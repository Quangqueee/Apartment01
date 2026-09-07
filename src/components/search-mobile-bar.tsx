"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildSearchHref } from "@/lib/districts";
import {
  parsePriceRange,
  PRICE_FILTER_MIN,
  PRICE_FILTER_MAX,
} from "@/lib/price-range";
import SearchSidebar from "@/components/search-sidebar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export default function SearchMobileBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setQuery(searchParams.get("query") || "");
  }, [searchParams]);

  const districts =
    searchParams.get("district")?.split(",").filter(Boolean) || [];
  const roomTypes =
    searchParams.get("roomType")?.split(",").filter(Boolean) || [];
  const priceParam = searchParams.get("price") || "";
  const urlPrice = parsePriceRange(priceParam);
  const hasPrice =
    priceParam.trim() !== "" &&
    (urlPrice.min > PRICE_FILTER_MIN ||
      (urlPrice.max !== null && urlPrice.max < PRICE_FILTER_MAX));
  const filterCount =
    districts.length + roomTypes.length + (hasPrice ? 1 : 0);

  const submitQuery = () => {
    startTransition(() => {
      router.push(
        buildSearchHref({
          query: query.trim(),
          districts,
          price: priceParam || undefined,
          roomType: roomTypes.join(","),
          sort: searchParams.get("sort") || undefined,
        }),
      );
    });
  };

  const clearFilters = () => {
    startTransition(() => {
      router.push(
        buildSearchHref({
          query: query.trim(),
          sort: searchParams.get("sort") || undefined,
        }),
      );
    });
    setOpen(false);
  };

  return (
    <div className="sticky top-[var(--site-header-height)] z-40 overflow-x-hidden border-b border-gray-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 lg:hidden">
      <form
        className="mx-auto flex w-full max-w-[1920px] items-center gap-2 overflow-x-hidden px-4 py-2.5"
        onSubmit={(event) => {
          event.preventDefault();
          submitQuery();
        }}
      >
        <label className="sr-only" htmlFor="mobile-search-query">
          Tìm theo địa chỉ hoặc mã nguồn
        </label>
        <div className="relative min-w-0 flex-1">
          <button
            type="submit"
            aria-label="Tìm kiếm"
            className="absolute left-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-[#cda533]"
          >
            <Search className="h-4 w-4" />
          </button>
          <input
            id="mobile-search-query"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Địa chỉ hoặc mã nguồn"
            enterKeyHint="search"
            autoComplete="off"
            className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-10 text-base font-medium text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#cda533] focus:bg-white focus:ring-2 focus:ring-[#cda533]/20 [&::-webkit-search-cancel-button]:appearance-none"
          />
          {isPending ? (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
          ) : null}
        </div>

        {filterCount > 0 ? (
          <button
            type="button"
            onClick={clearFilters}
            aria-label="Xóa bộ lọc"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-1 rounded-xl border border-red-100 bg-red-50 px-3 text-sm font-bold text-red-600 shadow-sm transition-colors active:bg-red-100"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Xóa</span>
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Mở bộ lọc"
          className={cn(
            "relative inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border px-3 text-sm font-bold shadow-sm transition-colors",
            filterCount > 0
              ? "border-[#cda533]/40 bg-[#cda533]/10 text-[#9a7b24]"
              : "border-gray-200 bg-white text-gray-800",
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>Bộ lọc</span>
          {filterCount > 0 ? (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#cda533] px-1 text-[10px] font-bold leading-none text-white">
              {filterCount}
            </span>
          ) : null}
        </button>
      </form>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="flex h-auto max-h-[min(88dvh,calc(100dvh-var(--safe-top)))] flex-col gap-0 overflow-hidden rounded-t-3xl border-gray-100 bg-white px-5 pt-2 pb-0 z-[70]"
        >
          <div
            aria-hidden
            className="mx-auto mb-1 h-1 w-10 shrink-0 rounded-full bg-gray-200"
          />
          <SheetHeader className="shrink-0 pb-2 pr-8 text-left">
            <div className="flex items-center justify-between gap-3">
              <SheetTitle className="font-headline text-xl">Bộ lọc</SheetTitle>
              {filterCount > 0 ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-red-600"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Xóa bộ lọc
                </button>
              ) : null}
            </div>
          </SheetHeader>
          <SearchSidebar
            hideQuery
            className="min-h-0 flex-1"
            onApplied={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
