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

/** ISR: homepage must stay free of searchParams so CDN can cache. */
export const revalidate = 600;

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
