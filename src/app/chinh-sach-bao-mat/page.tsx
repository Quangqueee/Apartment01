import type { Metadata } from "next";
import Link from "next/link";
import { PublicPageShell } from "@/components/public-page-shell";
import { SITE, SITE_PATHS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Chính sách bảo mật",
  description:
    "Cách Hanoi Residences thu thập, sử dụng và bảo vệ thông tin cá nhân khi bạn tìm thuê căn hộ, đặt lịch xem nhà hoặc đăng ký hợp tác.",
  alternates: {
    canonical: SITE_PATHS.privacy,
    languages: {
      "vi-VN": SITE_PATHS.privacy,
      "x-default": SITE_PATHS.privacy,
    },
  },
};

const sections = [
  {
    title: "1. Phạm vi áp dụng",
    body: `Chính sách này áp dụng cho website ${SITE.url} và các dịch vụ liên quan của ${SITE.name} khi bạn tìm kiếm căn hộ, tạo tài khoản, lưu yêu thích, đặt lịch xem nhà, hoặc đăng ký hợp tác với tư cách chủ nhà / đối tác.`,
  },
  {
    title: "2. Thông tin chúng tôi thu thập",
    body: "Tùy thao tác, chúng tôi có thể thu thập: họ tên, số điện thoại, email, nội dung tin nhắn, thông tin tài khoản đăng nhập (Firebase Authentication), căn hộ yêu thích, yêu cầu hợp tác, và dữ liệu kỹ thuật như địa chỉ IP, loại trình duyệt, trang đã xem thông qua Google Analytics / Google Tag Manager.",
  },
  {
    title: "3. Mục đích sử dụng",
    body: "Thông tin được dùng để liên hệ tư vấn thuê nhà, sắp xếp xem nhà, xử lý đăng ký đối tác, cải thiện trải nghiệm website, đo lường hiệu quả truyền thông, và tuân thủ nghĩa vụ pháp lý khi có yêu cầu hợp lệ.",
  },
  {
    title: "4. Lưu trữ và bên thứ ba",
    body: "Dữ liệu được lưu trên hạ tầng Firebase (Google). Một số nhà cung cấp hỗ trợ vận hành (phân tích truy cập, hosting) có thể xử lý dữ liệu thay mặt chúng tôi. Chúng tôi không bán danh sách khách hàng cho bên thứ ba để quảng cáo không liên quan.",
  },
  {
    title: "5. Thời gian lưu và quyền của bạn",
    body: "Chúng tôi lưu thông tin trong thời gian cần thiết cho mục đích nêu trên hoặc theo luật áp dụng. Bạn có thể yêu cầu xem, chỉnh sửa hoặc xóa thông tin liên hệ bằng cách gửi email tới địa chỉ bên dưới. Một số dữ liệu giao dịch / hợp đồng có thể được giữ lại để giải quyết tranh chấp.",
  },
  {
    title: "6. Cookie và đo lường",
    body: "Website sử dụng cookie / thẻ đo lường để hiểu cách khách truy cập sử dụng trang. Bạn có thể chặn cookie trong trình duyệt; một số tính năng có thể hoạt động không đầy đủ.",
  },
  {
    title: "7. Liên hệ về quyền riêng tư",
    body: `Đơn vị: ${SITE.name}. Địa chỉ: ${SITE.streetAddress}, ${SITE.addressLocality}, ${SITE.addressRegion}. Email: ${SITE.email}. Điện thoại: ${SITE.telephoneDisplay}. Người liên hệ: ${SITE.founderName}.`,
  },
];

export default function PrivacyPage() {
  return (
    <PublicPageShell>
      <article className="container mx-auto max-w-3xl overflow-x-hidden px-4 py-10 md:py-16">
        <h1 className="font-headline text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
          Chính sách bảo mật
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Cập nhật lần gần nhất: 19/08/2026. Tài liệu này giải thích cách{" "}
          {SITE.name} xử lý dữ liệu cá nhân trên website.
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
            href={SITE_PATHS.terms}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Điều khoản dịch vụ
          </Link>
          .
        </p>
      </article>
    </PublicPageShell>
  );
}
