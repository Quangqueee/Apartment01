import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Home, SearchX } from "lucide-react";
import { getShortTermApartmentById } from "@/lib/short-term-data";
import ShortTermDetailClient from "@/components/short-term-detail-client";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { SITE } from "@/lib/site";

type PageProps = {
  params: Promise<{ id: string }>;
};

// Luôn render động: lịch trống thay đổi liên tục theo booking.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const apartment = await getShortTermApartmentById(id);

  if (!apartment || apartment.submissionStatus !== "published") {
    return {
      title: "Căn hộ không tồn tại | Hanoi Residences",
      description:
        "Rất tiếc, thông tin căn hộ bạn tìm kiếm không tồn tại hoặc đã bị gỡ bỏ.",
    };
  }

  const title = `${apartment.title} - ${apartment.district} | Căn hộ ngắn hạn`;
  const description =
    apartment.details?.slice(0, 160) ||
    "Căn hộ ngắn hạn theo đêm tại Hà Nội, đầy đủ nội thất. Gửi yêu cầu, đội ngũ xác nhận giúp bạn.";
  const canonicalPath = `/can-ho-ngan-han/${id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE.url}${canonicalPath}`,
      siteName: SITE.name,
      images: apartment.imageUrls?.[0]
        ? [{ url: apartment.imageUrls[0], width: 1200, height: 630 }]
        : undefined,
      type: "article",
      locale: SITE.locale,
    },
    alternates: { canonical: canonicalPath },
  };
}

export default async function ShortTermDetailPage({ params }: PageProps) {
  const { id } = await params;
  const apartment = await getShortTermApartmentById(id);

  if (!apartment || apartment.submissionStatus !== "published") {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50/50">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
          <div className="bg-white p-10 md:p-12 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 max-w-lg w-full text-center">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-100">
              <SearchX className="h-10 w-10 text-gray-400" strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 font-headline tracking-tight">
              Không tìm thấy căn hộ
            </h1>
            <p className="text-gray-500 mb-8 leading-relaxed text-[15px] md:text-base">
              Căn hộ ngắn hạn bạn tìm kiếm không tồn tại hoặc đã ngưng nhận
              khách.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/"
                className="flex items-center justify-center gap-2 py-3.5 px-6 bg-gray-900 text-white rounded-xl font-semibold hover:bg-primary transition-all active:scale-95 shadow-sm"
              >
                <Home className="h-5 w-5" />
                Về trang chủ
              </Link>
              <Link
                href="/can-ho-ngan-han"
                className="flex items-center justify-center gap-2 py-3.5 px-6 bg-white text-gray-700 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-all active:scale-95"
              >
                <ArrowLeft className="h-5 w-5" />
                Xem căn ngắn hạn khác
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return <ShortTermDetailClient apartment={apartment} />;
}
