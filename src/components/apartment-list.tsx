
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useInView } from "react-intersection-observer";
import { Loader2 } from "lucide-react";
import { Apartment } from "@/lib/types";
import { fetchApartmentsAction } from "@/app/actions";
import ApartmentCard from "./apartment-card";

type ApartmentListProps = {
  initialApartments: Apartment[];
  searchParams: {
    q?: string;
    district?: string;
    price?: string;
    roomType?: string;
    sort?: string;
  };
  totalInitialResults: number;
};

const PAGE_SIZE = 9;

export default function ApartmentList({ initialApartments, searchParams, totalInitialResults }: ApartmentListProps) {
  const [apartments, setApartments] = useState(initialApartments);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialApartments.length < totalInitialResults);
  const [isLoading, setIsLoading] = useState(false);
  const { ref, inView } = useInView();

  // Ref to store a serialized version of searchParams to detect changes.
  const searchParamsRef = useRef(JSON.stringify(searchParams));

  // This is the key fix: Reset state whenever searchParams change.
  // This ensures that if the user applies a new filter or sort order,
  // the component resets to show the new initial data and loads more from page 2.
  useEffect(() => {
    const newSearchParamsString = JSON.stringify(searchParams);
    if (searchParamsRef.current !== newSearchParamsString) {
      searchParamsRef.current = newSearchParamsString;
      setApartments(initialApartments);
      setPage(1);
      setHasMore(initialApartments.length < totalInitialResults);
    }
  }, [initialApartments, searchParams, totalInitialResults]);


  const loadMoreApartments = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    const nextPage = page + 1;
    
    // The action is called with the most up-to-date searchParams
    const result = await fetchApartmentsAction({
      ...searchParams,
      priceRange: searchParams.price, // map 'price' from URL to 'priceRange'
      sortBy: searchParams.sort,
      page: nextPage,
      limit: PAGE_SIZE,
    });

    if (result.apartments.length > 0) {
      setPage(nextPage);
      const newApartments = [...apartments, ...result.apartments];
      setApartments(newApartments);
      // The total number of results comes from the initial page load.
      setHasMore(newApartments.length < totalInitialResults);
    } else {
      setHasMore(false);
    }
    setIsLoading(false);
  }, [page, hasMore, isLoading, searchParams, apartments, totalInitialResults]);


  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      loadMoreApartments();
    }
  }, [inView, hasMore, isLoading, loadMoreApartments]);

  return (
    <>
      {apartments.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">
            {apartments.map((apartment) => (
              <ApartmentCard key={apartment.id} apartment={apartment} />
            ))}
          </div>
          {hasMore && (
            <div
              ref={ref}
              className="mt-12 flex items-center justify-center space-x-2 text-muted-foreground"
            >
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Đang tải thêm...</span>
            </div>
          )}
        </>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed text-center">
          <h2 className="font-headline text-2xl">Không tìm thấy căn hộ nào</h2>
          <p className="mt-2 text-muted-foreground">
            Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn.
          </p>
        </div>
      )}
    </>
  );
}
