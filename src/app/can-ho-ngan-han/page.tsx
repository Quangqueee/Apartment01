import type { Metadata } from "next";
import { getPublishedShortTermApartments } from "@/lib/short-term-data";
import { PublicPageShell } from "@/components/public-page-shell";
import ShortTermListClient from "@/components/short-term-list-client";
import { SITE } from "@/lib/site";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Căn hộ ngắn hạn theo giờ, ngày, tuần tại Hà Nội | Hanoi Residences",
  description:
    "Đặt căn hộ ngắn hạn theo giờ, ngày/đêm hoặc tuần tại Hà Nội. Xem giá, chọn lịch và gửi yêu cầu xác nhận.",
  alternates: {
    canonical: "/can-ho-ngan-han",
  },
  openGraph: {
    title: "Căn hộ ngắn hạn theo giờ, ngày, tuần tại Hà Nội | Hanoi Residences",
    description:
      "Đặt căn hộ ngắn hạn theo giờ, ngày/đêm hoặc tuần tại Hà Nội. Xem giá, chọn lịch và gửi yêu cầu xác nhận.",
    url: `${SITE.url}/can-ho-ngan-han`,
    siteName: SITE.name,
    locale: SITE.locale,
    type: "website",
  },
};

export default async function ShortTermListPage() {
  const apartments = await getPublishedShortTermApartments();

  return (
    <PublicPageShell>
      <main className="container mx-auto px-4 md:px-6 py-10 lg:py-14 max-w-7xl overflow-x-hidden">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900">
            Căn hộ ngắn hạn theo giờ, ngày và tuần
          </h1>
          <p className="text-gray-500 mt-2 max-w-2xl">
            Lưu trú linh hoạt tại các căn hộ đầy đủ nội thất. Xem mức giá,
            chọn thời gian và gửi yêu cầu để đội ngũ xác nhận.
          </p>
        </div>
        <ShortTermListClient apartments={apartments} />
      </main>
    </PublicPageShell>
  );
}
