import OpenAI from "openai";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// --- Token-aware rate limiter cho Groq (12,000 TPM trên tier on_demand) ---
const TPM_LIMIT = 12000;
const SAFETY_MARGIN = 0.85; // Chỉ dùng 85% hạn mức để tránh sát ngưỡng
const EFFECTIVE_LIMIT = TPM_LIMIT * SAFETY_MARGIN;

let tokenWindow: { tokens: number; timestamp: number }[] = [];

async function waitForTokenBudget(estimatedTokens: number) {
  while (true) {
    const now = Date.now();
    // Chỉ giữ lại các lần gọi trong 60 giây gần nhất
    tokenWindow = tokenWindow.filter((entry) => now - entry.timestamp < 60000);

    const usedTokens = tokenWindow.reduce((sum, entry) => sum + entry.tokens, 0);

    if (usedTokens + estimatedTokens <= EFFECTIVE_LIMIT) {
      tokenWindow.push({ tokens: estimatedTokens, timestamp: now });
      return;
    }

    // Đợi tới khi request cũ nhất "hết hạn" khỏi cửa sổ 60s
    const oldestEntry = tokenWindow[0];
    const waitMs = Math.max(60000 - (now - oldestEntry.timestamp) + 200, 300);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
}

export async function generateListingSummary(input: {
  title: string;
  roomType: string;
  district: string;
  address: string;
  price: number;
  area: number;
  detailedInformation: string;
}) {
  const promptText = `Bạn là chuyên gia marketing bất động sản cho thuê tại Hà Nội. 
Hãy viết một bài mô tả căn hộ hấp dẫn, chuyên nghiệp bằng tiếng Việt để thuyết phục khách hàng B2C. 

Sử dụng các thông tin thô sau đây:
- Tiêu đề gốc: ${input.title}
- Loại phòng: ${input.roomType}
- Quận: ${input.district}
- Địa chỉ: ${input.address}
- Giá thuê: ${input.price} triệu/tháng
- Diện tích: ${input.area} m2
- Thông tin thô/Chi phí: ${input.detailedInformation}

YÊU CẦU ĐỊNH DẠNG BẮT BUỘC (MARKDOWN):
- Phải chia thành các đoạn văn ngắn gọn, rõ ràng, KHÔNG viết liền mạch.
- Phải dùng Markdown để in đậm (**text**) các từ khóa quan trọng và tiêu đề mục.
- Phải dùng gạch đầu dòng (-) cho các danh sách tiện ích, chi phí.
- Phải xuống dòng (dùng ký tự \\n\\n) giữa các phần.

CẤU TRÚC GỢI Ý CỦA BÀI VIẾT:
1. Mở bài: Dẫn dắt hấp dẫn về không gian sống (1-2 câu).
2. **THÔNG TIN CĂN HỘ:** Gạch đầu dòng rõ vị trí, diện tích, loại phòng.
3. **TIỆN ÍCH & NỘI THẤT:** Liệt kê các điểm nhấn.
4. **CHI PHÍ & DỊCH VỤ:** Liệt kê rõ ràng giá thuê và các phụ phí.

Yêu cầu trả về kết quả dưới định dạng JSON thuần túy:
{
  "seoTitle": "Tiêu đề chuẩn SEO",
  "description": "Nội dung bài viết theo định dạng Markdown như trên",
  "highlights": ["Điểm nhấn 1", "Điểm nhấn 2"]
}`;

  // Ước lượng token: ~4 ký tự/token cho tiếng Việt, cộng thêm output dự kiến ~500 token
  const estimatedInputTokens = Math.ceil(promptText.length / 3.2);
  const estimatedTokens = estimatedInputTokens + 500;

  const MAX_RETRIES = 5;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    await waitForTokenBudget(estimatedTokens);

    try {
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: promptText }],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content || "{}");
    } catch (error: any) {
      const isRateLimit = error?.status === 429;

      if (isRateLimit && attempt < MAX_RETRIES) {
        const retryAfterHeader = error?.headers?.get?.("retry-after");
        const retryAfterSeconds = retryAfterHeader
          ? parseFloat(retryAfterHeader)
          : Math.pow(2, attempt);

        const waitMs = Math.max(retryAfterSeconds * 1000, 1000) + Math.random() * 500;
        console.warn(
          `[Groq] Rate limit, thử lại lần ${attempt + 1}/${MAX_RETRIES} sau ${Math.round(waitMs)}ms`
        );
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }

      throw error;
    }
  }

  throw new Error("Đã vượt quá số lần thử lại do rate limit từ Groq.");
}