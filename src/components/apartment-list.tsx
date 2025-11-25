
"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { useInView } from "react-intersection-observer";
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
  const { ref, inView } = useInView({
    threshold: 0,
    triggerOnce: false,
  });

  // This effect is crucial for correctly resetting the state when the user applies new filters or searches.
  useEffect(() => {
    setApartments(initialApartments);
    setPage(1);
    setHasMore(initialApartments.length < totalInitialResults);
  }, [initialApartments, totalInitialResults]);


  const loadMoreApartments = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    const nextPage = page + 1;
    
    const result = await fetchApartmentsAction({
      query: searchParams.q,
      district: searchParams.district,
      priceRange: searchParams.price,
      roomType: searchParams.roomType,
      sortBy: searchParams.sort,
      page: nextPage,
      limit: PAGE_SIZE,
    });

    if (result.apartments && result.apartments.length > 0) {
      const newApartments = [...apartments, ...result.apartments];
      setApartments(newApartments);
      setPage(nextPage);
      setHasMore(newApartments.length < totalInitialResults);
    } else {
      setHasMore(false);
    }
    setIsLoading(false);
  }, [page, hasMore, isLoading, searchParams, apartments, totalInitialResults]);

  useEffect(() => {
    if (inView && !isLoading) {
      loadMoreApartments();
    }
  }, [inView, isLoading, loadMoreApartments]);

  return (
    <>
      {apartments.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">
            {apartments.map((apartment, index) => (
               <ApartmentCard key={`${apartment.id}-${index}`} apartment={apartment} />
            ))}
          </div>
          {hasMore && (
             <div ref={ref} className="mt-12 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
