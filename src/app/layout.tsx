import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import "./globals.css";
import MobileNav from "@/components/mobile-nav";
import MultiContact from "@/components/multi-contact";

export const metadata: Metadata = {
  title: "Hanoi Residences | Premium Apartments",
  description: "Premium apartments for rent in Hanoi",
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
