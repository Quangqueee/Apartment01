"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HANOI_DISTRICTS, ROOM_TYPES } from "@/lib/constants";
import { Button } from "./ui/button";
import {
  MapPin,
  Banknote,
  LayoutGrid,
  RotateCcw,
  Loader2,
  Search,
} from "lucide-react";
import {
  parsePriceRange,
  serializePriceRange,
  PRICE_FILTER_MIN,
  PRICE_FILTER_MAX,
} from "@/lib/price-range";

type FilterState = {
  query: string;
  district: string;
  roomType: string;
  priceMinInput: string;
  priceMaxInput: string;
};

const DEFAULT_FILTERS: FilterState = {
  query: "",
  district: "",
  roomType: "",
  priceMinInput: String(PRICE_FILTER_MIN),
  priceMaxInput: String(PRICE_FILTER_MAX),
};

const parsePriceInput = (value: string, fallback: number) => {
  if (value.trim() === "") return fallback;
  const parsed = Number(value.replace(",", "."));
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(PRICE_FILTER_MIN, Math.min(PRICE_FILTER_MAX, parsed));
};

export default function FilterControls() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);
  const [shouldScroll, setShouldScroll] = useState(false);

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  useEffect(() => {
    const urlPriceRange = parsePriceRange(searchParams.get("price") || "");
    setFilters({
      query: searchParams.get("query") || "",
      district: searchParams.get("district") || "",
      roomType: searchParams.get("roomType") || "",
      priceMinInput: String(Math.max(PRICE_FILTER_MIN, urlPriceRange.min)),
      priceMaxInput: String(
        Math.min(PRICE_FILTER_MAX, urlPriceRange.max ?? PRICE_FILTER_MAX),
      ),
    });
    setMounted(true);
  }, [searchParams]);

  useEffect(() => {
    if (!isPending && shouldScroll) {
      const element = document.getElementById("apartments-list");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      setShouldScroll(false);
    }
  }, [isPending, shouldScroll]);

  const handleApply = () => {
    const params = new URLSearchParams(searchParams.toString());
    const minValue = parsePriceInput(filters.priceMinInput, PRICE_FILTER_MIN);
    const maxValue = parsePriceInput(filters.priceMaxInput, PRICE_FILTER_MAX);
    const normalizedMin = Math.min(minValue, maxValue);
    const normalizedMax = Math.max(minValue, maxValue);

    const serializedPrice = serializePriceRange({
      min: normalizedMin,
      max: normalizedMax,
    });

    if (filters.query.trim()) params.set("query", filters.query.trim());
    else params.delete("query");

    if (filters.district) params.set("district", filters.district);
    else params.delete("district");

    if (filters.roomType) params.set("roomType", filters.roomType);
    else params.delete("roomType");

    const isDefaultPrice =
      normalizedMin === PRICE_FILTER_MIN && normalizedMax === PRICE_FILTER_MAX;
    if (isDefaultPrice) params.delete("price");
    else params.set("price", serializedPrice);

    params.set("page", "1");

    startTransition(() => {
      setShouldScroll(true);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
  };

  if (!mounted) return null;

  const hasActiveFilters =
    filters.query !== "" ||
    filters.district !== "" ||
    filters.roomType !== "" ||
    parsePriceInput(filters.priceMinInput, PRICE_FILTER_MIN) !==
      PRICE_FILTER_MIN ||
    parsePriceInput(filters.priceMaxInput, PRICE_FILTER_MAX) !==
      PRICE_FILTER_MAX;

  const selectFields = [
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
  ] as const;

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-[3rem] p-8 md:p-12 shadow-[0_30px_100px_rgba(0,0,0,0.1)] border border-white/60 w-full max-w-[900px] mx-auto select-none relative z-10">
      <div className="mb-10 text-center">
        <h2 className="font-headline text-3xl md:text-3xl text-gray-900 tracking-tight italic font-medium">
          Tìm căn hộ theo nhu cầu
        </h2>
        <div className="h-1 w-12 bg-[#cda533] mt-6 mx-auto rounded-full" />
      </div>

      <div className="flex flex-col gap-6">
        <div className="relative group w-full">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 group-focus-within:text-[#cda533] transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Nhập địa chỉ hoặc mã ID..."
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && handleApply()}
            className="h-16 w-full rounded-2xl border border-gray-100 bg-gray-50/50 text-base font-semibold pl-14 pr-6 shadow-inner transition-all font-body text-gray-900 focus:ring-2 focus:ring-[#cda533]/30 focus:border-[#cda533] focus:bg-white placeholder:text-gray-400 outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
          {selectFields.map((field) => (
            <div key={field.id} className="w-full space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 font-body ml-2 cursor-default">
                <field.icon className="h-3.5 w-3.5 text-[#cda533]" />{" "}
                {field.label}
              </label>
              <Select
                value={filters[field.id]}
                onValueChange={(value) =>
                  setFilters({ ...filters, [field.id]: value })
                }
              >
                <SelectTrigger className="h-14 w-full rounded-2xl border-gray-200 bg-white text-sm font-bold px-6 hover:border-[#cda533]/50 hover:bg-gray-50 transition-all font-body text-gray-800 focus:ring-2 focus:ring-[#cda533]/20 shadow-sm">
                  <SelectValue placeholder={field.placeholder} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-100 bg-white shadow-xl z-[150] p-1.5 max-h-[300px]">
                  {field.items.map((item) => (
                    <SelectItem
                      key={item.value}
                      value={item.value}
                      className="py-3 pl-10 pr-4 text-sm font-medium cursor-pointer font-body rounded-lg focus:bg-[#cda533]/10 focus:text-[#cda533] transition-colors data-[state=checked]:bg-[#cda533]/5 data-[state=checked]:text-[#cda533]"
                    >
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 md:p-5 space-y-4">
          <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 font-body ml-1 cursor-default">
            <Banknote className="h-3.5 w-3.5 text-[#cda533]" /> Ngân sách (triệu
            VNĐ)
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500 block ml-1">
                Từ (Min)
              </label>
              <input
                type="number"
                inputMode="decimal"
                step={0.5}
                placeholder="VD: 8"
                value={filters.priceMinInput}
                onChange={(event) =>
                  setFilters({ ...filters, priceMinInput: event.target.value })
                }
                className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#cda533]/20 focus:border-[#cda533]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500 block ml-1">
                Đến (Max)
              </label>
              <input
                type="number"
                inputMode="decimal"
                step={0.5}
                placeholder="VD: 15"
                value={filters.priceMaxInput}
                onChange={(event) =>
                  setFilters({ ...filters, priceMaxInput: event.target.value })
                }
                className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#cda533]/20 focus:border-[#cda533]"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-end">
          <div className="h-[22px] mb-2 hidden md:block" />
          <Button
            onClick={handleApply}
            disabled={isPending}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#1a1a1a] to-[#333] hover:from-[#cda533] hover:to-[#b88e22] text-white font-body font-bold text-xs uppercase tracking-[0.2em] shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all duration-300 active:scale-[0.98]"
          >
            {isPending ? (
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin h-4 w-4" /> ĐANG TÌM...
              </div>
            ) : (
              "TÌM KIẾM NGAY"
            )}
          </Button>
        </div>

        <div className="mt-2 flex justify-center">
          <button
            onClick={handleReset}
            disabled={!hasActiveFilters}
            className={`
                group flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] transition-all duration-300 py-2 px-4 rounded-full
                ${
                  hasActiveFilters
                    ? "text-red-400 hover:text-red-600 hover:bg-red-50 cursor-pointer opacity-100"
                    : "text-gray-300 cursor-not-allowed opacity-50"
                }
              `}
          >
            <RotateCcw
              className={`h-3.5 w-3.5 transition-transform duration-500 ${
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
