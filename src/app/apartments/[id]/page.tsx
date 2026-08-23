import { Metadata } from "next";
import { getApartmentById, getRelatedApartments } from "@/lib/data";
import ApartmentDetailsPageClient from "@/components/apartment-details-page-client";
import Link from "next/link";
import { Home, SearchX, ArrowLeft } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { JsonLd } from "@/components/json-ld";
import { SITE } from "@/lib/site";
import { buildApartmentJsonLd } from "@/lib/structured-data";

type PageProps = {
  params: Promise<{ id: string }>;
};

/** Literal bắt buộc — Next.js không theo dõi import (invalid-page-config). Đồng bộ với LISTING_REVALIDATE. */
export const revalidate = false;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const apartment = await getApartmentById(id);

  if (!apartment) {
    return {
      title: "Căn hộ không tồn tại | Hanoi Residences",
      description:
        "Rất tiếc, thông tin căn hộ bạn tìm kiếm không tồn tại hoặc đã bị gỡ bỏ.",
    };
  }

  // src/app/apartments/[id]/page.tsx

  // Ưu tiên tuyệt đối cho tiêu đề và mô tả SEO do AI tạo nằm bên trong object aiContent
  const title =
    apartment.aiContent?.seoTitle ||
    `${apartment.title} - ${apartment.district} | Hanoi Residences`;

  const description =
    apartment.aiContent?.seoDescription ||
    apartment.aiContent?.description ||
    apartment.details ||
    "Nền tảng tìm thuê căn hộ uy tín tại Hà Nội. Khám phá ngay không gian lý tưởng để an cư.";

  const primaryImage = apartment.imageUrls?.[0] || SITE.ogImage;
  const canonicalPath = `/apartments/${id}`;

  return {
    title: title,
    description: description,
    authors: [{ name: SITE.founderName, url: SITE.sameAs[0] }],
    openGraph: {
      title: title,
      description: description,
      url: `${SITE.url}${canonicalPath}`,
      siteName: SITE.name,
      images: [
        {
          url: primaryImage,
          width: 1200,
          height: 630,
          alt: apartment.title,
        },
      ],
      type: "article",
      locale: SITE.locale,
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
      images: [primaryImage],
    },
    alternates: {
      canonical: canonicalPath,
      languages: {
        "vi-VN": canonicalPath,
        "x-default": canonicalPath,
      },
    },
  };
}

export default async function ApartmentPage({ params }: PageProps) {
  const { id } = await params;

  // 1. Lấy thông tin căn hộ chính
  const apartment = await getApartmentById(id);

  // GIAO DIỆN KHI KHÔNG TÌM THẤY CĂN HỘ (ĐÃ TỐI ƯU UX)
  if (!apartment) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50/50">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
          <div className="bg-white p-10 md:p-12 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 max-w-lg w-full text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-100">
              <SearchX className="h-10 w-10 text-gray-400" strokeWidth={1.5} />
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 font-headline tracking-tight">
              Không tìm thấy căn hộ
            </h1>

            <p className="text-gray-500 mb-8 leading-relaxed text-[15px] md:text-base">
              Rất tiếc, thông tin căn hộ bạn đang tìm kiếm không tồn tại, đã
              được cho thuê hoặc vừa được gỡ bỏ khỏi hệ thống của{" "}
              <strong>Hanoi Residences</strong>.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/"
                className="flex items-center justify-center gap-2 py-3.5 px-6 bg-gray-900 text-white rounded-xl font-semibold hover:bg-primary hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 active:scale-95 shadow-sm"
              >
                <Home className="h-5 w-5" />
                Về trang chủ
              </Link>

              {/* Nếu bạn có trang danh sách tổng (/apartments), có thể dùng nút dưới đây, nếu không thì ẩn đi */}
              <Link
                href="/tim-kiem"
                className="flex items-center justify-center gap-2 py-3.5 px-6 bg-white text-gray-700 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-all active:scale-95"
              >
                <ArrowLeft className="h-5 w-5" />
                Xem căn hộ khác
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 2. Lấy 8 căn hộ gợi ý bằng hàm mới tạo
  const relatedApartments = await getRelatedApartments(apartment);

  return (
    <>
      <JsonLd id="schema-apartment" data={buildApartmentJsonLd(apartment)} />

      <ApartmentDetailsPageClient
        initialApartment={apartment}
        initialRelated={relatedApartments}
      />
    </>
  );
}
