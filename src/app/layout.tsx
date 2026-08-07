import type { Metadata } from "next";
import { Be_Vietnam_Pro, Playfair_Display } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { FirebaseProvider } from "@/firebase/provider"; // ✅ Bổ sung FirebaseProvider
import { AuthProvider } from "@/context/auth-context";
import "./globals.css";
import MobileNav from "@/components/mobile-nav";
import MultiContact from "@/components/multi-contact";
import Script from "next/script";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  metadataBase: new URL("https://hanoiresidence.site"),
  title: {
    default: "Hanoi Residences | Cho thuê căn hộ & Căn hộ dịch vụ tại Hà Nội",
    template: "%s | Hanoi Residences",
  },
  description:
    "Nền tảng tìm thuê căn hộ uy tín tại Hà Nội. Khám phá ngay không gian lý tưởng để an cư và làm việc với thông tin minh bạch, hỗ trợ tận tâm.",
  keywords: [
    "hanoi residences",
    "thuê căn hộ hà nội",
    "căn hộ dịch vụ hà nội",
    "thuê chung cư mini hà nội",
    "căn hộ cho người đi làm",
    "thuê căn hộ cao cấp hà nội",
    "thuê căn hộ tây hồ",
    "thuê căn hộ ba đình",
    "thuê căn hộ đống đa",
    "thuê căn hộ hai bà trưng",
    "thuê căn hộ hoàn kiếm",
    "hanoi apartment for rent",
    "serviced apartment hanoi",
    "hanoi apartment for expat",
    "fully furnished apartment hanoi",
    "tay ho apartment for rent",
  ],
  openGraph: {
    title: "Hanoi Residences | Cho thuê căn hộ & Căn hộ dịch vụ tại Hà Nội",
    description:
      "Nền tảng tìm thuê căn hộ uy tín tại Hà Nội. Khám phá ngay không gian lý tưởng để an cư và làm việc với thông tin minh bạch, hỗ trợ tận tâm.",
    url: "https://hanoiresidence.site",
    siteName: "Hanoi Residences",
    locale: "vi_VN",
    type: "website",
    images: [
      {
        url: "/images/hero-bg.webp",
        width: 1200,
        height: 630,
        alt: "Hanoi Residences - Thuê căn hộ tại Hà Nội",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hanoi Residences | Cho thuê căn hộ & Căn hộ dịch vụ tại Hà Nội",
    description:
      "Nền tảng tìm thuê căn hộ uy tín tại Hà Nội. Khám phá ngay không gian lý tưởng để an cư và làm việc với thông tin minh bạch, hỗ trợ tận tâm.",
    images: ["/images/hero-bg.webp"],
  },
  icons: { icon: "/favicon.ico" },
};

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-body",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-headline",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: "Hanoi Residences",
    image: "https://hanoiresidence.site/images/hero-bg.webp",
    "@id": "https://hanoiresidence.site",
    url: "https://hanoiresidence.site",
    telephone: "+84-355-885-851",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Hà Nội",
      addressCountry: "VN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 21.0285,
      longitude: 105.8542,
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "08:00",
      closes: "22:00",
    },
    priceRange: "5,000,000 VND - 50,000,000 VND",
    areaServed: [
      "Tây Hồ, Hà Nội",
      "Cầu Giấy, Hà Nội",
      "Ba Đình, Hà Nội",
      "Đống Đa, Hà Nội",
    ],
  };

  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-body text-foreground antialiased",
          beVietnamPro.variable,
          playfairDisplay.variable,
        )}
      >
        <Script
          id="schema-real-estate"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          strategy="beforeInteractive"
        />

        {/* 🚀 CHUẨN HÓA BỌC PHÂN CẤP PROVIDER: FirebaseClientProvider -> FirebaseProvider -> AuthProvider */}
        <FirebaseClientProvider>
          <FirebaseProvider>
            <AuthProvider>
              <div className="relative flex min-h-screen flex-col">
                <main className="flex-1 pb-24 md:pb-0">{children}</main>
              </div>
              <MultiContact />
              <MobileNav />
              <Toaster />
            </AuthProvider>
          </FirebaseProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
