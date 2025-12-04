
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/firebase/provider';
import { getFullFavoriteApartments } from '@/lib/data';
import { Apartment } from '@/lib/types';
import ApartmentCard from '@/components/apartment-card';
import { Loader2, Heart } from 'lucide-react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { removeVietnameseTones } from '@/lib/utils';
import SortControls from '@/components/sort-controls';

export default function FavoritesPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [allFavoriteApartments, setAllFavoriteApartments] = useState<(Apartment & { isFavorited?: boolean })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Read filter params from URL
  const query = searchParams.get('q');
  const district = searchParams.get('district');
  const price = searchParams.get('price');
  const roomType = searchParams.get('roomType');
  const sort = searchParams.get('sort');

  useEffect(() => {
    async function fetchFavorites() {
      if (user) {
        setIsLoading(true);
        const apartments = await getFullFavoriteApartments(user.uid);
        const apartmentsWithFavStatus = apartments.map(apt => ({ ...apt, isFavorited: true }));
        setAllFavoriteApartments(apartmentsWithFavStatus);
        setIsLoading(false);
      } else if (!isUserLoading) {
        // If user is not logged in, no need to fetch, just stop loading.
        setIsLoading(false);
      }
    }
    fetchFavorites();
  }, [user, isUserLoading]);

  const filteredAndSortedApartments = useMemo(() => {
    let filtered = [...allFavoriteApartments];

    // Client-side filtering
    if (query) {
      const normalizedQuery = removeVietnameseTones(query.toLowerCase());
      filtered = filtered.filter(apt => 
        removeVietnameseTones(apt.title.toLowerCase()).includes(normalizedQuery) ||
        removeVietnameseTones(apt.sourceCode.toLowerCase()).includes(normalizedQuery)
      );
    }
    if (district) {
      filtered = filtered.filter(apt => apt.district === district);
    }
    if (roomType) {
      filtered = filtered.filter(apt => apt.roomType === roomType);
    }
    if (price) {
      const [min, max] = price.split("-");
      const minPrice = min ? parseInt(min, 10) : 0;
      const maxPrice = max ? parseInt(max, 10) : Infinity;
      filtered = filtered.filter(apt => {
        const roundedPrice = Math.floor(apt.price);
        const meetsMin = minPrice > 0 ? roundedPrice >= minPrice : true;
        const meetsMax = maxPrice !== Infinity ? roundedPrice <= maxPrice : true;
        return meetsMin && meetsMax;
      });
    }

    // Client-side sorting
    if (sort === 'price-asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
      filtered.sort((a, b) => b.price - a.price);
    } else { // 'newest' or default
      filtered.sort((a, b) => {
        const dateA = a.updatedAt?.seconds > 0 ? a.updatedAt : a.createdAt;
        const dateB = b.updatedAt?.seconds > 0 ? b.updatedAt : b.createdAt;
        return dateB.seconds - dateA.seconds;
      });
    }

    return filtered;
  }, [allFavoriteApartments, query, district, price, roomType, sort]);

  const handleFavoriteToggle = (apartmentId: string) => {
    // Optimistically remove from both lists
    setAllFavoriteApartments(prev => prev.filter(apt => apt.id !== apartmentId));
  };


  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (!user) {
    return (
        <>
            <Header />
            <main className="flex-1">
                <div className="container mx-auto px-4 py-8 md:py-12 flex flex-col justify-center h-full min-h-[60vh]">
                    <h1 className="font-headline text-3xl font-bold tracking-tight md:text-4xl">
                        Yêu thích
                    </h1>
                    <p className="mt-4 font-headline text-2xl">Đăng nhập để xem danh sách Yêu thích của bạn</p>
                    <p className="mt-2 max-w-md text-muted-foreground">
                        Bạn có thể tạo, xem hoặc chỉnh sửa danh sách Yêu thích sau khi đăng nhập.
                    </p>
                    <Button asChild className="mt-6 w-fit">
                        <Link href="/login">Đăng nhập</Link>
                    </Button>
                </div>
            </main>
            <Footer />
        </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="mb-8 flex flex-col items-baseline justify-between gap-4 md:flex-row">
            <h1 className="font-headline text-3xl font-bold tracking-tight md:text-4xl">
              Căn hộ yêu thích
            </h1>
            <div className="flex w-full items-center justify-between md:w-auto md:justify-end">
              <p className="text-sm text-muted-foreground md:mr-4">
                Tìm thấy <span className="font-bold text-foreground">{filteredAndSortedApartments.length}</span> kết quả.
              </p>
              <SortControls />
            </div>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">
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
          ) : allFavoriteApartments.length > 0 ? (
             filteredAndSortedApartments.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">
                  {filteredAndSortedApartments.map((apartment, index) => (
                    <ApartmentCard key={`${apartment.id}-${index}`} apartment={apartment} onFavoriteToggle={handleFavoriteToggle} />
                  ))}
                </div>
            ) : (
                <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed text-center">
                    <h2 className="font-headline text-2xl">Không có kết quả phù hợp</h2>
                    <p className="mt-2 text-muted-foreground">
                        Không có căn hộ yêu thích nào khớp với bộ lọc của bạn.
                    </p>
                </div>
            )
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
