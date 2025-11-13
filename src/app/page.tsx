import Link from "next/link";
import { getApartments } from "@/lib/data";
import Header from "@/components/header";
import PaginationControls from "@/components/pagination-controls";
import Footer from "@/components/footer";
import ApartmentCard from "@/components/apartment-card";
import SortControls from "@/components/sort-controls";

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
  const { apartments, totalPages, totalResults } = await getApartments({
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
           <div className="mb-8 flex flex-col items-baseline justify-between gap-4 md:flex-row">
            <p className="text-sm text-muted-foreground">
              Tìm thấy <span className="font-bold text-foreground">{totalResults}</span> kết quả.
            </p>
            <SortControls />
          </div>
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
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed text-center">
              <h2 className="font-headline text-2xl">Không tìm thấy căn hộ nào</h2>
              <p className="mt-2 text-muted-foreground">
                Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
