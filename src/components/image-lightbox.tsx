
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
import JSZip from "jszip";
import { saveAs } from "file-saver";

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
  const [isDownloading, setIsDownloading] = useState(false);

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
    setIsDownloading(true);
    const zip = new JSZip();

    try {
        const imagePromises = images.map(async (url, index) => {
            const response = await fetch(url);
            if (!response.ok) {
                console.error(`Failed to fetch image: ${url}`);
                return;
            }
            const blob = await response.blob();
            // Extract file extension or default to .jpg
            const fileExtension = url.split('.').pop()?.split('?')[0] || 'jpg';
            zip.file(`image-${index + 1}.${fileExtension}`, blob);
        });

        await Promise.all(imagePromises);

        zip.generateAsync({ type: "blob" }).then((content) => {
            saveAs(content, "hanoi-residences-images.zip");
        });

    } catch (error) {
        console.error("Error creating zip file:", error);
    } finally {
        setIsDownloading(false);
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
        
        <div className="absolute left-4 top-4 z-20">
            <Button
                variant="ghost"
                size="icon"
                onClick={handleDownloadAll}
                disabled={isDownloading}
                className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground md:text-foreground text-white"
            >
                {isDownloading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Download className="h-4 w-4" />
                )}
                <span className="sr-only">
                    {isDownloading ? "Đang nén..." : "Tải xuống tất cả ảnh"}
                </span>
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
