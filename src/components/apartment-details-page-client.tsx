"use client";

import { getApartmentById } from "@/lib/data-client";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Apartment } from "@/lib/types";
import ClientFormattedDate from "@/components/client-formatted-date";
import { useUser } from "@/firebase/provider";
import { useState, useEffect, useTransition, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { checkFavoriteStatusAction, toggleFavoriteAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Header from "@/components/header";
import Footer from "@/components/footer";
import Image from "next/image";
import ImageLightbox from "@/components/image-lightbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
// Import Firestore để tìm căn hộ gợi ý
import { db } from "@/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
// IMPORT QUAN TRỌNG: Component Card có sẵn của bạn
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
        "_blank"
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
                copied ? "bg-green-500" : "bg-gray-400 group-hover:bg-gray-600"
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
function RelatedApartments({
  currentApartment,
}: {
  currentApartment: Apartment;
}) {
  const [related, setRelated] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        setLoading(true);
        // 1. Lấy các căn hộ cùng QUẬN (Ưu tiên cao nhất)
        const q = query(
          collection(db, "apartments"),
          where("district", "==", currentApartment.district),
          limit(20)
        );

        const snapshot = await getDocs(q);
        const fetched: Apartment[] = [];
        snapshot.forEach((doc) => {
          if (doc.id !== currentApartment.id) {
            // Loại bỏ căn hiện tại
            fetched.push({ id: doc.id, ...doc.data() } as Apartment);
          }
        });

        // 2. Logic tính điểm phù hợp (Scoring System)
        const scored = fetched.map((apt) => {
          let score = 0;
          // Cùng loại phòng: +3 điểm
          if (apt.roomType === currentApartment.roomType) score += 3;
          // Giá chênh lệch không quá 20%: +2 điểm
          const priceDiff = Math.abs(apt.price - currentApartment.price);
          const priceThreshold = currentApartment.price * 0.2;
          if (priceDiff <= priceThreshold) score += 2;

          return { ...apt, score };
        });

        // 3. Sắp xếp theo điểm cao nhất -> Mới nhất
        scored.sort((a, b) => b.score - a.score);

        // 4. Lấy top 4
        setRelated(scored.slice(0, 4));
      } catch (err) {
        console.error("Failed to fetch related", err);
      } finally {
        setLoading(false);
      }
    };

    if (currentApartment) fetchRelated();
  }, [currentApartment]);

  if (loading)
    return (
      <div className="bg-gray-50 py-12 md:py-16 border-t border-gray-100">
        <div className="container mx-auto px-4 md:px-6">
          <Skeleton className="h-8 w-48 mb-8 mx-auto md:mx-0" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Skeleton className="h-[350px] w-full rounded-2xl" />
            <Skeleton className="h-[350px] w-full rounded-2xl" />
            <Skeleton className="h-[350px] w-full rounded-2xl" />
            <Skeleton className="h-[350px] w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );

  if (related.length === 0) return null;

  return (
    <div className="bg-gray-50 border-t border-gray-100 py-12 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-headline text-2xl md:text-3xl font-bold text-gray-900">
            Có thể bạn cũng thích
          </h3>
          <Link
            href="/"
            className="hidden md:flex items-center gap-2 text-primary font-bold hover:underline"
          >
            Xem tất cả <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* SỬ DỤNG APARTMENT CARD CÓ SẴN CỦA BẠN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {related.map((apt) => (
            <ApartmentCard key={apt.id} apartment={apt} />
          ))}
        </div>

        <Link
          href="/"
          className="md:hidden mt-8 flex items-center justify-center gap-2 w-full py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-700"
        >
          Xem thêm căn hộ khác
        </Link>
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

// --- MAIN CLIENT COMPONENT ---

export default function ApartmentDetailsPageClient({
  apartmentId,
}: {
  apartmentId: string;
}) {
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isFavLoading, startFavTransition] = useTransition();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [mobileIndex, setMobileIndex] = useState(0);

  // Description Read More
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLongContent, setIsLongContent] = useState(false);
  const descriptionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchApartmentData = async () => {
      setIsLoading(true);
      const fetchedApartment = await getApartmentById(apartmentId);
      setApartment(fetchedApartment);
      if (fetchedApartment && user) {
        const { isFavorited } = await checkFavoriteStatusAction(
          user.uid,
          apartmentId
        );
        setIsFavorited(isFavorited);
      }
      setIsLoading(false);
    };
    fetchApartmentData();
  }, [apartmentId, user]);

  useEffect(() => {
    if (descriptionRef.current && apartment) {
      setIsLongContent(descriptionRef.current.scrollHeight > 250);
    }
  }, [apartment]);

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
    startFavTransition(async () => {
      const result = await toggleFavoriteAction({
        userId: user.uid,
        apartmentId,
        isFavorited,
      });
      if (result.success) {
        setIsFavorited(result.isFavorited);
        toast({
          title: result.isFavorited
            ? "Đã lưu vào danh sách yêu thích"
            : "Đã bỏ lưu",
          className: "bg-green-50 text-green-900 border-green-200",
        });
      }
    });
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleMobileScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollPosition = e.currentTarget.scrollLeft;
    const width = e.currentTarget.offsetWidth;
    const index = Math.round(scrollPosition / width);
    setMobileIndex(index);
  };

  if (isLoading || isUserLoading) {
    return (
      <>
        <Header />
        <ApartmentDetailsSkeleton />
        <Footer />
      </>
    );
  }

  if (!apartment) {
    return (
      <>
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <h1 className="text-2xl font-bold mb-2">Không tìm thấy căn hộ</h1>
          <Button onClick={() => router.push("/")}>Về trang chủ</Button>
        </div>
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
              <div
                className="md:hidden flex overflow-x-auto snap-x snap-mandatory aspect-[4/3] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                onScroll={handleMobileScroll}
              >
                {apartment.imageUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="snap-center flex-shrink-0 w-full h-full relative"
                    onClick={() => openLightbox(idx)}
                  >
                    <Image
                      src={url}
                      alt={`View ${idx}`}
                      fill
                      className="object-cover"
                      priority={idx === 0}
                    />
                  </div>
                ))}
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
                        : "col-span-1 row-span-1"
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
                className="md:hidden absolute top-4 right-4 z-10 p-3 bg-white/90 backdrop-blur-md rounded-full shadow-sm active:scale-95 transition-all"
              >
                <Heart
                  className={cn(
                    "h-5 w-5",
                    isFavorited ? "fill-red-500 text-red-500" : "text-gray-700"
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
                    label="Khu vực"
                    value={apartment.district}
                  />
                  <InfoBox
                    icon={Hash}
                    label="Mã căn"
                    value={apartment.sourceCode}
                  />
                </div>
              </div>

              <div className="pb-12 border-b border-gray-100 mb-8">
                <h3 className="font-headline text-2xl font-bold text-gray-900 mb-6">
                  Thông tin mô tả
                </h3>
                <div className="relative">
                  <div
                    ref={descriptionRef}
                    className={cn(
                      "prose prose-lg prose-gray max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap font-body transition-all duration-500 overflow-hidden",
                      !isExpanded && isLongContent
                        ? "max-h-[250px]"
                        : "max-h-none"
                    )}
                  >
                    {apartment.details}
                  </div>
                  {!isExpanded && isLongContent && (
                    <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                  )}
                </div>
                {isLongContent && (
                  <div className="flex justify-center md:justify-start mt-4">
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="flex items-center gap-2 text-primary font-bold hover:underline transition-all group"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-4 w-4" /> Thu gọn
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" /> Xem thêm mô tả
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
                        className={cn(
                          "hidden lg:flex items-center justify-center w-full py-4 rounded-2xl border-2 font-bold uppercase tracking-widest transition-all group gap-2 text-xs",
                          isFavorited
                            ? "border-red-200 bg-red-50 text-red-500 hover:bg-red-100 hover:border-red-300"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-primary hover:text-primary"
                        )}
                      >
                        <Heart
                          className={cn(
                            "h-5 w-5 transition-transform group-hover:scale-110",
                            isFavorited && "fill-current"
                          )}
                        />
                        {isFavorited ? "Đã lưu tin" : "Lưu tin này"}
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-400 text-center font-medium pt-2 italic">
                      Hanoi Residences - Tận Tâm, An Toàn, Chuyên Nghiệp.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* === 3. RELATED APARTMENTS === */}
        <RelatedApartments currentApartment={apartment} />
      </main>

      {!lightboxOpen && <Footer />}
    </>
  );
}
