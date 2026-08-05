import OpenAI from "openai";

// Khởi tạo client Groq
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// Hàm tạo Slug tự động bằng Code (Chống lỗi font tiếng Việt)
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD") // Chuẩn hóa unicode
    .replace(/[\u0300-\u036f]/g, "") // Xóa dấu
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "") // Xóa ký tự đặc biệt
    .replace(/\s+/g, "-") // Thay khoảng trắng bằng dấu gạch ngang
    .replace(/-+/g, "-") // Xóa các dấu gạch ngang thừa
    .replace(/^-+|-+$/g, ""); // Trim dấu gạch ngang ở hai đầu
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
}) {

  console.log(`Đang gọi Groq AI để tạo bài viết mới...`);

  // System Prompt giữ nguyên theo cấu trúc SEO
  const systemPrompt = `Bạn là chuyên gia SEO bất động sản cho thuê tại Hà Nội.

Mục tiêu:
- Viết bài chuẩn SEO Google.
- Nội dung tự nhiên, không nhồi nhét từ khóa.
- Tối ưu cho người thuê căn hộ và công cụ tìm kiếm.

QUY TẮC BẮT BUỘC:
1. Trả về JSON hợp lệ.
2. description phải là Markdown hợp lệ.
3. Cấu trúc Markdown:


Đoạn mô tả ngắn 2-3 câu.

## Thông tin căn hộ
- Địa chỉ
- Quận
- Diện tích
- Loại phòng

## Chi phí & dịch vụ
- Giá thuê
- Điện
- Nước (Nếu có thì ghi rõ giá tiền, nếu không có thì bỏ qua)
- Internet (Nếu có thì ghi rõ giá tiền, nếu không có thì bỏ qua)
- Dịch vụ (Nếu có thì ghi rõ giá tiền, nếu không có thì ghi miễn phí dịch vụ)
- Gửi xe (Nếu có thì ghi rõ giá tiền, nếu không có thì bỏ qua không ghi vào)

(LƯU Ý QUAN TRỌNG VỀ ĐỊNH DẠNG SỐ: Nếu không có phí thì ghi "Miễn phí dịch vụ" và bỏ qua các phần phí còn thiếu. Ví dụ: Không có internet - bỏ qua và không đề cập; không có tiền nước - bỏ qua và không đề cập, không có tiền gửi xe - bỏ qua và không đề cập thì bỏ qua. Mọi loại giá tiền và chi phí khác BẮT BUỘC phải sử dụng dấu chấm "." để phân cách hàng nghìn. Tuyệt đối không viết số liền nhau. Ví dụ ĐÚNG: 4.000 VNĐ, 120.000 VNĐ, 5.800.000 VNĐ).

## Vị trí & kết nối giao thông
Phân tích vị trí thực tế.
Đề cập cụ thể: Tuyến đường lớn, Khu văn phòng, Trường đại học, tiện ích xung quanh (nếu phù hợp với vị trí).

## Vì sao nên thuê căn hộ này?
Viết 4-6 bullet nổi bật.

## Từ khóa liên quan
Liệt kê 8-12 từ khóa SEO liên quan.

YÊU CẦU SEO:
- Xuất hiện từ khóa chính 3-5 lần.
- Có tên quận trong tiêu đề.
- Có địa chỉ trong bài viết.
- Có giá thuê trong bài viết (Hiển thị đầy đủ số VNĐ).
- Có diện tích trong bài viết.
- Tiêu đề phải theo cấu trúc: Cho thuê căn hộ [loại phòng] tại [Địa chỉ], [Quận] - [Giá thuê triệu VNĐ/tháng]

KHÔNG:
- Không dùng icon.
- Không dùng emoji.
- Không viết hoa toàn bộ.
- Không bịa thông tin.

Format JSON trả về thuần túy:
{
  "seoTitle": "",
  "seoDescription": "",
  "description": "",
  "highlights": []
}`;

  const formattedPrice = (input.price * 1000000).toLocaleString('de-DE');

  const userPrompt = `Hãy viết mô tả dựa trên dữ liệu sau:
- Tiêu đề gốc: ${input.title}
- Loại phòng: ${input.roomType}
- Quận: ${input.district}
- Địa chỉ: ${input.address}
- Giá thuê: ${input.price} triệu/tháng (Tự động quy đổi thành số VNĐ và BẮT BUỘC dùng dấu chấm ngăn cách hàng nghìn. Ví dụ: ${formattedPrice} VNĐ/tháng).- Diện tích: ${input.area} m2
- Thông tin thô/Chi phí: ${input.detailedInformation}`;

  const estimatedInputTokens = Math.ceil((systemPrompt.length + userPrompt.length) / 2.5);
  const estimatedTokens = estimatedInputTokens + 800;
  const MAX_RETRIES = 5;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const tokenEntry = await waitForTokenBudget(estimatedTokens);

    try {
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      if (response.usage?.total_tokens) {
        tokenEntry.tokens = response.usage.total_tokens;
      }

      const content = response.choices[0].message.content || "{}";

      let parsedData: any;
      try {
        parsedData = JSON.parse(content);
      } catch (parseError) {
        throw new Error("AI trả về định dạng JSON không hợp lệ.");
      }

      // Loại bỏ khoảng trắng đầu dòng tránh lỗi giao diện
      if (parsedData.description) {
        parsedData.description = parsedData.description.replace(/^[ \t]+/gm, "");
      }

      // Bổ sung Slug được tạo bằng code vào Data Object cuối cùng
      if (parsedData.seoTitle) {
        parsedData.slug = generateSlug(parsedData.seoTitle);
      } else {
        parsedData.slug = generateSlug(input.title);
      }

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