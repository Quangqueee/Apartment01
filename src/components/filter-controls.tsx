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
import { X } from "lucide-react";
import { useCallback } from "react";

type FilterControlsProps = {
  isAdmin?: boolean;
};

export default function FilterControls({ isAdmin = false }: FilterControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      if (name !== 'page') {
        params.set("page", "1");
      }
      return params.toString();
    },
    [searchParams]
  );
  
  const handleReset = () => {
    router.push(pathname);
  };

  const hasFilters =
    searchParams.has("q") ||
    searchParams.has("district") ||
    searchParams.has("price") ||
    searchParams.has("roomType") ||
    (!isAdmin && searchParams.has("sort"));

  return (
    <div className="grid grid-cols-1 gap-2 rounded-lg border bg-card p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      <Input
        placeholder={isAdmin ? "Tìm theo mã nội bộ..." : "Tìm kiếm theo tiêu đề..."}
        defaultValue={searchParams.get("q") || ""}
        onChange={(e) => {
          router.push(pathname + "?" + createQueryString("q", e.target.value));
        }}
        className="lg:col-span-2"
      />
      <Select
        value={searchParams.get("district") || ""}
        onValueChange={(value) => {
          router.push(pathname + "?" + createQueryString("district", value));
        }}
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
        value={searchParams.get("price") || ""}
        onValueChange={(value) => {
          router.push(pathname + "?" + createQueryString("price", value));
        }}
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
        value={searchParams.get("roomType") || ""}
        onValueChange={(value) => {
          router.push(pathname + "?" + createQueryString("roomType", value));
        }}
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
          value={searchParams.get("sort") || ""}
          onValueChange={(value) => {
            router.push(pathname + "?" + createQueryString("sort", value));
          }}
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
      {hasFilters && (
        <Button
          variant="ghost"
          onClick={handleReset}
          className="col-span-full mt-2 lg:col-span-1 lg:mt-0"
        >
          <X className="mr-2 h-4 w-4" />
          Xoá bộ lọc
        </Button>
      )}
    </div>
  );
}