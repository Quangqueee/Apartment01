import { Metadata } from "next";
import { getApartmentById, getRelatedApartments } from "@/lib/data";
import ApartmentDetailsPageClient from "@/components/apartment-details-page-client";
import Link from "next/link";
import { Home, SearchX, ArrowLeft } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const revalidate = 86400;

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

  const title = `${apartment.title} - ${apartment.district} | Hanoi Residences`;
  const description =
    apartment.listingSummary || apartment.details.substring(0, 155);
  const primaryImage = apartment.imageUrls?.[0] || "/default-og-image.png";

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      url: `https://hanoiresidence.site/apartments/${id}`,
      siteName: "Hanoi Residences",
      images: [
        {
          url: primaryImage,
          width: 1200,
          height: 630,
          alt: apartment.title,
        },
      ],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
      images: [primaryImage],
    },
    alternates: {
      canonical: `/apartments/${id}`,
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
                href="/"
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

  // 3. Tạo Dữ liệu có cấu trúc (Schema Markup) cho Bất động sản
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Apartment",
    name: apartment.title,
    description:
      apartment.listingSummary || apartment.details.substring(0, 155),
    floorSize: {
      "@type": "QuantitativeValue",
      value: apartment.area,
      unitCode: "MTK",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: apartment.district,
      addressRegion: "Hà Nội",
      addressCountry: "VN",
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "VND",
      price:
        typeof apartment.price === "number"
          ? apartment.price * 1000000
          : apartment.price,
      businessFunction: "http://purl.org/goodrelations/v1#LeaseOut",
      seller: {
        "@type": "RealEstateAgent",
        name: "Hanoi Residences",
        url: "https://hanoiresidence.site",
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <ApartmentDetailsPageClient
        initialApartment={apartment}
        initialRelated={relatedApartments}
      />
    </>
  );
}
