
"use client";

import { useState, useEffect, useCallback, use } from "react";
import { Loader2 } from "lucide-react";
import { Apartment } from "@/lib/types";
import { fetchApartmentsAction } from "@/app/actions";
import ApartmentCard from "./apartment-card";
import { Button } from "./ui/button";
import { useUser } from "@/firebase/provider";

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
  const { user } = useUser();
  const [apartments, setApartments] = useState(initialApartments);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialApartments.length < totalInitialResults);
  const [isLoading, setIsLoading] = useState(false);

  // Optimistically update favorite status
  const handleFavoriteToggle = (apartmentId: string, isFavorited: boolean) => {
    setApartments(currentApartments =>
      currentApartments.map(apt =>
        apt.id === apartmentId ? { ...apt, isFavorited } : apt
      )
    );
  };


  useEffect(() => {
    const fetchWithFavorites = async () => {
      // When the user logs in/out, re-fetch the initial list to get favorite status
      const result = await fetchApartmentsAction({
        ...searchParams,
        userId: user?.uid,
        page: 1,
        limit: apartments.length > PAGE_SIZE ? apartments.length : PAGE_SIZE, // Fetch up to current number of items
      });
      if (result.apartments) {
        setApartments(result.apartments);
      }
    };

    if (user !== undefined) { // Check if user state is resolved
      fetchWithFavorites();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // This effect correctly resets the state when filters change and
  // also correctly determines the `hasMore` state when navigating back to a page
  // with a longer list from the bfcache.
  useEffect(() => {
    setApartments(initialApartments);
    const initialPage = Math.ceil(initialApartments.length / PAGE_SIZE);
    setPage(initialPage > 0 ? initialPage : 1);
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
      userId: user?.uid,
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
  }, [page, hasMore, isLoading, searchParams, apartments, totalInitialResults, user]);

  return (
    <>
      {apartments.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">
            {apartments.map((apartment, index) => (
               <ApartmentCard 
                  key={`${apartment.id}-${index}`} 
                  apartment={apartment} 
                  onFavoriteToggle={handleFavoriteToggle} 
                />
            ))}
          </div>
          {hasMore && (
             <div className="mt-12 flex justify-center">
                <Button onClick={loadMoreApartments} disabled={isLoading} variant="outline" className="min-w-[150px]">
                    {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
