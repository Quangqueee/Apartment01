import { Metadata } from "next";
import { getApartmentById as getApartmentByIdServer } from "@/lib/data";
import { use } from "react";
import ApartmentDetailsPageClient from "@/components/apartment-details-page-client";

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
    apartment.listingSummary || apartment.details || ""
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

/**
 * Server Component wrapper
 */
export default function ApartmentPage({ params }: PageProps) {
  // Giải nén params bằng React.use() cho các Server Component đồng bộ
  const { id } = use(params);

  // Truyền ID đã giải nén xuống Client Component
  return <ApartmentDetailsPageClient apartmentId={id} />;
}
