import { getApartments } from "@/lib/data";
import Header from "@/components/header";
import Footer from "@/components/footer";
import SortControls from "@/components/sort-controls";
import ApartmentList from "@/components/apartment-list";
import Hero from "@/components/hero";
import FeaturedDistricts from "@/components/featured-districts";
import TrustSection from "@/components/trust-section";
import MobileNav from "@/components/mobile-nav";
import Link from "next/link";
import { X } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: any) {
  const sParams = await searchParams;
  const { apartments, totalResults } = await getApartments({
    district: sParams.district,
    priceRange: sParams.price,
    roomType: sParams.roomType,
    page: 1,
    limit: 6,
    sortBy: sParams.sort,
  });

  const districtNames = ["Tây Hồ", "Ba Đình", "Đống Đa", "Cầu Giấy"];
  const districtStats = await Promise.all(
    districtNames.map(async (name) => {
      const { totalResults } = await getApartments({
        district: name,
        limit: 1,
      });
      return { name, count: totalResults };
    })
  );

  const sectionTitle = sParams.district
    ? `CĂN HỘ TẠI ${sParams.district.toUpperCase()}`
    : "CĂN HỘ NỔI BẬT";

  return (
    <>
      <Header />
      <Hero />
      <main className="bg-white">
        <div className="container mx-auto px-4 py-16">
          <FeaturedDistricts stats={districtStats} />

          {/* FIX: Thêm ID để làm "mỏ neo" và scroll-mt để không bị dính Header */}
          <div
            id="apartments-list"
            className="mt-24 mb-12 flex flex-col md:flex-row justify-between items-center md:items-end border-b border-gray-100 pb-10 gap-6 scroll-mt-32"
          >
            <div className="flex flex-col gap-3 text-center md:text-left w-full md:w-auto">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <h2 className="text-3xl md:text-4xl font-headline font-black uppercase tracking-tighter text-gray-900 leading-tight">
                  {sectionTitle}
                </h2>
                {/* {sParams.district && (
                  <Link
                    href="/"
                    className="flex items-center gap-1 text-[10px] font-black text-gray-400 hover:text-red-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 uppercase tracking-widest"
                  >
                    <X className="h-3 w-3" /> Xóa lọc
                  </Link>
                )} */}
              </div>
              <p className="text-xs md:text-sm font-bold text-primary uppercase tracking-[0.2em] italic">
                Tìm thấy {totalResults} căn hộ
              </p>
            </div>
            <SortControls />
          </div>

          <ApartmentList
            initialApartments={apartments}
            searchParams={sParams}
            totalInitialResults={totalResults}
          />

          <div className="mt-32">
            <TrustSection />
          </div>
        </div>
      </main>
      <Footer />
      <MobileNav />
    </>
  );
}
