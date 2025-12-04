
"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { MapPin, BedDouble, Ruler, CalendarDays, Heart } from "lucide-react";
import { Apartment } from "@/lib/types";
import { ROOM_TYPES } from "@/lib/constants";
import ClientFormattedDate from "./client-formatted-date";
import { useUser } from "@/firebase/provider";
import { toggleFavoriteAction } from "@/app/actions";
import { useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";


type ApartmentCardProps = {
  apartment: Apartment & { isFavorited?: boolean };
  onFavoriteToggle?: (apartmentId: string, isFavorited: boolean) => void;
};

export default function ApartmentCard({ apartment, onFavoriteToggle }: ApartmentCardProps) {
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const getRoomTypeLabel = (value: string) => {
    const roomType = ROOM_TYPES.find((rt) => rt.value === value);
    return roomType ? roomType.label : "N/A";
  };

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating when clicking the heart
    if (!user) {
      toast({
        variant: "destructive",
        title: "Bạn cần đăng nhập",
        description: "Vui lòng đăng nhập để sử dụng chức năng yêu thích.",
      });
      router.push('/login');
      return;
    }
    startTransition(async () => {
      const result = await toggleFavoriteAction({
        userId: user.uid,
        apartmentId: apartment.id,
        isFavorited: !!apartment.isFavorited,
      });
       if (result.success && onFavoriteToggle) {
        onFavoriteToggle(apartment.id, result.isFavorited);
      } else if (result.error) {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: result.error,
        });
      }
    });
  };

  const primaryImage = apartment.imageUrls?.[0];
  const linkHref = `/apartments/${apartment.id}`;
  const displayDate = apartment.updatedAt && apartment.updatedAt.seconds > 0 ? apartment.updatedAt : apartment.createdAt;

  return (
    <Card
      key={apartment.id}
      className="flex h-full flex-col overflow-hidden transition-shadow duration-300 hover:shadow-xl group"
    >
      <div className="relative">
        <Link href={linkHref} className="block" target="_blank" rel="noopener noreferrer">
          {primaryImage && (
              <div className="relative w-full aspect-[4/3]">
              <Image
                  src={primaryImage}
                  alt={apartment.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover select-none pointer-events-none"
                  data-ai-hint="apartment exterior"
              />
              </div>
          )}
        </Link>
        <Button
          size="icon"
          variant="ghost"
          className={cn(
            "absolute top-2 right-2 rounded-full h-9 w-9 text-white bg-black/40 hover:bg-black/60 hover:text-white",
            apartment.isFavorited && "text-red-500 hover:text-red-500"
          )}
          onClick={handleFavoriteToggle}
          disabled={isPending}
        >
          <Heart className={cn("h-5 w-5", apartment.isFavorited ? "fill-current" : "fill-transparent")} />
          <span className="sr-only">Yêu thích</span>
        </Button>
      </div>

      <div className="flex flex-1 flex-col">
        <Link href={linkHref} className="flex flex-1 flex-col" target="_blank" rel="noopener noreferrer">
            <CardHeader>
                <CardTitle className="font-headline text-xl tracking-tight">
                    {apartment.title}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-end gap-4">
                <div className="flex flex-col gap-3 text-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{apartment.district}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <CalendarDays className="h-4 w-4" />
                            <ClientFormattedDate date={displayDate} />
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
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
                </div>
                <div className="flex items-center justify-between pt-2">
                    <p className="text-xl font-semibold text-primary">
                        {formatPrice(apartment.price)}
                    </p>
                </div>
            </CardContent>
        </Link>
      </div>
    </Card>
  );
}
