
import Link from "next/link";
import { getApartments } from "@/lib/data";
import Header from "@/components/header";
import Footer from "@/components/footer";
import ApartmentCard from "@/components/apartment-card";
import SortControls from "@/components/sort-controls";
import ApartmentList from "@/components/apartment-list";

export const dynamic = "force-dynamic";

type HomeProps = {
  searchParams: {
    q?: string;
    district?: string;
    price?: string;
    roomType?: string;
    sort?: string;
  };
};

const PAGE_SIZE = 9;

export default async function Home({ searchParams }: HomeProps) {
  // Fetch the initial batch of apartments using the centralized getApartments function
  const { apartments, totalResults } = await getApartments({
    query: searchParams.q,
    district: searchParams.district,
    priceRange: searchParams.price,
    roomType: searchParams.roomType,
    page: 1, // Always fetch the first page on initial load
    limit: PAGE_SIZE,
    sortBy: searchParams.sort,
  });

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12">
           <div className="mb-8 flex flex-col items-baseline justify-between gap-4 md:flex-row">
            <p className="text-sm text-muted-foreground">
              Tìm thấy <span className="font-bold text-foreground">{totalResults}</span> kết quả.
            </p>
            <SortControls />
          </div>
          <ApartmentList 
            initialApartments={apartments} 
            searchParams={searchParams}
            totalInitialResults={totalResults}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
