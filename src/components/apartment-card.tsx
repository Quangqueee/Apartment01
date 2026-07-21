"use client";
import { useEffect, useState, memo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { db } from "@/firebase";
import { doc, setDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import AuthModal from "./auth-modal";
import Link from "next/link";
import { Apartment } from "@/lib/types";
import { Heart, MapPin, Maximize, Clock, LayoutGrid } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { Montserrat } from "next/font/google";
import { Be_Vietnam_Pro } from "next/font/google";

const titleFont = Be_Vietnam_Pro({
  subsets: ["vietnamese"],
  weight: ["700"],
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["vietnamese"],
  weight: ["700"], // Chỉ tải trọng lượng in đậm để web chạy nhanh
  display: "swap",
});

export default memo(function ApartmentCard({
  apartment,
  onFavoriteToggle,
}: {
  apartment: Apartment;
  onFavoriteToggle?: (apartmentId: string, isFavorited: boolean) => void;
}) {
  const { user, userData } = useAuth();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [isFavoriteUpdating, setIsFavoriteUpdating] = useState(false);
  const isCollaborator = userData?.role === "collaborator";
  const initialFavoriteState =
    typeof apartment.isFavorited === "boolean"
      ? apartment.isFavorited
      : userData?.favorites?.includes(apartment.id) || false;
  const [isFavorite, setIsFavorite] = useState(initialFavoriteState);

  useEffect(() => {
    const nextFavoriteState =
      typeof apartment.isFavorited === "boolean"
        ? apartment.isFavorited
        : userData?.favorites?.includes(apartment.id) || false;
    setIsFavorite(nextFavoriteState);
  }, [apartment.id, apartment.isFavorited, userData?.favorites]);

  const formatCommission = (commissionValue: Apartment["commission"]) => {
    if (
      commissionValue === undefined ||
      commissionValue === null ||
      commissionValue === ""
    ) {
      return null;
    }
    if (typeof commissionValue === "number") {
      return commissionValue.toLocaleString("vi-VN");
    }
    return commissionValue;
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFavoriteUpdating) {
      return;
    }
    if (!user) {
      setShowModal(true);
      return;
    }

    const userRef = doc(db, "users", user.uid);
    const nextIsFavorite = !isFavorite;
    setIsFavoriteUpdating(true);
    setIsFavorite(nextIsFavorite);
    onFavoriteToggle?.(apartment.id, nextIsFavorite);

    try {
      await setDoc(
        userRef,
        {
          favorites: nextIsFavorite
            ? arrayUnion(apartment.id)
            : arrayRemove(apartment.id),
        },
        { merge: true },
      );
    } catch (err) {
      setIsFavorite(!nextIsFavorite);
      onFavoriteToggle?.(apartment.id, !nextIsFavorite);
      console.error("Lỗi yêu thích:", err);
    } finally {
      setIsFavoriteUpdating(false);
    }
  };

  const displayCommission = formatCommission(apartment.commission);
  const fullPrice = apartment.price * 1000000;
  const timeToDisplay = apartment.updatedAt?.seconds
    ? apartment.updatedAt
    : apartment.createdAt;

  return (
    <>
      <div className="group relative overflow-hidden rounded-[2.5rem] bg-white border border-gray-100/50 transition-all duration-500 hover:-translate-y-2 shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:shadow-[0_40px_80px_rgba(0,0,0,0.15)] h-full flex flex-col">
        <button
          onClick={toggleFavorite}
          disabled={isFavoriteUpdating}
          className="absolute right-6 top-6 z-20 rounded-full bg-white/95 p-3.5 shadow-xl backdrop-blur-md active:scale-90 transition-all hover:bg-white border border-gray-100 group/heart disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Heart
            className={`h-6 w-6 transition-all duration-300 ${
              isFavorite
                ? "fill-red-500 text-red-500 scale-110"
                : "text-gray-400 group-hover/heart:text-red-400"
            }`}
          />
        </button>

        <Link
          href={`/apartments/${apartment.id}`}
          className="flex flex-col h-full"
        >
          <div className="relative aspect-[4/3] overflow-hidden rounded-t-[2.5rem] bg-gray-50 isolate shrink-0">
            <img
              src={apartment.imageUrls[0]}
              alt={apartment.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-1000 will-change-transform group-hover:scale-110"
            />
            {isCollaborator && displayCommission && (
              <div
                className="absolute left-5 top-6 z-10 rounded-full bg-black/50 px-3.5 py-2 text-sm font-black text-white backdrop-blur-md"
                style={{ textShadow: "0px 0px 4px black" }}
              >
                HH: {displayCommission}
              </div>
            )}
            <div
              className="absolute bottom-4 right-5 z-10 rounded-full bg-black/50 px-3.5 py-2 text-sm font-black text-white backdrop-blur-md"
              style={{ textShadow: "0px 0px 4px black" }}
            >
              ID: {apartment.sourceCode}
            </div>
          </div>

          <div className="py-8 px-8 flex flex-col flex-1">
            <div>
              {/* Cố định chiều cao khung tiêu đề, áp dụng font Montserrat */}
              {/* Cố định chiều cao 1 dòng, dùng truncate để cắt chữ thành ... */}
              <div className="h-8 mb-4 flex items-center w-full overflow-hidden">
                <h3
                  className={`${titleFont.className} text-[1.15rem] text-gray-900 truncate w-full group-hover:text-primary transition-colors`}
                >
                  {apartment.title}
                </h3>
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
            </div>

            <div className="grid grid-cols-2 gap-4 my-auto">
              <div className="flex flex-col gap-1.5 rounded-2xl bg-gray-50/80 p-5 border border-gray-100/50 group-hover:bg-white transition-colors">
                <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
                  <Maximize className="h-4 w-4 text-primary" /> Diện tích
                </div>
                <div className="text-[1.15rem] font-black text-gray-800 tracking-tight font-body">
                  {apartment.area} m²
                </div>
              </div>
              <div className="flex flex-col gap-1.5 rounded-2xl bg-gray-50/80 p-5 border border-gray-100/50 group-hover:bg-white transition-colors">
                <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
                  <LayoutGrid className="h-4 w-4 text-primary" /> Thiết kế
                </div>
                <div className="text-[1.15rem] font-black text-gray-800 tracking-tight font-body uppercase">
                  {apartment.roomType}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-50">
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
