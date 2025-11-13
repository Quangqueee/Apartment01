"use client";

import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

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
  const [currentIndex, setCurrentIndex] = useState(selectedIndex);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(selectedIndex);
    }
  }, [isOpen, selectedIndex]);
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      if (event.key === "ArrowRight") {
        handleNext();
      } else if (event.key === "ArrowLeft") {
        handlePrevious();
      } else if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, currentIndex, images.length]);

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-none w-[95vw] h-[90vh] p-0 border-0 bg-background flex flex-col">
        <DialogTitle className="sr-only">Image Lightbox</DialogTitle>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-5 h-full overflow-hidden">
          {/* Main Image */}
          <div className="col-span-1 md:col-span-4 relative flex items-center justify-center bg-black/5">
            {images.length > 0 && (
              <Image
                src={images[currentIndex]}
                alt={`Lightbox image ${currentIndex + 1}`}
                fill
                className="object-contain"
              />
            )}
            {/* Navigation */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevious}
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 h-10 w-10 md:h-12 md:w-12 rounded-full bg-black/30 text-white hover:bg-black/50 hover:text-white"
            >
              <ChevronLeft className="h-6 w-6 md:h-8 md:w-8" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 h-10 w-10 md:h-12 md:w-12 rounded-full bg-black/30 text-white hover:bg-black/50 hover:text-white"
            >
              <ChevronRight className="h-6 w-6 md:h-8 md:w-8" />
            </Button>
             <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1.5 rounded-md">
                {currentIndex + 1} / {images.length}
            </div>
          </div>

          {/* Thumbnails */}
          <div className="hidden md:block col-span-1 h-full overflow-y-auto p-4 space-y-2 border-l bg-background">
             <h3 className="font-semibold text-lg mb-4">Gallery</h3>
            {images.map((url, index) => (
              <div
                key={index}
                className={cn(
                  "relative aspect-square cursor-pointer rounded-md overflow-hidden border-2",
                  index === currentIndex ? "border-primary" : "border-transparent"
                )}
                onClick={() => setCurrentIndex(index)}
              >
                <Image
                  src={url}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        <DialogClose asChild>
          <button className="absolute right-2 top-2 md:right-4 md:top-4 rounded-full p-1.5 bg-black/30 text-white transition-opacity hover:opacity-100 focus:outline-none z-10">
            <X className="h-6 w-6" />
            <span className="sr-only">Close</span>
          </button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}

// Dummy Button component to avoid errors, assuming it exists elsewhere
const Button = ({ className, children, ...props }: any) => (
    <button className={cn("inline-flex items-center justify-center", className)} {...props}>
        {children}
    </button>
)