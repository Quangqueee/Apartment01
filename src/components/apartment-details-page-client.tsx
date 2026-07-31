"use client";
import ReactMarkdown from "react-markdown";
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
  Copy,
  X,
  ArrowLeft,
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
import { Montserrat, Be_Vietnam_Pro } from "next/font/google";
import { db } from "@/firebase";
import { arrayUnion, arrayRemove, setDoc, doc } from "firebase/firestore";
import ApartmentCard from "@/components/apartment-card";

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
              <p className="text-xs text-gray-500">Copy link</p>
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

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount =
        direction === "left" ? -current.clientWidth : current.clientWidth;
      current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (related.length === 0) return null;

  return (
    <div className="py-12 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="rounded-[2.5rem] bg-gray-50/65 p-6 md:p-10 border border-gray-100/80 shadow-sm relative">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-headline text-2xl md:text-3xl font-bold text-gray-900">
              Có thể bạn cũng thích
            </h3>
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => scroll("left")}
                  disabled={!canScrollLeft}
                  className={`h-10 w-10 flex items-center justify-center rounded-full border border-gray-200 bg-white transition-all shadow-sm ${canScrollLeft ? "hover:border-primary hover:text-primary hover:shadow active:scale-95 text-gray-700 cursor-pointer" : "opacity-40 cursor-not-allowed text-gray-300"}`}
                >
                  <ChevronLeft className="h-5 w-5 stroke-[2]" />
                </button>
                <button
                  onClick={() => scroll("right")}
                  disabled={!canScrollRight}
                  className={`h-10 w-10 flex items-center justify-center rounded-full border border-gray-200 bg-white transition-all shadow-sm ${canScrollRight ? "hover:border-primary hover:text-primary hover:shadow active:scale-95 text-gray-700 cursor-pointer" : "opacity-40 cursor-not-allowed text-gray-300"}`}
                >
                  <ChevronRight className="h-5 w-5 stroke-[2]" />
                </button>
              </div>
              <Link
                href="/"
                className="flex items-center gap-2 text-primary font-bold hover:underline text-sm md:text-base"
              >
                Xem tất cả <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="md:hidden text-center text-xs font-medium text-gray-400 flex items-center justify-center gap-3 mb-6">
            <span className="opacity-60 text-base">←</span>
            <span>Vuốt ngang để xem thêm</span>
            <span className="opacity-60 text-base">→</span>
          </div>
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

  const apartment = initialApartment;
  const apartmentId = initialApartment.id;

  const [isFavorited, setIsFavorited] = useState(false);
  const [isFavLoading, setIsFavLoading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [mobileIndex, setMobileIndex] = useState(0);
  const [mobileCarouselApi, setMobileCarouselApi] = useState<CarouselApi>();

  // STATE CHO MODAL THÔNG TIN KIỂU AIRBNB
  const [isDescModalOpen, setIsDescModalOpen] = useState(false);

  const isMobileSwipeRef = useRef(false);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);

  // KIỂM TRA QUYỀN TRUY CẬP
  const isAdmin = userData?.role === "admin";
  const isCollaborator = userData?.role === "collaborator" || isAdmin;

  const formatCommission = (commissionValue: Apartment["commission"]) => {
    if (
      commissionValue === undefined ||
      commissionValue === null ||
      commissionValue === ""
    )
      return "--";
    if (typeof commissionValue === "number")
      return commissionValue.toLocaleString("vi-VN");
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
    if (!mobileCarouselApi) return;
    const syncMobileIndex = () =>
      setMobileIndex(mobileCarouselApi.selectedScrollSnap());
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
      .catch(() => {
        toast({
          variant: "destructive",
          title: "Không thể lưu yêu thích",
          description: "Vui lòng thử lại sau.",
        });
      })
      .finally(() => setIsFavLoading(false));
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
    if (deltaX > 8 || deltaY > 8) isMobileSwipeRef.current = true;
  };

  const handleMobileImageClick = (index: number) => {
    if (isMobileSwipeRef.current) {
      isMobileSwipeRef.current = false;
      return;
    }
    openLightbox(index);
  };

  // NÚT COPY THÔNG TIN DÀNH CHO CTV (Đã tách riêng Admin & CTV)
  const handleCopyInternalInfo = async () => {
    let copyText = "";

    if (isAdmin) {
      // Admin được copy full info
      copyText = `📍 Mã căn: ${apartment.sourceCode}\n`;
      copyText += `💰 Giá: ${formatPrice(apartment.price)}/tháng\n`;
      copyText += `🤝 Hoa hồng: ${formatCommission(apartment.commission)}\n`;
      copyText += `📞 SĐT Chủ nhà: ${apartment.landlordPhoneNumber || "Chưa có"}\n`;
      copyText += `\n--- THÔNG TIN CHUNG ---\n${apartment.details || "Chưa có thông tin chi tiết."}`;
    } else {
      // CTV chỉ được copy nội dung trong Prompt thông tin thô
      copyText = `📍 Mã căn: ${apartment.sourceCode}\n`;
      copyText += `\n--- THÔNG TIN CHUNG ---\n${apartment.details || "Chưa có thông tin chi tiết."}`;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(copyText);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = copyText;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }
      toast({
        title: "Đã copy thông tin!",
        className: "bg-white text-green-900 border-none",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Lỗi sao chép",
        description: "Trình duyệt của bạn không hỗ trợ tính năng này.",
      });
    }
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

  const isRented = apartment.status === "rented";
  const displayDate = apartment.updatedAt?.seconds
    ? apartment.updatedAt
    : apartment.createdAt;
  const dateInMs = displayDate?.seconds
    ? displayDate.seconds * 1000
    : Date.now();
  const daysPassed = Math.floor(
    (Date.now() - dateInMs) / (1000 * 60 * 60 * 24),
  );
  const isOldListing = daysPassed >= 14;

  let statusLabel = "";
  let statusTextColor = "";
  let statusDotColor = "";
  let statusHeader = "Tình trạng";

  if (isCollaborator) {
    if (isRented) {
      statusLabel = "Tạm hết";
      statusTextColor = "text-gray-500";
      statusDotColor = "bg-gray-400";
    } else if (isOldListing) {
      statusLabel = "Liên hệ xác nhận";
      statusTextColor = "text-amber-600";
      statusDotColor = "bg-amber-500";
    } else {
      statusLabel = "Còn trống";
      statusTextColor = "text-green-600";
      statusDotColor = "bg-green-500";
    }
  } else {
    const hasPetFriendly = apartment.tags?.includes("pet_friendly");
    const hasLakeView = apartment.tags?.includes("lake_view");

    if (hasPetFriendly) {
      statusHeader = "Đặc trưng";
      statusLabel = "Pet Friendly";
      statusTextColor = "text-emerald-600";
      statusDotColor = "bg-emerald-500";
    } else if (hasLakeView) {
      statusHeader = "Đặc trưng";
      statusLabel = "Lake View";
      statusTextColor = "text-sky-600";
      statusDotColor = "bg-sky-500";
    } else if (isRented || isOldListing) {
      statusHeader = "Độ Hot";
      const B2C_TAGS = [
        { label: "Hot Deal", color: "text-red-600", dot: "bg-red-500" },
        { label: "Trending", color: "text-orange-600", dot: "bg-orange-500" },
        { label: "Best Price", color: "text-blue-600", dot: "bg-blue-500" },
        { label: "Hot Listing", color: "text-rose-600", dot: "bg-rose-500" },
        {
          label: "Great Value",
          color: "text-indigo-600",
          dot: "bg-indigo-500",
        },
        {
          label: "Unique Property",
          color: "text-violet-600",
          dot: "bg-violet-500",
        },
      ];
      const tagIndex =
        apartmentId
          .split("")
          .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) %
        B2C_TAGS.length;
      const selectedTag = B2C_TAGS[tagIndex];
      statusLabel = selectedTag.label;
      statusTextColor = selectedTag.color;
      statusDotColor = selectedTag.dot;
    } else {
      statusLabel = "Còn trống";
      statusTextColor = "text-green-600";
      statusDotColor = "bg-green-500";
    }
  }

  // Helper render B2C Markdown
  const renderB2CContent = () => {
    if (!apartment.aiContent)
      return apartment.details || "Thông tin đang được cập nhật...";
    return (
      <ReactMarkdown>
        {apartment.aiContent.b2cDescription +
          (apartment.aiContent.highlights &&
          apartment.aiContent.highlights.length > 0
            ? "\n\n**Điểm nổi bật:**\n" +
              apartment.aiContent.highlights
                .map((h: string) => `- ${h}`)
                .join("\n")
            : "")}
      </ReactMarkdown>
    );
  };

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

      {/* COMPONENT POPUP NẢY LÊN CHO THÔNG TIN CHI TIẾT */}
      {/* ĐÃ FIX: Giới hạn Desktop Modal và Thêm Mobile Animation */}
      <Dialog open={isDescModalOpen} onOpenChange={setIsDescModalOpen}>
        <DialogContent
          className={cn(
            "p-0 border-none shadow-2xl z-[100] gap-0 bg-white flex flex-col [&>button.absolute]:hidden",
            // Mobile: Full screen, trượt từ dưới lên (slide-in-from-bottom)
            "max-sm:h-[100dvh] max-sm:w-full max-sm:max-w-none max-sm:rounded-none max-sm:!top-0 max-sm:!translate-y-0",
            "max-sm:data-[state=open]:animate-in max-sm:data-[state=closed]:animate-out max-sm:data-[state=open]:slide-in-from-bottom-full max-sm:data-[state=closed]:slide-out-to-bottom-full max-sm:duration-300",
            // Desktop: Kích thước cố định (width 780px, max-height 85vh), bo góc tròn
            "sm:max-w-[780px] sm:max-h-[85vh] sm:rounded-2xl overflow-hidden",
          )}
        >
          <DialogHeader className="px-5 py-4 sm:px-6 sm:py-5 border-b border-gray-100 flex flex-row items-center gap-4 sticky top-0 bg-white z-10 shrink-0 text-left">
            <button
              onClick={() => setIsDescModalOpen(false)}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none"
            >
              <X className="h-5 w-5 hidden sm:block text-gray-900" />
              <ArrowLeft className="h-5 w-5 sm:hidden text-gray-900" />
            </button>
            <DialogTitle className="font-semibold text-[20px] text-gray-900 m-0 !mt-0 leading-none">
              {isCollaborator
                ? "Thông tin chi tiết"
                : "Giới thiệu về chỗ ở này"}
            </DialogTitle>
          </DialogHeader>

          {/* Khu vực cuộn chuột (scrollable area) */}
          <div className="px-6 py-6 overflow-y-auto flex-1">
            {isCollaborator ? (
              <div className="bg-white rounded-2xl mb-6">
                {/* HAI CỘT HOA HỒNG & SĐT/MÃ CĂN SONG SONG TẠI MODAL */}
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl shadow-sm">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                      Hoa hồng:
                    </div>
                    <div className="text-gray-900 font-bold text-lg">
                      {formatCommission(apartment.commission)}
                    </div>
                  </div>

                  {isAdmin ? (
                    <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl shadow-sm">
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                        SĐT Chủ nhà:
                      </div>
                      <div className="text-gray-900 font-bold text-lg">
                        {apartment.landlordPhoneNumber || "Chưa có"}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl shadow-sm">
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                        Mã căn:
                      </div>
                      <div className="text-gray-900 font-bold text-lg">
                        {apartment.sourceCode}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center mb-3">
                  <div className="font-bold text-gray-900 flex items-center gap-2">
                    📝 Thông tin:
                  </div>
                  <Button
                    onClick={handleCopyInternalInfo}
                    variant="outline"
                    size="sm"
                    className="h-8 text-gray-700 border-gray-200 hover:bg-gray-100 bg-white font-semibold"
                  >
                    <Copy className="w-3.5 h-3.5 mr-1.5" /> Sao chép nhanh
                  </Button>
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 whitespace-pre-wrap text-[15px] text-gray-700 shadow-inner">
                  {apartment.details || "Không có thông tin ghi chú."}
                </div>
              </div>
            ) : (
              <div className="prose prose-gray max-w-none text-[16px] leading-relaxed prose-headings:text-gray-900 prose-headings:font-semibold prose-headings:text-lg prose-p:text-gray-700 prose-strong:text-gray-900">
                {renderB2CContent()}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <main className="flex-1 bg-white min-h-screen font-body text-gray-800">
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

        <div className="container mx-auto px-6 mt-8 md:mt-12 mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-8">
              {/* BẮT ĐẦU BLOCK HEADER TỐI ƯU CSS (AIRBNB STYLE) */}
              <div className="border-b border-gray-200 pb-6 mb-8 mt-2">
                {/* HÀNG 1: TIÊU ĐỀ & NÚT CHIA SẺ */}
                <div className="flex justify-between items-start gap-4 mb-2">
                  {/* Đã xóa titleFont.className để trả về font mặc định */}
                  <h1 className="text-[26px] md:text-[28px] font-semibold text-[#222222] leading-[1.2] tracking-tight font-airbnb">
                    {isCollaborator
                      ? apartment.title
                      : apartment.aiContent?.seoTitle || apartment.title}
                  </h1>

                  {/* Giữ nguyên Nút Share của bạn */}
                  <div className="hidden md:flex shrink-0 mt-1">
                    <Button
                      variant="outline"
                      className="rounded-full border-gray-200 hover:bg-gray-350 hover:text-green-800 gap-2 font-bold text-gray-600 transition-all"
                      onClick={() => setShareOpen(true)}
                    >
                      <Share className="h-4 w-4" /> Chia sẻ
                    </Button>
                  </div>
                </div>

                {/* HÀNG 2: GIÁ - MÃ CĂN (TRÁI) & CẬP NHẬT (PHẢI) */}
                <div className="flex flex-wrap items-center justify-between gap-y-3 mt-4">
                  <div className="flex items-center flex-wrap gap-x-2 text-[15px] text-[#222222]">
                    <div className="flex items-baseline gap-1">
                      <span className="text-[30px] md:text-[24px] font-bold tracking-tight text-[#cda533]">
                        {typeof apartment.price === "number"
                          ? `₫${(apartment.price * 1000000).toLocaleString("vi-VN")}`
                          : formatPrice(apartment.price)}
                      </span>
                      <span className="text-gray-500 font-normal text-base">
                        /tháng
                      </span>
                    </div>

                    <span className="text-gray-300 font-bold mx-1">·</span>
                  </div>

                  {/* BÊN PHẢI: NGÀY CẬP NHẬT */}
                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      Cập nhật: <ClientFormattedDate date={displayDate} />
                    </span>
                  </div>
                </div>
              </div>
              {/* KẾT THÚC BLOCK HEADER */}

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

              {/* BẮT ĐẦU BLOCK TEXT PREVIEW + NÚT "HIỂN THỊ THÊM" */}
              <div className="pb-8 border-b border-gray-100 mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-semibold text-gray-900">
                    Thông tin chi tiết
                  </h3>
                  {/* Nút copy bên ngoài cho CTV/Admin */}
                  {isCollaborator && (
                    <Button
                      onClick={handleCopyInternalInfo}
                      variant="outline"
                      size="sm"
                      className="h-8 text-gray-700 border-gray-200 hover:bg-gray-100 bg-white font-semibold flex items-center gap-1.5"
                    >
                      <Copy className="h-3.5 w-3.5" /> Sao chép nhanh
                    </Button>
                  )}
                </div>

                {/* HIỂN THỊ CỘT HOA HỒNG (VÀ SĐT NẾU LÀ ADMIN) BÊN NGOÀI */}
                {isCollaborator && (
                  <div
                    className={cn(
                      "grid gap-4 mb-6",
                      isAdmin ? "grid-cols-2" : "grid-cols-1",
                    )}
                  >
                    <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl shadow-sm">
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                        Hoa hồng:
                      </div>
                      <div className="text-gray-900 font-bold text-lg">
                        {formatCommission(apartment.commission)}
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl shadow-sm">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                          SĐT Chủ nhà:
                        </div>
                        <div className="text-gray-900 font-bold text-lg">
                          {apartment.landlordPhoneNumber || "Chưa có"}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="relative">
                  {/* Tăng line-clamp lên 12 để hiển thị đủ dài */}
                  <div className="line-clamp-[12] text-gray-700 text-[16px] leading-[1.6]">
                    {isCollaborator ? (
                      <div className="whitespace-pre-wrap">
                        {apartment.details}
                      </div>
                    ) : (
                      <div className="prose prose-gray max-w-none">
                        {renderB2CContent()}
                      </div>
                    )}
                  </div>
                  {/* Gradient làm mờ đoạn cuối text */}
                  <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                </div>

                <button
                  onClick={() => setIsDescModalOpen(true)}
                  className="mt-4 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-xl transition-colors text-base flex items-center"
                >
                  Hiển thị thêm
                </button>
              </div>
              {/* KẾT THÚC BLOCK TEXT PREVIEW */}

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

            <div className="lg:col-span-4 relative">
              <div className="sticky top-28">
                <div className="rounded-[2.5rem] bg-white p-8 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-gray-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                  <div className="relative z-10 space-y-6">
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100/50">
                      <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                          {statusHeader}
                        </span>
                        <span
                          className={`flex items-center gap-2 ${statusTextColor} text-xs font-bold uppercase tracking-wide`}
                        >
                          <span className="relative flex h-2.5 w-2.5">
                            <span
                              className={`animate-ping absolute inline-flex h-full w-full rounded-full ${statusDotColor} opacity-40`}
                            ></span>
                            <span
                              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${statusDotColor}`}
                            ></span>
                          </span>
                          {statusLabel}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                          Hotline 24/7
                        </span>
                        <span className="font-mono text-xl font-bold text-gray-900 tracking-wide">
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
        {initialRelated.length > 0 && (
          <RelatedApartments related={initialRelated} />
        )}
      </main>
      {!lightboxOpen && <Footer />}
    </>
  );
}
