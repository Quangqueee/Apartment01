
"use client";

import { getApartmentById } from "@/lib/data";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { ROOM_TYPES } from "@/lib/constants";
import {
  MapPin,
  BedDouble,
  Ruler,
  ChevronLeft,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Apartment } from "@/lib/types";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import ImageLightbox from "@/components/image-lightbox";

type ApartmentPageProps = {
  params: {
    id: string;
  };
};

export default function ApartmentPage({ params }: ApartmentPageProps) {
  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [api, setApi] = useState<any>();
  const [current, setCurrent] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    const fetchApartment = async () => {
      const apt = await getApartmentById(params.id);
      if (!apt) {
        notFound();
      }
      setApartment(apt);
    };
    fetchApartment();
  }, [params.id]);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  if (!apartment) {
    // You can render a loading state here
    return (
       <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const getRoomTypeLabel = (value: string) => {
    const roomType = ROOM_TYPES.find((rt) => rt.value === value);
    return roomType ? roomType.label : "N/A";
  };
  
  const handleThumbnailClick = (index: number) => {
    api?.scrollTo(index);
  }

  const openLightbox = () => {
    setIsLightboxOpen(true);
  }

  return (
    <>
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <Button asChild variant="ghost" className="mb-8">
            <Link href="/">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Listings
            </Link>
          </Button>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-12">
            <div className="lg:col-span-2">
               <div className="space-y-4">
                <div className="group relative">
                  <Carousel setApi={setApi} className="w-full">
                    <CarouselContent>
                      {apartment.imageUrls.map((url, index) => (
                        <CarouselItem key={index} onClick={openLightbox} className="cursor-pointer">
                          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg shadow-lg">
                            <Image
                              src={url}
                              alt={`${apartment.title} image ${index + 1}`}
                              fill
                              className="object-cover"
                              data-ai-hint="apartment interior"
                            />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-4 opacity-0 transition-opacity group-hover:opacity-100" />
                    <CarouselNext className="right-4 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Carousel>
                </div>
                
                <div className="hidden md:block">
                  <ScrollArea className="w-full whitespace-nowrap rounded-md">
                      <div className="flex space-x-2 pb-2">
                          {apartment.imageUrls.map((url, index) => (
                              <div 
                                  key={index} 
                                  className="relative aspect-[4/3] h-24 shrink-0 cursor-pointer" 
                                  onClick={() => handleThumbnailClick(index)}
                              >
                                  <Image 
                                      src={url}
                                      alt={`Thumbnail ${index + 1}`}
                                      fill
                                      className={cn(
                                          "object-cover rounded-md transition-all", 
                                          current === index ? "border-2 border-primary" : "opacity-70 hover:opacity-100"
                                      )}
                                  />
                              </div>
                          ))}
                      </div>
                      <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </div>

              </div>
            </div>

            <div className="space-y-6">
              <Badge variant="secondary" className="text-sm">
                {apartment.district}
              </Badge>
              <h1 className="font-headline text-3xl font-bold tracking-tight md:text-4xl">
                {apartment.title}
              </h1>
              <p className="text-3xl font-semibold text-primary">
                {formatPrice(apartment.price)}
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <BedDouble className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">Loại phòng</p>
                    <p className="capitalize text-muted-foreground">
                      {getRoomTypeLabel(apartment.roomType)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">Quận</p>
                    <p className="text-muted-foreground">{apartment.district}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Ruler className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">Diện tích</p>
                    <p className="text-muted-foreground">{apartment.area} m²</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 max-w-4xl">
            <div>
              <h2 className="mb-4 flex items-center font-headline text-2xl font-bold">
                <FileText className="mr-3 h-6 w-6 text-primary" />
                Detailed Information
              </h2>
              <div className="prose prose-lg max-w-none text-foreground/80 whitespace-pre-wrap">
                {apartment.details}
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="mt-12 border-t bg-secondary/50 py-6 text-center">
        <p className="text-muted-foreground">
          Interested? Contact us at +84 123 456 789
        </p>
      </footer>
       <ImageLightbox 
        images={apartment.imageUrls}
        selectedIndex={current}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
      />
    </>
  );
}
