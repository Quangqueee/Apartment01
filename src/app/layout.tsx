import type { Metadata } from "next";
import { Be_Vietnam_Pro, Playfair_Display } from "next/font/google";
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import "./globals.css";
import MobileNav from "@/components/mobile-nav";
import MultiContact from "@/components/multi-contact";
import { JsonLd } from "@/components/json-ld";
import { cn } from "@/lib/utils";
import { GA_MEASUREMENT_ID, GTM_ID } from "@/lib/constants";
import { SITE, SITE_PATHS } from "@/lib/site";
import { buildOrganizationJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Hanoi Residences | Cho thuê căn hộ & Căn hộ dịch vụ tại Hà Nội",
    template: "%s | Hanoi Residences",
  },
  description:
    "Nền tảng tìm thuê căn hộ uy tín tại Hà Nội. Khám phá ngay không gian lý tưởng để an cư và làm việc với thông tin minh bạch, hỗ trợ tận tâm.",
  applicationName: SITE.name,
  authors: [{ name: SITE.founderName, url: SITE.sameAs[0] }],
  creator: SITE.founderName,
  publisher: SITE.name,
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
  alternates: {
    canonical: SITE_PATHS.home,
    languages: {
      "vi-VN": SITE.url,
      "x-default": SITE.url,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: "Hanoi Residences | Cho thuê căn hộ & Căn hộ dịch vụ tại Hà Nội",
    description:
      "Nền tảng tìm thuê căn hộ uy tín tại Hà Nội. Khám phá ngay không gian lý tưởng để an cư và làm việc với thông tin minh bạch, hỗ trợ tận tâm.",
    url: SITE.url,
    siteName: SITE.name,
    locale: SITE.locale,
    type: "website",
    images: [
      {
        url: SITE.ogImage,
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
    images: [SITE.ogImage],
  },
  icons: { icon: "/favicon.ico" },
};

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800", "900"],
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
  return (
    <html lang="vi" data-scroll-behavior="smooth" suppressHydrationWarning>
      <GoogleTagManager gtmId={GTM_ID} />
      <body
        className={cn(
          "min-h-screen bg-background font-body text-foreground antialiased",
          beVietnamPro.variable,
          playfairDisplay.variable,
        )}
      >
        <JsonLd id="schema-organization" data={buildOrganizationJsonLd()} />

        {/* FirebaseClientProvider already nests FirebaseProvider + AuthProvider */}
        <FirebaseClientProvider>
          <div className="relative flex min-h-screen flex-col">
            <main className="flex-1 pb-24 md:pb-0">{children}</main>
          </div>
          <MultiContact />
          <MobileNav />
          <Toaster />
        </FirebaseClientProvider>
      </body>
      <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />
    </html>
  );
}
