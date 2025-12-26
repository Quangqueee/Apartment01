"use client";

import { useState, useEffect } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import ApartmentCard from "@/components/apartment-card";
import { Apartment } from "@/lib/types";
import { getApartments } from "@/lib/data";
import { Heart, Loader2, Home } from "lucide-react";
import Link from "next/link";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Apartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFavorites = async () => {
    setIsLoading(true);
    try {
      const favoriteIds = JSON.parse(localStorage.getItem("favorites") || "[]");

      if (favoriteIds.length === 0) {
        setFavorites([]);
        setIsLoading(false);
        return;
      }

      // Tải dữ liệu căn hộ (Tăng giới hạn để đảm bảo lấy đủ các căn đã thích)
      const { apartments } = await getApartments({ limit: 100 });

      // QUAN TRỌNG: Duyệt theo favoriteIds để giữ thứ tự "Mới nhất lên đầu"
      const sortedFavorites = favoriteIds
        .map((id: string) => apartments.find((apt) => apt.id === id))
        .filter((apt: any): apt is Apartment => apt !== undefined); // Loại bỏ các căn đã bị xóa khỏi DB

      setFavorites(sortedFavorites);
    } catch (error) {
      console.error("Lỗi khi tải danh sách yêu thích:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();

    const handleUpdate = () => loadFavorites();
    window.addEventListener("favoritesUpdated", handleUpdate);
    return () => window.removeEventListener("favoritesUpdated", handleUpdate);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-1 bg-slate-50/50 pb-20">
        <div className="container mx-auto px-4 py-12">
          {/* Tiêu đề */}
          <div className="mb-10 border-b pb-6">
            <h1 className="text-3xl font-black uppercase text-gray-900 flex items-center gap-3">
              <Heart className="h-8 w-8 text-red-500 fill-current" />
              Căn hộ yêu thích
            </h1>
            <p className="mt-2 text-sm text-gray-500 italic">
              Danh sách được sắp xếp theo căn hộ bạn vừa yêu thích gần đây nhất.
            </p>
          </div>

          {isLoading ? (
            <div className="flex h-64 flex-col items-center justify-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
              <p className="text-gray-400 font-medium">
                Đang cập nhật danh sách...
              </p>
            </div>
          ) : favorites.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {favorites.map((apartment) => (
                <ApartmentCard key={apartment.id} apartment={apartment} />
              ))}
            </div>
          ) : (
            <div className="flex h-80 flex-col items-center justify-center rounded-3xl border-2 border-dashed bg-white p-8 text-center shadow-sm">
              <div className="mb-4 rounded-full bg-gray-50 p-6">
                <Home className="h-12 w-12 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Chưa có căn hộ yêu thích
              </h3>
              <p className="mt-2 max-w-xs text-sm text-gray-500">
                Hãy quay lại trang chủ và chọn những không gian sống bạn ưng ý
                nhất.
              </p>
              <Link
                href="/"
                className="mt-8 rounded-full bg-gray-900 px-8 py-3 text-sm font-bold text-white transition-transform hover:scale-105 active:scale-95 shadow-lg"
              >
                Khám phá ngay
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
