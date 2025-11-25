
'use client';

import { getApartmentById } from "@/lib/data-client";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { ROOM_TYPES } from "@/lib/constants";
import {
  MapPin,
  BedDouble,
  Ruler,
  ChevronLeft,
  FileText,
  CalendarDays,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Apartment } from "@/lib/types";
import ApartmentImageGallery from "@/components/apartment-image-gallery";
import ClientFormattedDate from "@/components/client-formatted-date";
import { useUser } from "@/firebase/provider";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import Footer from "@/components/footer";


const getRoomTypeLabel = (value: string) => {
  const roomType = ROOM_TYPES.find((rt) => rt.value === value);
  return roomType ? roomType.label : "N/A";
};

function ApartmentDetailsSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8 md:py-12 animate-pulse">
            <Skeleton className="h-8 w-32 mb-8" />
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5 lg:gap-12">
                <div className="lg:col-span-3">
                    <Skeleton className="w-full aspect-[4/3] rounded-lg" />
                    <div className="hidden md:grid grid-cols-5 gap-2 mt-2">
                        <Skeleton className="w-full aspect-[4/3] rounded-md" />
                        <Skeleton className="w-full aspect-[4/3] rounded-md" />
                        <Skeleton className="w-full aspect-[4/3] rounded-md" />
                        <Skeleton className="w-full aspect-[4/3] rounded-md" />
                        <Skeleton className="w-full aspect-[4/3] rounded-md" />
                    </div>
                </div>
                <div className="space-y-8 lg:col-span-2">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-6 w-24 rounded-full" />
                            <Skeleton className="h-4 w-36" />
                        </div>
                        <Skeleton className="h-10 w-full rounded-lg" />
                        <Skeleton className="h-8 w-40 rounded-lg" />
                        <div className="space-y-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    </div>
                    <div className="pt-8">
                        <Skeleton className="h-8 w-48 mb-4" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ApartmentDetailsPage({ apartmentId }: { apartmentId: string }) {
    const { isUserLoading } = useUser();
    const [apartment, setApartment] = useState<Apartment | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchApartment = async () => {
            setIsLoading(true);
            const fetchedApartment = await getApartmentById(apartmentId);
            setApartment(fetchedApartment);
            setIsLoading(false);
        };
        fetchApartment();
    }, [apartmentId]);
    
    if (isLoading || isUserLoading) {
      return <ApartmentDetailsSkeleton />;
    }

    if (!apartment) {
        return (
             <div className="container mx-auto px-4 py-8 md:py-12 text-center">
                <h1 className="font-headline text-3xl font-bold">Apartment Not Found</h1>
                <p className="text-muted-foreground mt-4">The apartment you are looking for does not exist.</p>
                <Button variant="ghost" className="mt-8" onClick={() => router.back()}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back to Listings
                </Button>
            </div>
        );
    }

    const displayDate = apartment.updatedAt && apartment.updatedAt.seconds > 0 ? apartment.updatedAt : apartment.createdAt;

  return (
    <>
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <Button variant="ghost" className="mb-8" onClick={() => router.back()}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Listings
          </Button>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5 lg:gap-12">
            <div className="lg:col-span-3">
              <div className="sticky top-8 space-y-4">
                <ApartmentImageGallery imageUrls={apartment.imageUrls} title={apartment.title} />
              </div>
            </div>

            <div className="space-y-8 lg:col-span-2">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-sm">
                        {apartment.district}
                    </Badge>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarDays className="h-4 w-4" />
                        <span>Cập nhật: <ClientFormattedDate date={displayDate} /></span>
                    </div>
                </div>
                <h1 className="font-headline text-3xl font-bold tracking-tight md:text-4xl">
                  {apartment.title}
                </h1>
                <p className="text-3xl font-semibold text-primary">
                  {formatPrice(apartment.price)}
                </p>
                <div className="flex flex-col gap-4 text-sm">
                  <div className="flex items-center justify-between">
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
                      <Ruler className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-semibold">Diện tích</p>
                        <p className="text-muted-foreground">
                          {apartment.area} m²
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <div>
                        <p className="font-semibold">Quận</p>                      
                        <p className="text-muted-foreground">
                            {apartment.district}
                        </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="font-semibold">Mã nguồn</p>
                            <p className="text-muted-foreground">
                                {apartment.sourceCode}
                            </p>
                        </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                 <h2 className="mb-4 flex items-center font-headline text-2xl font-bold">
                    <FileText className="mr-3 h-6 w-6 text-primary" />
                    Thông tin căn hộ
                </h2>
                <div className="prose prose-lg max-w-none whitespace-pre-wrap text-foreground/80">
                    {apartment.details}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}


/**
 * This is the SERVER component wrapper for the apartment details page.
 * Its only job is to safely extract the `id` from the URL parameters (`params`)
 * and pass it to the actual page component, which is a Client Component.
 * This pattern avoids the `params` access warning in Next.js.
 */
export default function ApartmentPage({ params: { id } }: { params: { id: string } }) {
  // We pass the extracted `id` to the client component which will handle all data fetching and rendering.
  return <ApartmentDetailsPage apartmentId={id} />;
}
