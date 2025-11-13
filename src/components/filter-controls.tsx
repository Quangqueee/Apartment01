"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { HANOI_DISTRICTS, PRICE_RANGES, ROOM_TYPES, SORT_OPTIONS } from "@/lib/constants";
import { Button } from "./ui/button";
import { X, Save, Search } from "lucide-react";
import { useCallback, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

type FilterControlsProps = {
  isAdmin?: boolean;
};

const SAVED_FILTERS_KEY = "hanoi_residences_filters";

export default function FilterControls({ isAdmin = false }: FilterControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [filters, setFilters] = useState({
    q: searchParams.get("q") || "",
    district: searchParams.get("district") || "",
    price: searchParams.get("price") || "",
    roomType: searchParams.get("roomType") || "",
    sort: searchParams.get("sort") || "",
  });

  const applyFilters = useCallback((currentFilters: typeof filters) => {
    const params = new URLSearchParams();
    if (currentFilters.q) params.set("q", currentFilters.q);
    if (currentFilters.district) params.set("district", currentFilters.district);
    if (currentFilters.price) params.set("price", currentFilters.price);
    if (currentFilters.roomType) params.set("roomType", currentFilters.roomType);
    if (!isAdmin && currentFilters.sort) params.set("sort", currentFilters.sort);
    
    params.set("page", "1"); // Reset to first page on new search
    
    router.push(pathname + "?" + params.toString());
  }, [router, pathname, isAdmin]);


  useEffect(() => {
    // Load saved filters from localStorage on initial render
    try {
      const savedFilters = localStorage.getItem(SAVED_FILTERS_KEY);
      if (savedFilters) {
        const parsedFilters = JSON.parse(savedFilters);
        // We only apply saved filters if there are no filters in the URL
        if (!searchParams.toString()) {
            setFilters(parsedFilters);
            applyFilters(parsedFilters);
        }
      }
    } catch (error) {
      console.error("Failed to load filters from local storage", error);
    }
  }, [applyFilters, searchParams]); // Run only once on mount

  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSearch = () => {
    applyFilters(filters);
  };

  const handleReset = () => {
    const defaultFilters = { q: "", district: "", price: "", roomType: "", sort: "" };
    setFilters(defaultFilters);
    localStorage.removeItem(SAVED_FILTERS_KEY);
    router.push(pathname);
     toast({
        title: "Bộ lọc đã được xóa",
        description: "Tùy chọn tìm kiếm của bạn đã được đặt lại.",
      });
  };

  const handleSave = () => {
    try {
      localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(filters));
      toast({
        title: "Bộ lọc đã được lưu",
        description: "Tùy chọn tìm kiếm của bạn đã được áp dụng và lưu lại.",
      });
      // Apply filters immediately after saving
      applyFilters(filters);
    } catch (error) {
      console.error("Failed to save filters to local storage", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể lưu bộ lọc của bạn.",
      });
    }
  };

  const hasActiveFilters = Object.values(filters).some(val => val !== "");

  return (
    <div className="space-y-2">
      <div className="space-y-2 rounded-lg border bg-card p-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
           <div className="relative lg:col-span-2">
             <Input
                placeholder={isAdmin ? "Tìm theo mã nội bộ..." : "Tìm kiếm theo tiêu đề..."}
                value={filters.q}
                onChange={(e) => handleFilterChange("q", e.target.value)}
                className="pr-12"
             />
             <Button onClick={handleSearch} size="icon" variant="ghost" className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2">
                <Search className="h-4 w-4" />
                <span className="sr-only">Xác nhận</span>
            </Button>
           </div>
          <Select
            value={filters.district}
            onValueChange={(value) => handleFilterChange("district", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Quận/Huyện" />
            </SelectTrigger>
            <SelectContent>
              {HANOI_DISTRICTS.map((district) => (
                <SelectItem key={district} value={district}>
                  {district}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.price}
            onValueChange={(value) => handleFilterChange("price", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Khoảng giá" />
            </SelectTrigger>
            <SelectContent>
              {PRICE_RANGES.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.roomType}
            onValueChange={(value) => handleFilterChange("roomType", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Loại phòng" />
            </SelectTrigger>
            <SelectContent>
              {ROOM_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!isAdmin && (
            <Select
              value={filters.sort}
              onValueChange={(value) => handleFilterChange("sort", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sắp xếp theo" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
         <div className="flex flex-wrap items-center justify-end gap-2">
             {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={handleReset}
              >
                <X className="mr-2 h-4 w-4" />
                Xóa bộ lọc
              </Button>
            )}
            {!isAdmin && (
               <Button
                variant="outline"
                onClick={handleSave}
              >
                <Save className="mr-2 h-4 w-4" />
                Lưu bộ lọc
              </Button>
            )}
          </div>
      </div>
    </div>
  );
}
