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

  // --- LOGIC: KHÔNG THAY ĐỔI ---
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
    // Tối ưu Padding (p-6 cho mobile, p-10 cho tablet/desktop) và Radius
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
        {/* Thanh tìm kiếm */}
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
            // Tối ưu height từ h-16 xuống h-12 (Mobile) / h-14 (Desktop)
            className="h-12 md:h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 text-sm md:text-base font-semibold pl-12 pr-5 shadow-sm transition-all font-body text-gray-900 focus:ring-2 focus:ring-[#cda533]/30 focus:border-[#cda533] focus:bg-white placeholder:text-gray-400 outline-none"
          />
        </div>

        {/* Dropdowns */}
        {/* Sửa grid-cols-1 sm:grid-cols-2 thành grid-cols-2 trên mọi thiết bị. Giảm gap trên mobile xuống gap-3 */}
        <div className="grid grid-cols-2 gap-3 md:gap-5">
          {selectFields.map((field) => (
            // Thêm min-w-0 cực kỳ quan trọng để Grid không bị phá vỡ nội dung bên trong quá dài
            <div key={field.id} className="w-full space-y-1.5 min-w-0">
              <label className="flex items-center gap-1 text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-gray-500 font-body ml-1 cursor-default truncate">
                <field.icon className="h-3 w-3 md:h-3.5 md:w-3.5 text-[#cda533] shrink-0" />{" "}
                <span className="truncate">{field.label}</span>
              </label>
              <Select
                value={filters[field.id]}
                onValueChange={(value) =>
                  setFilters({ ...filters, [field.id]: value })
                }
              >
                {/* 
                  1. h-11 trên mobile để thanh thoát hơn. 
                  2. px-3 để lấy thêm không gian cho chữ. 
                  3. [&>span]:truncate để text hiển thị bên trong SelectValue tự động biến thành "Quận Nam T..." nếu quá dài 
                */}
                <SelectTrigger className="h-11 md:h-14 w-full rounded-xl md:rounded-2xl border-gray-200 bg-white text-[12px] md:text-sm font-bold px-3 md:px-5 hover:border-[#cda533]/50 hover:bg-gray-50 transition-all font-body text-gray-800 focus:ring-2 focus:ring-[#cda533]/20 shadow-sm [&>span]:truncate">
                  <SelectValue placeholder={field.placeholder} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-100 bg-white shadow-xl z-[150] p-1.5 max-h-[280px]">
                  {field.items.map((item) => (
                    <SelectItem
                      key={item.value}
                      value={item.value}
                      className="py-2.5 pl-8 pr-4 text-xs md:text-sm font-medium cursor-pointer font-body rounded-lg focus:bg-[#cda533]/10 focus:text-[#cda533] transition-colors data-[state=checked]:bg-[#cda533]/10 data-[state=checked]:text-[#cda533]"
                    >
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        {/* Ngân sách */}
        {/* Đổi border-gray-100 bg-white sang bg-gray-50 để tạo phân tầng thị giác (Visual Hierarchy) */}
        <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 md:p-5 space-y-3">
          <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 font-body ml-1 cursor-default">
            <Banknote className="h-4 w-4 text-[#cda533]" /> Ngân sách (Triệu
            VNĐ)
          </label>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block ml-1">
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
                className="h-11 md:h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#cda533]/20 focus:border-[#cda533] shadow-sm transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block ml-1">
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
                className="h-11 md:h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#cda533]/20 focus:border-[#cda533] shadow-sm transition-all"
              />
            </div>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="pt-2 flex flex-col gap-3">
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
