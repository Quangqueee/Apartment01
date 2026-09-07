"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import ImageLightbox from "@/components/image-lightbox";

type ApartmentImageGalleryProps = {
  imageUrls: string[];
  apartmentCode?: string;
  onLightboxChange?: (isOpen: boolean) => void; // Báo cho component cha biết Lightbox đang mở
  children?: React.ReactNode; // Để chứa các nút Share, Favorite, Download nổi trên ảnh
};

export default function ApartmentImageGallery({
  imageUrls,
  apartmentCode,
  onLightboxChange,
  children,
}: ApartmentImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [mobileIndex, setMobileIndex] = useState(0);
  const [mobileCarouselApi, setMobileCarouselApi] = useState<CarouselApi>();

  const isMobileSwipeRef = useRef(false);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);

  // Báo cáo trạng thái Lightbox ra bên ngoài (để ẩn/hiện Header, Footer)
  useEffect(() => {
    if (onLightboxChange) onLightboxChange(lightboxOpen);
  }, [lightboxOpen, onLightboxChange]);

  // Đồng bộ index cho Mobile Carousel
  useEffect(() => {
    if (!mobileCarouselApi) return;
    const syncMobileIndex = () =>
      setMobileIndex(mobileCarouselApi.selectedScrollSnap());
    syncMobileIndex();
    mobileCarouselApi.on("select", syncMobileIndex);
    mobileCarouselApi.on("reInit", syncMobileIndex);
    return () => {
      mobileCarouselApi.off("select", syncMobileIndex);
      mobileCarouselApi.off("reInit", syncMobileIndex);
    };
  }, [mobileCarouselApi]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleMobileTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const firstTouch = event.touches[0];
    touchStartXRef.current = firstTouch.clientX;
    touchStartYRef.current = firstTouch.clientY;
    isMobileSwipeRef.current = false;
  };

  const handleMobileTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!event.touches.length) return;
    const firstTouch = event.touches[0];
    const deltaX = Math.abs(firstTouch.clientX - touchStartXRef.current);
    const deltaY = Math.abs(firstTouch.clientY - touchStartYRef.current);
    if (deltaX > 8 || deltaY > 8) isMobileSwipeRef.current = true;
  };

  const handleMobileImageClick = (index: number) => {
    if (isMobileSwipeRef.current) {
      isMobileSwipeRef.current = false;
      return;
    }
    openLightbox(index);
  };

  if (!imageUrls || imageUrls.length === 0) return null;

  return (
    <>
      <div className="relative group md:rounded-[2rem] overflow-hidden">
        {/* --- MOBILE VIEW --- */}
        <div className="md:hidden">
          <Carousel
            setApi={setMobileCarouselApi}
            opts={{
              align: "start",
              containScroll: "trimSnaps",
              loop: imageUrls.length > 1,
            }}
            className="w-full aspect-[4/3]"
          >
            <CarouselContent className="-ml-0 select-none [touch-action:pan-y_pinch-zoom]">
              {imageUrls.map((url, idx) => (
                <CarouselItem
                  key={idx}
                  className="pl-0"
                  onTouchStart={handleMobileTouchStart}
                  onTouchMove={handleMobileTouchMove}
                  onClick={() => handleMobileImageClick(idx)}
                >
                  <div className="relative w-full h-full aspect-[4/3]">
                    <Image
                      src={url}
                      alt={`View ${idx}`}
                      fill
                      draggable={false}
                      className="object-cover pointer-events-none select-none [-webkit-touch-callout:none]"
                      priority={idx === 0}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-3 py-1 rounded-full font-medium backdrop-blur-sm pointer-events-none z-10">
            {mobileIndex + 1} / {imageUrls.length}
          </div>
        </div>

        {/* --- DESKTOP VIEW --- */}
        <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-2 h-[480px]">
          {imageUrls.slice(0, 5).map((url, idx) => (
            <div
              key={idx}
              className={cn(
                "relative cursor-pointer hover:brightness-90 transition-all duration-500",
                idx === 0 ? "col-span-2 row-span-2" : "col-span-1 row-span-1",
              )}
              onClick={() => openLightbox(idx)}
            >
              <Image src={url} alt="Apartment" fill className="object-cover" />
              {idx === 4 && imageUrls.length > 5 && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-headline font-bold text-xl backdrop-blur-[2px]">
                  Xem tất cả ảnh
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CÁC NÚT TƯƠNG TÁC (TỪ COMPONENT CHA TRUYỀN VÀO) */}
        {children}
      </div>

      {/* LIGHTBOX */}
      <ImageLightbox
        images={imageUrls}
        selectedIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        apartmentCode={apartmentCode}
      />
    </>
  );
}
