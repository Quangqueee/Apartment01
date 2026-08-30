"use client";

import { useState, useEffect, Suspense } from "react";
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

function SortControlsFallback() {
  return (
    <div className="flex items-center gap-2">
      <Label className="hidden text-sm text-gray-500 sm:inline">Sắp xếp:</Label>
      <div className="h-10 w-[160px] animate-pulse rounded-md bg-gray-100"></div>
    </div>
  );
}

function SortControlsInner() {
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
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    params.delete("cursor");
    params.delete("before");

    if (value && value !== "newest") {
      params.set("sort", value);
    } else {
      params.delete("sort");
    }

    // Keep `/` static: sort changes go to the search page.
    const targetPath = pathname === "/" ? "/tim-kiem" : pathname;
    const query = params.toString();
    router.push(query ? `${targetPath}?${query}` : targetPath, { scroll: false });
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

export default function SortControls() {
  return (
    <Suspense fallback={<SortControlsFallback />}>
      <SortControlsInner />
    </Suspense>
  );
}
