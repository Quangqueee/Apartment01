// src/app/page.tsx
import { getApartments } from "@/lib/data";
import Header from "@/components/header";
import Footer from "@/components/footer";
import SortControls from "@/components/sort-controls";
import ApartmentList from "@/components/apartment-list";
import Hero from "@/components/hero";
import FeaturedDistricts from "@/components/featured-districts";
import TrustSection from "@/components/trust-section";
import MobileNav from "@/components/mobile-nav";

export const dynamic = "force-dynamic";

type HomeProps = {
  searchParams: Promise<{
    q?: string;
    district?: string;
    price?: string;
    roomType?: string;
    sort?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const sParams = await searchParams; // Next.js 16 fix

  // 1. Lấy danh sách căn hộ chính
  const { apartments, totalResults } = await getApartments({
    query: sParams.q,
    district: sParams.district,
    priceRange: sParams.price,
    roomType: sParams.roomType,
    page: 1,
    limit: 9,
    sortBy: sParams.sort,
  });

  // 2. THỐNG KÊ THỰC TẾ: Tây Hồ, Ba Đình, Đống Đa, Cầu Giấy
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

  // --- LOGIC MỚI: Cập nhật tiêu đề động dựa trên quận đã chọn ---
  const selectedDistrict = sParams.district;
  const sectionTitle = selectedDistrict
    ? `CĂN HỘ TẠI ${selectedDistrict.toUpperCase()}`
    : "CĂN HỘ NỔI BẬT";

  return (
    <>
      <Header />
      <Hero />

      <main className="flex-1 pb-20 md:pb-0 bg-white">
        <div className="container mx-auto px-4 py-12">
          <FeaturedDistricts stats={districtStats} />

          {/* Tiêu đề danh sách mạnh mẽ và động theo khu vực */}
          <div className="mt-20 mb-10 flex flex-col items-baseline justify-between gap-6 border-b border-gray-100 pb-8 md:flex-row">
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-900 md:text-4xl">
                {sectionTitle} {/* Hiển thị tiêu đề động tại đây */}
              </h2>
              <p className="mt-2 text-sm font-medium text-orange-600 italic">
                {selectedDistrict
                  ? `Tìm thấy ${totalResults} căn hộ tại khu vực này.`
                  : `Tìm thấy ${totalResults} căn hộ`}
              </p>
            </div>
            <SortControls />
          </div>

          <ApartmentList
            initialApartments={apartments}
            searchParams={sParams}
            totalInitialResults={totalResults}
          />

          <div className="mt-24 pt-16 border-t border-gray-50">
            <TrustSection />
          </div>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </>
  );
}
