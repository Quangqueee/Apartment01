
"use client";

import {
  Dialog,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import Image from "next/image";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

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
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }
    setCurrent(api.selectedScrollSnap() + 1);
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);
  
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-none w-screen h-screen p-0 border-0 bg-black/90 flex items-center justify-center">
        <Carousel
          setApi={setApi}
          className="w-full h-full flex items-center justify-center"
          opts={{
            loop: true,
            startIndex: selectedIndex,
          }}
        >
          <CarouselContent className="h-auto">
            {images.map((url, index) => (
              <CarouselItem key={index}>
                <div className="relative w-full h-screen">
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
        </Carousel>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-2 py-1 rounded-md">
            {current} / {images.length}
        </div>
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-8 w-8 text-white" />
          <span className="sr-only">Close</span>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
