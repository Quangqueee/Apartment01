import OpenAI from "openai";
import crypto from "crypto";
import NodeCache from "node-cache";

// Khởi tạo client Groq
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// --- CẤU HÌNH CACHE ---
// Lưu cache trong 7 ngày (7 * 24 * 60 * 60 = 604800 giây)
const cache = new NodeCache({ stdTTL: 604800 });

// Hàm băm object đầu vào thành một chuỗi Key ngắn gọn và duy nhất
function generateCacheKey(input: any): string {
  // Loại bỏ thuộc tính forceRefresh ra khỏi quá trình băm key (nếu có)
  const { forceRefresh, ...cacheInput } = input;
  const stringifiedInput = JSON.stringify(cacheInput);
  const hash = crypto.createHash("md5").update(stringifiedInput).digest("hex");
  return `ai_listing_${hash}`;
}

// --- CẤU HÌNH RATE LIMITER ---
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

// --- HÀM CHÍNH ---
export async function generateListingSummary(input: {
  title: string;
  roomType: string;
  district: string;
  address: string;
  price: number;
  area: number;
  detailedInformation: string;
  forceRefresh?: boolean; // Thêm cờ này để cho phép người dùng ép AI viết lại bài mới
}) {
  
  // 1. KIỂM TRA BỘ NHỚ ĐỆM (CACHE)
  const cacheKey = generateCacheKey(input);
  
  // Nếu không ép buộc làm mới (forceRefresh = false/undefined), thử lấy từ Cache
  if (!input.forceRefresh) {
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log(`[Cache Hit] Lấy bài viết từ bộ nhớ đệm (Key: ${cacheKey}) - Siêu tốc & Miễn phí`);
      return cachedData;
    }
  }

  console.log(`[Cache Miss] Đang gọi Groq AI để tạo bài viết mới...`);

  // 2. CHUẨN BỊ PROMPT CHO AI
  const systemPrompt = `Bạn là chuyên gia marketing bất động sản cho thuê tại Hà Nội. 
Nhiệm vụ: Viết bài mô tả căn hộ hấp dẫn, chuyên nghiệp bằng tiếng Việt để thuyết phục khách hàng B2C. 

YÊU CẦU ĐỊNH DẠNG BẮT BUỘC (MARKDOWN):
- Chia thành các đoạn văn ngắn gọn, dùng Markdown in đậm (**text**) từ khóa và tiêu đề mục.
- Dùng gạch đầu dòng (-) cho danh sách.
- KHÔNG ĐƯỢC thụt lề, không để lại khoảng trắng (dấu cách/tab) ở đầu bất kỳ dòng nào.
- Dùng ký tự \\n để xuống dòng trong chuỗi JSON.

CẤU TRÚC GỢI Ý:
1. Dẫn dắt hấp dẫn (1-2 câu).
2. **THÔNG TIN CĂN HỘ:** Vị trí, diện tích, loại phòng.
3. **TIỆN ÍCH & NỘI THẤT:** Các điểm nhấn.
4. **CHI PHÍ & DỊCH VỤ:** Giá thuê và phụ phí.

Yêu cầu trả về JSON thuần túy (strict JSON object) theo format:
{
  "seoTitle": "Tiêu đề chuẩn SEO, có chữ 'cho thuê' và tên quận, tối đa 60 ký tự",
  "description": "Nội dung Markdown",
  "highlights": ["Điểm nhấn 1", "Điểm nhấn 2"]
}`;

  const userPrompt = `Hãy viết mô tả dựa trên dữ liệu sau:
- Tiêu đề gốc: ${input.title}
- Loại phòng: ${input.roomType}
- Quận: ${input.district}
- Địa chỉ: ${input.address}
- Giá thuê: ${input.price} triệu/tháng
- Diện tích: ${input.area} m2
- Thông tin thô/Chi phí: ${input.detailedInformation}`;

  const estimatedInputTokens = Math.ceil((systemPrompt.length + userPrompt.length) / 2.5);
  const estimatedTokens = estimatedInputTokens + 500;
  const MAX_RETRIES = 5;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const tokenEntry = await waitForTokenBudget(estimatedTokens);

    try {
      // 3. GỌI API GROQ
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      // Cập nhật lại số token thực tế vào hàm chặn tốc độ
      if (response.usage?.total_tokens) {
        tokenEntry.tokens = response.usage.total_tokens;
      }

      const content = response.choices[0].message.content || "{}";
      
      // Bắt lỗi JSON parse
      let parsedData;
      try {
        parsedData = JSON.parse(content);
      } catch (parseError) {
        throw new Error("AI trả về định dạng JSON không hợp lệ.");
      }

      // 4. SANITIZE OUTPUT: Chống vỡ giao diện (Xóa toàn bộ dấu cách đầu dòng)
      if (parsedData.description) {
        parsedData.description = parsedData.description.replace(/^[ \t]+/gm, "");
      }

      // 5. LƯU KẾT QUẢ VÀO CACHE ĐỂ DÙNG CHO CÁC LẦN SAU
      cache.set(cacheKey, parsedData);
      
      return parsedData;

    } catch (error: any) {
      const isRateLimit = error?.status === 429;

      if (isRateLimit && attempt < MAX_RETRIES) {
        const retryAfterHeader = error?.headers?.get?.("retry-after");
        const retryAfterSeconds = retryAfterHeader ? parseFloat(retryAfterHeader) : Math.pow(2, attempt);

        if (retryAfterSeconds > 15) {
          throw new Error(`Hệ thống đang bận. Vui lòng thử lại sau ${Math.ceil(retryAfterSeconds)} giây.`);
        }

        const waitMs = Math.max(retryAfterSeconds * 1000, 1000) + Math.random() * 500;
        console.warn(`[Groq] Rate limit, thử lại lần ${attempt + 1}/${MAX_RETRIES} sau ${Math.round(waitMs)}ms`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }

      throw error; 
    }
  }

  throw new Error("Đã vượt quá số lần thử lại do rate limit từ hệ thống.");
}