"use client";

import {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Apartment } from "@/lib/types";
import { fetchApartmentsAction } from "@/app/actions";
import ApartmentCard from "./apartment-card";
import { Button } from "./ui/button";
import { useAuth } from "@/context/auth-context";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type ApartmentListProps = {
  initialApartments: Apartment[];
  searchParams: {
    q?: string;
    query?: string;
    district?: string;
    price?: string;
    roomType?: string;
    sort?: string;
  };
  totalInitialResults: number;
};

const PAGE_SIZE = 12;

function subscribeMd(onChange: () => void) {
  const media = window.matchMedia("(min-width: 768px)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getMdSnapshot() {
  return window.matchMedia("(min-width: 768px)").matches;
}

function getVisiblePages(current: number, total: number) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages = new Set([1, total, current, current - 1, current + 1]);
  return Array.from(pages)
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b)
    .reduce<(number | "ellipsis")[]>((items, page, index, list) => {
      if (index > 0 && page - (list[index - 1] as number) > 1) {
        items.push("ellipsis");
      }
      items.push(page);
      return items;
    }, []);
}

export default function ApartmentList({
  initialApartments,
  searchParams,
  totalInitialResults,
}: ApartmentListProps) {
  const { userData } = useAuth();
  const { toast } = useToast();
  const isDesktop = useSyncExternalStore(subscribeMd, getMdSnapshot, () => false);
  const favoriteIds = useMemo(
    () => new Set<string>(userData?.favorites ?? []),
    [userData?.favorites],
  );

  const [pageItems, setPageItems] = useState<Record<number, Apartment[]>>({
    1: initialApartments,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [loadedThrough, setLoadedThrough] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const pageItemsRef = useRef(pageItems);
  const loadingRef = useRef(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const gridMinHeightRef = useRef(0);
  const shouldSnapRef = useRef(false);
  pageItemsRef.current = pageItems;

  const totalPages = Math.max(1, Math.ceil(totalInitialResults / PAGE_SIZE));

  const applyFavorites = useCallback(
    (list: Apartment[]) =>
      list.map((apt) => ({
        ...apt,
        isFavorited: favoriteIds.has(apt.id),
      })),
    [favoriteIds],
  );

  useEffect(() => {
    setPageItems({ 1: initialApartments });
    setCurrentPage(1);
    setLoadedThrough(1);
  }, [initialApartments, totalInitialResults]);

  const handleFavoriteToggle = (apartmentId: string, isFavorited: boolean) => {
    setPageItems((current) => {
      const next: Record<number, Apartment[]> = {};
      for (const [key, list] of Object.entries(current)) {
        next[Number(key)] = list.map((apt) =>
          apt.id === apartmentId ? { ...apt, isFavorited } : apt,
        );
      }
      return next;
    });
  };

  const loadPage = useCallback(
    async (page: number) => {
      if (page < 1 || page > totalPages) return pageItemsRef.current[page];
      const cached = pageItemsRef.current[page];
      if (cached) return cached;
      if (loadingRef.current) return undefined;

      loadingRef.current = true;
      setIsLoading(true);
      try {
        const previousPage = pageItemsRef.current[page - 1];
        const cursor = previousPage?.[previousPage.length - 1]?.id;

        const result = await fetchApartmentsAction({
          query: searchParams.query || searchParams.q,
          district: searchParams.district,
          priceRange: searchParams.price,
          roomType: searchParams.roomType,
          sortBy: searchParams.sort,
          page: cursor ? 1 : page,
          cursor,
          limit: PAGE_SIZE,
          skipCount: true,
          totalHint: totalInitialResults,
        });

        if ("error" in result && result.error) {
          toast({
            variant: "destructive",
            title: "Không tải được căn hộ",
            description: result.error,
          });
          return undefined;
        }

        const fetched = result.apartments ?? [];
        pageItemsRef.current = { ...pageItemsRef.current, [page]: fetched };
        setPageItems(pageItemsRef.current);
        return fetched;
      } catch (error) {
        console.error("Lỗi khi tải trang căn hộ:", error);
        toast({
          variant: "destructive",
          title: "Không tải được căn hộ",
          description: "Vui lòng thử lại sau.",
        });
        return undefined;
      } finally {
        loadingRef.current = false;
        setIsLoading(false);
      }
    },
    [searchParams, toast, totalInitialResults, totalPages],
  );

  const snapToListTop = useCallback(() => {
    const heading = document.getElementById("apartments-list");
    if (!heading) return;
    const headerOffset = 128;
    const viewportTop = heading.getBoundingClientRect().top;
    if (viewportTop >= 0 && viewportTop <= headerOffset + 24) return;
    window.scrollTo({
      top: Math.max(0, window.scrollY + viewportTop - headerOffset),
      behavior: "auto",
    });
  }, []);

  const goToPage = useCallback(
    async (page: number) => {
      if (page === currentPage) return;
      const loaded = pageItemsRef.current[page] ?? (await loadPage(page));
      if (!loaded) return;
      shouldSnapRef.current = true;
      setCurrentPage(page);
      setLoadedThrough((value) => Math.max(value, page));
    },
    [currentPage, loadPage],
  );

  const loadMoreApartments = useCallback(async () => {
    const nextPage = loadedThrough + 1;
    const loaded = pageItemsRef.current[nextPage] ?? (await loadPage(nextPage));
    if (!loaded) return;
    setLoadedThrough(nextPage);
    setCurrentPage(nextPage);
  }, [loadPage, loadedThrough]);

  const apartments = useMemo(() => {
    const source = isDesktop
      ? pageItems[currentPage] ?? []
      : Array.from({ length: loadedThrough }, (_, index) => pageItems[index + 1] ?? []).flat();
    return applyFavorites(source);
  }, [applyFavorites, currentPage, isDesktop, loadedThrough, pageItems]);

  const hasMoreMobile = loadedThrough < totalPages;

  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!isDesktop || !grid) return;
    const height = grid.getBoundingClientRect().height;
    if (height > gridMinHeightRef.current) {
      gridMinHeightRef.current = height;
      grid.style.minHeight = `${height}px`;
    }
    if (shouldSnapRef.current) {
      shouldSnapRef.current = false;
      snapToListTop();
    }
  }, [apartments, currentPage, isDesktop, snapToListTop]);

  return (
    <>
      {apartments.length > 0 || isLoading ? (
        <>
          <div
            ref={gridRef}
            className="grid grid-cols-1 gap-6 overflow-x-hidden sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 xl:gap-8"
          >
            {apartments.map((apartment, index) =>
              isDesktop ? (
                <div key={apartment.id}>
                  <ApartmentCard
                    apartment={apartment}
                    onFavoriteToggle={handleFavoriteToggle}
                    imagePriority={index < 2}
                  />
                </div>
              ) : (
                <motion.div
                  key={`${apartment.id}-${index}`}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{
                    duration: 0.35,
                    delay: index < PAGE_SIZE ? index * 0.04 : 0,
                    ease: "easeOut",
                  }}
                >
                  <ApartmentCard
                    apartment={apartment}
                    onFavoriteToggle={handleFavoriteToggle}
                    imagePriority={index < 2}
                  />
                </motion.div>
              ),
            )}
          </div>

          {hasMoreMobile ? (
            <div className="mt-12 flex justify-center md:hidden">
              <Button
                onClick={loadMoreApartments}
                disabled={isLoading}
                className="relative min-w-[210px] cursor-pointer rounded-full border-none bg-gradient-to-r from-[#cfb56f] to-[#b88e22] px-10 py-6 font-semibold tracking-wide text-white shadow-[0_10px_30px_rgba(205,165,51,0.3)] transition-all duration-300 ease-out hover:from-[#d6b03f] hover:to-[#d3ac42] hover:scale-105 hover:shadow-[0_15px_35px_rgba(205,165,51,0.45)] active:scale-85"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span className="text-sm font-bold tracking-wider antialiased drop-shadow-sm">
                    Xem thêm căn hộ
                  </span>
                )}
              </Button>
            </div>
          ) : null}

          {totalPages > 1 ? (
            <nav
              aria-label="Phân trang danh sách căn hộ"
              className="mt-12 hidden flex-wrap items-center justify-center gap-1.5 overflow-x-hidden md:flex"
            >
              <button
                type="button"
                disabled={currentPage <= 1 || isLoading}
                onClick={() => goToPage(currentPage - 1)}
                className={cn(
                  "inline-flex h-9 items-center gap-1 rounded-xl border px-3 text-sm font-semibold transition-colors",
                  currentPage <= 1 || isLoading
                    ? "cursor-not-allowed border-gray-100 text-gray-300"
                    : "border-gray-200 text-gray-700 hover:border-[#cda533] hover:text-[#cda533]",
                )}
              >
                <ChevronLeft className="h-4 w-4" /> Trước
              </button>

              {getVisiblePages(currentPage, totalPages).map((page, index) =>
                page === "ellipsis" ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-1 text-gray-400"
                    aria-hidden
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={page}
                    type="button"
                    disabled={isLoading}
                    onClick={() => goToPage(page)}
                    aria-current={page === currentPage ? "page" : undefined}
                    className={cn(
                      "inline-flex h-9 min-w-9 items-center justify-center rounded-xl border px-3 text-sm font-bold transition-colors",
                      page === currentPage
                        ? "border-[#cda533] bg-[#cda533] text-white"
                        : "border-gray-200 text-gray-700 hover:border-[#cda533] hover:text-[#cda533]",
                    )}
                  >
                    {page}
                  </button>
                ),
              )}

              <button
                type="button"
                disabled={currentPage >= totalPages || isLoading}
                onClick={() => goToPage(currentPage + 1)}
                className={cn(
                  "inline-flex h-9 items-center gap-1 rounded-xl border px-3 text-sm font-semibold transition-colors",
                  currentPage >= totalPages || isLoading
                    ? "cursor-not-allowed border-gray-100 text-gray-300"
                    : "border-gray-200 text-gray-700 hover:border-[#cda533] hover:text-[#cda533]",
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Sau <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </nav>
          ) : null}
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
