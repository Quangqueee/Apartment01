
"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/utils";
import { MapPin, BedDouble, Ruler, CalendarDays } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Apartment } from "@/lib/types";
import { ROOM_TYPES } from "@/lib/constants";

type ApartmentCardProps = {
  apartment: Apartment;
};

export default function ApartmentCard({ apartment }: ApartmentCardProps) {
  const getRoomTypeLabel = (value: string) => {
    const roomType = ROOM_TYPES.find((rt) => rt.value === value);
    return roomType ? roomType.label : "N/A";
  };

  return (
    <Card
      key={apartment.id}
      className="flex h-full flex-col overflow-hidden transition-shadow duration-300 hover:shadow-xl"
    >
      <Carousel
        className="group relative w-full"
        opts={{
          loop: true,
        }}
      >
        <CarouselContent>
          {apartment.imageUrls.map((url, index) => (
            <CarouselItem key={index}>
              <div className="relative w-full aspect-[4/3]">
                <Image
                  src={url}
                  alt={`${apartment.title} image ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                  data-ai-hint="apartment exterior"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <Link
        href={`/apartments/${apartment.id}`}
        className="flex flex-1 flex-col"
      >
        <CardHeader>
          <CardTitle className="font-headline text-2xl tracking-tight">
            {apartment.title}
          </CardTitle>
          <div className="flex items-center justify-between pt-2 text-sm">
             <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{apartment.district}</span>
             </div>
             <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                <span>{formatDate(apartment.createdAt)}</span>
             </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-end gap-4">
           <div className="flex items-center justify-between text-sm">
             <div className="flex items-center gap-2">
               <BedDouble className="h-5 w-5 text-primary" />
               <Badge variant="secondary" className="capitalize">
                 {getRoomTypeLabel(apartment.roomType)}
               </Badge>
             </div>
             <div className="flex items-center gap-2">
                <Ruler className="h-5 w-5 text-primary" />
                <span className="text-muted-foreground">{apartment.area} m²</span>
            </div>
           </div>
          <div className="flex items-center justify-between">
            <p className="text-xl font-semibold text-primary">
              {formatPrice(apartment.price)}
            </p>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
