"use client";
import { useEffect, useState, memo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { db } from "@/firebase";
import { doc, setDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import AuthModal from "./auth-modal";
import Link from "next/link";
import { Apartment } from "@/lib/types";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { Montserrat, Be_Vietnam_Pro } from "next/font/google";

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
  isCompact = false,
}: {
  apartment: Apartment;
  onFavoriteToggle?: (apartmentId: string, isFavorited: boolean) => void;
  isCompact?: boolean;
}) {
  const { user, userData } = useAuth();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [isFavoriteUpdating, setIsFavoriteUpdating] = useState(false);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // --- LOGIC VUỐT (SWIPE) ĐÃ TỐI ƯU CỰC MƯỢT ---
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const minSwipeDistance = 30;

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
    if (isFavoriteUpdating) return;
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
    } finally {
      setIsFavoriteUpdating(false);
    }
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentImageIndex((prev) =>
      prev === apartment.imageUrls.length - 1 ? 0 : prev + 1,
    );
  };

  const handlePrevImage = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentImageIndex((prev) =>
      prev === 0 ? apartment.imageUrls.length - 1 : prev - 1,
    );
  };

  // --- HÀM XỬ LÝ POINTER CHUẨN (KHÔNG NHẦM VỚI SCROLL DỌC) ---
  const onPointerDown = (e: React.PointerEvent) => {
    setIsDragging(false);
    setTouchStartX(e.clientX);
    setTouchStartY(e.clientY); // Lấy thêm tọa độ Y
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (touchStartX === null || touchStartY === null) return;

    const currentX = e.clientX;
    const currentY = e.clientY;

    const deltaX = Math.abs(currentX - touchStartX);
    const deltaY = Math.abs(currentY - touchStartY);

    // NẾU VUỐT DỌC (CUỘN TRANG) LỚN HƠN VUỐT NGANG -> HỦY THAO TÁC CHUYỂN ẢNH
    if (deltaY > deltaX && deltaY > 10) {
      setTouchStartX(null);
      setTouchStartY(null);
      return;
    }

    setTouchEndX(currentX);

    if (deltaX > 10) {
      setIsDragging(true);
    }
  };

  const onPointerUp = () => {
    if (touchStartX !== null && touchEndX !== null) {
      const distance = touchStartX - touchEndX;
      const isLeftSwipe = distance > minSwipeDistance;
      const isRightSwipe = distance < -minSwipeDistance;

      if (isLeftSwipe) {
        handleNextImage();
      } else if (isRightSwipe) {
        handlePrevImage();
      }
    }
    setTouchStartX(null);
    setTouchStartY(null);
    setTouchEndX(null);

    setTimeout(() => {
      setIsDragging(false);
    }, 50);
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const displayCommission = formatCommission(apartment.commission);
  const fullPrice = apartment.price * 1000000;
  const timeToDisplay = apartment.updatedAt?.seconds
    ? apartment.updatedAt
    : apartment.createdAt;

  return (
    <>
      <div className="group relative flex flex-col h-full bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden transition-all duration-300 ease-out hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1.5 hover:scale-[1.015]">
        <div
          className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100 touch-pan-y cursor-grab active:cursor-grabbing select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={() => {
            if (touchStartX !== null) onPointerUp();
          }}
          onDragStart={(e) => e.preventDefault()}
        >
          {canViewCommission && displayCommission && (
            <div className="absolute top-3 left-3 z-20 bg-[#5cb85c] text-white text-xs font-bold px-2.5 py-1 rounded shadow-sm pointer-events-none">
              HH: {displayCommission}
            </div>
          )}

          <div className="absolute top-3 right-3 z-20 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded shadow-sm pointer-events-none">
            ID: {apartment.sourceCode}
          </div>

          <Link
            href={`/apartments/${apartment.id}`}
            onClick={handleLinkClick}
            className="absolute inset-0 z-0"
            draggable={false}
          >
            <div
              className="flex h-full w-full transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
            >
              {apartment.imageUrls.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`${apartment.title} - ảnh ${idx + 1}`}
                  loading={idx === 0 ? "eager" : "lazy"}
                  draggable={false}
                  className="h-full w-full flex-shrink-0 object-cover pointer-events-none"
                />
              ))}
            </div>
          </Link>

          {apartment.imageUrls.length > 1 && (
            <>
              <div
                onClick={handlePrevImage}
                // 🛠️ Mũi tên: Chỉ hiện khi vuốt (cả đt/máy tính) hoặc khi hover trên máy tính
                className={`absolute left-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-gray-800 shadow hover:bg-white hover:scale-110 transition-all duration-300 ${
                  isDragging
                    ? "opacity-100"
                    : "opacity-0 md:group-hover:opacity-100"
                }`}
              >
                <ChevronLeft className="h-5 w-5" />
              </div>
              <div
                onClick={handleNextImage}
                className={`absolute right-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-gray-800 shadow hover:bg-white hover:scale-110 transition-all duration-300 ${
                  isDragging
                    ? "opacity-100"
                    : "opacity-0 md:group-hover:opacity-100"
                }`}
              >
                <ChevronRight className="h-5 w-5" />
              </div>
            </>
          )}

          {apartment.imageUrls.length > 1 && (
            <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5 drop-shadow-md">
              {apartment.imageUrls.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    currentImageIndex === idx
                      ? "w-4 bg-white"
                      : "w-1.5 bg-white/70"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <Link
          href={`/apartments/${apartment.id}`}
          onClick={handleLinkClick}
          className="flex flex-1 flex-col p-4 sm:p-5"
        >
          <div className="relative w-full">
            <h3
              className={`${titleFont.className} pr-8 text-[1.1rem] sm:text-lg font-bold text-gray-900 line-clamp-1`}
              title={apartment.title}
            >
              {apartment.title}
            </h3>

            <div
              onClick={toggleFavorite}
              className="absolute right-0 top-0 cursor-pointer p-1 active:scale-90 transition-transform z-10"
            >
              <Heart
                className={`h-5 w-5 transition-colors duration-300 ${
                  isFavorite
                    ? "fill-red-500 text-red-500"
                    : "text-gray-400 hover:text-red-400"
                }`}
              />
            </div>
          </div>

          <p className="mt-1 text-[0.85rem] sm:text-sm text-gray-500 line-clamp-1">
            {apartment.district}
          </p>

          {/* 🛠️ SỬA LỖI SYNTAX Ở ĐÂY: Dùng <span> thay vì Fragment <> */}
          <p className="mt-1 text-[0.85rem] sm:text-sm text-gray-500 line-clamp-1">
            {apartment.roomType} • {apartment.area} m²
            {!isCompact && <span> • {formatRelativeTime(timeToDisplay)}</span>}
          </p>

          {/* GIÁ TIỀN: Cấu trúc tối giản (₫ + Giá / tháng) với màu gốc */}
          <div className="mt-auto pt-4">
            <span
              className={`${montserrat.className} text-[1.4rem] sm:text-[1.45rem] font-bold text-primary tracking-tight`}
            >
              ₫{fullPrice.toLocaleString("vi-VN")}
            </span>
            <span className="ml-1 text-[0.85rem] sm:text-sm font-medium text-gray-500">
              /tháng
            </span>
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
