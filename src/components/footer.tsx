import {
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  MessageCircle,
} from "lucide-react";
// Nếu bạn dùng Next.js, hãy import Link từ "next/link" và thay các thẻ <a> bằng <Link>

export default function Footer() {
  return (
    <footer className="border-t bg-secondary/30 text-secondary-foreground">
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {/* Cột 1: Thông tin thương hiệu */}
          <div className="space-y-4">
            <h2 className="font-headline text-2xl font-bold tracking-tight">
              Hanoi Residences
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Không gian sống lý tưởng. Giải pháp tối ưu cho mọi ngân sách.
            </p>
            <div className="flex gap-4 pt-2">
              <a
                href="https://www.facebook.com/quangluxury.9999/"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://www.instagram.com/qquangquee/"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://zalo.me/0355885851"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                <MessageCircle className="h-5 w-5" />{" "}
                {/* Icon tượng trưng cho Zalo */}
              </a>
            </div>
          </div>

          {/* Cột 2: Điều hướng nhanh */}
          <div>
            <h3 className="mb-4 text-base font-semibold">Khám phá</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a href="/" className="transition-colors hover:text-primary">
                  Trang chủ
                </a>
              </li>
              <li>
                <a
                  href="#apartment-list"
                  className="transition-colors hover:text-primary"
                >
                  Danh sách căn hộ
                </a>
              </li>
              <li>
                <a
                  href="#about"
                  className="transition-colors hover:text-primary"
                >
                  Về chúng tôi
                </a>
              </li>
              <li>
                <a
                  href="#about"
                  className="transition-colors hover:text-primary"
                >
                  Dành cho Chủ nhà & Nhà đầu tư
                </a>
              </li>
            </ul>
          </div>

          {/* Cột 3: Hỗ trợ khách hàng */}
          <div>
            <h3 className="mb-4 text-base font-semibold">Hỗ trợ khách hàng</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a href="#" className="transition-colors hover:text-primary">
                  Câu hỏi thường gặp
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-primary">
                  Chính sách bảo mật
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-primary">
                  Điều khoản dịch vụ
                </a>
              </li>
            </ul>
          </div>

          {/* Cột 4: Liên hệ */}
          <div>
            <h3 className="mb-4 text-base font-semibold">Liên hệ</h3>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>+84 355 885 851 (Quang)</span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="break-all">quangluxury6886@gmail.com</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>173B Trường Chinh, Đống Đa, Hà Nội</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & DMCA */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-6 text-sm text-muted-foreground md:flex-row">
          <p>
            &copy; {new Date().getFullYear()} Hanoi Residences. All rights
            reserved.
          </p>

          <div className="flex items-center gap-2">
            <a
              href="https://www.dmca.com/Protection/Status.aspx?ID=a6b9ac16-e5b4-48be-b3c0-2fb3a6f9ff25"
              title="DMCA.com Protection Status"
              className="dmca-badge"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="https://images.dmca.com/Badges/DMCA_logo-grn-btn100w.png?ID=a6b9ac16-e5b4-48be-b3c0-2fb3a6f9ff25"
                alt="DMCA.com Protection Status"
              />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
