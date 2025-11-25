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
import { Download, Loader2, X } from "lucide-react"; // Thêm icon X để đóng
import { useEffect, useState, useCallback } from "react";
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

  // Cập nhật slide hiện tại khi scroll
  useEffect(() => {
    if (!api) return;

    setCurrentSlide(api.selectedScrollSnap());

    const onSelect = () => {
      setCurrentSlide(api.selectedScrollSnap());
    };

    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  // Đồng bộ lại vị trí slide khi mở modal
  useEffect(() => {
    if (api && isOpen) {
      api.scrollTo(selectedIndex, true); // true để nhảy ngay lập tức không animation
    }
  }, [api, isOpen, selectedIndex]);

  // Hàm Download tối ưu: Fetch Blob để tránh lỗi CORS và mở tab mới
  const handleDownload = async () => {
    const imageUrl = images[currentSlide];
    if (!imageUrl) return;

    setIsDownloading(true);
    try {
      // 1. Fetch dữ liệu ảnh dưới dạng Blob
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error("Network response was not ok");
      const blob = await response.blob();

      // 2. Tạo URL ảo cho Blob
      const blobUrl = window.URL.createObjectURL(blob);

      // 3. Tạo thẻ a ẩn để kích hoạt tải xuống
      const link = document.createElement("a");
      link.href = blobUrl;

      // Lấy tên file từ URL hoặc đặt tên mặc định
      const fileName =
        imageUrl.split("/").pop()?.split("?")[0] ||
        `image-${currentSlide + 1}.jpg`;
      link.setAttribute("download", fileName);

      document.body.appendChild(link);
      link.click();

      // 4. Dọn dẹp
      link.remove();
      window.URL.revokeObjectURL(blobUrl);

      toast({
        title: "Đã tải xuống",
        description: "Ảnh đã được lưu về máy của bạn.",
        duration: 2000,
      });
    } catch (error) {
      console.error("Download failed:", error);
      toast({
        variant: "destructive",
        title: "Lỗi tải xuống",
        description: "Không thể tải ảnh do lỗi mạng hoặc bảo mật (CORS).",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* TỐI ƯU CSS DIALOG: 
         - max-w-none w-screen h-screen: Full màn hình tuyệt đối
         - bg-black/90: Nền đen mờ đậm chất điện ảnh
         - border-none: Bỏ viền mặc định của Shadcn
         - p-0: Bỏ padding để ảnh tràn viền
      */}
      <DialogContent className="max-w-none w-screen h-screen p-0 m-0 bg-black/95 border-none shadow-none flex flex-col overflow-hidden [&>button]:hidden">
        {/* --- HEADER/TOOLBAR (Giữ nguyên) --- */}
        <div className="absolute top-0 left-0 right-0 z-50 flex justify-between items-center p-4 bg-gradient-to-b from-black/60 to-transparent h-16 shrink-0">
          <div className="text-white/90 text-sm font-medium px-3 py-1 bg-black/20 rounded-full backdrop-blur-md border border-white/10">
            {currentSlide + 1} / {images.length}
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              disabled={isDownloading}
              className="text-white/90 hover:bg-white/10 hover:text-white rounded-full h-10 w-10"
            >
              {isDownloading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Download className="h-5 w-5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white/90 hover:bg-white/10 hover:text-white rounded-full h-10 w-10"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* --- CAROUSEL (Phần đã sửa lỗi hiển thị ảnh) --- */}
        {/* 1. flex-1: Để Carousel chiếm toàn bộ khoảng trống còn lại dưới Header */}
        {/* 2. min-h-0: Quan trọng cho Flexbox lồng nhau để không bị vỡ layout */}
        <div className="flex-1 w-full h-full min-h-0 relative flex items-center justify-center">
          <Carousel
            setApi={setApi}
            className="w-full h-full"
            opts={{
              startIndex: selectedIndex,
              loop: true,
              align: "center",
            }}
          >
            {/* 3. h-[100vh]: Mẹo nhỏ. Thay vì h-full đôi khi bị lỗi với Embla carousel,
             ta set cứng chiều cao bằng màn hình để đảm bảo ảnh luôn có chỗ hiển thị */}
            <CarouselContent className="h-[100vh] -ml-0 items-center">
              {images.map((url, index) => (
                <CarouselItem
                  key={index}
                  className="h-full pl-0 relative flex items-center justify-center"
                >
                  {/* 4. Container chứa ảnh */}
                  <div className="relative w-full h-full flex items-center justify-center p-4 md:p-10">
                    <Image
                      src={url}
                      alt={`Lightbox image ${index + 1}`}
                      fill
                      priority={index === selectedIndex}
                      className="object-contain max-h-[90vh]" // Giới hạn max-height để không bị che bởi header/footer ảo nếu có
                      sizes="100vw"
                      quality={100}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>

            <CarouselPrevious className="left-4 bg-black/20 border-white/10 text-white hover:bg-black/40 hover:text-white hidden md:flex h-12 w-12" />
            <CarouselNext className="right-4 bg-black/20 border-white/10 text-white hover:bg-black/40 hover:text-white hidden md:flex h-12 w-12" />
          </Carousel>
        </div>
      </DialogContent>
    </Dialog>
  );
}