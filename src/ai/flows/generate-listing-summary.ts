import OpenAI from "openai";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

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

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: promptText }],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content || "{}");
  } catch (error) {
    throw error;
  }
}