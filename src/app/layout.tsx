import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import "./globals.css";
import MobileNav from "@/components/mobile-nav";
import MultiContact from "@/components/multi-contact";

export const metadata: Metadata = {
  title: "Hanoi Residences | Căn hộ cho thuê cao cấp tại Hà Nội",
  description:
    "Tìm thuê căn hộ dịch vụ cao cấp tại Hà Nội: Studio, 1-2 phòng ngủ tại Tây Hồ, Ba Đình, Cầu Giấy, Đống Đa. Nội thất đầy đủ, giá từ 5 triệu/tháng. Hỗ trợ 24/7.",
  keywords:
    "cho thuê căn hộ Hà Nội, căn hộ dịch vụ Hà Nội, căn hộ studio cho thuê, thuê nhà Tây Hồ, thuê nhà Ba Đình, thuê nhà Cầu Giấy, căn hộ 1 phòng ngủ Hà Nội, căn hộ full nội thất Hà Nội, chung cư cho thuê Hà Nội",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "Hanoi Residences | Căn hộ cho thuê cao cấp tại Hà Nội",
    description:
      "Khám phá hàng trăm căn hộ dịch vụ cao cấp tại Hà Nội. Nội thất đầy đủ, an ninh 24/7, sẵn sàng chuyển vào ngay.",
    url: "https://hanoiresidences.com",
    siteName: "Hanoi Residences",
    locale: "vi_VN",
    type: "website",
    images: [
      {
        url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
        width: 1200,
        height: 630,
        alt: "Hanoi Residences — Căn hộ cho thuê cao cấp Hà Nội",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hanoi Residences | Căn hộ cho thuê cao cấp tại Hà Nội",
    description:
      "Tìm thuê căn hộ cao cấp tại Hà Nội — Nội thất đầy đủ, giá tốt, hỗ trợ 24/7.",
    images: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  alternates: {
    canonical: "https://hanoiresidences.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=PT+Sans:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body bg-background text-foreground antialiased overflow-x-hidden">
        <FirebaseClientProvider>
          {/* Căn chỉnh lại container chính để không bóp nghẹt component con */}
          <div className="relative flex min-h-screen flex-col">
            <main className="flex-1 pb-24 md:pb-0">{children}</main>
          </div>

          <MultiContact />
          <MobileNav />
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
