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

export default function FilterControls() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);
  const [shouldScroll, setShouldScroll] = useState(false);

  // State quản lý bộ lọc
  const [filters, setFilters] = useState({
    query: "",
    district: "",
    minPrice: "",
    maxPrice: "",
    roomType: "",
  });

  // Đồng bộ URL vào State khi load trang
  useEffect(() => {
    setFilters({
      query: searchParams.get("query") || "",
      district: searchParams.get("district") || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      roomType: searchParams.get("roomType") || "",
    });
    setMounted(true);
  }, [searchParams]);

  // Logic: Scroll xuống ID "apartments-list" sau khi load xong dữ liệu
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

    // Xóa param giá cũ (nếu có) và set các param mới
    params.delete("price");
    Object.entries(filters).forEach(([key, val]) => {
      if (val) params.set(key, val);
      else params.delete(key);
    });
    params.set("page", "1");

    startTransition(() => {
      setShouldScroll(true);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const handleReset = () => {
    setFilters({ query: "", district: "", minPrice: "", maxPrice: "", roomType: "" });
  };

  if (!mounted) return null;

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  // Cấu hình Select cho Khu vực và Thiết kế
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
  ];

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-[3rem] p-8 md:p-12 shadow-[0_30px_100px_rgba(0,0,0,0.1)] border border-white/60 w-full max-w-[900px] mx-auto select-none relative z-10">
      {/* HEADER */}
      <div className="mb-10 text-center">
        <h2 className="font-headline text-3xl md:text-3xl text-gray-900 tracking-tight italic font-medium">
          Tìm căn hộ theo nhu cầu
        </h2>
        <div className="h-1 w-12 bg-[#cda533] mt-6 mx-auto rounded-full" />
      </div>

      <div className="flex flex-col gap-6">
        {/* HÀNG 1: Ô TÌM KIẾM */}
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

        {/* HÀNG 2: BỘ LỌC NGÂN SÁCH (Min/Max) */}
        <div className="w-full space-y-2">
          <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 font-body ml-2 cursor-default">
            <Banknote className="h-3.5 w-3.5 text-[#cda533]" /> Ngân sách (triệu/tháng)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              placeholder="Từ (triệu)"
              min={0}
              value={filters.minPrice}
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleApply()}
              className="h-14 w-full rounded-2xl border border-gray-200 bg-white text-sm font-bold px-5 hover:border-[#cda533]/50 hover:bg-gray-50 transition-all font-body text-gray-800 focus:ring-2 focus:ring-[#cda533]/20 focus:border-[#cda533] shadow-sm outline-none placeholder:text-gray-400 placeholder:font-normal"
            />
            <span className="text-gray-400 font-bold shrink-0">—</span>
            <input
              type="number"
              placeholder="Đến (triệu)"
              min={0}
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleApply()}
              className="h-14 w-full rounded-2xl border border-gray-200 bg-white text-sm font-bold px-5 hover:border-[#cda533]/50 hover:bg-gray-50 transition-all font-body text-gray-800 focus:ring-2 focus:ring-[#cda533]/20 focus:border-[#cda533] shadow-sm outline-none placeholder:text-gray-400 placeholder:font-normal"
            />
          </div>
        </div>

        {/* HÀNG 3: GRID 2 CỘT (2 Select + 1 Button) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
          {selectFields.map((f) => (
            <div key={f.id} className="w-full space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 font-body ml-2 cursor-default">
                <f.icon className="h-3.5 w-3.5 text-[#cda533]" /> {f.label}
              </label>
              <Select
                value={(filters as any)[f.id]}
                onValueChange={(v) => setFilters({ ...filters, [f.id]: v })}
              >
                <SelectTrigger className="h-14 w-full rounded-2xl border-gray-200 bg-white text-sm font-bold px-6 hover:border-[#cda533]/50 hover:bg-gray-50 transition-all font-body text-gray-800 focus:ring-2 focus:ring-[#cda533]/20 shadow-sm">
                  <SelectValue placeholder={f.placeholder} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-100 bg-white shadow-xl z-[150] p-1.5 max-h-[300px]">
                  {f.items.map((item) => (
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

          {/* NÚT TÌM KIẾM */}
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
        </div>

        {/* NÚT LÀM MỚI */}
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

