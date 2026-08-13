"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HANOI_DISTRICTS, ROOM_TYPES } from "@/lib/constants";
import {
  parsePriceRange,
  serializePriceRange,
  PRICE_FILTER_MIN,
  PRICE_FILTER_MAX,
} from "@/lib/price-range";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import FloatingPriceInput from "@/components/floating-price-input";
import { cn } from "@/lib/utils";
import { Loader2, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const parsePriceInput = (value: string, fallback: number) => {
  if (value.trim() === "") return fallback;
  const parsed = Number(value.replace(",", "."));
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(PRICE_FILTER_MIN, Math.min(PRICE_FILTER_MAX, parsed));
};

const toggleValue = (list: string[], value: string) =>
  list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

export default function SearchSidebar({
  className,
  onApplied,
}: {
  className?: string;
  onApplied?: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState("");
  const [districts, setDistricts] = useState<string[]>([]);
  const [roomTypes, setRoomTypes] = useState<string[]>([]);
  const [priceMinInput, setPriceMinInput] = useState("");
  const [priceMaxInput, setPriceMaxInput] = useState("");

  useEffect(() => {
    const urlPriceRange = parsePriceRange(searchParams.get("price") || "");
    const isDefaultMin = urlPriceRange.min === PRICE_FILTER_MIN;
    const isDefaultMax =
      urlPriceRange.max === null || urlPriceRange.max === PRICE_FILTER_MAX;

    setQuery(searchParams.get("query") || "");
    setDistricts(searchParams.get("district")?.split(",").filter(Boolean) || []);
    setRoomTypes(searchParams.get("roomType")?.split(",").filter(Boolean) || []);
    setPriceMinInput(isDefaultMin ? "" : String(urlPriceRange.min));
    setPriceMaxInput(isDefaultMax ? "" : String(urlPriceRange.max));
  }, [searchParams]);

  const applyFilters = () => {
    const params = new URLSearchParams();
    const currentSort = searchParams.get("sort");
    const minValue = parsePriceInput(priceMinInput, PRICE_FILTER_MIN);
    const maxValue = parsePriceInput(priceMaxInput, PRICE_FILTER_MAX);
    const normalizedMin = Math.min(minValue, maxValue);
    const normalizedMax = Math.max(minValue, maxValue);
    const isNoPriceInput =
      priceMinInput.trim() === "" && priceMaxInput.trim() === "";
    const isDefaultPrice =
      normalizedMin === PRICE_FILTER_MIN && normalizedMax === PRICE_FILTER_MAX;

    if (query.trim()) params.set("query", query.trim());
    if (districts.length > 0) params.set("district", districts.join(","));
    if (roomTypes.length > 0) params.set("roomType", roomTypes.join(","));
    if (!isNoPriceInput && !isDefaultPrice) {
      params.set(
        "price",
        serializePriceRange({ min: normalizedMin, max: normalizedMax }),
      );
    }
    if (currentSort && currentSort !== "newest") params.set("sort", currentSort);

    startTransition(() => {
      const queryString = params.toString();
      router.push(queryString ? `/tim-kiem?${queryString}` : "/tim-kiem");
      onApplied?.();
    });
  };

  const resetFilters = () => {
    const currentSort = searchParams.get("sort");
    setQuery("");
    setDistricts([]);
    setRoomTypes([]);
    setPriceMinInput("");
    setPriceMaxInput("");
    startTransition(() => {
      const params = new URLSearchParams();
      if (currentSort && currentSort !== "newest") params.set("sort", currentSort);
      const queryString = params.toString();
      router.push(queryString ? `/tim-kiem?${queryString}` : "/tim-kiem");
      onApplied?.();
    });
  };

  return (
    <form
      className={cn("space-y-4 overflow-x-hidden", className)}
      onSubmit={(event) => {
        event.preventDefault();
        applyFilters();
      }}
    >
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
          Từ khóa
        </label>
        <Input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Địa chỉ hoặc mã ID"
          className="h-11 rounded-xl bg-white text-base md:text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
          Khu vực
        </label>
        <div className="grid max-h-44 grid-cols-1 gap-0.5 overflow-y-auto overflow-x-hidden pr-1">
          {HANOI_DISTRICTS.map((district) => {
            const checked = districts.includes(district);
            return (
              <label
                key={district}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
                  checked
                    ? "bg-[#cda533]/10 font-semibold text-[#9a7b24]"
                    : "text-gray-700 hover:bg-gray-50",
                )}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-[#cda533] focus:ring-[#cda533]"
                  checked={checked}
                  onChange={() => setDistricts(toggleValue(districts, district))}
                />
                <span className="truncate">{district}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
          Loại phòng
        </label>
        <div className="grid grid-cols-1 gap-0.5">
          {ROOM_TYPES.map((roomType) => {
            const checked = roomTypes.includes(roomType.value);
            return (
              <label
                key={roomType.value}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
                  checked
                    ? "bg-[#cda533]/10 font-semibold text-[#9a7b24]"
                    : "text-gray-700 hover:bg-gray-50",
                )}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-[#cda533] focus:ring-[#cda533]"
                  checked={checked}
                  onChange={() =>
                    setRoomTypes(toggleValue(roomTypes, roomType.value))
                  }
                />
                <span className="truncate">{roomType.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
          Ngân sách (triệu)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <FloatingPriceInput
            id="search-price-min"
            label="Min"
            value={priceMinInput}
            onChange={setPriceMinInput}
          />
          <FloatingPriceInput
            id="search-price-max"
            label="Max"
            value={priceMaxInput}
            onChange={setPriceMaxInput}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5 pt-1">
        <Button
          type="submit"
          disabled={isPending}
          className="h-11 w-full rounded-xl bg-[#1a1a1a] font-bold uppercase tracking-widest text-white hover:bg-[#cda533]"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" /> Áp dụng
            </>
          )}
        </Button>
        <button
          type="button"
          onClick={resetFilters}
          className="inline-flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold uppercase tracking-widest text-gray-400 transition-colors hover:text-red-500"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Xóa bộ lọc
        </button>
      </div>
    </form>
  );
}

export function SearchFiltersSheet() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold text-gray-800 shadow-sm lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" /> Bộ lọc
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[min(100%,20rem)] overflow-y-auto overflow-x-hidden bg-white p-5"
      >
        <SheetHeader className="mb-4 text-left">
          <SheetTitle className="font-headline text-xl">Bộ lọc</SheetTitle>
        </SheetHeader>
        <SearchSidebar onApplied={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
