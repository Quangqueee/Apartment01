// src/components/featured-districts.tsx
import Link from "next/link";

type DistrictStat = {
  name: string;
  count: number;
};

const DISTRICT_IMAGES: Record<string, string> = {
  "Tây Hồ":
    "https://images.unsplash.com/photo-1741776326857-0f5859c55370?q=80&w=1332&auto=format&fit=crop",
  "Ba Đình":
    "https://xuanphonggroup.com/wp-content/uploads/2021/05/lotte-lieu-giai.jpg",
  "Đống Đa":
    "https://hoidisanvanhoa.vn/wp-content/uploads/2025/02/van-mieu-quoc-tu-giam-9.webp",
  "Cầu Giấy":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Discovery_C%E1%BA%A7u_Gi%E1%BA%A5y.jpg/2560px-Discovery_C%E1%BA%A7u_Gi%E1%BA%A5y.jpg",
};

export default function FeaturedDistricts({
  stats,
}: {
  stats: DistrictStat[];
}) {
  return (
    <section className="py-8">
      <h2 className="mb-10 text-center text-3xl font-black uppercase tracking-tight text-gray-900">
        Khu Vực Tiêu Biểu
      </h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        {stats.map((district) => (
          <Link
            key={district.name}
            href={`/?district=${encodeURIComponent(district.name)}`}
            // SỬA: mask-image để fix lỗi bo góc nhọn, transform-gpu để mượt hơn
            className="group relative h-56 overflow-hidden rounded-[2rem] bg-gray-200 shadow-md transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl transform-gpu"
            style={{ WebkitMaskImage: "-webkit-radial-gradient(white, black)" }}
          >
            <img
              src={DISTRICT_IMAGES[district.name]}
              alt={district.name}
              // SỬA: Thêm transform-gpu
              className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110 transform-gpu"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-500 group-hover:from-orange-600/80" />

            <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 text-white">
              <span className="text-2xl font-black uppercase tracking-widest drop-shadow-lg">
                {district.name}
              </span>

              <div className="mt-3 transform rounded-full bg-white/20 px-4 py-1 text-[11px] font-bold tracking-tighter backdrop-blur-md transition-all duration-300 group-hover:bg-white group-hover:text-orange-600">
                {district.count > 0
                  ? `${district.count.toLocaleString()} CĂN HỘ`
                  : "ĐANG CẬP NHẬT"}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
