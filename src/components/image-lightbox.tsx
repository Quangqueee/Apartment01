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
import { Download, Loader2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";

type ImageLightboxProps = {
  images: string[];
  selectedIndex: number;
  onClose: () => void;
  isOpen: boolean;
};

export default function ImageLightbox({
  images,
  selectedIndex,
  onClose,
  isOpen,
}: ImageLightboxProps) {
  const { toast } = useToast();
  const [api, setApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(selectedIndex);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!api) return;
    setCurrentSlide(api.selectedScrollSnap());
    const onSelect = () => setCurrentSlide(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  useEffect(() => {
    if (api && isOpen) {
      api.scrollTo(selectedIndex, true);
    }
  }, [api, isOpen, selectedIndex]);

  const handleDownload = async () => {
    if (!images || images.length === 0) return;

    // Phát hiện thiết bị mobile (touch screen hoặc màn nhỏ)
    const isMobile =
      typeof window !== "undefined" &&
      (window.innerWidth < 768 || navigator.maxTouchPoints > 1);

    setIsDownloading(true);

    // Hàm tải một ảnh duy nhất
    const downloadSingleImage = async (imageUrl: string, idx: number) => {
      try {
        const proxyUrl = `/api/download-image?url=${encodeURIComponent(imageUrl)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) return;
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        const fileName =
          imageUrl.split("/").pop()?.split("?")[0] || `image-${idx + 1}.jpg`;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // Trì hoãn ngắn để trình duyệt xử lý xong trước khi revoke
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
      } catch (err) {
        console.error(`Lỗi tải ảnh ${idx + 1}:`, err);
      }
    };

    try {
      if (isMobile) {
        // Mobile: Chỉ tải ảnh đang xem (trình duyệt mobile chặn tải đồng loạt)
        toast({
          title: "Đang tải ảnh...",
          description: `Tải ảnh ${currentSlide + 1} / ${images.length}`,
        });
        await downloadSingleImage(images[currentSlide], currentSlide);
        toast({
          title: "Hoàn tất!",
          description: "Ảnh đã được tải xuống.",
          duration: 2000,
        });
      } else {
        // Desktop: Tải tất cả ảnh tuần tự với delay nhỏ
        toast({
          title: "Bắt đầu tải xuống...",
          description: `Chuẩn bị tải ${images.length} ảnh.`,
        });
        for (let i = 0; i < images.length; i++) {
          await downloadSingleImage(images[i], i);
          // Delay 300ms giữa các lần tải để trình duyệt không bị chặn
          if (i < images.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
        }
        toast({
          title: "Hoàn tất!",
          description: "Tất cả ảnh đã được tải xuống.",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Lỗi tải ảnh:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Đã xảy ra lỗi trong quá trình tải xuống.",
      });
    } finally {
      setIsDownloading(false);
    }
  };


  if (!isOpen) return null;

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
          <Carousel
            setApi={setApi}
            className="w-full h-full"
            opts={{ startIndex: selectedIndex, loop: true }}
          >
            <CarouselContent className="h-[100vh] -ml-0">
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
                      />
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            
            <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full border border-white/20 bg-black/50 text-white transition-all hidden md:flex items-center justify-center z-50 hover:bg-black/80" />
            <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full border border-white/20 bg-black/50 text-white transition-all hidden md:flex items-center justify-center z-50 hover:bg-black/80" />
          </Carousel>
        </div>
      </DialogContent>
    </Dialog>
  );
}
