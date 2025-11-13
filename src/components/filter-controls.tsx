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
import { HANOI_DISTRICTS, PRICE_RANGES, ROOM_TYPES } from "@/lib/constants";
import { Button } from "./ui/button";
import { X, Save, Search } from "lucide-react";
import { useCallback, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

type FilterControlsProps = {
  isAdmin?: boolean;
  onFilterSave?: () => void;
};

const SAVED_FILTERS_KEY = "hanoi_residences_filters";

export default function FilterControls({ isAdmin = false, onFilterSave }: FilterControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [filters, setFilters] = useState({
    q: searchParams.get("q") || "",
    district: searchParams.get("district") || "",
    price: searchParams.get("price") || "",
    roomType: searchParams.get("roomType") || "",
  });

  const applyFilters = useCallback((currentFilters: Omit<typeof filters, 'sort'>) => {
    const params = new URLSearchParams(searchParams);
    
    if (currentFilters.q) params.set("q", currentFilters.q);
    else params.delete("q");

    if (currentFilters.district) params.set("district", currentFilters.district);
    else params.delete("district");

    if (currentFilters.price) params.set("price", currentFilters.price);
    else params.delete("price");

    if (currentFilters.roomType) params.set("roomType", currentFilters.roomType);
    else params.delete("roomType");
    
    params.set("page", "1"); // Reset to first page on new search
    
    router.push(pathname + "?" + params.toString());
  }, [router, pathname, searchParams]);


  useEffect(() => {
    // Load saved filters from localStorage on initial render
    try {
      if (isAdmin) return;
      const savedFiltersJson = localStorage.getItem(SAVED_FILTERS_KEY);
      if (savedFiltersJson) {
        const savedFilters = JSON.parse(savedFiltersJson);
        // Only apply if there are no filters in URL
        const currentParams = new URLSearchParams(searchParams);
        currentParams.delete("page");
        currentParams.delete("sort");

        if (currentParams.toString() === "") {
          setFilters(savedFilters);
          // Don't auto-apply, let user click search
        }
      }
    } catch (error) {
      console.error("Failed to load filters from local storage", error);
    }
  }, [isAdmin, searchParams]);

  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSearch = () => {
    applyFilters(filters);
  };

  const handleReset = () => {
    const defaultFilters = { q: "", district: "", price: "", roomType: "" };
    setFilters(defaultFilters);
    if (!isAdmin) {
        localStorage.removeItem(SAVED_FILTERS_KEY);
    }
    router.push(pathname);
  };

  const handleSave = () => {
    try {
      localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify({
        q: filters.q,
        district: filters.district,
        price: filters.price,
        roomType: filters.roomType
      }));
      toast({
        title: "Bộ lọc đã được lưu",
        description: "Tùy chọn tìm kiếm của bạn đã được lưu cho lần truy cập sau.",
      });
      onFilterSave?.();
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
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
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
        </div>
         <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
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
             <Button
                onClick={handleSearch}
              >
                <Search className="mr-2 h-4 w-4" />
                Tìm kiếm
              </Button>
          </div>
      </div>
    </div>
  );
}
