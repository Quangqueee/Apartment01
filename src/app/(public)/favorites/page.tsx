"use client";
import { useAuth } from "@/context/auth-context";
import { db } from "@/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import ApartmentCard from "@/components/apartment-card";
import { Apartment } from "@/lib/types";
import { Heart, Loader2, House, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Header from "@/components/header";
import Footer from "@/components/footer";
import MobileNav from "@/components/mobile-nav";

export default function FavoritesPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFavorites() {
      if (authLoading) return;

      if (!user || !userData?.favorites || userData.favorites.length === 0) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      try {
        const favoriteIds = userData.favorites.slice(0, 30);
        const q = query(
          collection(db, "apartments"),
          where("__name__", "in", favoriteIds)
        );

        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Apartment[];
        setFavorites(docs);
      } catch (err) {
        console.error("Lỗi lấy danh sách yêu thích:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchFavorites();
  }, [user, userData?.favorites, authLoading]);

  // Loading state đồng bộ với phong cách Hanoi Residences
  if (authLoading || loading)
    return (
      <div className="flex min-h-screen flex-col bg-white">
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
        <MobileNav />
      </div>
    );

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      <main className="flex-1">
        {/* SECTION 1: HERO BANNER - Tối ưu cho Mobile */}
        <section className="relative bg-gray-50 border-b border-gray-100 py-16 lg:py-28">
          <div className="max-w-7xl mx-auto px-6">
            {/* FIX: Ẩn nút Quay lại trên mobile, chỉ hiện trên Desktop */}
            <Link
              href="/"
              className="hidden md:inline-flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-primary transition-colors mb-8"
            >
              <ArrowLeft size={14} /> Quay lại trang chủ
            </Link>

            <h1 className="font-headline text-5xl lg:text-7xl font-black uppercase tracking-tighter text-gray-900 leading-none">
              Bộ sưu tập <br />
              <span className="text-primary italic">Yêu thích</span>
            </h1>
            <p className="mt-6 text-sm lg:text-base text-gray-500 font-medium italic border-l-2 border-primary pl-6 max-w-lg">
              Tuyển chọn những không gian sống tinh tế nhất bạn đã lưu lại tại
              thủ đô.
            </p>
          </div>
        </section>

        {/* SECTION 2: DANH SÁCH - Tăng padding để giao diện thoáng hơn */}
        <section className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
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
                Danh sách đang trống
              </h3>
              <Link
                href="/apartments"
                className="mt-8 inline-block text-primary font-black text-[10px] uppercase tracking-[0.2em] border-b-2 border-primary pb-1 hover:opacity-70 transition-all"
              >
                Khám phá căn hộ ngay
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-12 border-b border-gray-50 pb-8">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
                  Số lượng: {favorites.length} Căn hộ
                </span>
              </div>

              {/* Grid đồng bộ với trang chủ */}
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
      {/* MobileNav với logic Active Tab đã sửa sẽ giúp nút Yêu thích sáng rõ */}
      <MobileNav />
    </div>
  );
}
