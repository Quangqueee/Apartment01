
"use client";

import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselApi,
} from "@/components/ui/carousel";
import Image from "next/image";
import { X, Download, Loader2 } from "lucide-react";
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
    const onSelect = () => {
      setCurrentSlide(api.selectedScrollSnap());
    };
    api.on("select", onSelect);

    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  const handleDownload = () => {
    // This is a simpler download method that avoids CORS issues
    // by not using fetch(). It tells the browser to download the
    // image from its original URL.
    setIsDownloading(true);
    try {
      const imageUrl = images[currentSlide];
      const link = document.createElement("a");
      link.href = imageUrl;

      // The 'download' attribute suggests a filename to the browser.
      // If the server sends a Content-Disposition header, it may be overridden.
      // We can suggest a name based on the URL.
      const fileName = imageUrl.split('/').pop()?.split('?')[0] || `image-${currentSlide + 1}.jpg`;
      link.setAttribute("download", fileName);
      
      // We don't need to add the link to the body for it to work in modern browsers.
      link.click();
      
      toast({
        title: "Bắt đầu tải xuống",
        description: "Ảnh của bạn đang được tải xuống.",
      });
    } catch (error) {
      console.error("Download failed:", error);
      toast({
        variant: "destructive",
        title: "Tải xuống thất bại",
        description: "Không thể tải ảnh. Vui lòng thử lại.",
      });
    } finally {
      // The download starts instantly, so we can set loading to false quickly.
      setIsDownloading(false);
    }
  };


  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-2 md:bg-background bg-black border-0 md:border">
        <DialogTitle className="sr-only">Image Lightbox</DialogTitle>
        <Carousel
          setApi={setApi}
          className="w-full"
          opts={{
            startIndex: selectedIndex,
            loop: true,
          }}
        >
          <CarouselContent>
            {images.map((url, index) => (
              <CarouselItem key={index}>
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src={url}
                    alt={`Lightbox image ${index + 1}`}
                    fill
                    className="object-contain"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 hidden md:flex" />
          <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 hidden md:flex" />
        </Carousel>
        
        <div className="absolute right-4 top-4 flex items-center gap-2 z-20">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              disabled={isDownloading}
              className="rounded-full h-8 w-8 text-white md:text-foreground opacity-70 hover:opacity-100 hover:bg-white/20 md:hover:bg-accent"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="sr-only">Tải xuống ảnh này</span>
            </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
