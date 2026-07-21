import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import "./globals.css";
import MobileNav from "@/components/mobile-nav";
import MultiContact from "@/components/multi-contact";

export const metadata: Metadata = {
  metadataBase: new URL("https://hanoiresidences.com"),
  title: {
    default: "Hanoi Residences | Thuê căn hộ Hà Nội để ở và làm việc",
    template: "%s | Hanoi Residences",
  },
  description:
    "Nền tảng tìm thuê căn hộ Hà Nội với ảnh thật, giá rõ ràng và hỗ trợ nhanh cho nhu cầu ở lâu dài, sinh hoạt tiện nghi và làm việc hiệu quả.",
  keywords: [
    "thuê căn hộ hà nội",
    "căn hộ để ở hà nội",
    "căn hộ cho người đi làm",
    "thuê studio hà nội",
    "thuê căn hộ tây hồ",
    "thuê căn hộ cầu giấy",
    "thuê căn hộ ba đình",
    "căn hộ gần văn phòng hà nội",
  ],
  openGraph: {
    title: "Hanoi Residences | Thuê căn hộ Hà Nội để ở và làm việc",
    description:
      "Khám phá căn hộ phù hợp để sinh sống và làm việc tại Hà Nội, hình ảnh thực tế và mức giá minh bạch.",
    url: "https://hanoiresidences.com",
    siteName: "Hanoi Residences",
    locale: "vi_VN",
    type: "website",
    images: [
      {
        url: "/default-og-image.png",
        width: 1200,
        height: 630,
        alt: "Hanoi Residences - Thuê căn hộ tại Hà Nội",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hanoi Residences | Thuê căn hộ Hà Nội để ở và làm việc",
    description:
      "Nền tảng tìm thuê căn hộ Hà Nội cho nhu cầu sinh sống và làm việc.",
    images: ["/default-og-image.png"],
  },
  icons: { icon: "/favicon.ico" },
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
