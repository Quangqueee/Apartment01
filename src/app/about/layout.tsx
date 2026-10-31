import type { Metadata } from "next";
import { PublicPageShell } from "@/components/public-page-shell";

export const metadata: Metadata = {
  title: "Về chúng tôi",
  description:
    "Hanoi Residences mang đến hệ thống căn hộ dịch vụ tại Hà Nội từ năm 2020: hình ảnh thực tế, giá minh bạch, hỗ trợ khách Việt Nam và chuyên gia nước ngoài.",
  alternates: {
    canonical: "/about",
    languages: {
      "vi-VN": "/about",
      "x-default": "/about",
    },
  },
  openGraph: {
    title: "Về chúng tôi | Hanoi Residences",
    description:
      "Hanoi Residences mang đến hệ thống căn hộ dịch vụ tại Hà Nội từ năm 2020: hình ảnh thực tế, giá minh bạch, hỗ trợ khách Việt Nam và chuyên gia nước ngoài.",
    url: "/about",
    type: "website",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicPageShell>{children}</PublicPageShell>;
}
