"use client";

import { formatPrice } from "@/lib/utils";
import { ROOM_TYPES } from "@/lib/constants";
import {
  MapPin,
  Maximize,
  LayoutGrid,
  Heart,
  Hash,
  Share,
  Check,
  Facebook,
  Link as LinkIcon,
  Phone,
  MessageCircle,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Star,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Apartment } from "@/lib/types";
import ClientFormattedDate from "@/components/client-formatted-date";
import { useAuth } from "@/context/auth-context";
import { useState, useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Header from "@/components/header";
import Footer from "@/components/footer";
import Image from "next/image";
import ImageLightbox from "@/components/image-lightbox";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// BƯỚC 1: Chỉ giữ lại các hàm Firebase phục vụ cho tính năng Lưu yêu thích
import { db } from "@/firebase";
import { arrayUnion, arrayRemove, setDoc, doc } from "firebase/firestore";
import ApartmentCard from "@/components/apartment-card";

// --- HELPER FUNCTIONS & COMPONENTS ---

const getRoomTypeLabel = (value: string) => {
  const roomType = ROOM_TYPES.find((rt) => rt.value === value);
  return roomType ? roomType.label : value;
};

function ShareModal({
  isOpen,
  onClose,
  title,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
}) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast({
        title: "Đã sao chép liên kết!",
        className: "bg-black text-white border-none",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFacebookShare = () => {
    if (typeof window !== "undefined") {
      const url = encodeURIComponent(window.location.href);
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${url}`,
        "_blank",
      );
    }
  };

  const handleZaloShare = () => {
    handleCopyLink();
    window.open(`https://chat.zalo.me/`, "_blank");
    toast({
      title: "Đã sao chép link!",
      description: "Đang mở Zalo web để bạn dán link.",
      className: "bg-blue-50 text-blue-900 border-blue-100",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm bg-white rounded-[2rem] border-none shadow-2xl p-6 z-[100]">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl font-bold text-center mb-4">
            Chia sẻ căn hộ này
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all group"
          >
            <div
              className={cn(
                "p-2 rounded-full text-white transition-colors",
                copied ? "bg-green-500" : "bg-gray-400 group-hover:bg-gray-600",
              )}
            >
              {copied ? (
                <Check className="h-5 w-5" />
              ) : (
                <LinkIcon className="h-5 w-5" />
              )}
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900 text-sm">
                Sao chép liên kết
              </p>
              <p className="text-xs text-gray-500">Copy link để gửi thủ công</p>
            </div>
          </button>
          <button
            onClick={handleFacebookShare}
            className="flex items-center gap-4 p-4 rounded-2xl bg-[#1877F2]/10 hover:bg-[#1877F2]/20 transition-all"
          >
            <div className="p-2 rounded-full bg-[#1877F2] text-white">
              <Facebook className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="font-bold text-[#1877F2] text-sm">Facebook</p>
              <p className="text-xs text-[#1877F2]/70">
                Đăng bài viết công khai
              </p>
            </div>
          </button>
          <button
            onClick={handleZaloShare}
            className="flex items-center gap-4 p-4 rounded-2xl bg-[#0068FF]/10 hover:bg-[#0068FF]/20 transition-all"
          >
            <div className="p-2 rounded-full bg-[#0068FF] text-white">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="font-bold text-[#0068FF] text-sm">Zalo</p>
              <p className="text-xs text-[#0068FF]/70">
                Sao chép & Mở Zalo web
              </p>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoBox({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col justify-between h-28 hover:border-primary/30 hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-primary transition-colors">
        <Icon className="h-4 w-4" /> {label}
      </div>
      <div className="font-bold text-gray-900 text-lg truncate" title={value}>
        {value}
      </div>
    </div>
  );
}

function FeatureRow({
  icon: Icon,
  title,
  desc,
}: {
  icon: any;
  title: string;
  desc: React.ReactNode;
}) {
  return (
    <div className="flex gap-5 items-start">
      <div className="p-3 rounded-xl bg-primary/5 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <h4 className="font-bold text-gray-900 text-base mb-1">{title}</h4>
        <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

// === COMPONENT: GỢI Ý CĂN HỘ ===
function RelatedApartments({ related }: { related: Apartment[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 2);
    }
  };

  useEffect(() => {
    if (related.length > 0) {
      checkScroll();
      window.addEventListener("resize", checkScroll);
      return () => window.removeEventListener("resize", checkScroll);
    }
  }, [related.length]);

  // CƠ CHẾ CLICK NÚT: TRƯỢT HẾT CẢ KHUNG NHÌN (SANG TRANG MỚI)
  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      // Lấy chiều rộng của khung hiển thị hiện tại để dịch chuyển trọn vẹn một trang
      const scrollAmount =
        direction === "left" ? -current.clientWidth : current.clientWidth;
      current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (related.length === 0) return null;

  return (
    <div className="py-12 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        {/* KHỐI CARD LỚN BAO BỌC MỀM MẠI */}
        <div className="rounded-[2.5rem] bg-gray-50/65 p-6 md:p-10 border border-gray-100/80 shadow-sm relative">
          {/* PHẦN ĐẦU: TIÊU ĐỀ, CỤM NÚT CHUYỂN TRANG & NÚT XEM TẤT CẢ */}
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-headline text-2xl md:text-3xl font-bold text-gray-900">
              Có thể bạn cũng thích
            </h3>

            <div className="flex items-center gap-6">
              {/* Cụm nút chuyển trang nằm ngang, độc lập */}
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => scroll("left")}
                  disabled={!canScrollLeft}
                  className={`h-10 w-10 flex items-center justify-center rounded-full border border-gray-200 bg-white transition-all shadow-sm ${
                    canScrollLeft
                      ? "hover:border-primary hover:text-primary hover:shadow active:scale-95 text-gray-700 cursor-pointer"
                      : "opacity-40 cursor-not-allowed text-gray-300"
                  }`}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-5 w-5 stroke-[2]" />
                </button>
                <button
                  onClick={() => scroll("right")}
                  disabled={!canScrollRight}
                  className={`h-10 w-10 flex items-center justify-center rounded-full border border-gray-200 bg-white transition-all shadow-sm ${
                    canScrollRight
                      ? "hover:border-primary hover:text-primary hover:shadow active:scale-95 text-gray-700 cursor-pointer"
                      : "opacity-40 cursor-not-allowed text-gray-300"
                  }`}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-5 w-5 stroke-[2]" />
                </button>
              </div>

              {/* Nút Xem tất cả */}
              <Link
                href="/"
                className="flex items-center gap-2 text-primary font-bold hover:underline text-sm md:text-base"
              >
                Xem tất cả <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* HƯỚNG DẪN VUỐT TRÊN MOBILE */}
          <div className="md:hidden text-center text-xs font-medium text-gray-400 flex items-center justify-center gap-3 mb-6">
            <span className="opacity-60 text-base">←</span>
            <span>Vuốt ngang để xem thêm</span>
            <span className="opacity-60 text-base">→</span>
          </div>

          {/* DANH SÁCH CĂN HỘ */}
          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory py-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full scroll-smooth"
          >
            {related.map((apt) => (
              <div
                key={apt.id}
                className="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.125rem)] flex-shrink-0 snap-start"
              >
                <ApartmentCard apartment={apt} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
function ApartmentDetailsSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse">
      <Skeleton className="w-full aspect-[16/9] md:aspect-[21/9] rounded-[1.5rem] mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        <div className="lg:col-span-8 space-y-6">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-16 w-1/3" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="lg:col-span-4">
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// BƯỚC 3: MAIN CLIENT COMPONENT NHẬN DATA TỪ SERVER
export default function ApartmentDetailsPageClient({
  initialApartment,
  initialRelated,
}: {
  initialApartment: Apartment;
  initialRelated: Apartment[];
}) {
  const { user, userData, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Gán thẳng data từ Server vào biến apartment để không phải sửa code phía dưới
  const apartment = initialApartment;
  const apartmentId = initialApartment.id;

  const [isFavorited, setIsFavorited] = useState(false);
  const [isFavLoading, setIsFavLoading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [mobileIndex, setMobileIndex] = useState(0);
  const [mobileCarouselApi, setMobileCarouselApi] = useState<CarouselApi>();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isLongContent, setIsLongContent] = useState(false);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const isMobileSwipeRef = useRef(false);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const isCollaborator = userData?.role === "collaborator";

  const formatCommission = (commissionValue: Apartment["commission"]) => {
    if (
      commissionValue === undefined ||
      commissionValue === null ||
      commissionValue === ""
    ) {
      return "--";
    }
    if (typeof commissionValue === "number") {
      return commissionValue.toLocaleString("vi-VN");
    }
    return commissionValue;
  };

  useEffect(() => {
    if (!user) {
      setIsFavorited(false);
      return;
    }
    const currentFavorites = userData?.favorites ?? [];
    setIsFavorited(currentFavorites.includes(apartmentId));
  }, [user, userData?.favorites, apartmentId]);

  useEffect(() => {
    if (descriptionRef.current && apartment) {
      setIsLongContent(descriptionRef.current.scrollHeight > 250);
    }
  }, [apartment]);

  useEffect(() => {
    if (!mobileCarouselApi) return;
    const syncMobileIndex = () => {
      setMobileIndex(mobileCarouselApi.selectedScrollSnap());
    };
    syncMobileIndex();
    mobileCarouselApi.on("select", syncMobileIndex);
    mobileCarouselApi.on("reInit", syncMobileIndex);
    return () => {
      mobileCarouselApi.off("select", syncMobileIndex);
      mobileCarouselApi.off("reInit", syncMobileIndex);
    };
  }, [mobileCarouselApi]);

  const handleFavoriteToggle = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!user) {
      toast({
        title: "Yêu cầu đăng nhập",
        description: "Vui lòng đăng nhập để lưu căn hộ.",
      });
      router.push("/login");
      return;
    }

    setIsFavLoading(true);
    const nextIsFavorited = !isFavorited;
    setDoc(
      doc(db, "users", user.uid),
      {
        favorites: nextIsFavorited
          ? arrayUnion(apartmentId)
          : arrayRemove(apartmentId),
      },
      { merge: true },
    )
      .then(() => {
        setIsFavorited(nextIsFavorited);
        toast({
          title: nextIsFavorited
            ? "Đã lưu vào danh sách yêu thích"
            : "Đã bỏ lưu",
          className: "bg-green-50 text-green-900 border-green-200",
        });
      })
      .catch((error) => {
        console.error("Lỗi cập nhật yêu thích:", error);
        toast({
          variant: "destructive",
          title: "Không thể lưu yêu thích",
          description: "Vui lòng thử lại sau.",
        });
      })
      .finally(() => {
        setIsFavLoading(false);
      });
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleMobileTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const firstTouch = event.touches[0];
    touchStartXRef.current = firstTouch.clientX;
    touchStartYRef.current = firstTouch.clientY;
    isMobileSwipeRef.current = false;
  };

  const handleMobileTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!event.touches.length) return;
    const firstTouch = event.touches[0];
    const deltaX = Math.abs(firstTouch.clientX - touchStartXRef.current);
    const deltaY = Math.abs(firstTouch.clientY - touchStartYRef.current);
    if (deltaX > 8 || deltaY > 8) {
      isMobileSwipeRef.current = true;
    }
  };

  const handleMobileImageClick = (index: number) => {
    if (isMobileSwipeRef.current) {
      isMobileSwipeRef.current = false;
      return;
    }
    openLightbox(index);
  };

  if (authLoading) {
    return (
      <>
        <Header />
        <ApartmentDetailsSkeleton />
        <Footer />
      </>
    );
  }

  const displayDate = apartment.updatedAt?.seconds
    ? apartment.updatedAt
    : apartment.createdAt;

  return (
    <>
      {!lightboxOpen && <Header />}

      <ImageLightbox
        images={apartment.imageUrls}
        selectedIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        apartmentCode={apartment.sourceCode}
      />

      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        title={apartment.title}
      />

      <main className="flex-1 bg-white min-h-screen font-body text-gray-800">
        {/* === IMAGES GALLERY === */}
        <div className="pt-0 md:pt-6">
          <div className="container mx-auto px-0 md:px-6">
            <div className="relative group md:rounded-[2rem] overflow-hidden">
              <div className="md:hidden">
                <Carousel
                  setApi={setMobileCarouselApi}
                  opts={{
                    align: "start",
                    containScroll: "trimSnaps",
                    loop: apartment.imageUrls.length > 1,
                  }}
                  className="w-full aspect-[4/3]"
                >
                  <CarouselContent className="-ml-0 select-none [touch-action:pan-y_pinch-zoom]">
                    {apartment.imageUrls.map((url, idx) => (
                      <CarouselItem
                        key={idx}
                        className="pl-0"
                        onTouchStart={handleMobileTouchStart}
                        onTouchMove={handleMobileTouchMove}
                        onClick={() => handleMobileImageClick(idx)}
                      >
                        <div className="relative w-full h-full aspect-[4/3]">
                          <Image
                            src={url}
                            alt={`View ${idx}`}
                            fill
                            draggable={false}
                            className="object-cover pointer-events-none select-none"
                            priority={idx === 0}
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
                <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-3 py-1 rounded-full font-medium backdrop-blur-sm pointer-events-none z-10">
                  {mobileIndex + 1} / {apartment.imageUrls.length}
                </div>
              </div>

              <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-2 h-[480px]">
                {apartment.imageUrls.slice(0, 5).map((url, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "relative cursor-pointer hover:brightness-90 transition-all duration-500",
                      idx === 0
                        ? "col-span-2 row-span-2"
                        : "col-span-1 row-span-1",
                    )}
                    onClick={() => openLightbox(idx)}
                  >
                    <Image
                      src={url}
                      alt="Apartment"
                      fill
                      className="object-cover"
                    />
                    {idx === 4 && apartment.imageUrls.length > 5 && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-headline font-bold text-xl backdrop-blur-[2px]">
                        Xem tất cả ảnh
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={handleFavoriteToggle}
                disabled={isFavLoading}
                className="md:hidden absolute top-4 right-4 z-10 p-3 bg-white/90 backdrop-blur-md rounded-full shadow-sm active:scale-95 transition-all"
              >
                <Heart
                  className={cn(
                    "h-5 w-5",
                    isFavorited ? "fill-red-500 text-red-500" : "text-gray-700",
                  )}
                />
              </button>
            </div>
          </div>
        </div>

        {/* === MAIN CONTENT === */}
        <div className="container mx-auto px-6 mt-8 md:mt-12 mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* CỘT TRÁI */}
            <div className="lg:col-span-8">
              <div className="border-b border-gray-100 pb-8 mb-8">
                <div className="flex justify-between items-start gap-4 mb-3">
                  <h1 className="font-headline text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-[1.1] tracking-tight">
                    {apartment.title}
                  </h1>
                  <div className="hidden md:flex shrink-0">
                    <Button
                      variant="outline"
                      className="rounded-full border-gray-200 hover:bg-gray-50 hover:text-gray-900 gap-2 font-bold text-gray-600 transition-all"
                      onClick={() => setShareOpen(true)}
                    >
                      <Share className="h-4 w-4" /> Chia sẻ
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-6">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#cda533] bg-[#cda533]/10 px-3 py-1.5 rounded-full border border-[#cda533]/20">
                    <Hash className="h-3.5 w-3.5" />
                    {apartment.sourceCode}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="uppercase tracking-wider">
                      Cập nhật: <ClientFormattedDate date={displayDate} />
                    </span>
                  </div>
                </div>
                <div className="pt-6 flex items-baseline gap-2">
                  <span className="font-headline text-4xl md:text-5xl font-black text-[#cda533]">
                    {formatPrice(apartment.price)}
                  </span>
                </div>
              </div>

              <div className="border-b border-gray-100 pb-8 mb-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  <InfoBox
                    icon={Maximize}
                    label="Diện tích"
                    value={`${apartment.area} m²`}
                  />
                  <InfoBox
                    icon={LayoutGrid}
                    label="Thiết kế"
                    value={getRoomTypeLabel(apartment.roomType)}
                  />
                  <InfoBox
                    icon={MapPin}
                    label={isCollaborator ? "Hoa hồng" : "Khu vực"}
                    value={
                      isCollaborator
                        ? formatCommission(apartment.commission)
                        : apartment.district
                    }
                  />
                  <InfoBox
                    icon={Hash}
                    label="Mã căn"
                    value={apartment.sourceCode}
                  />
                </div>
              </div>

              <div className="pb-12 border-b border-gray-100 mb-8">
                <h3 className="font-headline text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-[#cda533] rounded-full inline-block"></span>
                  Thông tin mô tả
                </h3>
                <div className="relative">
                  <div
                    ref={descriptionRef}
                    className={cn(
                      "text-gray-600 text-base md:text-lg leading-relaxed antialiased whitespace-pre-wrap font-body transition-all duration-500 overflow-hidden",
                      !isExpanded && isLongContent
                        ? "max-h-[220px]"
                        : "max-h-none",
                    )}
                  >
                    {apartment.details}
                  </div>
                  {!isExpanded && isLongContent && (
                    <div className="absolute bottom-0 left-0 w-full h-28 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
                  )}
                </div>
                {isLongContent && (
                  <div className="flex justify-center md:justify-start mt-6">
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gray-100 hover:bg-[#cda533]/10 hover:text-[#cda533] text-gray-700 font-bold text-sm transition-all group"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-4 w-4" /> Thu gọn
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" /> Xem thêm
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="pb-8 space-y-6">
                <FeatureRow
                  icon={Star}
                  title="Dịch vụ chuyên nghiệp"
                  desc="Cam kết chất lượng, hỗ trợ 24/7 từ Hanoi Residences."
                />
                <FeatureRow
                  icon={Sparkles}
                  title="Thông tin minh bạch"
                  desc="Hình ảnh thực tế, giá niêm yết rõ ràng, không thu phí trung gian."
                />
              </div>
            </div>

            {/* CỘT PHẢI */}
            <div className="lg:col-span-4 relative">
              <div className="sticky top-28">
                <div className="rounded-[2.5rem] bg-white p-8 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-gray-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                  <div className="relative z-10 space-y-6">
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100/50">
                      <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                          Trạng thái
                        </span>
                        <span className="flex items-center gap-2 text-green-600 text-xs font-bold uppercase tracking-wide">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-30"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                          </span>
                          Còn trống
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                          Hotline 24/7
                        </span>
                        <span className="font-headline text-xl font-bold text-gray-900 tracking-wide font-mono">
                          0355.885.851
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3 pt-2">
                      <a
                        href="tel:+84355885851"
                        className="flex items-center justify-center w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-[#b88e22] text-white font-bold uppercase tracking-widest hover:shadow-[0_10px_25px_rgba(205,165,51,0.3)] hover:scale-[1.01] transition-all duration-300 gap-2 shadow-lg"
                      >
                        <Phone className="h-5 w-5 fill-current" /> Liên hệ ngay
                      </a>
                      <button
                        onClick={handleFavoriteToggle}
                        disabled={isFavLoading}
                        className={cn(
                          "hidden lg:flex items-center justify-center w-full py-4 rounded-2xl border-2 font-bold uppercase tracking-widest transition-all group gap-2 text-xs",
                          isFavorited
                            ? "border-red-200 bg-red-50 text-red-500 hover:bg-red-100 hover:border-red-300"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-primary hover:text-primary",
                        )}
                      >
                        <Heart
                          className={cn(
                            "h-5 w-5 transition-transform group-hover:scale-110",
                            isFavorited && "fill-current",
                          )}
                        />
                        {isFavorited ? "Đã lưu tin" : "Lưu tin này"}
                      </button>
                    </div>
                    <p className="text-[12px] text-gray-400 text-center font-medium pt-2 italic">
                      Hanoi Residences - Tận Tâm, An Toàn, Chuyên Nghiệp.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BƯỚC 4: TRUYỀN DATA VÀO COMPONENT THANH TRƯỢT */}
        <RelatedApartments related={initialRelated} />
      </main>

      {!lightboxOpen && <Footer />}
    </>
  );
}
