
'use client';

import { getApartmentById } from "@/lib/data-client";
import { notFound, useRouter } from "next/navigation";
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

const getRoomTypeLabel = (value: string) => {
  const roomType = ROOM_TYPES.find((rt) => rt.value === value);
  return roomType ? roomType.label : "N/A";
};

function ApartmentDetails({ apartment: initialApartment, apartmentId }: { apartment: Apartment | null, apartmentId: string }) {
    const { userRole, isUserLoading } = useUser();
    const [apartment, setApartment] = useState<Apartment | null>(initialApartment);
    const [isLoading, setIsLoading] = useState(!initialApartment);

    useEffect(() => {
        const fetchApartment = async () => {
            if (!initialApartment) {
                setIsLoading(true);
                const fetchedApartment = await getApartmentById(apartmentId);
                setApartment(fetchedApartment);
                setIsLoading(false);
            }
        };
        fetchApartment();
    }, [initialApartment, apartmentId]);

    const canViewCommission = userRole === 'admin' || userRole === 'collaborator';
    
    if (isLoading || isUserLoading) {
      return <ApartmentDetailsSkeleton />;
    }

    if (!apartment) {
        notFound();
    }

    const displayDate = apartment.updatedAt && apartment.updatedAt.seconds > 0 ? apartment.updatedAt : apartment.createdAt;

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
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">Quận</p>                      <p className="text-muted-foreground">
                        {apartment.district}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {canViewCommission && apartment.commission && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <h2 className="mb-2 flex items-center font-headline text-xl font-bold">
                        <Award className="mr-3 h-5 w-5 text-primary" />
                        Thông tin hoa hồng
                    </h2>
                    <p className="text-foreground/80">{apartment.commission}</p>
                </div>
              )}

              <div className="pt-8">
                 <h2 className="mb-4 flex items-center font-headline text-2xl font-bold">
                    <FileText className="mr-3 h-6 w-6 text-primary" />
                    Detailed Information
                </h2>
                <div className="prose prose-lg max-w-none whitespace-pre-wrap text-foreground/80">
                    {apartment.details}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="mt-12 border-t bg-secondary/50 py-6 text-center">
        <p className="text-muted-foreground">
          Interested? Contact us at +84 355 885 851
        </p>
      </footer>
    </>
  );
}

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

// This page now needs to be a Client Component to use hooks like useUser.
// We'll fetch data client-side if it wasn't pre-fetched during SSR.
export default function ApartmentPage({ params: { id } }: { params: { id: string } }) {
  // We pass null for initialApartment because we will fetch on the client.
  // This avoids passing a server-rendered object to a client component that then re-fetches,
  // which can lead to mismatches if data changes.
  return <ApartmentDetails apartment={null} apartmentId={id} />;
}
