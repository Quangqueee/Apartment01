
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HANOI_DISTRICTS, PRICE_RANGES, ROOM_TYPES } from "@/lib/constants";
import { Button } from "./ui/button";
import { X, Save } from "lucide-react";
import { useCallback, useState, useEffect, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";


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
  const [isPending, startTransition] = useTransition();

  const [filters, setFilters] = useState({
    district: searchParams.get("district") || "",
    price: searchParams.get("price") || "",
    roomType: searchParams.get("roomType") || "",
  });

  const debouncedFilters = useDebounce(filters, 500);

  const createQueryString = useCallback(
    (newFilters: typeof filters) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      // Do not reset page on filter change for infinite scroll
      // params.set("page", "1");
      return params.toString();
    },
    [searchParams]
  );
  
  useEffect(() => {
    // This effect now ONLY handles pushing updates to the URL when debounced filters change.
    const currentQueryString = new URLSearchParams(searchParams).toString();
    const newQueryString = createQueryString(debouncedFilters);

    if (currentQueryString !== newQueryString) {
      startTransition(() => {
          router.push(`${pathname}?${newQueryString}`);
      });
    }
  }, [debouncedFilters, router, pathname, createQueryString, searchParams]);

  useEffect(() => {
    // This effect handles loading filters from localStorage on mount.
    // It runs ONLY on the client, AFTER initial render (hydration).
    if (isAdmin) return;
    
    try {
      const savedFiltersJson = localStorage.getItem(SAVED_FILTERS_KEY);
      if (savedFiltersJson) {
        const savedFilters = JSON.parse(savedFiltersJson);
        const currentParams = new URLSearchParams(searchParams);
        
        // Apply saved filters only if there are no filters in the current URL
        if (!currentParams.has('district') && !currentParams.has('price') && !currentParams.has('roomType')) {
          setFilters(savedFilters);
        }
      }
    } catch (error) {
      console.error("Failed to load filters from local storage", error);
    }
  }, [isAdmin, searchParams]); // searchParams is included to re-evaluate if URL changes externally

  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    const defaultFilters = { district: "", price: "", roomType: "" };
    setFilters(defaultFilters);
    if (!isAdmin) {
      try {
        localStorage.removeItem(SAVED_FILTERS_KEY);
      } catch (error) {
        console.error("Failed to remove filters from local storage", error);
      }
    }
    // Let the debounced effect handle the navigation
  };

  const handleSave = () => {
    if (isAdmin) return;
    try {
      const filtersToSave = {
        district: filters.district,
        price: filters.price,
        roomType: filters.roomType,
      };
      localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(filtersToSave));
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
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      </div>
    </div>
  );
}
