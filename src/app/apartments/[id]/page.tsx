
import { getApartmentById } from "@/lib/data";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/utils";
import { ROOM_TYPES } from "@/lib/constants";
import {
  MapPin,
  BedDouble,
  Ruler,
  ChevronLeft,
  FileText,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Apartment } from "@/lib/types";
import ApartmentImageGallery from "@/components/apartment-image-gallery";

type ApartmentPageProps = {
  params: {
    id: string;
  };
};

const getRoomTypeLabel = (value: string) => {
  const roomType = ROOM_TYPES.find((rt) => rt.value === value);
  return roomType ? roomType.label : "N/A";
};

function ApartmentDetails({ apartment }: { apartment: Apartment }) {
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
                        <span>Đã đăng: {formatDate(apartment.createdAt)}</span>
                    </div>
                </div>
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
                      <p className="text-muted-foreground">
                        {apartment.district}
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
              </div>

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
          Interested? Contact us at +84 123 456 789
        </p>
      </footer>
    </>
  );
}


export default async function ApartmentPage({ params }: ApartmentPageProps) {
  const apartment = await getApartmentById(params.id);

  if (!apartment) {
    notFound();
  }

  return <ApartmentDetails apartment={apartment} />;
}
