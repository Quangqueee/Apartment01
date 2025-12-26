"use client";

import Link from "next/link";
import { Apartment } from "@/lib/types";
import { MapPin, Maximize, ArrowUpRight, Heart, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { formatRelativeTime } from "@/lib/utils";

export default function ApartmentCard({ apartment }: { apartment: Apartment }) {
  const [isFavorite, setIsFavorite] = useState(false);

  // Kiểm tra trạng thái yêu thích từ localStorage khi mount
  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
    setIsFavorite(favorites.includes(apartment.id));
  }, [apartment.id]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
    let updatedFavorites;

    if (isFavorite) {
      // Bỏ thích: Lọc bỏ ID
      updatedFavorites = favorites.filter((id: string) => id !== apartment.id);
    } else {
      // THÊM MỚI: Đưa ID mới lên ĐẦU MẢNG để hiện thị đầu tiên
      updatedFavorites = [apartment.id, ...favorites.filter((id: string) => id !== apartment.id)];
    }

    localStorage.setItem("favorites", JSON.stringify(updatedFavorites));
    setIsFavorite(!isFavorite);
    
    // Kích hoạt sự kiện để trang Favorites biết và cập nhật lại giao diện
    window.dispatchEvent(new Event("favoritesUpdated"));
  };

  const timeToDisplay = apartment.updatedAt?.seconds ? apartment.updatedAt : apartment.createdAt;

  return (
    <div className="group relative overflow-hidden rounded-3xl bg-white transition-all duration-300 hover:shadow-2xl">
      <button
        onClick={toggleFavorite}
        className="absolute right-4 top-4 z-20 rounded-full bg-white/90 p-2.5 shadow-sm backdrop-blur-sm transition-all active:scale-90"
      >
        <Heart className={`h-5 w-5 transition-colors ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
      </button>

      <Link href={`/apartments/${apartment.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-3xl">
          <img
            src={apartment.imageUrls[0]}
            alt={apartment.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </div>

        <div className="py-6 px-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-xl font-bold text-gray-900 line-clamp-1 group-hover:text-orange-600 transition-colors">
              {apartment.title}
            </h3>
            <ArrowUpRight className="h-5 w-5 text-gray-300 group-hover:text-orange-600 shrink-0" />
          </div>

          <div className="mt-3 flex items-center justify-between border-b pb-3">
            <div className="flex items-center text-sm text-gray-500 font-medium">
              <MapPin className="mr-1 h-4 w-4 text-orange-500" />
              {apartment.district}
            </div>
            <div className="flex items-center text-[11px] text-gray-400 font-semibold uppercase tracking-tight">
              <Clock className="mr-1 h-3.5 w-3.5" />
              {formatRelativeTime(timeToDisplay)}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50 p-2 rounded-lg">
            <span className="flex items-center gap-1.5">
              <Maximize className="h-3.5 w-3.5" /> {apartment.area} m²
            </span>
            <span className="h-1 w-1 rounded-full bg-gray-300" />
            <span>{apartment.roomType === "studio" ? "Studio" : apartment.roomType}</span>
          </div>

          <div className="mt-5 flex items-baseline gap-1">
            <span className="text-2xl font-black text-orange-600">{apartment.price.toLocaleString("vi-VN")}</span>
            <span className="text-xs font-bold text-gray-500 uppercase">triệu / tháng</span>
          </div>
        </div>
      </Link>
    </div>
  );
}