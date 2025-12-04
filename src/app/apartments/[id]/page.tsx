
import { Metadata } from "next";
import { getApartmentById as getApartmentByIdServer } from "@/lib/data";
import { use } from "react";
import ApartmentDetailsPageClient from "@/components/apartment-details-page-client";

// --- SEO METADATA GENERATION (SERVER-SIDE) ---
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const apartment = await getApartmentByIdServer(params.id);

  if (!apartment) {
    return {
      title: "Apartment Not Found | Hanoi Residences",
      description: "The apartment you are looking for could not be found.",
    };
  }

  const title = `${apartment.title} | Hanoi Residences`;
  const description = apartment.listingSummary || apartment.details.substring(0, 155);
  const primaryImage = apartment.imageUrls?.[0] || '/default-og-image.png';

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: [
        {
          url: primaryImage,
          width: 1200,
          height: 630,
          alt: apartment.title,
        },
      ],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [primaryImage],
    },
  };
}

/**
 * This is the SERVER component wrapper for the apartment details page.
 * Its only job is to safely extract the `id` from the URL parameters (`params`)
 * and pass it to the actual page component, which is a Client Component.
 * This pattern avoids the `params` access warning in Next.js and separates server/client logic.
 */
export default function ApartmentPage({ params }: { params: { id: string } }) {
  // `use(Promise)` is the recommended way to unwrap the params promise in Server Components.
  const { id } = use(Promise.resolve(params));
  
  // We pass the extracted `id` to the client component which will handle all data fetching and rendering.
  return <ApartmentDetailsPageClient apartmentId={id} />;
}
