"use client";

import Link from "next/link";
import Image from "next/image";

type DistrictStat = {
  name: string;
  count: number;
};

const DISTRICT_IMAGES: Record<string, string> = {
  "Tây Hồ": "/images/photo-1741776326857-0f5859c55370.webp",
  "Ba Đình": "/images/lotte-lieu-giai.webp",
  "Đống Đa": "/images/van-mieu-quoc-tu-giam-9.webp",
  "Cầu Giấy": "images/CauGiay.webp",
};

export default function FeaturedDistricts({
  stats,
}: {
  stats: DistrictStat[];
}) {
  const handleScrollToApartments = () => {
    setTimeout(() => {
      const element = document.getElementById("apartments-list");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);
  };

  return (
    <section className="py-8">
      <h2 className="mb-10 text-center font-headline text-3xl font-semibold tracking-tight text-gray-900">
        Khu Vực Tiêu Biểu
      </h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        {stats.map((district) => {
          // Lấy đúng đường dẫn ảnh, nếu không có thì fallback về chuỗi rỗng để tránh crash
          const imageUrl = DISTRICT_IMAGES[district.name] || "";

          return (
            <Link
              key={district.name}
              href={`/?district=${encodeURIComponent(district.name)}`}
              scroll={false}
              onClick={handleScrollToApartments}
              className="group relative h-[280px] overflow-hidden rounded-[2rem] bg-gray-200 shadow-md transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl transform-gpu"
              style={{
                WebkitMaskImage: "-webkit-radial-gradient(white, black)",
              }}
            >
              {imageUrl && (
                <Image
                  src={imageUrl}
                  alt={`Căn hộ dịch vụ cao cấp cho thuê tại ${district.name}, Hà Nội`}
                  fill
                  // Tối ưu sizes chính xác theo layout 2 cột trên mobile và 4 cột trên desktop
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 300px"
                  // Bật priority cho toàn bộ các ảnh khu vực tiêu biểu vì chúng đều nằm ở phần đầu trang (Above the fold)
                  priority={true}
                  className="object-cover transition-transform duration-1000 group-hover:scale-110 transform-gpu"
                />
              )}

              {/* 1. Lớp phủ đen mờ mặc định */}
              <div className="absolute inset-0 bg-black/40 transition-opacity duration-500 group-hover:opacity-0" />

              {/* 2. Lớp phủ Gradient vàng sang trọng khi hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#9a7b24]/90 via-[#cda533]/80 to-[#e4c467]/60 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

              {/* Container 1: Tên quận căn giữa tuyệt đối */}
              <div className="absolute inset-0 flex items-center justify-center px-4">
                <span className="font-headline text-3xl font-bold uppercase tracking-widest text-white drop-shadow-2xl text-center">
                  {district.name}
                </span>
              </div>

              {/* Container 2: Nút số lượng neo ở dưới cùng */}
              <div className="absolute bottom-0 inset-x-0 flex justify-center pb-10">
                <div className="transform rounded-full border border-white/30 bg-white/20 px-5 py-1.5 text-xs font-bold tracking-wider text-white backdrop-blur-md transition-all duration-300 group-hover:bg-white group-hover:text-[#cda533] shadow-sm">
                  {district.count > 0
                    ? `${district.count.toLocaleString()} CĂN HỘ`
                    : "ĐANG CẬP NHẬT"}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
