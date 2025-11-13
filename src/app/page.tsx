import Link from "next/link";
import { getApartments } from "@/lib/data";
import Header from "@/components/header";
import PaginationControls from "@/components/pagination-controls";
import Footer from "@/components/footer";
import ApartmentCard from "@/components/apartment-card";

export const dynamic = "force-dynamic";

type HomeProps = {
  searchParams: {
    q?: string;
    district?: string;
    price?: string;
    roomType?: string;
    page?: string;
    sort?: string;
  };
};

export default async function Home({ searchParams }: HomeProps) {
  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const { apartments, totalPages } = await getApartments({
    query: searchParams.q,
    district: searchParams.district,
    priceRange: searchParams.price,
    roomType: searchParams.roomType,
    page,
    limit: 9,
    sortBy: searchParams.sort,
  });

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12">
          {apartments.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">
                {apartments.map((apartment) => (
                  <ApartmentCard key={apartment.id} apartment={apartment} />
                ))}
              </div>
              <PaginationControls
                currentPage={page}
                totalPages={totalPages}
                className="mt-12"
              />
            </>
          ) : (
            <div className="text-center">
              <h2 className="font-headline text-2xl">No Apartments Found</h2>
              <p className="mt-2 text-muted-foreground">
                Try adjusting your filters or search query.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
