"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { HANOI_DISTRICTS, ROOM_TYPES } from "@/lib/constants";
import {
  buildSearchHref,
  districtFromPathname,
} from "@/lib/districts";
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
import { Loader2, RotateCcw, Search } from "lucide-react";

const parsePriceInput = (value: string, fallback: number) => {
  if (value.trim() === "") return fallback;
  const parsed = Number(value.replace(",", "."));
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(PRICE_FILTER_MIN, Math.min(PRICE_FILTER_MAX, parsed));
};

const toggleValue = (list: string[], value: string) =>
  list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

const ROUND_CHECK_CLASS =
  "h-4 w-4 shrink-0 cursor-pointer appearance-none rounded-full border-2 border-gray-300 bg-white transition-colors checked:border-[#cda533] checked:bg-[#cda533] checked:shadow-[inset_0_0_0_3px_white] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cda533]/40";

const chipClass = (active: boolean) =>
  cn(
    "inline-flex h-9 max-w-full items-center rounded-full border px-3 text-sm font-semibold transition-colors",
    active
      ? "border-[#cda533] bg-[#cda533] text-white"
      : "border-gray-200 bg-white text-gray-700 active:bg-gray-50",
  );

export default function SearchSidebar({
  className,
  onApplied,
  hideQuery = false,
}: {
  className?: string;
  onApplied?: () => void;
  hideQuery?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
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
    const fromQuery =
      searchParams.get("district")?.split(",").filter(Boolean) || [];
    const fromPath = districtFromPathname(pathname);
    setDistricts(
      fromQuery.length > 0 ? fromQuery : fromPath ? [fromPath] : [],
    );
    setRoomTypes(searchParams.get("roomType")?.split(",").filter(Boolean) || []);
    setPriceMinInput(isDefaultMin ? "" : String(urlPriceRange.min));
    setPriceMaxInput(isDefaultMax ? "" : String(urlPriceRange.max));
  }, [pathname, searchParams]);

  const applyFilters = () => {
    const currentSort = searchParams.get("sort");
    const minValue = parsePriceInput(priceMinInput, PRICE_FILTER_MIN);
    const maxValue = parsePriceInput(priceMaxInput, PRICE_FILTER_MAX);
    const normalizedMin = Math.min(minValue, maxValue);
    const normalizedMax = Math.max(minValue, maxValue);
    const isNoPriceInput =
      priceMinInput.trim() === "" && priceMaxInput.trim() === "";
    const isDefaultPrice =
      normalizedMin === PRICE_FILTER_MIN && normalizedMax === PRICE_FILTER_MAX;

    startTransition(() => {
      router.push(
        buildSearchHref({
          query: hideQuery
            ? (searchParams.get("query") || "").trim()
            : query.trim(),
          districts,
          price:
            !isNoPriceInput && !isDefaultPrice
              ? serializePriceRange({
                  min: normalizedMin,
                  max: normalizedMax,
                })
              : undefined,
          roomType: roomTypes.join(","),
          sort: currentSort || undefined,
        }),
      );
      onApplied?.();
    });
  };

  const resetFilters = () => {
    const currentSort = searchParams.get("sort");
    const keptQuery = hideQuery
      ? (searchParams.get("query") || "").trim()
      : "";
    if (!hideQuery) setQuery("");
    setDistricts([]);
    setRoomTypes([]);
    setPriceMinInput("");
    setPriceMaxInput("");
    startTransition(() => {
      router.push(
        buildSearchHref({
          query: keptQuery,
          sort: currentSort || undefined,
        }),
      );
      onApplied?.();
    });
  };

  const filterFields = (
    <>
      <div className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
          Khu vực
        </p>
        {hideQuery ? (
          <div className="flex flex-wrap gap-2 overflow-x-hidden">
            {HANOI_DISTRICTS.map((district) => {
              const checked = districts.includes(district);
              return (
                <button
                  key={district}
                  type="button"
                  aria-pressed={checked}
                  onClick={() => setDistricts(toggleValue(districts, district))}
                  className={chipClass(checked)}
                >
                  {district}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-1 gap-y-0.5 overflow-x-hidden">
            {HANOI_DISTRICTS.map((district) => {
              const checked = districts.includes(district);
              return (
                <label
                  key={district}
                  className={cn(
                    "flex cursor-pointer items-center gap-1.5 rounded-lg px-1.5 py-1 text-sm transition-colors",
                    checked
                      ? "bg-[#cda533]/10 font-semibold text-[#9a7b24]"
                      : "text-gray-700 hover:bg-gray-50",
                  )}
                >
                  <input
                    type="checkbox"
                    className={ROUND_CHECK_CLASS}
                    checked={checked}
                    onChange={() =>
                      setDistricts(toggleValue(districts, district))
                    }
                  />
                  <span className="truncate">{district}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
          Loại phòng
        </p>
        {hideQuery ? (
          <div className="flex flex-wrap gap-2 overflow-x-hidden">
            {ROOM_TYPES.map((roomType) => {
              const checked = roomTypes.includes(roomType.value);
              return (
                <button
                  key={roomType.value}
                  type="button"
                  aria-pressed={checked}
                  onClick={() =>
                    setRoomTypes(toggleValue(roomTypes, roomType.value))
                  }
                  className={chipClass(checked)}
                >
                  {roomType.label}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-1 gap-y-0.5 overflow-x-hidden">
            {ROOM_TYPES.map((roomType) => {
              const checked = roomTypes.includes(roomType.value);
              return (
                <label
                  key={roomType.value}
                  className={cn(
                    "flex cursor-pointer items-center gap-1.5 rounded-lg px-1.5 py-1 text-sm transition-colors",
                    checked
                      ? "bg-[#cda533]/10 font-semibold text-[#9a7b24]"
                      : "text-gray-700 hover:bg-gray-50",
                  )}
                >
                  <input
                    type="checkbox"
                    className={ROUND_CHECK_CLASS}
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
        )}
      </div>

      <div className="space-y-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
          Ngân sách (triệu)
        </p>
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
          <FloatingPriceInput
            id="search-price-min"
            label="Tối Thiểu"
            value={priceMinInput}
            onChange={setPriceMinInput}
          />
          <span className="mb-1.5 text-sm text-gray-300">–</span>
          <FloatingPriceInput
            id="search-price-max"
            label="Tối Đa"
            value={priceMaxInput}
            onChange={setPriceMaxInput}
          />
        </div>
      </div>
    </>
  );

  const actionButtons = (
    <div
      className={cn(
        "gap-2",
        hideQuery ? "grid grid-cols-2" : "flex flex-col",
      )}
    >
      <button
        type="button"
        onClick={resetFilters}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-2xl border border-gray-200 bg-white font-bold uppercase tracking-widest text-gray-500 shadow-sm transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600",
          hideQuery
            ? "h-12 text-[11px]"
            : "h-10 w-full text-[11px] order-2",
        )}
      >
        <RotateCcw className="h-3.5 w-3.5" /> Xóa bộ lọc
      </button>
      <Button
        type="submit"
        disabled={isPending}
        className={cn(
          "rounded-2xl bg-[#1a1a1a] text-sm font-bold uppercase tracking-[0.18em] text-white shadow-[0_8px_20px_rgba(26,26,26,0.18)] transition-all hover:bg-[#cda533] hover:shadow-[0_8px_20px_rgba(205,165,51,0.35)]",
          hideQuery ? "h-12 w-full" : "h-12 w-full order-1",
        )}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Search className="mr-2 h-4 w-4" /> Áp dụng
          </>
        )}
      </Button>
    </div>
  );

  return (
    <form
      className={cn(
        "flex min-h-0 flex-col overflow-hidden",
        hideQuery ? "min-h-0 flex-1" : "h-auto",
        className,
      )}
      onSubmit={(event) => {
        event.preventDefault();
        applyFilters();
      }}
    >
      <div
        className={cn(
          "min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain",
          hideQuery
            ? "min-h-0 flex-1 space-y-4 pb-2"
            : "space-y-3.5 pb-3",
        )}
      >
        {!hideQuery ? (
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Từ khóa
            </label>
            <div className="relative">
              <Input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Địa chỉ hoặc mã nguồn"
                className="h-11 rounded-xl bg-white pr-11 text-base md:text-sm"
              />
              <button
                type="submit"
                disabled={isPending}
                aria-label="Tìm kiếm"
                className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-[#cda533] disabled:opacity-60"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        ) : null}
        {filterFields}
      </div>
      <div
        className={cn(
          "shrink-0 border-t border-gray-100 bg-white pt-3",
          hideQuery
            ? "pb-[max(0.75rem,var(--safe-bottom))]"
            : "pb-1",
        )}
      >
        {actionButtons}
      </div>
    </form>
  );
}

