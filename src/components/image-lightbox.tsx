
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
  type CarouselApi,
} from "@/components/ui/carousel";
import Image from "next/image";
import { X } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

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
  const [currentIndex, setCurrentIndex] = useState(selectedIndex);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(selectedIndex);
      if (api) {
        api.scrollTo(selectedIndex, true); // Jump to selected index instantly
      }
    }
  }, [isOpen, selectedIndex, api]);
  
  const onSelect = useCallback(() => {
    if (!api) return;
    setCurrentIndex(api.selectedScrollSnap());
  }, [api]);

  useEffect(() => {
    if (!api) return;

    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);

    return () => {
      api.off("select", onSelect);
    };
  }, [api, onSelect]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      if (event.key === "ArrowRight") {
        api?.scrollNext();
      } else if (event.key === "ArrowLeft") {
        api?.scrollPrev();
      } else if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, api, onClose]);


  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-none w-screen h-screen p-0 border-0 bg-black flex flex-col">
        <DialogTitle className="sr-only">Image Lightbox</DialogTitle>

        <div className="relative flex h-full w-full items-center justify-center">
           <Carousel 
            setApi={setApi} 
            className="w-full h-full"
            opts={{
              startIndex: selectedIndex,
              loop: true,
            }}
          >
            <CarouselContent className="-ml-4 h-full">
              {images.map((url, index) => (
                <CarouselItem key={index} className="pl-4 flex items-center justify-center">
                  <div className="relative w-full h-[90vh]">
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
            <CarouselPrevious className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 h-10 w-10 md:h-12 md:w-12 rounded-full bg-black/30 text-white border-none hover:bg-black/50 hover:text-white" />
            <CarouselNext className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 h-10 w-10 md:h-12 md:w-12 rounded-full bg-black/30 text-white border-none hover:bg-black/50 hover:text-white" />
          </Carousel>
           <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1.5 rounded-md">
              {currentIndex + 1} / {images.length}
          </div>
        </div>

        <DialogClose asChild>
          <button className="absolute right-4 top-4 rounded-full p-1.5 bg-black/30 text-white transition-opacity hover:opacity-100 focus:outline-none z-10">
            <X className="h-6 w-6" />
            <span className="sr-only">Close</span>
          </button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
