import { getApartments } from "@/lib/data";
import Header from "@/components/header";
import Footer from "@/components/footer";
import SortControls from "@/components/sort-controls";
import ApartmentList from "@/components/apartment-list";
import Hero from "@/components/hero";
import FeaturedDistricts from "@/components/featured-districts";
import MobileNav from "@/components/mobile-nav";
import Link from "next/link";
import { X } from "lucide-react";

// Import component About (đường dẫn đã fix)
import AboutSection from "@/app/about/page";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: any) {
  const sParams = await searchParams;

  const { apartments, totalResults } = await getApartments({
    query: sParams.query,
    district: sParams.district,
    priceRange: sParams.price,
    roomType: sParams.roomType,
    page: 1,
    limit: 12, // <--- ĐÃ TĂNG LÊN 12 CĂN
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

  let sectionTitle = "CĂN HỘ NỔI BẬT";
  if (sParams.query) {
    sectionTitle = `KẾT QUẢ TÌM KIẾM: "${sParams.query}"`;
  } else if (sParams.district) {
    sectionTitle = `CĂN HỘ TẠI ${sParams.district.toUpperCase()}`;
  }

  return (
    <>
      <Header />
      <Hero />
      <main className="bg-white">
        <div className="container mx-auto px-4 py-16">
          <FeaturedDistricts stats={districtStats} />

          {/* Danh sách căn hộ & Bộ lọc */}
          <div
            id="apartments-list"
            className="mt-24 mb-12 flex flex-col md:flex-row justify-between items-center md:items-end border-b border-gray-100 pb-10 gap-6 scroll-mt-32"
          >
            <div className="flex flex-col gap-3 text-center md:text-left w-full md:w-auto">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <h2 className="text-3xl md:text-4xl font-headline font-black uppercase tracking-tighter text-gray-900 leading-tight">
                  {sectionTitle}
                </h2>
                {(sParams.district ||
                  sParams.query ||
                  sParams.price ||
                  sParams.roomType) && (
                  <Link
                    href="/"
                    className="flex items-center gap-1 text-[10px] font-black text-gray-400 hover:text-red-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 uppercase tracking-widest transition-colors"
                  >
                    <X className="h-3 w-3" /> Xóa lọc
                  </Link>
                )}
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

          {/* PHẦN ABOUT */}
          <div
            id="about"
            className="scroll-mt-28 mt-32 border-t border-gray-100 pt-16"
          >
            <AboutSection />
          </div>
        </div>
      </main>
      <Footer />
      <MobileNav />
    </>
  );
}
