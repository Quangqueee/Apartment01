import { getApartments } from "@/lib/data";
import Header from "@/components/header";
import Footer from "@/components/footer";
import SortControls from "@/components/sort-controls";
import ApartmentList from "@/components/apartment-list";
import Hero from "@/components/hero";
import FeaturedDistricts from "@/components/featured-districts";
import MobileNav from "@/components/mobile-nav";
import AboutSection from "@/app/about/page";
import { redirect } from "next/navigation";

export const revalidate = 604800;

export default async function Home({ searchParams }: any) {
  const sParams = await searchParams;

  const redirectParams = new URLSearchParams();
  for (const key of ["query", "district", "price", "roomType", "sort"] as const) {
    if (sParams[key]) redirectParams.set(key, String(sParams[key]));
  }
  if (sParams.query || sParams.district || sParams.price || sParams.roomType) {
    redirect(`/tim-kiem?${redirectParams.toString()}`);
  }

  const { apartments, totalResults } = await getApartments({
    page: 1,
    limit: 12,
    sortBy: sParams.sort,
  });

  // CHỈ LÀM PHẲNG MẢNG APARTMENTS Ở TRANG CHỦ
  const serializedApartments = JSON.parse(JSON.stringify(apartments));

  const districtNames = ["Tây Hồ", "Ba Đình", "Đống Đa", "Cầu Giấy"];
  const districtStats = await Promise.all(
    districtNames.map(async (name) => {
      const { totalResults } = await getApartments({
        district: name,
        limit: 1,
      });
      return { name, count: totalResults };
    }),
  );

  return (
    <>
      <Header />
      <Hero />
      <main className="bg-white">
        <div className="container mx-auto px-4 py-10 lg:py-12">
          <FeaturedDistricts stats={districtStats} />

          {/* Danh sách căn hộ & Bộ lọc */}
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
            <SortControls />
          </div>

          {/* Truyền mảng đã được xử lý thay vì mảng gốc */}
          <ApartmentList
            initialApartments={serializedApartments}
            searchParams={sParams}
            totalInitialResults={totalResults}
          />

          {/* PHẦN ABOUT */}
          <div
            id="about"
            className="scroll-mt-28 mt-20 border-t border-gray-100 pt-12"
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
