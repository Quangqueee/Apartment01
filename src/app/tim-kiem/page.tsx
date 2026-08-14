import { getApartments } from "@/lib/data";
import Header from "@/components/header";
import Footer from "@/components/footer";
import SortControls from "@/components/sort-controls";
import SearchSidebar, {
  SearchFiltersSheet,
} from "@/components/search-sidebar";
import SearchPagination from "@/components/search-pagination";
import ApartmentCard from "@/components/apartment-card";
import type { Metadata } from "next";
import { Suspense } from "react";
import type { Apartment } from "@/lib/types";

export const metadata: Metadata = {
  title: "Tìm kiếm căn hộ",
  description:
    "Kết quả tìm kiếm căn hộ cho thuê tại Hà Nội theo khu vực, loại phòng và ngân sách.",
};

export const revalidate = 60;

const SEARCH_PAGE_SIZE = 12;

const toParamString = (value: unknown) => {
  if (Array.isArray(value)) return value.filter(Boolean).join(",");
  if (typeof value === "string") return value;
  return "";
};

export default async function SearchResultsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sParams = await searchParams;
  const query = toParamString(sParams.query);
  const district = toParamString(sParams.district);
  const price = toParamString(sParams.price);
  const roomType = toParamString(sParams.roomType);
  const sort = toParamString(sParams.sort);
  const cursor = toParamString(sParams.cursor);
  const requestedPage = Math.max(
    1,
    Number(toParamString(sParams.page) || "1") || 1,
  );

  const { apartments, totalResults, nextCursor } = await getApartments({
    query,
    district,
    priceRange: price,
    roomType,
    page: cursor ? 1 : requestedPage,
    limit: SEARCH_PAGE_SIZE,
    sortBy: sort,
    cursor: cursor || undefined,
  });

  const serializedApartments = JSON.parse(
    JSON.stringify(apartments),
  ) as Apartment[];
  const totalPages = Math.max(1, Math.ceil(totalResults / SEARCH_PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);

  return (
    <div className="flex min-h-screen flex-col bg-white overflow-x-hidden">
      <Header />

      <main className="flex-1 overflow-x-hidden">
        <section className="w-full max-w-[1920px] mx-auto px-4 lg:px-8 py-4 md:py-5 overflow-x-hidden">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3 overflow-x-hidden">
            <div className="min-w-0">
              <h1 className="font-headline text-xl font-black uppercase tracking-tight text-gray-900 md:text-2xl">
                Kết quả tìm kiếm
              </h1>
              <p className="mt-1 text-base font-bold uppercase tracking-widest text-amber-700 md:text-lg">
                {totalResults} căn hộ
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Suspense fallback={null}>
                <SearchFiltersSheet />
              </Suspense>
              <Suspense fallback={null}>
                <SortControls />
              </Suspense>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
            <aside className="hidden lg:block">
              <div className="sticky top-24 overflow-x-hidden rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
                <h2 className="mb-3 font-headline text-base font-bold text-gray-900">
                  Bộ lọc tìm kiếm
                </h2>
                <Suspense fallback={null}>
                  <SearchSidebar />
                </Suspense>
              </div>
            </aside>

            <div className="min-w-0 overflow-x-hidden">
              {serializedApartments.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 xl:gap-8">
                  {serializedApartments.map((apartment, index) => (
                    <ApartmentCard
                      key={apartment.id}
                      apartment={apartment}
                      imagePriority={index < 2}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex h-56 flex-col items-center justify-center rounded-2xl border border-dashed text-center">
                  <h2 className="font-headline text-2xl">Không tìm thấy căn hộ nào</h2>
                  <p className="mt-2 text-muted-foreground">
                    Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn.
                  </p>
                </div>
              )}

              <SearchPagination
                currentPage={currentPage}
                totalPages={totalPages}
                nextCursor={nextCursor}
                query={query}
                district={district}
                price={price}
                roomType={roomType}
                sort={sort}
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
