"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { BedDouble, MapPin, Users } from "lucide-react";
import {
  HANOI_DISTRICTS,
  NIGHTLY_PRICE_RANGES,
  ROOM_TYPES,
} from "@/lib/constants";
import type { ShortTermApartment } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "all";

function roomTypeLabel(value: string) {
  return ROOM_TYPES.find((type) => type.value === value)?.label || value;
}

export function ShortTermCard({ apartment }: { apartment: ShortTermApartment }) {
  return (
    <Link
      href={`/can-ho-ngan-han/${apartment.id}`}
      className="group block overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-lg transition-shadow select-none [-webkit-touch-callout:none]"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {apartment.imageUrls?.[0] ? (
          <Image
            src={apartment.imageUrls[0]}
            alt={apartment.title}
            fill
            className="object-cover pointer-events-none select-none [-webkit-touch-callout:none] transition-transform duration-500 group-hover:scale-105"
            draggable={false}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="h-full w-full bg-gray-100" />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
          Ngắn hạn
        </span>
        {apartment.status === "rented" && (
          <span className="absolute right-3 top-3 rounded-full bg-red-500/90 px-3 py-1 text-[11px] font-bold text-white">
            Tạm ngưng
          </span>
        )}
      </div>
      <div className="space-y-2 p-4">
        <h3 className="font-bold text-gray-900 line-clamp-2 leading-snug">
          {apartment.title}
        </h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {apartment.district}
          </span>
          <span className="inline-flex items-center gap-1">
            <BedDouble className="h-3.5 w-3.5" />{" "}
            {roomTypeLabel(apartment.roomType)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> {apartment.maxGuests} khách
          </span>
        </div>
        <p className="pt-1">
          <span className="text-lg font-black text-[#cda533]">
            {(apartment.nightlyPrice || 0).toLocaleString("vi-VN")}đ
          </span>
          <span className="text-sm text-gray-500"> /đêm</span>
        </p>
      </div>
    </Link>
  );
}

export default function ShortTermListClient({
  apartments,
}: {
  apartments: ShortTermApartment[];
}) {
  const [district, setDistrict] = useState(ALL);
  const [priceRange, setPriceRange] = useState(ALL);
  const [guests, setGuests] = useState(ALL);

  const filtered = useMemo(() => {
    return apartments.filter((apt) => {
      if (district !== ALL && apt.district !== district) return false;
      if (guests !== ALL && (apt.maxGuests || 0) < parseInt(guests, 10)) {
        return false;
      }
      if (priceRange !== ALL) {
        const [minRaw, maxRaw] = priceRange.split("-");
        const min = minRaw ? parseInt(minRaw, 10) : 0;
        const max = maxRaw ? parseInt(maxRaw, 10) : Infinity;
        const price = apt.nightlyPrice || 0;
        if (price < min || price > max) return false;
      }
      return true;
    });
  }, [apartments, district, priceRange, guests]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <Select value={district} onValueChange={setDistrict}>
          <SelectTrigger className="text-base">
            <SelectValue placeholder="Khu vực" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tất cả khu vực</SelectItem>
            {HANOI_DISTRICTS.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priceRange} onValueChange={setPriceRange}>
          <SelectTrigger className="text-base">
            <SelectValue placeholder="Giá mỗi đêm" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Mọi mức giá</SelectItem>
            {NIGHTLY_PRICE_RANGES.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={guests} onValueChange={setGuests}>
          <SelectTrigger className="text-base">
            <SelectValue placeholder="Số khách" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Mọi số khách</SelectItem>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <SelectItem key={n} value={String(n)}>
                Từ {n} khách trở lên
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-16 text-center text-gray-500">
          <p className="font-semibold">Chưa có căn hộ phù hợp.</p>
          <p className="text-sm mt-1">
            Thử thay đổi bộ lọc hoặc quay lại sau nhé.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((apt) => (
            <ShortTermCard key={apt.id} apartment={apt} />
          ))}
        </div>
      )}
    </div>
  );
}
