"use client";
import { useState, memo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { db } from "@/firebase";
import { doc, setDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import AuthModal from "./auth-modal";
import Link from "next/link";
import { Apartment } from "@/lib/types";
import {
  Heart,
  MapPin,
  Maximize,
  Clock,
  ArrowUpRight,
  LayoutGrid,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

export default memo(function ApartmentCard({
  apartment,
}: {
  apartment: Apartment;
}) {
  const { user, userData } = useAuth();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const isFavorite = userData?.favorites?.includes(apartment.id) || false;

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      setShowModal(true);
      return;
    }
    const userRef = doc(db, "users", user.uid);
    try {
      // Sửa lỗi image_b04c07.jpg: Dùng setDoc với merge: true
      await setDoc(
        userRef,
        {
          favorites: isFavorite
            ? arrayRemove(apartment.id)
            : arrayUnion(apartment.id),
        },
        { merge: true }
      );
    } catch (err) {
      console.error("Lỗi yêu thích:", err);
    }
  };

  // Tính toán hiển thị giá đầy đủ (Ví dụ: 15.500.000 VNĐ)
  // Nếu dữ liệu apartment.price đang lưu là "15.5" (triệu), ta nhân với 1.000.000
  const fullPrice = apartment.price * 1000000;

  const timeToDisplay = apartment.updatedAt?.seconds
    ? apartment.updatedAt
    : apartment.createdAt;

  return (
    <>
      <div className="group relative overflow-hidden rounded-[2.5rem] bg-white border border-gray-100/50 transition-all duration-500 hover:-translate-y-2 shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:shadow-[0_40px_80px_rgba(0,0,0,0.15)]">
        <button
          onClick={toggleFavorite}
          className="absolute right-6 top-6 z-20 rounded-full bg-white/95 p-3.5 shadow-xl backdrop-blur-md active:scale-90 transition-all hover:bg-white border border-gray-100 group/heart"
        >
          <Heart
            className={`h-6 w-6 transition-all duration-300 ${
              isFavorite
                ? "fill-red-500 text-red-500 scale-110" // Màu khi đã tim: Đỏ rực và phóng to nhẹ
                : "text-gray-400 group-hover/heart:text-red-400" // Màu khi chưa tim: Xám, hover lên hiện đỏ nhạt
            }`}
          />
        </button>

        <Link href={`/apartments/${apartment.id}`} className="block">
          <div className="relative aspect-[4/3] overflow-hidden rounded-t-[2.5rem] bg-gray-50 isolate">
            <img
              src={apartment.imageUrls[0]}
              alt={apartment.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-1000 will-change-transform group-hover:scale-110"
            />
          </div>

          <div className="py-8 px-8">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h3 className="font-headline text-2xl font-black text-gray-900 line-clamp-2 leading-snug py-1 group-hover:text-primary transition-colors tracking-tight pr-2">
                {apartment.title}
              </h3>
              {/* <div className="mt-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-300 group-hover:bg-primary group-hover:text-white transition-all">
                <ArrowUpRight className="h-5 w-5" />
              </div> */}
            </div>

            <div className="flex justify-between mb-4">
              <div className="flex items-center text-base font-bold text-gray-400 italic mb-2">
                <MapPin className="mr-2 h-5 w-5 text-primary" />
                {apartment.district}
              </div>
              <div className="flex items-center mb-2 italic gap-1 text-[15px] font-bold text-gray-300 tracking-tight font-body">
                <Clock className="h-4 w-4" />
                <p>Ngày đăng:</p>
                {formatRelativeTime(timeToDisplay)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-2">
              <div className="flex flex-col gap-1.5 rounded-2xl bg-gray-50/80 p-5 border border-gray-100/50 group-hover:bg-white transition-colors">
                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <Maximize className="h-4 w-4 text-primary" /> Diện tích
                </div>
                <div className="text-lg font-black text-gray-800 tracking-tight font-body">
                  {apartment.area} m²
                </div>
              </div>
              <div className="flex flex-col gap-1.5 rounded-2xl bg-gray-50/80 p-5 border border-gray-100/50 group-hover:bg-white transition-colors">
                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <LayoutGrid className="h-4 w-4 text-primary" /> Thiết kế
                </div>
                <div className="text-lg font-black text-gray-800 tracking-tight font-body uppercase">
                  {apartment.roomType}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-7 border-t border-gray-50">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-primary tracking-tighter font-body italic">
                  {fullPrice.toLocaleString("vi-VN")}
                </span>
                <span className="text-[15px] font-black text-gray-400 uppercase tracking-widest">
                  VNĐ/Tháng
                </span>
              </div>
            </div>
          </div>
        </Link>
      </div>
      <AuthModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={() => router.push("/login")}
      />
    </>
  );
});
