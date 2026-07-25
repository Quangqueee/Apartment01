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
  weight: ["700"],
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

  // Logic RBAC: Admin và Collaborator đều thấy hoa hồng
  const canViewCommission =
    userData?.role === "collaborator" || userData?.role === "admin";

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
      <div className="group relative overflow-hidden rounded-[2.5rem] bg-white border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.03),0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.07),0_2px_4px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1.5 h-full flex flex-col">
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
            {/* Logic RBAC được áp dụng ở đây */}
            {canViewCommission && displayCommission && (
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

          {/* Tối ưu lại padding tổng thể của thân card để các phần tử bên trong xích lại gần nhau hơn */}
          <div className="pt-6 pb-6 px-7 flex flex-col flex-1">
            <div className="flex flex-col flex-1">
              {/* Tiêu đề: Font to hơn hẳn, khoảng cách mb-2.5 để sát vào Quận/Thời gian */}
              <div className="mb-2.5 flex w-full">
                <h3
                  className={`${titleFont.className} text-[1.40rem] leading-[1.3] font-extrabold text-gray-900 line-clamp-2 group-hover:text-primary transition-colors`}
                  title={apartment.title}
                >
                  {apartment.title}
                </h3>
              </div>

              <div className="flex justify-between mb-5 mt-1">
                <div className="flex items-center text-base font-bold text-gray-400 italic">
                  <MapPin className="mr-2 h-4 w-4 text-primary" />
                  {apartment.district}
                </div>
                <div className="flex items-center italic gap-1 text-[14px] font-bold text-gray-300 tracking-tight font-body">
                  <Clock className="h-3.5 w-3.5" />
                  <p>Ngày đăng:</p>
                  {formatRelativeTime(timeToDisplay)}
                </div>
              </div>

              {/* Diện tích, Thiết kế */}
              <div className="grid grid-cols-2 gap-3 mb-2 px-5">
                <div className="flex flex-col items-center justify-center text-center gap-1.5 rounded-2xl bg-gray-50/80 py-3 px-2 border border-gray-100/50 group-hover:bg-white transition-colors min-w-0">
                  <div className="flex items-center justify-center gap-2 text-xs font-black text-gray-400 tracking-widest w-full truncate">
                    <Maximize className="h-4 w-4 text-primary shrink-0" />
                    <span className="truncate">Diện Tích</span>
                  </div>
                  <div className="text-[1.15rem] font-black text-gray-800 tracking-tight font-body truncate w-full">
                    {apartment.area} m²
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center text-center gap-1.5 rounded-2xl bg-gray-50/80 py-3 px-2 border border-gray-100/50 group-hover:bg-white transition-colors min-w-0">
                  <div className="flex items-center justify-center gap-2 text-xs font-black text-gray-400 tracking-widest w-full truncate">
                    <LayoutGrid className="h-4 w-4 text-primary shrink-0" />
                    <span className="truncate">Thiết Kế</span>
                  </div>
                  <div className="text-[1.15rem] font-black text-gray-800 tracking-tight font-body uppercase truncate w-full">
                    {apartment.roomType}
                  </div>
                </div>
              </div>
            </div>

            {/* Giá tiền*/}
            <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-4">
              <div className="flex items-baseline gap-3">
                <span className="inline-block origin-bottom scale-y-[1.15] text-3xl font-black text-primary tracking-tighter font-body italic">
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
