"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import ImageLightbox from "@/components/image-lightbox";

type ApartmentImageGalleryProps = {
  imageUrls: string[];
  apartmentCode?: string;
  onLightboxChange?: (isOpen: boolean) => void;
  children?: React.ReactNode;
};

const TAP_MAX_MS = 400;
const TAP_MAX_MOVE = 12;

export default function ApartmentImageGallery({
  imageUrls,
  apartmentCode,
  onLightboxChange,
  children,
}: ApartmentImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [mobileIndex, setMobileIndex] = useState(0);
  const mobileScrollerRef = useRef<HTMLDivElement>(null);
  const touchActiveRef = useRef(false);
  const gestureRef = useRef({
    x: 0,
    y: 0,
    t: 0,
    moved: false,
    pointerType: "mouse",
    scrollLeft: 0,
  });

  useEffect(() => {
    if (onLightboxChange) onLightboxChange(lightboxOpen);
  }, [lightboxOpen, onLightboxChange]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const rememberGestureStart = (event: React.PointerEvent) => {
    touchActiveRef.current = true;
    gestureRef.current = {
      x: event.clientX,
      y: event.clientY,
      t: Date.now(),
      moved: false,
      pointerType: event.pointerType,
      scrollLeft: mobileScrollerRef.current?.scrollLeft ?? 0,
    };
  };

  const rememberGestureMove = (event: React.PointerEvent) => {
    if (
      Math.hypot(
        event.clientX - gestureRef.current.x,
        event.clientY - gestureRef.current.y,
      ) > TAP_MAX_MOVE
    ) {
      gestureRef.current.moved = true;
    }
  };

  const endGesture = () => {
    touchActiveRef.current = false;
  };

  const shouldOpenLightbox = () => {
    const { moved, t, pointerType, scrollLeft } = gestureRef.current;
    const currentScroll = mobileScrollerRef.current?.scrollLeft ?? scrollLeft;
    if (moved || Math.abs(currentScroll - scrollLeft) > 10) return false;
    if (pointerType === "touch" && Date.now() - t > TAP_MAX_MS) return false;
    return true;
  };

  const handleGalleryActivate = (index: number) => {
    if (!shouldOpenLightbox()) return;
    openLightbox(index);
  };

  const handleMobileScroll = () => {
    const scroller = mobileScrollerRef.current;
    if (!scroller?.clientWidth) return;
    setMobileIndex(Math.round(scroller.scrollLeft / scroller.clientWidth));
    if (touchActiveRef.current) gestureRef.current.moved = true;
  };

  if (!imageUrls || imageUrls.length === 0) return null;

  return (
    <>
      <div className="relative group overflow-hidden md:rounded-[2rem]">
        <div className="md:hidden">
          <div
            ref={mobileScrollerRef}
            onScroll={handleMobileScroll}
            className="flex w-full aspect-[4/3] overflow-x-auto snap-x snap-mandatory [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {imageUrls.map((url, idx) => (
              <div
                key={`${url}-${idx}`}
                className="relative aspect-[4/3] w-full shrink-0 grow-0 basis-full snap-center snap-always"
                onPointerDown={rememberGestureStart}
                onPointerMove={rememberGestureMove}
                onPointerUp={endGesture}
                onPointerCancel={endGesture}
                onClick={() => handleGalleryActivate(idx)}
              >
                <img
                  src={url}
                  alt={`View ${idx + 1}`}
                  loading={idx === 0 ? "eager" : "lazy"}
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover [-webkit-touch-callout:default]"
                  style={{ WebkitTouchCallout: "default" }}
                />
              </div>
            ))}
          </div>
          <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-3 py-1 rounded-full font-medium backdrop-blur-sm pointer-events-none z-10">
            {mobileIndex + 1} / {imageUrls.length}
          </div>
        </div>

        <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-2 h-[480px]">
          {imageUrls.slice(0, 5).map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              className={cn(
                "relative cursor-pointer hover:brightness-90 transition-all duration-500",
                idx === 0 ? "col-span-2 row-span-2" : "col-span-1 row-span-1",
              )}
              onPointerDown={rememberGestureStart}
              onPointerMove={rememberGestureMove}
              onClick={() => handleGalleryActivate(idx)}
            >
              <Image
                src={url}
                alt="Apartment"
                fill
                className="object-cover [-webkit-touch-callout:default]"
                style={{ WebkitTouchCallout: "default" }}
              />
              {idx === 4 && imageUrls.length > 5 && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-headline font-bold text-xl backdrop-blur-[2px] pointer-events-none">
                  Xem tất cả ảnh
                </div>
              )}
            </div>
          ))}
        </div>

        {children}
      </div>

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
