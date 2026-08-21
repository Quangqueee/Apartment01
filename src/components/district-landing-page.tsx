import { getApartments } from "@/lib/data";
import Header from "@/components/header";
import Footer from "@/components/footer";
import SortControls from "@/components/sort-controls";
import SearchPagination from "@/components/search-pagination";
import ApartmentCard from "@/components/apartment-card";
import DistrictLandingHero from "@/components/district-landing-hero";
import { JsonLd } from "@/components/json-ld";
import type { Apartment } from "@/lib/types";
import type { DistrictLanding } from "@/lib/districts";
import { buildSearchHref } from "@/lib/districts";
import { buildDistrictSearchJsonLd } from "@/lib/structured-data";
import { SEARCH_PAGE_SIZE, toParamString } from "@/components/search-results";
import { Suspense } from "react";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";

export default async function DistrictLandingPage({
  landing,
  searchParams,
}: {
  landing: DistrictLanding;
  searchParams: Record<string, string | string[] | undefined>;
}) {
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
      district: landing.name,
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
    console.error("Lỗi khi tải danh sách căn hộ theo quận:", error);
  }

  const totalPages = Math.max(1, Math.ceil(totalResults / SEARCH_PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const searchHref = buildSearchHref({ districts: [landing.name], sort });

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-white">
      <JsonLd
        id="schema-district-search"
        data={buildDistrictSearchJsonLd({
          landing,
          apartments,
          totalResults,
          page: currentPage,
          pageSize: SEARCH_PAGE_SIZE,
        })}
      />
      <Header />

      <main className="flex-1 overflow-x-hidden">
        <DistrictLandingHero landing={landing} totalResults={totalResults} />

        <section className="mx-auto w-full max-w-[1920px] overflow-x-hidden px-4 pb-8 pt-6 lg:px-8 md:pb-10 md:pt-8">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3 overflow-x-hidden">
            <div className="min-w-0">
              <h2 className="font-headline text-xl font-bold tracking-tight text-gray-900 md:text-2xl">
                Căn hộ đang cho thuê tại {landing.name}
              </h2>
              <p className="mt-1 text-sm font-medium text-amber-700 md:text-base">
                {totalResults.toLocaleString("vi-VN")} căn hộ
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={searchHref}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:border-[#cda533] hover:text-[#cda533]"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Lọc nâng cao
              </Link>
              <Suspense fallback={null}>
                <SortControls />
              </Suspense>
            </div>
          </div>

          {apartments.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 xl:gap-8">
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
              <h2 className="font-headline text-2xl">Chưa có căn hộ tại {landing.name}</h2>
              <p className="mt-2 text-muted-foreground">
                Hãy xem các quận lân cận hoặc mở bộ lọc tìm kiếm toàn thành phố.
              </p>
            </div>
          )}

          <SearchPagination
            currentPage={currentPage}
            totalPages={totalPages}
            nextCursor={nextCursor}
            prevAnchor={apartments[0]?.id ?? null}
            query=""
            district={landing.name}
            price=""
            roomType=""
            sort={sort}
            basePath={`/${landing.slug}`}
          />
        </section>
      </main>

      <Footer />
    </div>
  );
}
