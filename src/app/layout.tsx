import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import "./globals.css";
import MobileNav from "@/components/mobile-nav";

export const metadata: Metadata = {
  title: "Hanoi Residences",
  description: "Premium apartments for rent in Hanoi",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body bg-background text-foreground antialiased">
        <FirebaseClientProvider>
          <div className="relative flex min-h-screen w-full flex-col pb-16 md:pb-0">
            {children}
          </div>
          <MobileNav />
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
