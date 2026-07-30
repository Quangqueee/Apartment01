import { Metadata } from "next";
import { getApartmentById, getRelatedApartments } from "@/lib/data";
import ApartmentDetailsPageClient from "@/components/apartment-details-page-client";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const revalidate = 604800;

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

  if (!apartment) {
    return (
      <div className="text-center py-20 font-bold text-xl">
        Không tìm thấy căn hộ
      </div>
    );
  }

  // 2. Lấy 8 căn hộ gợi ý bằng hàm mới tạo
  const relatedApartments = await getRelatedApartments(apartment);

  // 3. Truyền xuống Client
  return (
    <ApartmentDetailsPageClient
      initialApartment={apartment}
      initialRelated={relatedApartments}
    />
  );
}
