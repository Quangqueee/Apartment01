
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
} from "@/components/ui/carousel";
import Image from "next/image";
import { X, Download, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
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
  const [isZipping, setIsZipping] = useState(false);
  const { toast } = useToast();

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
  
  const handleDownloadAll = async () => {
    setIsZipping(true);
    toast({
      title: "Đang chuẩn bị tệp...",
      description: "Quá trình này có thể mất vài giây.",
    });

    try {
      const zip = new JSZip();

      // Helper to fetch image and handle potential CORS issues
      const fetchImage = async (url: string) => {
        // We use a proxy or a serverless function in production for real CORS issues,
        // but for development, `no-cors` is a quick way to get the data, 
        // though it results in an opaque response.
        // A better approach is to ensure Firebase Storage is configured for CORS.
        // For this demo, we'll assume direct fetch works.
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${url}`);
        }
        return response.blob();
      };
      
      const imagePromises = images.map(async (url, index) => {
        try {
          const blob = await fetchImage(url);
          const extension = url.split('.').pop()?.split('?')[0] || 'jpg';
          zip.file(`image-${index + 1}.${extension}`, blob);
        } catch(e) {
          console.error(`Could not add ${url} to zip`, e);
        }
      });
      
      await Promise.all(imagePromises);
      
      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, "hanoi-residences-images.zip");

    } catch (error) {
        console.error("Failed to create zip file", error);
        toast({
            variant: "destructive",
            title: "Lỗi!",
            description: "Không thể tạo tệp zip. Vui lòng thử lại.",
        });
    } finally {
        setIsZipping(false);
    }
  };


  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-2 md:bg-background bg-black border-0 md:border">
        <DialogTitle className="sr-only">Image Lightbox</DialogTitle>
        <Carousel
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

        <DialogClose asChild>
          <button className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground md:text-foreground text-white z-20">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogClose>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDownloadAll}
          disabled={isZipping}
          className="absolute left-4 top-4 rounded-full opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground md:text-foreground text-white z-20"
        >
          {isZipping ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span className="sr-only">Tải xuống tất cả ảnh</span>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
