import { Phone, Mail, MapPin } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t bg-gray-50">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* CỘT 1: Thương hiệu */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <svg
                className="h-7 w-7 text-[#cda533] shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L2 7V21H22V7L12 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M12 12L2 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 12L22 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 12V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 17H8V14H16V17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="font-headline text-xl font-bold text-gray-900">
                Hanoi Residences
              </span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Hệ thống căn hộ dịch vụ cao cấp tại Hà Nội. Nội thất đầy đủ,
              an ninh đảm bảo — nơi bạn chỉ cần xách vali vào ở.
            </p>
          </div>

          {/* CỘT 2: Điều hướng nhanh */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-5">
              Khám phá
            </h3>
            <ul className="space-y-3">
              {[
                { href: "/", label: "Trang chủ" },
                { href: "/#apartments-list", label: "Danh sách căn hộ" },
                { href: "/#about", label: "Giới thiệu" },
                { href: "/favorites", label: "Căn hộ yêu thích" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-500 hover:text-[#cda533] transition-colors font-medium"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* CỘT 3: Liên hệ */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-5">
              Liên hệ
            </h3>
            <div className="space-y-3">
              <p className="flex items-start gap-3 text-sm text-gray-500">
                <Phone className="h-4 w-4 text-[#cda533] mt-0.5 shrink-0" />
                <span>+84 355 885 851</span>
              </p>
              <p className="flex items-start gap-3 text-sm text-gray-500">
                <Mail className="h-4 w-4 text-[#cda533] mt-0.5 shrink-0" />
                <span>quangluxury6886@gmail.com</span>
              </p>
              <p className="flex items-start gap-3 text-sm text-gray-500">
                <MapPin className="h-4 w-4 text-[#cda533] mt-0.5 shrink-0" />
                <span>173B Trường Chinh, Đống Đa, Hà Nội</span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <p>
            &copy; {new Date().getFullYear()} Hanoi Residences. Bảo lưu mọi quyền.
          </p>
          <p className="italic">
            Thiết kế với ❤️ tại Hà Nội
          </p>
        </div>
      </div>
    </footer>
  );
}

