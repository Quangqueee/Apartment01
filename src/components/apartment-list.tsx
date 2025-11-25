
"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { Apartment } from "@/lib/types";
import { fetchApartmentsAction } from "@/app/actions";
import ApartmentCard from "./apartment-card";
import { Button } from "./ui/button";

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
  
  // This effect synchronizes the component's state with new server-rendered props.
  // It runs when the user applies new filters, sorting, or performs a search.
  useEffect(() => {
    setApartments(initialApartments);
    setPage(1); // Reset to the first page
    setHasMore(initialApartments.length < totalInitialResults);
  }, [initialApartments, totalInitialResults]);


  const loadMoreApartments = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    const nextPage = page + 1;
    
    const result = await fetchApartmentsAction({
      query: searchParams.q,
      district: searchParams.district,
      priceRange: searchParams.price, // map 'price' from URL to 'priceRange'
      roomType: searchParams.roomType,
      sortBy: searchParams.sort,
      page: nextPage,
      limit: PAGE_SIZE,
    });

    if (result.apartments && result.apartments.length > 0) {
      setPage(nextPage);
      // Use a callback with setApartments to ensure we're appending to the most recent state
      setApartments((prev) => [...prev, ...result.apartments]);
      // The total number of results comes from the initial page load.
      // We need to use a callback here as well to get the latest `apartments` length
      setHasMore(prevHasMore => {
          const newTotal = apartments.length + result.apartments.length;
          return newTotal < totalInitialResults;
      });

    } else {
      setHasMore(false);
    }
    setIsLoading(false);
  }, [page, hasMore, isLoading, searchParams, apartments.length, totalInitialResults]);

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
            <div className="mt-12 flex justify-center">
              <Button
                onClick={loadMoreApartments}
                disabled={isLoading}
                variant="outline"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Đang tải...
                  </>
                ) : (
                  "Xem thêm"
                )}
              </Button>
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
