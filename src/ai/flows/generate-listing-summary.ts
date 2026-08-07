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

// Hàm khởi tạo Client động, tự động lấy Key hiện tại
function getGroqClient() {
  if (API_KEYS.length === 0) {
    throw new Error("Hệ thống chưa cấu hình GROQ_API_KEY.");
  }
  return new OpenAI({
    apiKey: API_KEYS[currentKeyIndex],
    baseURL: "https://api.groq.com/openai/v1",
  });
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
MỤC TIÊU: Viết bài mô tả chuẩn SEO, TUYỆT ĐỐI tuân thủ cấu trúc Markdown (H2, Bullet points) bên trong trường "description". KHÔNG bịa thông tin.

CẤU TRÚC JSON PHẢI TRẢ VỀ:
{
  "seoTitle": "Cho thuê căn hộ [Loại phòng] [Diện tích] tại [Đường], [Quận]",
  "seoDescription": "Mô tả ngắn gọn, hấp dẫn khoảng 2-3 câu...",
  "description": "Đoạn mở đầu.\\n\\n## Thông tin căn hộ\\n- Địa chỉ: ...\\n- Diện tích: ...\\n\\n## Chi phí & dịch vụ\\n- Giá thuê: ...\\n- (Liệt kê phí điện, nước, dịch vụ. KHÔNG tự bịa phí. Nếu miễn phí ghi 'Miễn phí').\\n\\n## Vị trí & kết nối\\n- Phân tích điểm mạnh...\\n\\n## Vì sao nên thuê?\\n- (4 bullet points)",
  "highlights": ["Điểm nhấn 1", "Điểm nhấn 2"]
}`;

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

  const estimatedTokens = Math.ceil((systemPrompt.length + userPrompt.length) / 2.5) + 800;
  const MAX_RETRIES = 5;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const tokenEntry = await waitForTokenBudget(estimatedTokens);

    try {
      // ✅ Lấy Groq client với API Key của vòng lặp hiện tại
      const groq = getGroqClient();
      console.log(`[Groq] Đang gọi AI (Key Index: ${currentKeyIndex})...`);

      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3, // Ép chặt định dạng Markdown JSON
      });

      if (response.usage?.total_tokens) {
        tokenEntry.tokens = response.usage.total_tokens;
      }

      const content = response.choices[0].message.content || "{}";
      let parsedData: any = JSON.parse(content);

      if (parsedData.description) {
        parsedData.description = parsedData.description.replace(/^[ \t]+/gm, "").trim();
      }

      return {
        seoTitle: parsedData.seoTitle || "",
        seoDescription: parsedData.seoDescription || "",
        description: parsedData.description || "",
        highlights: parsedData.highlights || [],
        slug: generateSlug(parsedData.seoTitle || input.title),
      };

    } catch (error: any) {
      // 🚀 BẮT LỖI RATE LIMIT (429) & QUOTA EXCEEDED (402) ĐỂ CHUYỂN API KEY
      const isRateLimit = error?.status === 429;
      const isQuotaExceeded = error?.status === 402 || error?.error?.code === 'insufficient_quota';

      if ((isRateLimit || isQuotaExceeded) && attempt < MAX_RETRIES) {
        // Tự động xoay vòng sang API Key tiếp theo
        currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;

        console.warn(`⚠️ [Groq] Lỗi 429/402. Đang tự động chuyển sang API Key thứ ${currentKeyIndex + 1}...`);

        // Reset cửa sổ token để Key mới chạy max công suất lập tức
        tokenWindow = [];

        await new Promise((resolve) => setTimeout(resolve, 1500));
        continue;
      }

      throw error;
    }
  }

  throw new Error("Đã vượt quá số lần thử lại do rate limit hoặc các Key đều cạn kiệt.");
}