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

    // 1. Toast khởi tạo (Đã ép chiều rộng tối thiểu min-w để thanh progress không bị cụt)
    const { id, update } = toast({
      title: "Đang chuẩn bị tải xuống...",
      description: (
        <div className="mt-3 w-full min-w-[280px] sm:min-w-[340px] flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-600">
            Đang nén {images.length} ảnh. Vui lòng chờ trong giây lát.
          </p>
          <Progress value={0} className="h-2 w-full bg-gray-100" />
        </div>
      ),
      duration: 100000,
      className:
        "bg-white text-gray-800 border border-[#cda533]/30 shadow-[0_20px_50px_rgba(205,165,51,0.15)] rounded-[1.5rem] px-6 py-4 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-90 data-[state=open]:duration-500",
    });

    try {
      const zip = new JSZip();
      let hasError = false;

      // 2. Vòng lặp tải ảnh ngầm (0% -> 50%)
      for (let i = 0; i < images.length; i++) {
        const imageUrl = images[i];
        const proxyUrl = `/api/download-image?url=${encodeURIComponent(imageUrl)}`;

        const fetchProgress = Math.round(((i + 1) / images.length) * 50);

        update({
          id,
          description: (
            <div className="mt-3 w-full min-w-[280px] sm:min-w-[340px] flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm font-medium text-gray-600">
                <span>
                  Đang tải tệp {i + 1}/{images.length}
                </span>
                <span className="text-[#cda533]">{fetchProgress}%</span>
              </div>
              <Progress
                value={fetchProgress}
                className="h-2 w-full bg-gray-100 [&>div]:bg-[#cda533]"
              />
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
          const fileName = `${prefix}-${i + 1}.jpg`;

          zip.file(fileName, blob);
        } catch (fetchError) {
          console.error(`Lỗi khi tải ảnh thứ ${i + 1}:`, fetchError);
          hasError = true;
        }
      }

      // 3. Quá trình nén ZIP (50% -> 100%)
      const zipBlob = await zip.generateAsync({ type: "blob" }, (metadata) => {
        const totalProgress = 50 + Math.round(metadata.percent / 2);
        update({
          id,
          description: (
            <div className="mt-3 w-full min-w-[280px] sm:min-w-[340px] flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm font-medium text-gray-600">
                <span>Đang nén dữ liệu...</span>
                <span className="text-[#cda533]">{totalProgress}%</span>
              </div>
              <Progress
                value={totalProgress}
                className="h-2 w-full bg-gray-100 [&>div]:bg-[#cda533]"
              />
            </div>
          ),
        });
      });

      const zipUrl = window.URL.createObjectURL(zipBlob);

      // 4. Kích hoạt tải file xuống máy
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

      // 5. Toast hoàn tất
      update({
        id,
        title: "Hoàn tất!",
        description: (
          <p className="mt-2 text-sm font-medium">
            {hasError
              ? "Đã nén xong, nhưng có vài ảnh bị lỗi."
              : "Toàn bộ ảnh đã được nén và tải về máy."}
          </p>
        ),
        duration: 3000,
        className:
          "bg-green-50 text-green-700 border border-green-300 shadow-[0_20px_50px_rgba(34,197,94,0.25)] rounded-[1.5rem] px-6 py-4",
      });
    } catch (error) {
      console.error("Quá trình tạo file ZIP thất bại:", error);
      update({
        id,
        title: "Lỗi hệ thống",
        description: (
          <p className="mt-2 text-sm font-medium">
            Đã xảy ra lỗi trong quá trình tạo file nén. Vui lòng thử lại.
          </p>
        ),
        duration: 3000,
        className:
          "bg-red-50 text-red-600 border border-red-100 rounded-[1.5rem] shadow-[0_20px_50px_rgba(239,68,68,0.1)] px-6 py-4",
      });
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
                    className="max-h-full max-w-full object-contain"
                    style={{ WebkitTouchCallout: "default" }}
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
                          className="object-contain p-0 md:p-12"
                          sizes="100vw"
                          quality={100}
                          draggable={false}
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
