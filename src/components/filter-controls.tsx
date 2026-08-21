"use client";

import { useState, useTransition, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { HANOI_DISTRICTS, ROOM_TYPES } from "@/lib/constants";
import { buildSearchHref } from "@/lib/districts";
import { Button } from "./ui/button";
import {
  MapPin,
  Banknote,
  LayoutGrid,
  RotateCcw,
  Loader2,
  Search,
  ChevronDown,
  Check,
} from "lucide-react";
import {
  parsePriceRange,
  serializePriceRange,
  PRICE_FILTER_MIN,
  PRICE_FILTER_MAX,
} from "@/lib/price-range";

type FilterState = {
  query: string;
  district: string[];
  roomType: string[];
  priceMinInput: string;
  priceMaxInput: string;
};

const DEFAULT_FILTERS: FilterState = {
  query: "",
  district: [],
  roomType: [],
  priceMinInput: "",
  priceMaxInput: "",
};

const parsePriceInput = (value: string, fallback: number) => {
  if (value.trim() === "") return fallback;
  const parsed = Number(value.replace(",", "."));
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(PRICE_FILTER_MIN, Math.min(PRICE_FILTER_MAX, parsed));
};

function FilterControlsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  useEffect(() => {
    const urlPriceRange = parsePriceRange(searchParams.get("price") || "");

    const isDefaultMin = urlPriceRange.min === PRICE_FILTER_MIN;
    const isDefaultMax =
      urlPriceRange.max === null || urlPriceRange.max === PRICE_FILTER_MAX;

    setFilters({
      query: searchParams.get("query") || "",
      district: searchParams.get("district")?.split(",").filter(Boolean) || [],
      roomType: searchParams.get("roomType")?.split(",").filter(Boolean) || [],
      priceMinInput: isDefaultMin ? "" : String(urlPriceRange.min),
      priceMaxInput: isDefaultMax ? "" : String(urlPriceRange.max),
    });
    setMounted(true);
  }, [searchParams]);

  const handleApply = () => {
    const minValue = parsePriceInput(filters.priceMinInput, PRICE_FILTER_MIN);
    const maxValue = parsePriceInput(filters.priceMaxInput, PRICE_FILTER_MAX);
    const normalizedMin = Math.min(minValue, maxValue);
    const normalizedMax = Math.max(minValue, maxValue);

    const serializedPrice = serializePriceRange({
      min: normalizedMin,
      max: normalizedMax,
    });

    const isNoPriceInput =
      filters.priceMinInput.trim() === "" &&
      filters.priceMaxInput.trim() === "";
    const isDefaultPrice =
      normalizedMin === PRICE_FILTER_MIN && normalizedMax === PRICE_FILTER_MAX;

    const currentSort = searchParams.get("sort");

    startTransition(() => {
      router.push(
        buildSearchHref({
          query: filters.query.trim(),
          districts: filters.district,
          price:
            isNoPriceInput || isDefaultPrice ? undefined : serializedPrice,
          roomType: filters.roomType.join(","),
          sort: currentSort || undefined,
        }),
      );
    });
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
  };

  if (!mounted) return null;

  const hasActiveFilters =
    filters.query !== "" ||
    filters.district.length > 0 ||
    filters.roomType.length > 0 ||
    filters.priceMinInput.trim() !== "" ||
    filters.priceMaxInput.trim() !== "";

  const selectFields: {
    id: "district" | "roomType";
    label: string;
    icon: any;
    placeholder: string;
    items: { label: string; value: string }[];
  }[] = [
    {
      id: "district",
      label: "Khu vực",
      icon: MapPin,
      placeholder: "Tất cả quận",
      items: HANOI_DISTRICTS.map((d) => ({ label: d, value: d })),
    },
    {
      id: "roomType",
      label: "Thiết kế",
      icon: LayoutGrid,
      placeholder: "Loại căn hộ",
      items: ROOM_TYPES,
    },
  ];

  return (
    <div className="bg-white/90 backdrop-blur-2xl rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 shadow-[0_20px_80px_rgba(0,0,0,0.12)] border border-white w-full max-w-[900px] mx-auto select-none relative z-10">
      <div className="mb-8 flex justify-center text-center">
        <div className="inline-flex flex-col items-center">
          <h2 className="font-headline text-2xl md:text-3xl text-gray-900 tracking-tight italic font-bold">
            Tìm căn hộ theo nhu cầu
          </h2>
          <div className="h-[3px] w-[90%] bg-gradient-to-r from-[#cda533]/10 via-[#cda533] to-[#cda533]/10 mt-4 rounded-full" />
        </div>
      </div>

      <div className="flex flex-col gap-5 md:gap-6">
        <div className="relative group w-full">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 group-focus-within:text-[#cda533] transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Nhập địa chỉ hoặc mã ID..."
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && handleApply()}
            className="h-12 md:h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 text-sm md:text-base font-semibold pl-12 pr-5 shadow-sm transition-all font-body text-gray-900 focus:ring-2 focus:ring-[#cda533]/30 focus:border-[#cda533] focus:bg-white placeholder:text-gray-400 outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 md:gap-5">
          {selectFields.map((field) => {
            const selectedItems = filters[field.id];
            const displayText =
              selectedItems.length === 0
                ? field.placeholder
                : selectedItems.length <= 2
                  ? selectedItems.join(", ")
                  : `${selectedItems.length} ${
                      field.id === "district" ? "quận" : "loại phòng"
                    } đã chọn`;

            const Icon = field.icon;

            return (
              <div key={field.id} className="w-full space-y-1.5 min-w-0">
                <label className="flex items-center gap-1 text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-gray-500 font-body ml-1 cursor-default truncate">
                  <Icon className="h-3 w-3 md:h-3.5 md:w-3.5 text-[#cda533] shrink-0" />
                  <span className="truncate">{field.label}</span>
                </label>

                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="h-11 md:h-14 w-full rounded-xl md:rounded-2xl border border-gray-200 bg-white text-[12px] md:text-sm font-bold px-3 md:px-5 flex items-center justify-between hover:border-[#cda533]/50 hover:bg-gray-50/80 transition-all font-body text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#cda533]/20 shadow-sm"
                    >
                      <span className="truncate mr-2 text-gray-700">
                        {displayText}
                      </span>
                      <ChevronDown className="h-4 w-4 text-gray-400 shrink-0 transition-transform duration-200" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[155px] md:w-[var(--radix-popover-trigger-width)] rounded-2xl border-gray-100 bg-white/95 backdrop-blur-lg shadow-2xl z-[150] p-2 max-h-[280px] overflow-y-auto"
                    align="start"
                  >
                    <div className="flex flex-col gap-1">
                      {field.items.map((item) => {
                        const isChecked = selectedItems.includes(item.value);
                        return (
                          <div
                            key={item.value}
                            onClick={() => {
                              const currentArray = filters[field.id];
                              let newArray = [];
                              if (isChecked) {
                                newArray = currentArray.filter(
                                  (val) => val !== item.value,
                                );
                              } else {
                                newArray = [...currentArray, item.value];
                              }
                              setFilters({ ...filters, [field.id]: newArray });
                            }}
                            className={`flex items-center justify-start gap-3 py-2.5 px-3 text-xs md:text-sm font-semibold cursor-pointer font-body rounded-xl transition-all ${
                              isChecked
                                ? "bg-[#cda533]/10 text-[#cda533]"
                                : "hover:bg-gray-50 text-gray-600 hover:text-gray-900"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded-md shrink-0 flex items-center justify-center border transition-colors ${
                                isChecked
                                  ? "bg-[#cda533] border-[#cda533] text-white"
                                  : "border-gray-300 bg-white"
                              }`}
                            >
                              {isChecked && (
                                <Check className="w-3 h-3 stroke-[3]" />
                              )}
                            </div>
                            <span className="whitespace-nowrap">
                              {item.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 md:p-5 space-y-3">
          <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 font-body ml-1 cursor-default">
            <Banknote className="h-4 w-4 text-[#cda533]" /> Ngân sách (Triệu
            VNĐ)
          </label>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold uppercase tracking-wider text-gray-400 block ml-1">
                Tối thiểu
              </label>
              <input
                type="number"
                inputMode="decimal"
                step={0.5}
                placeholder="Min"
                value={filters.priceMinInput}
                onChange={(event) =>
                  setFilters({ ...filters, priceMinInput: event.target.value })
                }
                className="h-11 md:h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-800 placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#cda533]/20 focus:border-[#cda533] shadow-sm transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold uppercase tracking-wider text-gray-400 block ml-1">
                Tối đa
              </label>
              <input
                type="number"
                inputMode="decimal"
                step={0.5}
                placeholder="Max"
                value={filters.priceMaxInput}
                onChange={(event) =>
                  setFilters({ ...filters, priceMaxInput: event.target.value })
                }
                className="h-11 md:h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-800 placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#cda533]/20 focus:border-[#cda533] shadow-sm transition-all"
              />
            </div>
          </div>
        </div>

        <div className="pt-2 flex flex-col gap-3">
          {/* Đã sửa onClick và disabled thành JS Expression */}
          <Button
            onClick={handleApply}
            disabled={isPending}
            className="w-full h-12 md:h-14 rounded-2xl bg-gradient-to-r from-[#1a1a1a] to-[#333] hover:from-[#cda533] hover:to-[#b88e22] text-white font-body font-bold text-[13px] uppercase tracking-widest shadow-[0_8px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_10px_25px_rgba(205,165,51,0.3)] hover:-translate-y-0.5 transition-all duration-300 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {isPending ? (
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin h-4 w-4" /> ĐANG TÌM...
              </div>
            ) : (
              "TÌM KIẾM NGAY"
            )}
          </Button>

          <button
            onClick={handleReset}
            disabled={!hasActiveFilters}
            className={`
              group flex items-center justify-center gap-2 text-[11px] md:text-xs font-bold uppercase tracking-widest transition-all duration-300 py-2 px-4 rounded-full mx-auto
              ${
                hasActiveFilters
                  ? "text-red-500 hover:text-red-600 hover:bg-red-50 cursor-pointer opacity-100"
                  : "text-gray-300 cursor-not-allowed opacity-50"
              }
            `}
          >
            {/* Đã sửa lại cú pháp truyền className của thẻ RotateCcw */}
            <RotateCcw
              className={`h-3 w-3 md:h-3.5 md:w-3.5 transition-transform duration-500 ${
                hasActiveFilters ? "group-hover:-rotate-180" : ""
              }`}
            />
            Làm mới bộ lọc
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FilterControls() {
  return (
    <Suspense fallback={<div className="min-h-[320px] w-full" />}>
      <FilterControlsInner />
    </Suspense>
  );
}
