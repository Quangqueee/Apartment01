import OpenAI from "openai";

// ==========================================
// 1. CƠ CHẾ XOAY VÒNG API KEY (ROUND-ROBIN)
// ==========================================
// Lấy tất cả các key từ biến môi trường (bạn có thể cấu hình GROQ_API_KEY_2, GROQ_API_KEY_3... trong .env)
const API_KEYS = [
  process.env.GROQ_API_KEY,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
].filter(Boolean) as string[]; // Lọc bỏ các giá trị undefined/null

let currentKeyIndex = 0;

type SeoModelConfig = {
  id: string;
  reasoningEffort: "none" | "low";
  maxCompletionTokens: number;
};

// Qwen 3.8: model Groq còn host, viết tiếng Việt tốt hơn gpt-oss.
// Free/on_demand giới hạn ~1000 OTPM cho Qwen — max_completion_tokens 4096 bị 429 "Request too large".
// gpt-oss-120b là production fallback khi Qwen lỗi JSON / bị gỡ / hết quota output.
const SEO_MODELS: SeoModelConfig[] = [
  { id: "qwen/qwen3.8-27b", reasoningEffort: "none", maxCompletionTokens: 900 },
  { id: "openai/gpt-oss-120b", reasoningEffort: "low", maxCompletionTokens: 4096 },
];

function getGroqClient() {
  if (API_KEYS.length === 0) {
    throw new Error("Hệ thống chưa cấu hình GROQ_API_KEY.");
  }
  return new OpenAI({
    apiKey: API_KEYS[currentKeyIndex],
    baseURL: "https://api.groq.com/openai/v1",
  });
}

function groqErrorMessage(error: any): string {
  return String(error?.error?.message || error?.message || "");
}

function isRequestTooLargeError(error: any): boolean {
  const msg = groqErrorMessage(error).toLowerCase();
  return msg.includes("request too large") || msg.includes("otpm");
}

function isRateLimitError(error: any): boolean {
  return error?.status === 429 && !isRequestTooLargeError(error);
}

function isQuotaExceededError(error: any): boolean {
  return error?.status === 402 || error?.error?.code === "insufficient_quota";
}

function isModelUnavailableError(error: any): boolean {
  const status = error?.status;
  const code = String(error?.error?.code || error?.code || "").toLowerCase();
  const msg = groqErrorMessage(error).toLowerCase();
  if (status === 404) return true;
  if (
    code.includes("model_decommissioned") ||
    code.includes("model_not_found") ||
    code === "json_validate_failed"
  ) {
    return true;
  }
  return (
    msg.includes("decommissioned") ||
    msg.includes("does not exist") ||
    msg.includes("is not available") ||
    msg.includes("failed to generate json")
  );
}

function extractOtpmLimit(error: any): number | null {
  const match = groqErrorMessage(error).match(/Limit (\d+), Requested (\d+)/i);
  if (!match) return null;
  return Number(match[1]);
}

// ==========================================
// 2. UTILS & RATE LIMITER
// ==========================================
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const TPM_LIMIT = 12000;
const SAFETY_MARGIN = 0.85;
const EFFECTIVE_LIMIT = TPM_LIMIT * SAFETY_MARGIN;
let tokenWindow: { tokens: number; timestamp: number }[] = [];

async function waitForTokenBudget(estimatedTokens: number) {
  while (true) {
    const now = Date.now();
    tokenWindow = tokenWindow.filter((entry) => now - entry.timestamp < 60000);
    const usedTokens = tokenWindow.reduce((sum, entry) => sum + entry.tokens, 0);

    if (usedTokens + estimatedTokens <= EFFECTIVE_LIMIT) {
      const newEntry = { tokens: estimatedTokens, timestamp: now };
      tokenWindow.push(newEntry);
      return newEntry;
    }

    const oldestEntry = tokenWindow[0];
    const waitMs = Math.max(60000 - (now - oldestEntry.timestamp) + 200, 300);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
}

// ==========================================
// 3. ĐỒNG BỘ LUỒNG DỮ LIỆU (DATA FLOW)
// ==========================================
export interface AiSummaryResponse {
  seoTitle: string;
  seoDescription: string;
  description: string; // Trả đúng key description để nạp vào aiContent object
  highlights: string[];
  slug?: string;
}

function normalizeSummary(parsedData: any, fallbackTitle: string): AiSummaryResponse {
  const description = String(parsedData?.description || "")
    .replace(/^[ \t]+/gm, "")
    .trim();
  const highlights = Array.isArray(parsedData?.highlights)
    ? parsedData.highlights.filter((item: unknown) => typeof item === "string")
    : [];

  return {
    seoTitle: parsedData?.seoTitle || "",
    seoDescription: parsedData?.seoDescription || "",
    description,
    highlights,
    slug: generateSlug(parsedData?.seoTitle || fallbackTitle),
  };
}

/** Groq JSON mode đôi khi trả description bị tách thành string mồ côi — ghép lại rồi parse. */
function salvageFailedGeneration(raw: unknown): any | null {
  if (typeof raw !== "string" || !raw.trim()) return null;

  const candidates = [
    raw,
    raw.replace(
      /("description"\s*:\s*")((?:\\.|[^"\\])*)(")\s*,\s*"((?:\\.|[^"\\])*)"\s*,/,
      (_m, prefix: string, desc: string, suffix: string, orphan: string) =>
        `${prefix}${desc}${orphan}${suffix},`
    ),
  ];

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      // thử candidate tiếp theo
    }
  }
  return null;
}

export async function generateListingSummary(input: {
  title: string;
  roomType: string;
  district: string;
  address: string;
  price: number;
  area: number;
  detailedInformation: string;
}): Promise<AiSummaryResponse> {

  const formattedPrice = input.price > 0 ? `${(input.price * 1000000).toLocaleString('de-DE')} VNĐ/tháng` : "Thỏa thuận";
  const formattedArea = input.area > 0 ? `${input.area} m2` : "Không cung cấp";

  const systemPrompt = `Bạn là chuyên gia Content SEO Bất động sản cao cấp tại Hà Nội.
MỤC TIÊU: Viết bài mô tả chuẩn SEO, văn phong tự nhiên như người môi giới giàu kinh nghiệm — hấp dẫn, cụ thể, không sáo rỗng, không dịch máy. TUYỆT ĐỐI tuân thủ cấu trúc Markdown (H2, Bullet points) bên trong trường "description". KHÔNG bịa thông tin.

CẤU TRÚC JSON PHẢI TRẢ VỀ:
{
  "seoTitle": "Cho thuê căn hộ [Loại phòng] [Diện tích (m2)] tại [Đường], [Quận]",
  "seoDescription": "Mô tả ngắn gọn, hấp dẫn khoảng 2-3 câu...",
  "description": "Đoạn mở đầu.\\n\\n## Thông tin căn hộ\\n- Địa chỉ: ...\\n- Diện tích: ...\\n\\n## Chi phí & dịch vụ\\n- Giá thuê: ...\\n- (Liệt kê phí điện, nước, dịch vụ. KHÔNG tự bịa phí. Nếu miễn phí ghi 'Miễn phí').\\n\\n## Vị trí & kết nối\\n- Phân tích điểm mạnh...\\n\\n## Vì sao nên thuê?\\n- (4 bullet points)",
  "highlights": ["Điểm nhấn 1", "Điểm nhấn 2"]
}
CHỈ được trả đúng 4 key trên. Trường "description" là MỘT chuỗi JSON duy nhất chứa toàn bộ 4 mục Markdown — không tách heading thành key JSON khác.`;

  const userPrompt = `Hãy xử lý thông tin sau thành bài viết chuẩn JSON:
- Tiêu đề gốc: ${input.title}
- Loại phòng: ${input.roomType}
- Quận: ${input.district}
- Địa chỉ: ${input.address}
- Giá thuê: ${formattedPrice}
- Diện tích: ${formattedArea}
- Thông tin thô/Chi phí:
"""
${input.detailedInformation}
"""`;

  const estimatedTokens = Math.ceil((systemPrompt.length + userPrompt.length) / 2.5) + 1000;
  const MAX_RETRIES = 5;
  let lastError: unknown;

  for (const model of SEO_MODELS) {
    let maxCompletionTokens = model.maxCompletionTokens;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const tokenEntry = await waitForTokenBudget(estimatedTokens);

      try {
        const groq = getGroqClient();
        console.log(
          `[Groq] Đang gọi AI (model: ${model.id}, Key Index: ${currentKeyIndex}, max_tokens: ${maxCompletionTokens})...`
        );

        const response = await groq.chat.completions.create({
          model: model.id,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
          top_p: 0.8,
          max_completion_tokens: maxCompletionTokens,
          reasoning_effort: model.reasoningEffort,
        });

        if (response.usage?.total_tokens) {
          tokenEntry.tokens = response.usage.total_tokens;
        }

        const content = response.choices[0].message.content || "{}";
        return normalizeSummary(JSON.parse(content), input.title);
      } catch (error: any) {
        lastError = error;

        if (error instanceof SyntaxError) {
          console.warn(`⚠️ [Groq] JSON không hợp lệ từ ${model.id}. Thử model tiếp theo...`);
          break;
        }

        const failedGeneration =
          error?.error?.failed_generation || error?.failed_generation;
        if (failedGeneration) {
          const salvaged = salvageFailedGeneration(failedGeneration);
          if (salvaged?.seoTitle || salvaged?.description) {
            console.warn(
              `⚠️ [Groq] JSON lỗi từ ${model.id}, đã ghép lại failed_generation.`
            );
            return normalizeSummary(salvaged, input.title);
          }
        }

        if (isRequestTooLargeError(error)) {
          const otpmLimit = extractOtpmLimit(error) ?? 1000;
          if (maxCompletionTokens > otpmLimit) {
            maxCompletionTokens = Math.max(256, otpmLimit - 100);
            console.warn(
              `⚠️ [Groq] OTPM quá lớn. Giảm max_completion_tokens xuống ${maxCompletionTokens}...`
            );
            continue;
          }
          console.warn(
            `⚠️ [Groq] ${model.id} vượt OTPM free tier. Chuyển model tiếp theo...`
          );
          break;
        }

        if (
          (isRateLimitError(error) || isQuotaExceededError(error)) &&
          attempt < MAX_RETRIES
        ) {
          currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
          console.warn(
            `⚠️ [Groq] Lỗi 429/402. Đang tự động chuyển sang API Key thứ ${currentKeyIndex + 1}...`
          );
          tokenWindow = [];
          await new Promise((resolve) => setTimeout(resolve, 1500));
          continue;
        }

        if (isModelUnavailableError(error)) {
          console.warn(
            `⚠️ [Groq] Model ${model.id} không dùng được (${groqErrorMessage(error)}). Thử model tiếp theo...`
          );
          break;
        }

        throw error;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Đã vượt quá số lần thử lại do rate limit hoặc các Key đều cạn kiệt.");
}