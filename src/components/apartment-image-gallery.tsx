
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import ImageLightbox from "@/components/image-lightbox";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

type ApartmentImageGalleryProps = {
  imageUrls: string[];
  title: string;
};

export default function ApartmentImageGallery({ imageUrls, title }: ApartmentImageGalleryProps) {
  const [mainApi, setMainApi] = useState<CarouselApi>();
  const [thumbApi, setThumbApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const onThumbClick = useCallback(
    (index: number) => {
      if (!mainApi || !thumbApi) return;
      mainApi.scrollTo(index);
    },
    [mainApi, thumbApi]
  );

  const onSelect = useCallback(() => {
    if (!mainApi || !thumbApi) return;
    setSelectedIndex(mainApi.selectedScrollSnap());
    thumbApi.scrollTo(mainApi.selectedScrollSnap());
  }, [mainApi, thumbApi, setSelectedIndex]);

  useEffect(() => {
    if (!mainApi) return;
    onSelect();
    mainApi.on("select", onSelect);
    mainApi.on("reInit", onSelect);
  }, [mainApi, onSelect]);

  const openLightbox = () => {
    setIsLightboxOpen(true);
  };

  return (
    <>
      <div className="space-y-2">
        <div className="group relative">
          <Carousel 
            setApi={setMainApi} 
            className="w-full cursor-grab active:cursor-grabbing"
            opts={{
              loop: true,
            }}
          >
            <CarouselContent className="-ml-4 select-none">
              {imageUrls.map((url, index) => (
                <CarouselItem key={index} onClick={openLightbox} className="pl-4 cursor-pointer">
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg shadow-lg">
                    <Image
                      src={url}
                      alt={`${title} image ${index + 1}`}
                      fill
                      className="object-cover pointer-events-none"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      data-ai-hint="apartment interior"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="absolute inset-y-0 left-2 flex items-center md:hidden">
              <ChevronLeft className="h-8 w-8 text-white/50" />
            </div>
            <div className="absolute inset-y-0 right-2 flex items-center md:hidden">
              <ChevronRight className="h-8 w-8 text-white/50" />
            </div>
          </Carousel>
        </div>

        <div className="hidden md:block">
          <Carousel
            setApi={setThumbApi}
            opts={{
              align: "start",
              containScroll: "trimSnaps",
            }}
            className="w-full cursor-grab active:cursor-grabbing"
          >
            <CarouselContent className="-ml-2 select-none">
              {imageUrls.map((url, index) => (
                <CarouselItem key={index} onClick={() => onThumbClick(index)} className="basis-1/4 pl-2 lg:basis-1/5">
                  <div className="relative aspect-[4/3] cursor-pointer">
                    <Image
                      src={url}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      sizes="10vw"
                      className={cn(
                        "rounded-md object-cover transition-all pointer-events-none",
                        selectedIndex === index
                          ? "border-2 border-primary"
                          : "opacity-60 hover:opacity-100"
                      )}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
      <ImageLightbox
        images={imageUrls}
        selectedIndex={selectedIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
      />
    </>
  );
}
