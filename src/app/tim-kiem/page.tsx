import { getApartments } from "@/lib/data";
import Header from "@/components/header";
import Footer from "@/components/footer";
import MobileNav from "@/components/mobile-nav";
import SortControls from "@/components/sort-controls";
import SearchFilterTags from "@/components/search-filter-tags";
import SearchSidebar, {
  SearchFiltersSheet,
} from "@/components/search-sidebar";
import SearchPagination from "@/components/search-pagination";
import ApartmentCard from "@/components/apartment-card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
        <section className="w-full max-w-[1600px] mx-auto px-4 lg:px-6 py-4 md:py-5 overflow-x-hidden">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 overflow-x-hidden">
            <div className="min-w-0">
              <Link
                href="/"
                className="mb-1 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 transition-colors hover:text-[#cda533]"
              >
                <ArrowLeft size={12} /> Trang chủ
              </Link>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h1 className="font-headline text-xl font-black uppercase tracking-tight text-gray-900 md:text-2xl">
                  Kết quả tìm kiếm
                </h1>
                <p className="text-xs font-bold uppercase tracking-widest text-amber-700">
                  {totalResults} căn hộ
                </p>
              </div>
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

          <Suspense fallback={null}>
            <SearchFilterTags />
          </Suspense>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
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
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {serializedApartments.map((apartment) => (
                    <ApartmentCard
                      key={apartment.id}
                      apartment={apartment}
                      isCompact
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
      <MobileNav />
    </div>
  );
}
