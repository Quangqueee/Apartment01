import { Metadata } from "next";
import Header from "@/components/header";
import Footer from "@/components/footer";
import MobileNav from "@/components/mobile-nav";

export const metadata: Metadata = {
  title: "Quy trình làm việc CTV | Hanoi Residences",
  description:
    "Hướng dẫn quy trình làm việc dành cho Cộng tác viên Hanoi Residences.",
  robots: { index: false }, // Trang nội bộ, không index SEO
};

export default function HuongDanPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white font-body">
      <Header />
      <main className="flex-1"></main>
      <Footer />
      <MobileNav />
    </div>
  );
}
