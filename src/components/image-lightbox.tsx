"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselApi,
} from "@/components/ui/carousel";
import Image from "next/image";
import { Download, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/context/auth-context";
import JSZip from "jszip";
import { Progress } from "@/components/ui/progress";

type ImageLightboxProps = {
  images: string[];
  selectedIndex: number;
  onClose: () => void;
  isOpen: boolean;
  apartmentCode?: string;
};

export default function ImageLightbox({
  images,
  selectedIndex,
  onClose,
  isOpen,
  apartmentCode,
}: ImageLightboxProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { userData } = useAuth();

  const canDownload =
    userData?.role === "admin" || userData?.role === "collaborator";

  const [api, setApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(selectedIndex);
  const [isDownloading, setIsDownloading] = useState(false);
  const mobileScrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isMobile) return;
    if (!api) return;
    setCurrentSlide(api.selectedScrollSnap());
    const onSelect = () => setCurrentSlide(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api, isMobile]);

  useEffect(() => {
    if (!isMobile && api && isOpen) {
      api.scrollTo(selectedIndex, true);
    }
  }, [api, isMobile, isOpen, selectedIndex]);

  useEffect(() => {
    if (!isMobile || !isOpen || !mobileScrollerRef.current) return;
    mobileScrollerRef.current.scrollTo({
      left: selectedIndex * mobileScrollerRef.current.clientWidth,
      behavior: "auto",
    });
    setCurrentSlide(selectedIndex);
  }, [isMobile, isOpen, selectedIndex]);

  const handleDownload = async () => {
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
          const fileName = `${prefix}-${i + 1}.webp`;

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-none w-screen h-screen p-0 m-0 bg-black border-none shadow-none block overflow-hidden [&>button]:hidden">
        <DialogTitle className="sr-only">Chi tiết hình ảnh</DialogTitle>

        {/* --- TOOLBAR --- */}
        <div className="absolute top-0 left-0 right-0 z-50 flex justify-between items-start px-4 pt-14 md:pt-4 pb-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
          <div className="pointer-events-auto text-white/90 text-sm font-medium px-3 py-1.5 bg-zinc-800/60 backdrop-blur-md border border-white/10 rounded-full mt-1">
            {currentSlide + 1} / {images.length}
          </div>

          <div className="flex gap-3 pointer-events-auto">
            {canDownload && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                disabled={isDownloading}
                className="text-white hover:bg-white/20 hover:text-white rounded-full h-11 w-11 transition-all active:scale-95 bg-black/30 backdrop-blur-sm"
              >
                {isDownloading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Download className="h-6 w-6" />
                )}
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20 hover:text-white rounded-full h-11 w-11 transition-all active:scale-95 bg-black/30 backdrop-blur-sm"
            >
              <X className="h-7 w-7" />
            </Button>
          </div>
        </div>

        {/* --- CAROUSEL --- */}
        <div className="w-full h-full">
          {isMobile ? (
            <div
              ref={mobileScrollerRef}
              className="h-full w-full flex overflow-x-auto snap-x snap-mandatory select-none touch-pan-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              onScroll={(event) => {
                const width = event.currentTarget.clientWidth;
                if (!width) return;
                const nextIndex = Math.round(
                  event.currentTarget.scrollLeft / width,
                );
                setCurrentSlide(nextIndex);
              }}
            >
              {images.map((url, index) => (
                <div
                  key={index}
                  className="h-full w-full shrink-0 snap-center flex items-center justify-center select-none touch-pan-x"
                >
                  <img
                    src={url}
                    alt={`Ảnh ${index + 1}`}
                    draggable={false}
                    // Thêm pointer-events-none và select-none
                    className="max-h-full max-w-full object-contain pointer-events-none select-none"
                    // Đổi WebkitTouchCallout thành "none"
                    style={{
                      WebkitTouchCallout: "none",
                      WebkitUserSelect: "none",
                    }}
                    // Chặn menu chuột phải / nhấn giữ Android
                    onContextMenu={(e) => e.preventDefault()}
                  />
                </div>
              ))}
            </div>
          ) : (
            <Carousel
              setApi={setApi}
              className="w-full h-full select-none touch-pan-y"
              opts={{ startIndex: selectedIndex, loop: true }}
            >
              <CarouselContent className="h-[100vh] -ml-0 select-none touch-pan-y">
                {images.map((url, index) => (
                  <CarouselItem key={index} className="h-full pl-0 relative">
                    <div className="w-full h-[100vh] flex items-center justify-center">
                      <div className="relative w-full h-full">
                        <Image
                          src={url}
                          alt={`Image ${index + 1}`}
                          fill
                          priority={index === selectedIndex}
                          // Thêm pointer-events-none và select-none
                          className="object-contain p-0 md:p-12 pointer-events-none select-none"
                          sizes="100vw"
                          quality={100}
                          draggable={false}
                          // Chặn menu chuột phải / nhấn giữ
                          onContextMenu={(e) => e.preventDefault()}
                          style={{
                            WebkitTouchCallout: "none",
                            WebkitUserSelect: "none",
                          }}
                        />
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>

              <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full border border-white/20 bg-black/50 text-white transition-all hidden md:flex items-center justify-center z-50 hover:bg-black/80" />
              <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full border border-white/20 bg-black/50 text-white transition-all hidden md:flex items-center justify-center z-50 hover:bg-black/80" />
            </Carousel>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
