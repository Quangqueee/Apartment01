import { Metadata } from "next";
import { getApartmentById as getApartmentByIdServer } from "@/lib/data";
import { use } from "react";
import ApartmentDetailsPageClient from "@/components/apartment-details-page-client";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
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
  const { id } = await params;
  const apartment = await getApartmentByIdServer(id);

  if (!apartment) {
    notFound();
  }

  const relatedApartments: any[] = [];

  function serializeTimestamps<T>(obj: T): T {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== "object") return obj;

    if (typeof (obj as any).toDate === "function") {
      return (obj as any).toDate().toISOString() as unknown as T;
    }

    if ("seconds" in obj && typeof (obj as any).seconds === "number") {
      return new Date(
        (obj as any).seconds * 1000,
      ).toISOString() as unknown as T;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => serializeTimestamps(item)) as unknown as T;
    }

    const result: any = {};
    for (const key in obj) {
      result[key] = serializeTimestamps((obj as any)[key]);
    }

    return result;
  }

  const safeApartment = serializeTimestamps(apartment);
  const safeRelatedApartments = serializeTimestamps(relatedApartments);

  return (
    <ApartmentDetailsPageClient
      initialApartment={safeApartment}
      initialRelated={safeRelatedApartments}
    />
  );
}
