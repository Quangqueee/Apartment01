import { getApartments } from "@/lib/data";
import Header from "@/components/header";
import Footer from "@/components/footer";
import SortControls from "@/components/sort-controls";
import SearchSidebar from "@/components/search-sidebar";
import SearchMobileBar from "@/components/search-mobile-bar";
import SearchPagination from "@/components/search-pagination";
import ApartmentCard from "@/components/apartment-card";
import type { Apartment } from "@/lib/types";
import { Suspense } from "react";
import { cn } from "@/lib/utils";

export const SEARCH_PAGE_SIZE = 12;

export const toParamString = (value: unknown) => {
  if (Array.isArray(value)) return value.filter(Boolean).join(",");
  if (typeof value === "string") return value;
  return "";
};

function SearchResultsHeading({
  totalResults,
  className,
}: {
  totalResults: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-3 flex flex-col gap-3 overflow-x-hidden sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="font-headline text-lg font-black uppercase tracking-tight text-gray-900 md:text-2xl">
          Kết quả tìm kiếm
        </h1>
        <p className="mt-1 text-sm font-bold uppercase tracking-widest text-amber-700 md:text-lg">
          {totalResults} căn hộ
        </p>
      </div>

      <div className="flex shrink-0 items-center">
        <Suspense fallback={null}>
          <SortControls />
        </Suspense>
      </div>
    </div>
  );
}

export default async function SearchResults({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const query = toParamString(searchParams.query);
  const district = toParamString(searchParams.district);
  const price = toParamString(searchParams.price);
  const roomType = toParamString(searchParams.roomType);
  const sort = toParamString(searchParams.sort);
  const cursor = toParamString(searchParams.cursor);
  const before = toParamString(searchParams.before);
  const requestedPage = Math.max(
    1,
    Number(toParamString(searchParams.page) || "1") || 1,
  );

  let apartments: Apartment[] = [];
  let totalResults = 0;
  let nextCursor: string | null = null;

  try {
    const result = await getApartments({
      query,
      district,
      priceRange: price,
      roomType,
      page: cursor || before ? 1 : requestedPage,
      limit: SEARCH_PAGE_SIZE,
      sortBy: sort,
      cursor: cursor || undefined,
      before: before || undefined,
    });
    apartments = JSON.parse(JSON.stringify(result.apartments)) as Apartment[];
    totalResults = result.totalResults;
    nextCursor = result.nextCursor;
  } catch (error) {
    console.error("Lỗi khi tải danh sách căn hộ tìm kiếm:", error);
  }

  const totalPages = Math.max(1, Math.ceil(totalResults / SEARCH_PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-white">
      <Header />
      <Suspense fallback={null}>
        <SearchMobileBar />
      </Suspense>

      <main className="flex-1 overflow-x-clip">
        <section className="mx-auto w-full max-w-[1920px] overflow-x-clip px-4 py-4 lg:px-8 md:py-5">
          <SearchResultsHeading
            totalResults={totalResults}
            className="lg:hidden"
          />

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
            <aside className="hidden lg:block">
              <div className="sticky top-[calc(var(--site-header-height)+1rem)] max-h-[calc(100dvh-var(--site-header-height)-2rem)] overflow-x-hidden overflow-y-auto rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
                <h2 className="mb-3 shrink-0 font-headline text-base font-bold text-gray-900">
                  Bộ lọc tìm kiếm
                </h2>
                <Suspense fallback={null}>
                  <SearchSidebar className="min-h-0" />
                </Suspense>
              </div>
            </aside>

            <div className="min-w-0 overflow-x-hidden">
              <SearchResultsHeading
                totalResults={totalResults}
                className="hidden lg:flex"
              />
              {apartments.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8 2xl:grid-cols-4">
                  {apartments.map((apartment, index) => (
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
                prevAnchor={apartments[0]?.id ?? null}
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
