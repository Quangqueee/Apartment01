"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { ROOM_TYPES } from "@/lib/constants";
import {
  parsePriceRange,
  PRICE_FILTER_MIN,
  PRICE_FILTER_MAX,
} from "@/lib/price-range";

type SearchTag = {
  id: string;
  label: string;
  remove: (params: URLSearchParams) => void;
};

const getRoomTypeLabel = (value: string) =>
  ROOM_TYPES.find((item) => item.value === value)?.label || value;

const formatPriceTag = (priceParam: string) => {
  const range = parsePriceRange(priceParam);
  const hasMin = range.min > PRICE_FILTER_MIN;
  const hasMax = range.max !== null && range.max < PRICE_FILTER_MAX;

  if (hasMin && hasMax) return `Ngân sách: ${range.min} - ${range.max} triệu`;
  if (hasMin) return `Ngân sách: từ ${range.min} triệu`;
  if (hasMax) return `Ngân sách: đến ${range.max} triệu`;
  return "Ngân sách";
};

export default function SearchFilterTags() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const query = searchParams.get("query") || "";
  const districts =
    searchParams.get("district")?.split(",").filter(Boolean) || [];
  const roomTypes =
    searchParams.get("roomType")?.split(",").filter(Boolean) || [];
  const price = searchParams.get("price") || "";

  const tags: SearchTag[] = [];

  if (query) {
    tags.push({
      id: "query",
      label: `"${query}"`,
      remove: (params) => {
        params.delete("query");
      },
    });
  }

  districts.forEach((district) => {
    tags.push({
      id: `district-${district}`,
      label: district,
      remove: (params) => {
        const next = (params.get("district") || "")
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item && item !== district);
        if (next.length > 0) params.set("district", next.join(","));
        else params.delete("district");
      },
    });
  });

  roomTypes.forEach((roomType) => {
    tags.push({
      id: `roomType-${roomType}`,
      label: getRoomTypeLabel(roomType),
      remove: (params) => {
        const next = (params.get("roomType") || "")
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item && item !== roomType);
        if (next.length > 0) params.set("roomType", next.join(","));
        else params.delete("roomType");
      },
    });
  });

  if (price) {
    tags.push({
      id: "price",
      label: formatPriceTag(price),
      remove: (params) => {
        params.delete("price");
      },
    });
  }

  const applyParams = (updater: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    updater(params);
    params.delete("page");
    params.delete("cursor");
    const queryString = params.toString();
    router.push(queryString ? `/tim-kiem?${queryString}` : "/tim-kiem");
  };

  if (tags.length === 0) return null;

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 overflow-x-hidden">
      {tags.map((tag) => (
        <button
          key={tag.id}
          type="button"
          onClick={() => applyParams(tag.remove)}
          className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#cda533]/30 bg-white px-3 py-1 text-xs font-semibold text-gray-800 shadow-sm transition-colors hover:border-[#cda533] hover:bg-[#cda533]/10"
        >
          <span className="truncate">{tag.label}</span>
          <X className="h-3.5 w-3.5 shrink-0 text-gray-400" />
        </button>
      ))}
      {tags.length > 1 && (
        <button
          type="button"
          onClick={() => router.push("/tim-kiem")}
          className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-red-500 transition-colors hover:bg-red-50"
        >
          Xóa tất cả
        </button>
      )}
    </div>
  );
}
