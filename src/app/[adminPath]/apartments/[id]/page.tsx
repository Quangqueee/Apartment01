import { Metadata } from "next";
import { getApartmentById as getApartmentByIdServer } from "@/lib/data";
import { use } from "react";
import ApartmentDetailsPageClient from "@/components/apartment-details-page-client";
import { notFound } from "next/navigation";

// Định nghĩa kiểu dữ liệu chuẩn cho Next.js 16
type PageProps = {
  params: Promise<{ id: string }>;
};

// --- TỐI ƯU SEO METADATA (SERVER-SIDE) ---
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  // BẮT BUỘC: Giải nén params bằng await
  const { id } = await params;
  const apartment = await getApartmentByIdServer(id);

  if (!apartment) {
    return {
      title: "Căn hộ không tồn tại | Hanoi Residences",
      description:
        "Rất tiếc, thông tin căn hộ bạn tìm kiếm không tồn tại hoặc đã bị gỡ bỏ.",
      openGraph: {
        title: "Căn hộ không tồn tại | Hanoi Residences",
        description:
          "Rất tiếc, thông tin căn hộ bạn tìm kiếm không tồn tại hoặc đã bị gỡ bỏ.",
      },
    };
  }

  const title = `${apartment.title} - ${apartment.district} | Hanoi Residences`;
  const description = (
    apartment.listingSummary ||
    apartment.details ||
    ""
  ).slice(0, 155);
  const primaryImage = apartment.imageUrls?.[0] || "/default-og-image.png";

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      url: `https://hanoiresidences.com/apartments/${id}`,
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
    keywords: [
      apartment.title,
      `thuê căn hộ ${apartment.district}`,
      "căn hộ để ở tại hà nội",
      "căn hộ cho người đi làm",
      "căn hộ cho người nước ngoài",
      "căn hộ cho người nước ngoài tại hà nội",
      "căn hộ cho thuê giá rẻ",
      "cho thuê căn hộ cao cấp",
      "cho thuê căn hộ trung tâm hà nội",
      "căn hộ cho thuê cao cấp",
      "căn hộ cho thuê trung tâm hà nội",
      "căn hộ cho thuê gần trung tâm hà nội",
      "căn hộ cho thuê gần hồ gươm",
      "căn hộ cho thuê gần các trường đại học",
      "căn hộ cho thuê gần các khu công nghiệp",
      "cho thuê phòng trọ",
      "cho thuê nhà nguyên căn",
      "cho thuê nhà trọ",
    ],
    alternates: {
      canonical: `/apartments/${id}`,
    },
  };
}

export default async function ApartmentPage({ params }: PageProps) {
  // 1. Chuyển component thành 'async function'
  // 2. Giải nén params bằng await giống như cách bạn làm trong generateMetadata
  const { id } = await params;

  // 3. Fetch dữ liệu căn hộ ở Server
  const apartment = await getApartmentByIdServer(id);

  if (!apartment) {
    // Trả về trang 404 nếu không tìm thấy dữ liệu
    notFound();
  }
  const relatedApartments: any[] = [];

  // 5. Truyền đúng props mà Client Component yêu cầu
  return (
    <ApartmentDetailsPageClient
      initialApartment={apartment}
      initialRelated={relatedApartments}
    />
  );
}
