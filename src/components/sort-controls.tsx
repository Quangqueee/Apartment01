"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SORT_OPTIONS } from "@/lib/constants";
import { Label } from "./ui/label";

export default function SortControls() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 1. Thêm state kiểm tra trạng thái mount
  const [isMounted, setIsMounted] = useState(false);

  // 2. Chuyển sang true sau khi render trên client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const currentSort = searchParams.get("sort") || "newest";

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("sort", value);
    params.delete("page");
    params.delete("cursor");

    // Thêm { scroll: false } để ngăn trình duyệt giật lên đầu trang
    router.push(pathname + "?" + params.toString(), { scroll: false });
  };

  // 3. Nếu chưa mount xong, hiển thị khung giữ chỗ (Skeleton) để tránh lỗi Hydration
  if (!isMounted) {
    return (
      <div className="flex items-center gap-2">
        <Label className="hidden text-sm text-gray-500 sm:inline">Sắp xếp:</Label>
        <div className="h-10 w-[160px] animate-pulse rounded-md bg-gray-100"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="sort-by" className="hidden text-sm sm:inline">
        Sắp xếp:
      </Label>
      <Select value={currentSort} onValueChange={handleSortChange}>
        <SelectTrigger id="sort-by" className="h-10 w-[160px]">
          <SelectValue placeholder="Sắp xếp theo" />
        </SelectTrigger>
        <SelectContent className="bg-white">
          {SORT_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
