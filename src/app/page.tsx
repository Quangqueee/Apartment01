import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, MoonStar } from "lucide-react";
import {
  getCachedFeaturedDistrictStats,
  getCachedHomeApartments,
} from "@/lib/data";
import Header from "@/components/header";
import Footer from "@/components/footer";
import SortControls from "@/components/sort-controls";
import ApartmentList from "@/components/apartment-list";
import Hero from "@/components/hero";
import FeaturedDistricts from "@/components/featured-districts";
import AboutSection from "@/app/about/page";
import { SHORT_TERM_PUBLIC_ACCESS } from "@/lib/constants";

/** Cache vô hạn: chỉ làm mới khi revalidateApartmentListings() (push/sửa/xóa). Literal bắt buộc — Next.js không theo dõi import (invalid-page-config). */
export const revalidate = false;

export default async function Home() {
  const [{ apartments, totalResults }, districtStats] = await Promise.all([
    getCachedHomeApartments(),
    getCachedFeaturedDistrictStats(),
  ]);

  return (
    <>
      <Header />
      <Hero />
      <main className="bg-white">
        <div className="container mx-auto px-4 py-10 lg:py-12">
          <FeaturedDistricts stats={districtStats} />

          {SHORT_TERM_PUBLIC_ACCESS ? (
            <Link
              href="/can-ho-ngan-han"
              className="group mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-[#1a1a1a] to-[#33301f] p-6 md:p-8 shadow-lg overflow-hidden"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#cda533]/20 text-[#cda533]">
                  <MoonStar className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                    Căn hộ ngắn hạn theo đêm
                  </h2>
                  <p className="text-sm text-gray-300 mt-1 max-w-xl">
                    Lưu trú linh hoạt vài đêm tại Hà Nội — chọn ngày, gửi yêu
                    cầu, đội ngũ xác nhận trong ngày.
                  </p>
                </div>
              </div>
              <span className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#cda533] px-5 py-3 text-sm font-bold text-white transition-all group-hover:gap-3 group-hover:bg-[#b88e22]">
                Khám phá ngay <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ) : null}

          <div
            id="apartments-list"
            className="mt-12 mb-8 flex flex-col md:flex-row justify-between items-center md:items-end border-b border-gray-100 pb-6 gap-4 scroll-mt-32"
          >
            <div className="flex flex-col gap-2 text-center md:text-left w-full md:w-auto">
              <h2 className="text-3xl md:text-4xl font-headline font-black uppercase tracking-tighter text-gray-900 leading-tight">
                CĂN HỘ NỔI BẬT
              </h2>
              <p className="text-sm font-bold text-amber-700 uppercase tracking-[0.2em] italic">
                Tìm thấy {totalResults} căn hộ
              </p>
            </div>
            <Suspense
              fallback={
                <div className="flex items-center gap-2">
                  <div className="h-10 w-[160px] animate-pulse rounded-md bg-gray-100" />
                </div>
              }
            >
              <SortControls />
            </Suspense>
          </div>

          <ApartmentList
            initialApartments={apartments}
            searchParams={{}}
            totalInitialResults={totalResults}
          />

          <div
            id="about"
            className="scroll-mt-28 mt-20 border-t border-gray-100 pt-12"
          >
            <AboutSection />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
