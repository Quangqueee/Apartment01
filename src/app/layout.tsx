import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Playfair_Display } from "next/font/google";
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import { ClientToaster } from "@/components/client-toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import "./globals.css";
import MobileNav from "@/components/mobile-nav";
import MultiContact from "@/components/multi-contact";
import { JsonLd } from "@/components/json-ld";
import { PwaHead } from "@/components/pwa-head";
import { cn } from "@/lib/utils";
import { GA_MEASUREMENT_ID, GTM_ID } from "@/lib/constants";
import { SITE, SITE_PATHS } from "@/lib/site";
import { buildOrganizationJsonLd } from "@/lib/structured-data";
import {
  PWA_APPLE_TOUCH_ICON,
  PWA_ICON_192,
  PWA_MANIFEST_PATH,
  PWA_THEME_COLOR,
} from "@/lib/pwa";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Hanoi Residences | Cho thuê căn hộ & Căn hộ dịch vụ tại Hà Nội",
    template: "%s | Hanoi Residences",
  },
  description:
    "Nền tảng tìm thuê căn hộ uy tín tại Hà Nội. Khám phá ngay không gian lý tưởng để an cư và làm việc với thông tin minh bạch, hỗ trợ tận tâm.",
  applicationName: SITE.name,
  manifest: PWA_MANIFEST_PATH,
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
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: PWA_ICON_192, sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: PWA_APPLE_TOUCH_ICON, sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: SITE.name,
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: PWA_THEME_COLOR },
    { media: "(prefers-color-scheme: dark)", color: PWA_THEME_COLOR },
  ],
  colorScheme: "light",
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
      <PwaHead />
      <GoogleTagManager gtmId={GTM_ID} />
      <body
        className={cn(
          "min-h-dvh bg-background font-body text-foreground antialiased overflow-x-clip",
          beVietnamPro.variable,
          playfairDisplay.variable,
        )}
      >
        <JsonLd id="schema-organization" data={buildOrganizationJsonLd()} />

        {/* FirebaseClientProvider already nests FirebaseProvider + AuthProvider */}
        <FirebaseClientProvider>
          <div className="relative flex min-h-dvh flex-col overflow-x-clip">
            <main className="flex-1 overflow-x-clip pb-[calc(6rem+var(--safe-bottom))] md:pb-0">
              {children}
            </main>
          </div>
          <MultiContact />
          <MobileNav />
          <ClientToaster />
        </FirebaseClientProvider>
      </body>
      <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />
    </html>
  );
}
