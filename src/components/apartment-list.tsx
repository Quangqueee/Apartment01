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
};

export default function ApartmentList({ initialApartments, searchParams }: ApartmentListProps) {
  const [apartments, setApartments] = useState(initialApartments);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialApartments.length > 0);
  const [isLoading, setIsLoading] = useState(false);
  const { ref, inView } = useInView();

  // Ref to store a serialized version of searchParams for dependency array
  const searchParamsRef = useRef(JSON.stringify(searchParams));

  // Reset state when filters change
  useEffect(() => {
    const newSearchParams = JSON.stringify(searchParams);
    if (searchParamsRef.current !== newSearchParams) {
      searchParamsRef.current = newSearchParams;
      setApartments(initialApartments);
      setPage(1);
      setHasMore(initialApartments.length > 0);
    }
  }, [initialApartments, searchParams]);

  const loadMoreApartments = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    const nextPage = page + 1;
    const result = await fetchApartmentsAction({
      ...searchParams,
      page: nextPage,
      limit: 9,
    });

    if (result.apartments.length > 0) {
      setPage(nextPage);
      setApartments((prev) => [...prev, ...result.apartments]);
      setHasMore(result.apartments.length === 9); 
    } else {
      setHasMore(false);
    }
    setIsLoading(false);
  }, [page, hasMore, isLoading, searchParams]);

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
