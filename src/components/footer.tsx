import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  MessageCircle,
} from "lucide-react";
import { SITE, SITE_PATHS } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="border-t bg-secondary/30 text-secondary-foreground">
      <div className="container mx-auto overflow-x-hidden px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="space-y-4">
            <h2 className="font-headline text-2xl font-bold tracking-tight">
              {SITE.name}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Không gian sống lý tưởng. Giải pháp tối ưu cho mọi ngân sách.
            </p>
            <div className="flex gap-4 pt-2">
              <a
                href={SITE.sameAs[0]}
                className="text-muted-foreground transition-colors hover:text-primary"
                aria-label="Facebook"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href={SITE.sameAs[1]}
                className="text-muted-foreground transition-colors hover:text-primary"
                aria-label="Instagram"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href={SITE.sameAs[2]}
                className="text-muted-foreground transition-colors hover:text-primary"
                aria-label="Zalo"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-base font-semibold">Khám phá</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="transition-colors hover:text-primary">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link
                  href={SITE_PATHS.search}
                  className="transition-colors hover:text-primary"
                >
                  Danh sách căn hộ
                </Link>
              </li>
              <li>
                <Link
                  href={SITE_PATHS.about}
                  className="transition-colors hover:text-primary"
                >
                  Về chúng tôi
                </Link>
              </li>
              <li>
                <Link
                  href={SITE_PATHS.partnerRegister}
                  className="transition-colors hover:text-primary"
                >
                  Dành cho Chủ nhà & Nhà đầu tư
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-base font-semibold">Hỗ trợ khách hàng</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link
                  href={SITE_PATHS.faq}
                  className="transition-colors hover:text-primary"
                >
                  Câu hỏi thường gặp
                </Link>
              </li>
              <li>
                <Link
                  href={SITE_PATHS.privacy}
                  className="transition-colors hover:text-primary"
                >
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link
                  href={SITE_PATHS.terms}
                  className="transition-colors hover:text-primary"
                >
                  Điều khoản dịch vụ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-base font-semibold">Liên hệ</h3>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <a
                  href={`tel:${SITE.telephone}`}
                  className="transition-colors hover:text-primary"
                >
                  {SITE.telephoneDisplay} (Quang)
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <a
                  href={`mailto:${SITE.email}`}
                  className="break-all transition-colors hover:text-primary"
                >
                  {SITE.email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  {SITE.streetAddress}, {SITE.addressLocality},{" "}
                  {SITE.addressRegion}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-6 text-sm text-muted-foreground md:flex-row">
          <p>
            &copy; {new Date().getFullYear()} {SITE.name}. All rights reserved.
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
