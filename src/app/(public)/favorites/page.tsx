"use client";
import { useAuth } from "@/context/auth-context";
import { fetchFavoriteApartmentsByIds } from "@/lib/favorites-client";
import { useEffect, useState } from "react";
import ApartmentCard from "@/components/apartment-card";
import { Apartment } from "@/lib/types";
import { Heart, Loader2, House, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { toast } from "@/hooks/use-toast";

export default function FavoritesPage() {
  const { user, favoriteIds, favoritesReady, loading: authLoading } =
    useAuth();
  const [favorites, setFavorites] = useState<Apartment[]>([]);
  const [unavailableCount, setUnavailableCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFavorites() {
      if (authLoading || !favoritesReady) return;

      if (!user || favoriteIds.length === 0) {
        setFavorites([]);
        setUnavailableCount(0);
        setLoading(false);
        return;
      }

      try {
        const { apartments, unavailableCount: missing } =
          await fetchFavoriteApartmentsByIds(favoriteIds);
        setFavorites(apartments);
        setUnavailableCount(missing);
      } catch (err) {
        console.error("Lỗi lấy danh sách yêu thích:", err);
        setFavorites([]);
        setUnavailableCount(0);
        toast({
          variant: "destructive",
          title: "Không tải được danh sách yêu thích",
          description: "Vui lòng thử lại sau.",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchFavorites();
  }, [user, favoriteIds, favoritesReady, authLoading]);

  if (authLoading || !favoritesReady || loading)
    return (
      <div className="flex min-h-screen flex-col overflow-x-hidden bg-white">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="mt-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
              Đang tải bộ sưu tập...
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-white">
      <Header />

      <main className="flex-1">
        <section className="relative bg-gray-50 border-b border-gray-100 py-16 lg:py-28">
          <div className="max-w-[1920px] mx-auto px-6">
            <Link
              href="/"
              className="hidden md:inline-flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-primary transition-colors mb-8"
            >
              <ArrowLeft size={14} /> Quay lại trang chủ
            </Link>

            <h1 className="font-headline text-5xl lg:text-7xl font-black uppercase tracking-tighter text-gray-900 leading-none">
              <span className="text-primary italic">Yêu thích</span>
            </h1>
          </div>
        </section>

        <section className="max-w-[1920px] mx-auto px-6 py-5 lg:py-5">
          {!user ? (
            <div className="max-w-md mx-auto text-center py-20 bg-gray-50 rounded-[3rem] border border-gray-100 shadow-sm px-10">
              <Heart className="h-12 w-12 text-gray-200 mx-auto mb-6" />
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">
                Yêu cầu đăng nhập
              </h2>
              <p className="text-sm text-gray-500 mt-4 leading-relaxed">
                Đăng nhập để xem lại những căn hộ bạn đã chọn từ mọi thiết bị.
              </p>
              <Link
                href="/login"
                className="mt-10 block w-full bg-gray-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary transition-all shadow-xl"
              >
                Đăng nhập ngay
              </Link>
            </div>
          ) : favorites.length === 0 ? (
            <div className="py-32 text-center border-2 border-dashed border-gray-100 rounded-[3rem]">
              <House className="mx-auto h-16 w-16 text-gray-200 mb-8" />
              <h3 className="text-xl font-black text-gray-400 uppercase tracking-widest">
                {unavailableCount > 0
                  ? "Không hiển thị được căn đã lưu"
                  : "Danh sách đang trống"}
              </h3>
              <p className="mt-4 text-sm text-gray-500">
                {unavailableCount > 0
                  ? `${unavailableCount} căn đã lưu hiện không còn xem được (đã gỡ hoặc chưa công khai).`
                  : "Bạn chưa có căn hộ yêu thích nào."}
              </p>
              <Link
                href="/apartments"
                className="mt-8 inline-block text-primary font-black text-[10px] uppercase tracking-[0.2em] border-b-2 border-primary pb-1 hover:opacity-70 transition-all"
              >
                Khám phá căn hộ ngay
              </Link>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3 mb-12 border-b border-gray-50 pb-8 md:flex-row md:items-center md:justify-between">
                <span className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">
                  Số lượng: {favorites.length} Căn hộ
                </span>
                {unavailableCount > 0 && (
                  <span className="text-xs text-gray-400">
                    {unavailableCount} căn đã lưu hiện không còn xem được.
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16 mb-20">
                {favorites.map((item) => (
                  <ApartmentCard key={item.id} apartment={item} />
                ))}
              </div>
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
