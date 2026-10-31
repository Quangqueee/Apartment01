import type { Metadata } from "next";
import Link from "next/link";
import { PublicPageShell } from "@/components/public-page-shell";
import { SITE, SITE_PATHS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Điều khoản dịch vụ",
  description:
    "Điều kiện sử dụng website Hanoi Residences khi tìm thuê căn hộ, xem nhà, hoặc đăng ký hợp tác với tư cách chủ nhà tại Hà Nội.",
  alternates: {
    canonical: SITE_PATHS.terms,
    languages: {
      "vi-VN": SITE_PATHS.terms,
      "x-default": SITE_PATHS.terms,
    },
  },
};

const sections = [
  {
    title: "1. Chấp nhận điều khoản",
    body: `Khi truy cập ${SITE.url}, bạn đồng ý với các điều khoản này và với Chính sách bảo mật. Nếu không đồng ý, vui lòng ngừng sử dụng website.`,
  },
  {
    title: "2. Vai trò của Hanoi Residences",
    body: `${SITE.name} là đơn vị môi giới / tư vấn cho thuê căn hộ và căn hộ dịch vụ tại Hà Nội. Một số căn do chúng tôi quản lý, một số căn thuộc chủ nhà hợp tác. Thông tin trên website nhằm hỗ trợ tìm kiếm; điều kiện thuê chính thức được xác nhận khi xem nhà và ký hợp đồng.`,
  },
  {
    title: "3. Thông tin căn hộ",
    body: "Giá, tình trạng còn trống, nội thất, phí dịch vụ và hình ảnh có thể thay đổi theo nguồn. Chúng tôi nỗ lực cập nhật, nhưng không cam kết mọi tin đăng luôn khớp 100% thực tế tại mọi thời điểm. Khách nên xem nhà trực tiếp trước khi đặt cọc.",
  },
  {
    title: "4. Đặt lịch, đặt cọc và hợp đồng",
    body: "Việc đặt lịch xem nhà không tạo nghĩa vụ thuê. Tiền đặt cọc, thời hạn hợp đồng, phí phát sinh và quy định tòa nhà do các bên thỏa thuận bằng văn bản. Không coi tin nhắn mạng xã hội là hợp đồng trừ khi được xác nhận chính thức.",
  },
  {
    title: "5. Tài khoản người dùng",
    body: "Bạn chịu trách nhiệm bảo mật tài khoản đăng nhập. Không đăng nội dung sai sự thật, spam, hoặc sử dụng website cho mục đích trái pháp luật. Chúng tôi có thể tạm khóa tài khoản khi phát hiện lạm dụng.",
  },
  {
    title: "6. Chủ nhà và đối tác",
    body: "Chủ nhà cam kết thông tin đăng ký và căn hộ là chính xác, có quyền cho thuê. Hoa hồng, phạm vi quản lý và thời hạn hợp tác được thỏa thuận riêng sau khi đăng ký trên trang đối tác.",
  },
  {
    title: "7. Sở hữu trí tuệ",
    body: `Tên thương hiệu, giao diện, mô tả do ${SITE.name} tạo và hình ảnh do chúng tôi sản xuất thuộc quyền của đơn vị. Không sao chép hàng loạt tin đăng để đăng lại nơi khác khi chưa được phép.`,
  },
  {
    title: "8. Giới hạn trách nhiệm",
    body: "Website cung cấp thông tin theo hiện trạng. Chúng tôi không chịu trách nhiệm đối với thiệt hại gián tiếp phát sinh từ việc dựa hoàn toàn vào tin đăng mà không xem nhà, hoặc từ tranh chấp giữa khách thuê và chủ nhà ngoài phạm vi dịch vụ đã thỏa thuận.",
  },
  {
    title: "9. Liên hệ",
    body: `${SITE.name} — ${SITE.streetAddress}, ${SITE.addressLocality}, ${SITE.addressRegion}. Điện thoại: ${SITE.telephoneDisplay}. Email: ${SITE.email}. Người đại diện liên hệ: ${SITE.founderName}.`,
  },
];

export default function TermsPage() {
  return (
    <PublicPageShell>
      <article className="container mx-auto max-w-3xl overflow-x-hidden px-4 py-10 md:py-16">
        <h1 className="font-headline text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
          Điều khoản dịch vụ
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Cập nhật lần gần nhất: 19/08/2026.
        </p>
        <div className="mt-8 space-y-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-semibold text-gray-900">
                {section.title}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                {section.body}
              </p>
            </section>
          ))}
        </div>
        <p className="mt-10 text-sm text-muted-foreground">
          Xem thêm{" "}
          <Link
            href={SITE_PATHS.privacy}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Chính sách bảo mật
          </Link>{" "}
          và{" "}
          <Link
            href={SITE_PATHS.faq}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Câu hỏi thường gặp
          </Link>
          .
        </p>
      </article>
    </PublicPageShell>
  );
}
