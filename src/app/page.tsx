import Image from "next/image";
import Link from "next/link";
import { getApartments } from "@/lib/data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { MapPin, BedDouble } from "lucide-react";
import Header from "@/components/header";
import PaginationControls from "@/components/pagination-controls";
import Footer from "@/components/footer";

export const dynamic = "force-dynamic";

type HomeProps = {
  searchParams: {
    q?: string;
    district?: string;
    price?: string;
    roomType?: string;
    page?: string;
  };
};

export default async function Home({ searchParams }: HomeProps) {
  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const { apartments, totalPages } = await getApartments({
    query: searchParams.q,
    district: searchParams.district,
    priceRange: searchParams.price,
    roomType: searchParams.roomType,
    page,
    limit: 9,
  });

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12">
          {apartments.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">
                {apartments.map((apartment) => (
                  <Link href={`/apartments/${apartment.id}`} key={apartment.id}>
                    <Card className="flex h-full flex-col overflow-hidden transition-shadow duration-300 hover:shadow-xl">
                      <div className="relative h-56 w-full">
                        <Image
                          src={apartment.imageUrls[0]}
                          alt={apartment.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover"
                          data-ai-hint="apartment exterior"
                        />
                      </div>
                      <CardHeader>
                        <CardTitle className="font-headline text-2xl tracking-tight">
                          {apartment.title}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 pt-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{apartment.district}</span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-1 flex-col justify-end">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <BedDouble className="h-5 w-5 text-primary" />
                            <Badge variant="secondary" className="capitalize">
                              {apartment.roomType}
                            </Badge>
                          </div>
                          <p className="text-xl font-semibold text-primary">
                            {formatPrice(apartment.price)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
              <PaginationControls
                currentPage={page}
                totalPages={totalPages}
                className="mt-12"
              />
            </>
          ) : (
            <div className="text-center">
              <h2 className="font-headline text-2xl">No Apartments Found</h2>
              <p className="mt-2 text-muted-foreground">
                Try adjusting your filters or search query.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
