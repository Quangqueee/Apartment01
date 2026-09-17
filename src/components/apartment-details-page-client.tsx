"use client";
import JSZip from "jszip";
import { Progress } from "@/components/ui/progress";
import ReactMarkdown from "react-markdown";
import { formatPrice } from "@/lib/utils";
import { ROOM_TYPES } from "@/lib/constants";
import BookingWidget from "@/components/booking-widget";
import {
  MapPin,
  Maximize,
  LayoutGrid,
  Heart,
  Hash,
  Share,
  Check,
  Link as LinkIcon,
  Clock,
  Sparkles,
  Star,
  Phone,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Copy,
  X,
  ArrowLeft,
  Download,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Apartment } from "@/lib/types";
import ClientFormattedDate from "@/components/client-formatted-date";
import { useAuth } from "@/context/auth-context";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getDisplaySourceCode } from "@/lib/source-code";
import Link from "next/link";
import Header from "@/components/header";
import Footer from "@/components/footer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { setApartmentFavorite } from "@/lib/favorites-client";
import ApartmentCard from "@/components/apartment-card";
import ApartmentImageGallery from "@/components/apartment-image-gallery";
import {
  copyFromElement,
  copyOrShareText,
  copyTextNow,
  ensureCopyField,
  getPageShareUrl,
  openMessengerWithLink,
  openZaloWithLink,
  prefersNativeShare,
  shareViaSystem,
  shouldUseSystemShare,
  type SharePayload,
} from "@/lib/web-share";

const MessengerSvgIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
  >
    <defs>
      <linearGradient
        id="messenger-grad"
        x1="12.0229"
        y1="23.3662"
        x2="11.9644"
        y2="2.57322"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#0068FF" />
        <stop offset="0.77" stopColor="#A033FF" />
        <stop offset="1" stopColor="#FF5280" />
      </linearGradient>
    </defs>
    <path
      fill="url(#messenger-grad)"
      d="M12 2C6.18 2 1.5 6.36 1.5 11.75C1.5 14.86 3.03 17.63 5.48 19.38V23C5.48 23.28 5.76 23.46 6.02 23.33L8.85 21.84C9.85 22.09 10.91 22.25 12 22.25C17.82 22.25 22.5 17.89 22.5 12.5C22.5 7.11 17.82 2 12 2ZM12.7 14.84L10.23 12.19L5.34 14.84L10.74 9.1L13.29 11.77L18.11 9.12L12.7 14.84Z"
    />
  </svg>
);

const ZaloSvgIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    className={className}
  >
    <path
      fill="#2962ff"
      d="M15,36V6.827l-1.211-0.811C8.64,8.083,5,13.112,5,19v10c0,7.732,6.268,14,14,14h10  c4.722,0,8.883-2.348,11.417-5.931V36H15z"
    ></path>
    <path
      fill="#eee"
      d="M29,5H19c-1.845,0-3.601,0.366-5.214,1.014C10.453,9.25,8,14.528,8,19  c0,6.771,0.936,10.735,3.712,14.607c0.216,0.301,0.357,0.653,0.376,1.022c0.043,0.835-0.129,2.365-1.634,3.742  c-0.162,0.148-0.059,0.419,0.16,0.428c0.942,0.041,2.843-0.014,4.797-0.877c0.557-0.246,1.191-0.203,1.729,0.083  C20.453,39.764,24.333,40,28,40c4.676,0,9.339-1.04,12.417-2.916C42.038,34.799,43,32.014,43,29V19C43,11.268,36.732,5,29,5z"
    ></path>
    <path
      fill="#2962ff"
      d="M36.75,27C34.683,27,33,25.317,33,23.25s1.683-3.75,3.75-3.75s3.75,1.683,3.75,3.75 S38.817,27,36.75,27z M36.75,21c-1.24,0-2.25,1.01-2.25,2.25s1.01,2.25,2.25,2.25S39,24.49,39,23.25S37.99,21,36.75,21z"
    ></path>
    <path
      fill="#2962ff"
      d="M31.5,27h-1c-0.276,0-0.5-0.224-0.5-0.5V18h1.5V27z"
    ></path>
    <path
      fill="#2962ff"
      d="M27,19.75v0.519c-0.629-0.476-1.403-0.769-2.25-0.769c-2.067,0-3.75,1.683-3.75,3.75  S22.683,27,24.75,27c0.847,0,1.621-0.293,2.25-0.769V26.5c0,0.276,0.224,0.5,0.5,0.5h1v-7.25H27z M24.75,25.5 c-1.24,0-2.25-1.01-2.25-2.25S23.51,21,24.75,21S27,22.01,27,23.25S25.99,25.5,24.75,25.5z"
    ></path>
    <path
      fill="#2962ff"
      d="M21.25,18h-8v1.5h5.321L13,26h0.026c-0.163,0.211-0.276,0.463-0.276,0.75V27h7.5  c0.276,0,0.5-0.224,0.5-0.5v-1h-5.321L21,19h-0.026c0.163-0.211,0.276-0.463,0.276-0.75V18z"
    ></path>
  </svg>
);

const getRoomTypeLabel = (value: string) => {
  const roomType = ROOM_TYPES.find((rt) => rt.value === value);
  return roomType ? roomType.label : value;
};

function ShareModal({
  isOpen,
  onClose,
  payload,
}: {
  isOpen: boolean;
  onClose: () => void;
  payload: SharePayload;
}) {
  const [copied, setCopied] = useState(false);
  const copyFieldRef = useRef<HTMLTextAreaElement>(null);
  const actionLockRef = useRef(false);
  const { toast } = useToast();

  const runShareAction = (action: () => void) => {
    if (actionLockRef.current) return;
    actionLockRef.current = true;
    action();
    window.setTimeout(() => {
      actionLockRef.current = false;
    }, 700);
  };

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
      return;
    }
    ensureCopyField();
  }, [isOpen]);

  const shareUrl = () => payload.url || getPageShareUrl();

  const copyLinkNow = (url: string) =>
    copyFromElement(copyFieldRef.current, url) || copyTextNow(url);

  const handleCopyLink = () => {
    runShareAction(() => {
      void (async () => {
        const url = shareUrl();
        const result = await copyOrShareText(url, {
          title: payload.title,
          url,
        });

        if (result === "copied") {
          setCopied(true);
          toast({
            title: "Đã sao chép liên kết!",
            className: "bg-black text-white border-none",
          });
          setTimeout(() => setCopied(false), 2000);
          return;
        }

        if (result === "shared" || result === "cancelled") {
          onClose();
          return;
        }

        toast({
          variant: "destructive",
          title: "Không sao chép được",
          description: "Hãy chọn Zalo hoặc Messenger trong danh sách chia sẻ.",
        });
      })();
    });
  };

  const handleMessengerShare = () => {
    runShareAction(() => {
      const url = shareUrl();
      copyLinkNow(url);
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        void navigator.clipboard.writeText(url);
      }
      openMessengerWithLink(url);

      toast({
        title: "Đã sao chép link!",
        description: "Đang mở Messenger để bạn dán gửi bạn bè.",
        className: "bg-purple-50 text-purple-900 border-purple-200",
      });
    });
  };

  const handleZaloShare = () => {
    runShareAction(() => {
      const url = shareUrl();
      if (!prefersNativeShare()) {
        copyLinkNow(url);
      }
      openZaloWithLink(url);

      toast({
        title: "Đang mở Zalo",
        description: "Nếu không tự điền, dán link từ Chia sẻ → Copy.",
        className: "bg-blue-50 text-blue-900 border-blue-100",
      });
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          // 🚀 FIX LỖI GÓC CẠNH: Thêm overflow-hidden để ép toàn bộ nội dung con không bị tràn ra ngoài khung bo góc tròn
          "p-0 border-none shadow-2xl z-[100] gap-0 bg-white flex flex-col overflow-hidden [&>button.absolute]:hidden",

          // Đảm bảo cả hai chế độ màn hình đều được bo tròn toàn bộ 4 góc hoặc khớp chuẩn Bottom Sheet di động
          "sm:max-w-[400px] sm:rounded-[2rem]",
          "dialog-sheet-mobile max-sm:w-full max-sm:rounded-t-[2rem] max-sm:rounded-b-none max-sm:pb-[var(--safe-bottom)]",
          "max-sm:data-[state=open]:animate-in max-sm:data-[state=closed]:animate-out",
          "max-sm:data-[state=open]:slide-in-from-bottom-full max-sm:data-[state=closed]:slide-out-to-bottom-full",
          "max-sm:duration-300 max-sm:ease-out",
        )}
      >
        <DialogHeader className="px-6 py-5 border-b border-gray-100 flex flex-row items-center justify-between sticky top-0 bg-white z-10 shrink-0 text-left">
          <DialogTitle className="font-headline text-[18px] font-bold text-gray-900 m-0 !mt-0 leading-none">
            Chia sẻ căn hộ này
          </DialogTitle>
          <button
            onClick={onClose}
            className="p-1.5 -mr-1.5 rounded-full hover:bg-gray-100 transition-colors focus:outline-none"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </DialogHeader>

        {/* 🚀 FIX LỖI NỀN XÁM ĐÁY: Bo tròn nhẹ phần đáy hoặc đồng bộ màu nền container */}
        <div className="relative flex flex-col gap-3 p-5 bg-white rounded-b-[2rem]">
          <textarea
            ref={copyFieldRef}
            aria-hidden="true"
            tabIndex={-1}
            readOnly
            inputMode="none"
            autoComplete="off"
            className="pointer-events-none absolute left-0 top-0 h-px w-px caret-transparent opacity-[0.01]"
            style={{ fontSize: 16 }}
          />
          <button
            type="button"
            onClick={handleCopyLink}
            aria-label="Sao chép liên kết căn hộ"
            className="flex items-center gap-4 p-3.5 rounded-[1.25rem] bg-white border border-gray-100 shadow-[0_2px_15px_rgba(0,0,0,0.03)] hover:border-gray-300 transition-all group"
          >
            <div
              className={cn(
                "p-2.5 rounded-full text-white transition-colors",
                copied ? "bg-green-500" : "bg-gray-400 group-hover:bg-gray-600",
              )}
            >
              {copied ? (
                <Check className="h-5 w-5" />
              ) : (
                <LinkIcon className="h-5 w-5" />
              )}
            </div>
            <div className="text-left min-w-0">
              <p className="font-bold text-gray-900 text-[15px] mb-0.5">
                Sao chép liên kết
              </p>
              <p className="text-[13px] text-gray-500 leading-snug">
                Copy link
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={handleMessengerShare}
            aria-label="Chia sẻ qua Facebook Messenger"
            className="flex items-center gap-4 p-3.5 rounded-[1.25rem] bg-white border border-purple-100 shadow-[0_2px_15px_rgba(160,51,255,0.06)] hover:border-purple-300 transition-all"
          >
            <div className="p-1 rounded-full bg-white text-white shrink-0">
              <MessengerSvgIcon className="h-[40px] w-[40px]" />
            </div>
            <div className="text-left">
              <p className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#0068FF] to-[#FF5280] text-[15px] mb-0.5">
                Messenger
              </p>
              <p className="text-[13px] text-gray-500 leading-snug">
                Gửi tin nhắn riêng tư
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={handleZaloShare}
            aria-label="Chia sẻ qua Zalo"
            className="flex items-center gap-4 p-3.5 rounded-[1.25rem] bg-white border border-[#0068FF]/20 shadow-[0_2px_15px_rgba(0,104,255,0.05)] hover:border-[#0068FF]/40 transition-all"
          >
            <div className="p-1 rounded-full bg-white text-white">
              <ZaloSvgIcon className="h-[40px] w-[40px]" />
            </div>
            <div className="text-left">
              <p className="font-bold text-[#0068FF] text-[15px] mb-0.5">
                Zalo
              </p>
              <p className="text-[13px] text-[#0068FF]/70 leading-snug">
                Sao chép & mở Zalo
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
    <div className="flex gap-3 md:gap-5 items-start">
      <div className="shrink-0 size-7 md:size-auto md:p-3 md:rounded-xl md:bg-primary/5 md:text-primary">
        <Icon className="h-7 w-7 md:h-6 md:w-6 text-[#222222] md:text-primary" />
      </div>
      <div className="min-w-0">
        <h4 className="font-semibold md:font-bold text-[#222222] text-[15px] md:text-base mb-0 md:mb-1 leading-5">
          {title}
        </h4>
        <p className="text-[#757575] md:text-gray-500 text-[13px] md:text-sm leading-5 md:leading-relaxed">
          {desc}
        </p>
      </div>
    </div>
  );
}

function HighlightCard({
  icon: Icon,
  label,
}: {
  icon: any;
  label: string;
}) {
  return (
    <div className="flex-1 min-w-0 self-stretch flex flex-col justify-between gap-2 border border-[#e2e2e2] rounded-2xl p-3">
      <Icon className="h-7 w-7 text-[#222222] shrink-0" />
      <p className="font-semibold text-[12px] leading-4 tracking-[0.04px] text-[#222222] break-words">
        {label}
      </p>
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
    <div className="py-8 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="rounded-[2.5rem] bg-gray-50/65 p-6 md:p-10 border border-gray-100/80 shadow-sm relative">
          <div className="flex items-center justify-between mb-4 md:mb-8">
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
          <div className="md:hidden text-center text-xs font-medium text-gray-400 flex items-center justify-center gap-3 mb-3">
            <span className="opacity-60 text-base">←</span>
            <span>Vuốt ngang để xem thêm</span>
            <span className="opacity-60 text-base">→</span>
          </div>
          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex w-full gap-6 overflow-x-auto snap-x snap-mandatory py-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] [touch-action:pan-x_pan-y]"
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

export default function ApartmentDetailsPageClient({
  initialApartment,
  initialRelated,
}: {
  initialApartment: Apartment;
  initialRelated: Apartment[];
}) {
  const { user, userData, favoriteIds, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const apartment = initialApartment;
  const apartmentId = initialApartment.id;

  const [isFavorited, setIsFavorited] = useState(false);
  const [isFavLoading, setIsFavLoading] = useState(false);

  const [shareOpen, setShareOpen] = useState(false);
  const [isGalleryLightboxOpen, setIsGalleryLightboxOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDescModalOpen, setIsDescModalOpen] = useState(false);
  const descRef = useRef<HTMLDivElement>(null);
  const infoCopyRef = useRef<HTMLTextAreaElement>(null);
  const infoCopyLockRef = useRef(false);
  const [descOverflows, setDescOverflows] = useState(false);

  useEffect(() => {
    ensureCopyField();
  }, []);

  const sharePayload: SharePayload = {
    title: apartment.title,
    text: `${apartment.title} — ${formatPrice(apartment.price)}`,
    url: "",
  };

  const handleOpenShare = async () => {
    const payload: SharePayload = {
      ...sharePayload,
      url: getPageShareUrl(),
    };

    if (shouldUseSystemShare()) {
      const result = await shareViaSystem(payload);
      if (result === "shared" || result === "cancelled") return;
    }

    setShareOpen(true);
  };

  const isAdmin = userData?.role === "admin";
  const isCollaborator = userData?.role === "collaborator" || isAdmin;
  const displaySourceCode = getDisplaySourceCode(
    apartment.sourceCode,
    userData?.role,
  );

  const handleDownloadImages = async () => {
    const images = apartment.imageUrls;
    const apartmentCode = apartment.sourceCode;

    if (!images || images.length === 0) return;

    setIsDownloading(true);

    const { id, update, dismiss } = toast({
      title: "Đang chuẩn bị tải xuống...",
      duration: 100000,
      className:
        "w-full [&>div]:flex-1 bg-white text-gray-800 border border-[#cda533]/30 shadow-[0_20px_50px_rgba(205,165,51,0.15)] rounded-[1.5rem] px-6 py-4 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-90 data-[state=open]:duration-500",
      description: (
        <div className="mt-3 w-full flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs font-medium text-gray-500">
              <span>Đang lấy dữ liệu (0/{images.length})</span>
              <span>0%</span>
            </div>
            <Progress value={0} className="h-1.5 w-full bg-gray-100" />
          </div>
          <div className="flex flex-col gap-1.5 opacity-50">
            <div className="flex justify-between items-center text-xs font-medium text-gray-400">
              <span>Đang chờ nén tệp...</span>
              <span>0%</span>
            </div>
            <Progress value={0} className="h-1.5 w-full bg-gray-100" />
          </div>
        </div>
      ),
    });

    try {
      const zip = new JSZip();
      let hasError = false;

      for (let i = 0; i < images.length; i++) {
        const imageUrl = images[i];
        const proxyUrl = `/api/download-image?url=${encodeURIComponent(imageUrl)}`;

        const downloadPercent = Math.round(((i + 1) / images.length) * 100);

        update({
          id,
          title: "Đang tải ảnh xuống...",
          className: "w-full [&>div]:flex-1",
          description: (
            <div className="mt-3 w-full flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs font-medium text-gray-600">
                  <span>
                    Tải ảnh ({i + 1}/{images.length})
                  </span>
                  <span className="text-[#cda533]">{downloadPercent}%</span>
                </div>
                <Progress
                  value={downloadPercent}
                  className="h-1.5 w-full bg-gray-100 [&>div]:bg-[#cda533]"
                />
              </div>
              <div className="flex flex-col gap-1.5 opacity-50">
                <div className="flex justify-between items-center text-xs font-medium text-gray-400">
                  <span>Đang chờ nén tệp...</span>
                  <span>0%</span>
                </div>
                <Progress value={0} className="h-1.5 w-full bg-gray-100" />
              </div>
            </div>
          ),
        });

        try {
          const response = await fetch(proxyUrl);
          if (!response.ok) {
            hasError = true;
            continue;
          }

          const blob = await response.blob();
          const prefix = apartmentCode || "can-ho";
          const fileName = `${prefix}-${i + 1}.jpeg`;

          zip.file(fileName, blob);
        } catch (fetchError) {
          console.error(`Lỗi khi tải ảnh thứ ${i + 1}:`, fetchError);
          hasError = true;
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" }, (metadata) => {
        const compressPercent = Math.round(metadata.percent);

        update({
          id,
          title: "Đang xử lý file nén...",
          className: "w-full [&>div]:flex-1",
          description: (
            <div className="mt-3 w-full flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs font-medium text-gray-600">
                  <span>Tải ảnh (Hoàn tất)</span>
                  <span className="text-green-600">100%</span>
                </div>
                <Progress
                  value={100}
                  className="h-1.5 w-full bg-gray-100 [&>div]:bg-green-500"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs font-medium text-gray-600">
                  <span>Đang nén tệp ZIP</span>
                  <span className="text-[#cda533]">{compressPercent}%</span>
                </div>
                <Progress
                  value={compressPercent}
                  className="h-1.5 w-full bg-gray-100 [&>div]:bg-[#cda533]"
                />
              </div>
            </div>
          ),
        });
      });

      const zipUrl = window.URL.createObjectURL(zipBlob);

      const link = document.createElement("a");
      link.href = zipUrl;
      const dateString = new Date().toISOString().split("T")[0];
      const prefix = apartmentCode || "chung";

      link.setAttribute("download", `anh-can-ho-${prefix}-${dateString}.zip`);
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(zipUrl);
      }, 150);

      let countdown = 3;

      const renderSuccessToast = (timeLeft: number) => {
        update({
          id,
          title: "Hoàn tất!",
          description: (
            <div className="mt-2 flex flex-col gap-1.5">
              <p className="text-sm font-medium">
                {hasError
                  ? "Đã nén xong, nhưng có vài ảnh bị lỗi."
                  : "Toàn bộ ảnh đã được nén và tải về máy."}
              </p>
              <p className="text-xs text-green-700/60 text-right italic animate-pulse">
                Tự động đóng sau {timeLeft}s...
              </p>
            </div>
          ),
          className:
            "w-full [&>div]:flex-1 bg-green-50 text-green-700 border border-green-300 shadow-[0_20px_50px_rgba(34,197,94,0.25)] rounded-[1.5rem] px-6 py-4",
        });
      };

      renderSuccessToast(countdown);

      const interval = setInterval(() => {
        countdown -= 1;
        if (countdown <= 0) {
          clearInterval(interval);
          dismiss();
        } else {
          renderSuccessToast(countdown);
        }
      }, 1000);
    } catch (error) {
      let errCountdown = 3;

      const renderErrorToast = (timeLeft: number) => {
        update({
          id,
          title: "Lỗi hệ thống",
          description: (
            <div className="mt-2 flex flex-col gap-1.5">
              <p className="text-sm font-medium">
                Đã xảy ra lỗi trong quá trình tạo file nén. Vui lòng thử lại.
              </p>
              <p className="text-xs text-red-600/60 text-right italic animate-pulse">
                Tự động đóng sau {timeLeft}s...
              </p>
            </div>
          ),
          className:
            "w-full [&>div]:flex-1 bg-red-50 text-red-600 border border-red-100 rounded-[1.5rem] shadow-[0_20px_50px_rgba(239,68,68,0.1)] px-6 py-4",
        });
      };

      renderErrorToast(errCountdown);

      const errInterval = setInterval(() => {
        errCountdown -= 1;
        if (errCountdown <= 0) {
          clearInterval(errInterval);
          dismiss();
        } else {
          renderErrorToast(errCountdown);
        }
      }, 1000);
    } finally {
      setIsDownloading(false);
    }
  };

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
    setIsFavorited(favoriteIds.includes(apartmentId));
  }, [user, favoriteIds, apartmentId]);

  useLayoutEffect(() => {
    if (authLoading || isCollaborator) {
      setDescOverflows(false);
      return;
    }

    const el = descRef.current;
    if (!el) return;

    const checkOverflow = () => {
      const node = descRef.current;
      if (!node) return;
      const inner = node.firstElementChild as HTMLElement | null;
      const clampedOverflow = node.scrollHeight > node.clientHeight + 1;
      const innerOverflow = inner
        ? inner.scrollHeight > node.clientHeight + 1
        : false;
      setDescOverflows(clampedOverflow || innerOverflow);
    };

    checkOverflow();
    const observer = new ResizeObserver(checkOverflow);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => observer.disconnect();
  }, [
    authLoading,
    isCollaborator,
    apartmentId,
    apartment.details,
    apartment.aiContent?.description,
    apartment.aiContent?.highlights,
  ]);

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
    setApartmentFavorite(user, apartmentId, nextIsFavorited)
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

  const handleCopyInternalInfo = async () => {
    if (infoCopyLockRef.current) return;
    infoCopyLockRef.current = true;
    window.setTimeout(() => {
      infoCopyLockRef.current = false;
    }, 700);

    let copyText = "";

    if (isAdmin) {
      copyText = `📍 Mã căn: ${displaySourceCode}\n`;
      copyText += `💰 Giá: ${formatPrice(apartment.price)}/tháng\n`;
      copyText += `🤝 Hoa hồng: ${formatCommission(apartment.commission)}\n`;
      copyText += `📞 SĐT Chủ nhà: ${apartment.landlordPhoneNumber || "Chưa có"}\n`;
      copyText += `\n--- THÔNG TIN CHUNG ---\n${apartment.details || "Chưa có thông tin chi tiết."}`;
    } else {
      copyText = `📍 Mã căn: ${displaySourceCode}\n`;
      copyText += `\n--- THÔNG TIN CHUNG ---\n${apartment.details || "Chưa có thông tin chi tiết."}`;
    }

    if (
      !prefersNativeShare() &&
      (copyFromElement(infoCopyRef.current, copyText) || copyTextNow(copyText))
    ) {
      toast({
        title: "Đã copy thông tin!",
        className: "bg-white text-green-900 border-none",
      });
      return;
    }

    const result = await copyOrShareText(copyText, {
      title: `Thông tin ${displaySourceCode}`,
    });

    if (result === "copied") {
      toast({
        title: "Đã copy thông tin!",
        className: "bg-white text-green-900 border-none",
      });
      return;
    }

    if (result === "shared" || result === "cancelled") return;

    toast({
      variant: "destructive",
      title: "Không sao chép được",
      description: "Hãy chọn Copy trong bảng chia sẻ của iPhone.",
    });
  };

  const isRented = apartment.status === "rented";
  const formattedPrice =
    typeof apartment.price === "number"
      ? `₫${(apartment.price * 1000000).toLocaleString("vi-VN")}`
      : formatPrice(apartment.price);
  const displayDate = apartment.updatedAt?.seconds
    ? apartment.updatedAt
    : apartment.createdAt;
  const dateInMs = displayDate?.seconds
    ? displayDate.seconds * 1000
    : Date.now();
  const daysPassed = Math.floor(
    (Date.now() - dateInMs) / (1000 * 60 * 60 * 24),
  );
  const isOldListing = daysPassed >= 10;

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

  // ✅ Đã bọc ReactMarkdown bằng div và đọc chuẩn aiContent.description
  const renderB2CContent = () => {
    const ai = apartment.aiContent;

    if (!ai || !ai.description) {
      return (
        <div className="whitespace-pre-wrap text-[16px] text-gray-700 leading-relaxed">
          {apartment.details || "Thông tin đang được cập nhật..."}
        </div>
      );
    }

    return (
      <div className="prose prose-gray max-w-none text-gray-700">
        <ReactMarkdown>
          {ai.description +
            (ai.highlights && ai.highlights.length > 0
              ? "\n\n**Điểm nổi bật:**\n" +
                ai.highlights.map((h: string) => `- ${h}`).join("\n")
              : "")}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <>
      {!isGalleryLightboxOpen && <Header />}

      <textarea
        ref={infoCopyRef}
        aria-hidden="true"
        tabIndex={-1}
        readOnly
        inputMode="none"
        autoComplete="off"
        className="pointer-events-none fixed left-0 top-0 h-px w-px caret-transparent opacity-[0.01]"
        style={{ fontSize: 16 }}
      />

      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        payload={sharePayload}
      />

      <Dialog open={isDescModalOpen} onOpenChange={setIsDescModalOpen}>
        <DialogContent
          className={cn(
            "p-0 border-none shadow-2xl z-[100] gap-0 bg-white flex flex-col [&>button.absolute]:hidden",
            "sm:max-w-[780px] sm:max-h-[85vh] sm:rounded-2xl overflow-hidden",
            "dialog-fullscreen-mobile",
            "max-sm:data-[state=open]:animate-in max-sm:data-[state=closed]:animate-out",
            "max-sm:data-[state=open]:slide-in-from-bottom-full max-sm:data-[state=closed]:slide-out-to-bottom-full",
            "max-sm:duration-350 max-sm:ease-out",
          )}
        >
          <DialogHeader className="pwa-safe-header px-5 py-4 sm:px-6 sm:py-5 border-b border-gray-100 flex flex-row items-center gap-4 sticky top-0 bg-white z-10 shrink-0 text-left">
            <button
              type="button"
              aria-label="Trở về"
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

          <div className="px-6 py-6 overflow-y-auto flex-1 pwa-safe-footer">
            {isCollaborator ? (
              <div className="bg-white rounded-2xl mb-6">
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
                        {displaySourceCode}
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

      <main className="flex-1 bg-white min-h-screen font-body text-[#222222] overflow-x-clip">
        <div className="pt-0 md:pt-6">
          <div className="container mx-auto px-0 md:px-6">
            <ApartmentImageGallery
              imageUrls={apartment.imageUrls}
              apartmentCode={apartment.sourceCode}
              onLightboxChange={setIsGalleryLightboxOpen}
            >
              {isCollaborator && (
                <div className="md:hidden absolute top-4 left-4 z-10 flex items-center gap-2">
                  <button
                    onClick={handleDownloadImages}
                    disabled={isDownloading}
                    className="h-10 w-10 bg-white/90 backdrop-blur-md rounded-full shadow-sm active:scale-95 transition-all flex items-center justify-center"
                  >
                    {isDownloading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-gray-700" />
                    ) : (
                      <Download className="h-5 w-5 text-gray-700" />
                    )}
                  </button>
                </div>
              )}

              <div className="md:hidden absolute top-4 right-4 z-10 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenShare}
                  className="h-10 w-10 bg-white/90 backdrop-blur-md rounded-full shadow-sm active:scale-95 transition-all flex items-center justify-center"
                >
                  <Share className="h-5 w-5 text-gray-700" />
                </button>
                <button
                  onClick={handleFavoriteToggle}
                  disabled={isFavLoading}
                  className="h-10 w-10 bg-white/90 backdrop-blur-md rounded-full shadow-sm active:scale-95 transition-all flex items-center justify-center"
                >
                  <Heart
                    className={cn(
                      "h-5 w-5 transition-colors",
                      isFavorited
                        ? "fill-red-500 text-red-500"
                        : "text-gray-700",
                    )}
                  />
                </button>
              </div>
            </ApartmentImageGallery>
          </div>
        </div>

        <div className="container mx-auto px-6 mt-0 md:mt-12 mb-6 lg:mb-16 pb-20 lg:pb-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-12">
            <div className="lg:col-span-8">
              <div className="pt-4 pb-3 md:py-0 md:border-b md:border-gray-200 md:pb-6 md:mb-8 md:mt-2">
                <div className="flex justify-between items-start gap-4 mb-2">
                  <h1 className="text-[24px] md:text-[28px] font-semibold text-[#222222] leading-[30px] md:leading-[1.2] tracking-[-0.1px] font-airbnb">
                    {isCollaborator
                      ? apartment.title
                      : apartment.aiContent?.seoTitle || apartment.title}
                  </h1>

                  <div className="hidden md:flex shrink-0 mt-1 gap-2 items-center">
                    {isCollaborator && (
                      <Button
                        variant="outline"
                        className="rounded-full border-gray-200 hover:bg-gray-100 hover:text-[#cda533] gap-2 font-bold text-gray-600 transition-all h-10 px-4"
                        onClick={handleDownloadImages}
                        disabled={isDownloading}
                      >
                        {isDownloading ? (
                          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                        ) : (
                          <Download className="h-4 w-4 shrink-0" />
                        )}
                        Tải ảnh
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      className="rounded-full border-gray-200 hover:bg-gray-100 hover:text-green-800 gap-2 font-bold text-gray-600 transition-all h-10 px-4"
                      onClick={handleOpenShare}
                    >
                      <Share className="h-4 w-4 shrink-0" /> Chia sẻ
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] leading-5 text-[#222222]">
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-4 w-4 fill-[#222222] text-[#222222]" />
                    <span className={cn("font-normal", statusTextColor)}>
                      {statusLabel}
                    </span>
                  </span>
                  <span>·</span>
                  <span className="font-semibold underline underline-offset-2">
                    {displaySourceCode}
                  </span>
                  <span>·</span>
                  <span>
                    {apartment.district}
                    {apartment.district ? ", Hà Nội" : "Hà Nội"}
                  </span>
                </div>

                <div className="flex flex-col gap-2 mt-3 md:mt-4">
                  <div className="hidden md:flex items-baseline gap-1">
                    <span className="text-[24px] font-bold tracking-tight text-[#cda533]">
                      {formattedPrice}
                    </span>
                    <span className="text-gray-500 font-normal text-[16px]">
                      /tháng
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[13px] md:text-xs font-medium text-[#757575] md:text-gray-500 md:bg-gray-50 md:px-3 md:py-1.5 md:rounded-full md:border md:border-gray-100 md:w-fit">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      Ngày đăng: <ClientFormattedDate date={displayDate} />
                    </span>
                  </div>
                </div>
              </div>

              <div className="h-px w-full bg-[#e2e2e2] md:hidden" />

              <div className="py-4 md:py-0 md:border-b md:border-gray-100 md:pb-8 md:mb-8">
                <p className="font-semibold text-[18px] md:text-[20px] leading-6 md:leading-7 tracking-[-0.08px] text-[#222222] mb-3">
                  {getRoomTypeLabel(apartment.roomType)} tại{" "}
                  {apartment.district || "Hà Nội"}
                </p>

                <div className="flex gap-[11px] md:hidden">
                  <HighlightCard
                    icon={Maximize}
                    label={`${apartment.area} m²`}
                  />
                  <HighlightCard
                    icon={LayoutGrid}
                    label={getRoomTypeLabel(apartment.roomType)}
                  />
                  <HighlightCard icon={Hash} label={displaySourceCode} />
                </div>

                <div className="hidden md:grid grid-cols-4 gap-4">
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
                    value={displaySourceCode}
                  />
                </div>
              </div>

              <div className="h-px w-full bg-[#e2e2e2] md:hidden" />

              <div className="py-4 md:py-0 md:pb-8 md:border-b md:border-gray-100 md:mb-8">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-[18px] md:text-2xl font-semibold text-[#222222] leading-6 md:leading-7 tracking-[-0.08px] md:tracking-normal font-airbnb">
                    {isCollaborator
                      ? "Thông tin chi tiết"
                      : "Giới thiệu về chỗ ở này"}
                  </h3>
                  {isCollaborator && (
                    <Button
                      onClick={handleCopyInternalInfo}
                      variant="outline"
                      size="sm"
                      className="h-8 text-gray-700 border-gray-200 hover:bg-gray-100 bg-white font-semibold flex items-center gap-1.5"
                    >
                      <Copy className="h-3.5 w-3.5" /> Sao chép
                    </Button>
                  )}
                </div>

                {isCollaborator && (
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className=" bg-gray-50 border border-gray-100 p-3 rounded-xl shadow-sm">
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                        Hoa hồng:
                      </div>
                      <div className="text-gray-900 font-bold text-lg">
                        {formatCommission(apartment.commission)}
                      </div>
                    </div>

                    {isAdmin ? (
                      <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl shadow-sm">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                          SĐT Chủ nhà:
                        </div>
                        <div className="text-gray-900 font-bold text-lg">
                          {apartment.landlordPhoneNumber || "Chưa có"}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl shadow-sm">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                          Mã căn:
                        </div>
                        <div className="text-gray-900 font-bold text-lg">
                          {displaySourceCode}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="relative">
                  <div
                    ref={descRef}
                    className={cn(
                      "text-[#222222] md:text-gray-700 text-[16px] leading-6 md:leading-[1.6]",
                      isCollaborator
                        ? "whitespace-pre-wrap"
                        : "line-clamp-3 max-h-[4.5rem] md:max-h-[4.8rem] [&_p]:my-0 [&_ul]:my-0 [&_ol]:my-0",
                    )}
                  >
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

                  {!isCollaborator && descOverflows && (
                    <div className="absolute bottom-0 left-0 w-full h-6 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                  )}
                </div>

                {!isCollaborator && descOverflows && (
                  <button
                    onClick={() => setIsDescModalOpen(true)}
                    className="mt-2 inline-flex items-center gap-1 text-[16px] font-semibold text-[#222222] underline underline-offset-2 md:no-underline md:mt-3 md:px-6 md:py-3 md:bg-gray-100 md:hover:bg-gray-200 md:rounded-xl md:transition-colors"
                  >
                    Hiển thị thêm
                    <ChevronRight className="h-5 w-5 md:hidden" />
                  </button>
                )}
              </div>

              <div className="h-px w-full bg-[#e2e2e2] md:hidden" />

              <div className="py-4 space-y-3 md:hidden">
                <FeatureRow
                  icon={Star}
                  title={statusHeader}
                  desc={statusLabel}
                />
                <FeatureRow
                  icon={Phone}
                  title="Hotline 24/7"
                  desc="081.2442.111"
                />
                <FeatureRow
                  icon={Sparkles}
                  title="Thông tin minh bạch"
                  desc="Hình ảnh thực tế, giá niêm yết rõ ràng, không thu phí trung gian."
                />
              </div>

              <div className="hidden md:block pb-8 space-y-6">
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
              <BookingWidget
                apartment={apartment}
                isFavorited={isFavorited}
                onFavoriteToggle={handleFavoriteToggle}
                isFavLoading={isFavLoading}
                statusHeader={statusHeader}
                statusLabel={statusLabel}
                statusTextColor={statusTextColor}
                statusDotColor={statusDotColor}
                hideMobileBar={isGalleryLightboxOpen}
              />
            </div>
          </div>
        </div>
        {initialRelated.length > 0 && (
          <RelatedApartments related={initialRelated} />
        )}
      </main>
      {!isGalleryLightboxOpen && <Footer />}
    </>
  );
}
