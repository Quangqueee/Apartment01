"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { Apartment } from "@/lib/types";
import { fetchApartmentsAction } from "@/app/actions";
import ApartmentCard from "./apartment-card";
import { Button } from "./ui/button";
import { useAuth } from "@/context/auth-context";
// 1. Import Framer Motion
import { motion } from "framer-motion";

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

// Đã tăng lên 12 theo yêu cầu của bạn ở bước trước
const PAGE_SIZE = 12;

export default function ApartmentList({
  initialApartments,
  searchParams,
  totalInitialResults,
}: ApartmentListProps) {
  const { user, userData } = useAuth();
  const favoriteIds = useMemo(
    () => new Set<string>(userData?.favorites ?? []),
    [userData?.favorites],
  );
  const [apartments, setApartments] = useState(initialApartments);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(
    initialApartments.length < totalInitialResults,
  );
  const [isLoading, setIsLoading] = useState(false);

  // Optimistically update favorite status
  const handleFavoriteToggle = (apartmentId: string, isFavorited: boolean) => {
    setApartments((currentApartments) =>
      currentApartments.map((apt) =>
        apt.id === apartmentId ? { ...apt, isFavorited } : apt,
      ),
    );
  };

  useEffect(() => {
    setApartments(initialApartments);
    const initialPage = Math.ceil(initialApartments.length / PAGE_SIZE);
    setPage(initialPage > 0 ? initialPage : 1);
    setHasMore(initialApartments.length < totalInitialResults);
  }, [initialApartments, totalInitialResults]);

  useEffect(() => {
    setApartments((currentApartments) =>
      currentApartments.map((apt) => ({
        ...apt,
        isFavorited: favoriteIds.has(apt.id),
      })),
    );
  }, [favoriteIds]);

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
  }, [
    page,
    hasMore,
    isLoading,
    searchParams,
    apartments,
    totalInitialResults,
    user,
  ]);

  return (
    <>
      {apartments.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">
            {apartments.map((apartment, index) => (
              // 2. Wrap Card trong motion.div
              <motion.div
                key={`${apartment.id}-${index}`}
                // Trạng thái ban đầu: Ẩn và dịch xuống 50px
                initial={{ opacity: 0, y: 50 }}
                // Khi cuộn tới: Hiện rõ và dịch về vị trí gốc (0)
                whileInView={{ opacity: 1, y: 0 }}
                // Chỉ chạy hiệu ứng 1 lần, khi phần tử vào khung hình khoảng 50px
                viewport={{ once: true, margin: "-50px" }}
                // Cấu hình thời gian chạy hiệu ứng
                transition={{
                  duration: 0.5,
                  // Delay nhẹ cho 12 căn đầu tiên để tạo hiệu ứng domino
                  delay: index < PAGE_SIZE ? index * 0.05 : 0,
                  ease: "easeOut",
                }}
              >
                <ApartmentCard
                  apartment={apartment}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              </motion.div>
            ))}
          </div>
          {hasMore && (
            <div className="mt-12 flex justify-center">
              <Button
                onClick={loadMoreApartments}
                disabled={isLoading}
                className="relative px-10 py-6 rounded-full bg-gradient-to-r from-[#cfb56f] to-[#b88e22] hover:from-[#d6b03f] hover:to-[#d3ac42] text-white font-semibold tracking-wide shadow-[0_10px_30px_rgba(205,165,51,0.3)] hover:shadow-[0_15px_35px_rgba(205,165,51,0.45)] transition-all duration-300 ease-out hover:scale-105 active:scale-85 border-none min-w-[210px] cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span className="text-sm font-bold tracking-wider antialiased drop-shadow-sm transition-transform duration-300">
                    Xem thêm căn hộ
                  </span>
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
