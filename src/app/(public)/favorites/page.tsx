
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/provider';
import { getFullFavoriteApartments } from '@/lib/data';
import { Apartment } from '@/lib/types';
import ApartmentCard from '@/components/apartment-card';
import { Loader2, Heart } from 'lucide-react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function FavoritesPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [favoriteApartments, setFavoriteApartments] = useState<(Apartment & { isFavorited?: boolean })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If user check is done and there's no user, redirect to login
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    async function fetchFavorites() {
      if (user) {
        setIsLoading(true);
        const apartments = await getFullFavoriteApartments(user.uid);
        // Mark all fetched apartments as favorited
        const apartmentsWithFavStatus = apartments.map(apt => ({ ...apt, isFavorited: true }));
        setFavoriteApartments(apartmentsWithFavStatus);
        setIsLoading(false);
      }
    }
    fetchFavorites();
  }, [user]);

  // Show a global loader while checking user auth
  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <h1 className="font-headline text-3xl font-bold tracking-tight md:text-4xl mb-8">
            Căn hộ yêu thích
          </h1>
          
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">
                {/* Skeleton Loader */}
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-4 p-4 rounded-lg border animate-pulse">
                        <div className="w-full aspect-[4/3] rounded-md bg-muted"></div>
                        <div className="space-y-2">
                            <div className="h-6 w-3/4 rounded bg-muted"></div>
                            <div className="h-4 w-1/2 rounded bg-muted"></div>
                            <div className="h-4 w-1/3 rounded bg-muted"></div>
                        </div>
                    </div>
                ))}
            </div>
          ) : favoriteApartments.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">
              {favoriteApartments.map((apartment, index) => (
                <ApartmentCard key={`${apartment.id}-${index}`} apartment={apartment} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-20 rounded-lg border border-dashed">
                <div className="rounded-full border border-dashed p-4">
                    <div className="rounded-full bg-secondary p-4">
                        <Heart className="h-10 w-10 text-muted-foreground" />
                    </div>
                </div>
                <h2 className="mt-6 font-headline text-2xl font-semibold">Danh sách yêu thích trống</h2>
                <p className="mt-2 text-muted-foreground">
                    Bạn chưa có căn hộ yêu thích nào.
                </p>
                <Button asChild className="mt-6">
                    <Link href="/">Bắt đầu tìm kiếm</Link>
                </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
