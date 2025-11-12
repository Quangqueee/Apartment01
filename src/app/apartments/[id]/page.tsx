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
import {
  MapPin,
  BedDouble,
  Building,
  DollarSign,
  ChevronLeft,
  FileText,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type ApartmentPageProps = {
  params: {
    id: string;
  };
};

export async function generateMetadata({ params }: ApartmentPageProps) {
  const apartment = await getApartmentById(params.id);

  if (!apartment) {
    return {
      title: "Apartment Not Found",
    };
  }

  return {
    title: `${apartment.title} | Hanoi Residences`,
    description: apartment.summary,
  };
}

export default async function ApartmentPage({ params }: ApartmentPageProps) {
  const apartment = await getApartmentById(params.id);

  if (!apartment) {
    notFound();
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
              <Carousel className="w-full">
                <CarouselContent>
                  {apartment.imageUrls.map((url, index) => (
                    <CarouselItem key={index}>
                      <div className="relative h-96 w-full overflow-hidden rounded-lg shadow-lg">
                        <Image
                          src={url}
                          alt={`${apartment.title} image ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 800px"
                           data-ai-hint="apartment interior"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-4" />
                <CarouselNext className="right-4" />
              </Carousel>
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
                    <p className="font-semibold">Room Type</p>
                    <p className="capitalize text-muted-foreground">
                      {apartment.roomType}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">District</p>
                    <p className="text-muted-foreground">{apartment.district}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 max-w-4xl">
            <div className="mb-8">
              <h2 className="mb-4 flex items-center font-headline text-2xl font-bold">
                <Sparkles className="mr-3 h-6 w-6 text-primary" />
                AI Generated Summary
              </h2>
              <p className="text-lg leading-relaxed text-foreground/80">
                {apartment.summary}
              </p>
            </div>

            <div>
              <h2 className="mb-4 flex items-center font-headline text-2xl font-bold">
                <FileText className="mr-3 h-6 w-6 text-primary" />
                Detailed Information
              </h2>
              <div className="prose prose-lg max-w-none text-foreground/80 whitespace-pre-wrap">
                {apartment.detailedInformation}
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
