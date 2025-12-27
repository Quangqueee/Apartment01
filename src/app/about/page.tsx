"use client";

import {
  Building,
  ShieldCheck,
  Star,
  Key,
  CheckCircle2,
  Phone,
  Handshake,
} from "lucide-react";
import Link from "next/link";

export default function AboutSection() {
  return (
    <section className="bg-white font-sans text-gray-800">
      {/* 1. HERO SECTION (Giữ nguyên của bạn) */}
      <div className="relative h-[50vh] md:h-[60vh] flex items-center justify-center bg-[#1a1a1a] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center bg-fixed" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent" />

        <div className="relative z-10 container mx-auto px-6 text-center space-y-6">
          <span className="inline-block py-1.5 px-4 rounded-full border border-[#cda533] text-[#cda533] text-xs font-bold uppercase tracking-widest bg-black/50 backdrop-blur-md">
            Since 2020
          </span>

          <h1 className="font-headline text-4xl md:text-6xl font-bold leading-tight">
            Trải nghiệm sống <br />{" "}
            <span className="text-[#cda533] italic">Tiện Nghi & Văn Minh</span>
          </h1>

          <p className="max-w-3xl mx-auto text-gray-200 font-sans text-lg md:text-xl leading-relaxed font-medium">
            Hanoi Residences mang đến hệ thống căn hộ dịch vụ đa dạng, an ninh
            đảm bảo và đầy đủ nội thất. Nơi bạn chỉ cần xách vali vào ở và tận
            hưởng cuộc sống thoải mái.
          </p>
        </div>
      </div>

      {/* 2. THỐNG KÊ UY TÍN */}
      <div className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-gray-100">
            <StatItem number="300+" label="Căn hộ quản lý" />
            <StatItem number="5.000+" label="Khách hàng tin chọn" />
            <StatItem number="96%" label="Tỷ lệ lấp đầy" />
            <StatItem number="24/7" label="Hỗ trợ khách hàng" />
          </div>
        </div>
      </div>

      {/* 3. GIÁ TRỊ CỐT LÕI */}
      <div className="py-20 bg-[#F9F9F9]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-headline text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tại sao chọn Hanoi Residences?
            </h2>
            <p className="text-gray-600 font-sans text-base max-w-xl mx-auto">
              Chúng tôi hiểu rằng bạn cần một không gian sống không chỉ đẹp mà
              còn phải tiện lợi, minh bạch và được hỗ trợ nhanh chóng.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={ShieldCheck}
              title="Minh bạch & An toàn"
              desc="Hình ảnh thực tế, giá niêm yết rõ ràng, hợp đồng pháp lý đầy đủ. Hệ thống an ninh bảo vệ sự riêng tư của bạn và an toàn."
            />
            <FeatureCard
              icon={Star}
              title="Dịch vụ tận tâm"
              desc="Đội ngũ CSKH hỗ trợ nhiệt tình. Dịch vụ chỉn chu giúp bạn thảnh thơi tận hưởng."
            />
            <FeatureCard
              icon={Building}
              title="Đa dạng phân khúc"
              desc="Đầy đủ các thiết kế căn hộ từ Studio - 1 ngủ, 2 ngủ,... rộng rãi cho gia đình. Phủ sóng khắp các quận trung tâm Hà Nội."
            />
          </div>
        </div>
      </div>

      {/* 4. DÀNH CHO CHỦ NHÀ (PARTNER SECTION) */}
      <div className="py-20 md:py-28 bg-[#1a1a1a] text-white relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#cda533] rounded-full blur-[150px] opacity-15 pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="space-y-8">
              <div>
                <h2 className="text-[#cda533] font-bold text-sm uppercase tracking-[0.2em] mb-2">
                  Hợp tác cùng phát triển
                </h2>
                <h3 className="font-headline text-3xl md:text-4xl font-bold leading-tight">
                  Giải pháp tối ưu cho <br /> Chủ nhà & Nhà đầu tư
                </h3>
              </div>

              <p className="text-gray-300 text-lg font-sans leading-relaxed">
                Bạn có căn hộ trống nhưng không có thời gian quản lý? Hay bạn
                đang tìm kiếm nguồn khách ổn định? Hanoi Residences cung cấp
                giải pháp linh hoạt phù hợp với nhu cầu của bạn.
              </p>

              <div className="space-y-6">
                {/* Option 1 */}
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-[#cda533]/20 flex items-center justify-center text-[#cda533] shrink-0">
                    <Handshake size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-white">
                      Kết hợp Môi giới & Lấp phòng
                    </h4>
                    <p className="text-sm text-gray-400 mt-1">
                      Chúng tôi có nguồn khách hàng dồi dào, đội ngũ chuyên viên
                      chủ động dẫn khách, giúp bạn tìm kiếm khách thuê nhanh
                      chóng với chi phí hợp lý.
                    </p>
                  </div>
                </div>

                {/* Option 2 */}
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-[#cda533]/20 flex items-center justify-center text-[#cda533] shrink-0">
                    <Key size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-white">
                      Quản lý & Vận hành trọn gói
                    </h4>
                    <p className="text-sm text-gray-400 mt-1">
                      Bạn chỉ cần giao chìa khóa, chúng tôi lo mọi việc: tìm
                      khách, bảo trì, thu tiền và báo cáo doanh thu hàng tháng.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <a
                  href="tel:+84355885851"
                  className="inline-flex items-center gap-3 bg-white text-black px-8 py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-[#cda533] hover:text-white transition-all shadow-lg"
                >
                  <Phone className="h-5 w-5" /> Liên hệ hợp tác
                </a>
              </div>
            </div>

            {/* Visual */}
            <div className="relative h-full min-h-[400px]">
              <div className="absolute inset-0 bg-gray-800 rounded-2xl overflow-hidden border border-gray-700">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1932&auto=format&fit=crop')] bg-cover bg-center opacity-60 hover:scale-105 transition-transform duration-700" />

                {/* Floating Card */}
                <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-6 rounded-xl text-gray-900 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-bold text-lg">Hiệu quả hợp tác</span>
                    <span className="text-[#cda533] font-black text-xl">
                      Top 1
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm font-medium text-gray-600">
                      <span>Tốc độ lấp phòng</span>
                      <span className="text-green-600 font-bold">3-7 ngày</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full w-[90%]" />
                    </div>
                    <div className="flex justify-between text-sm font-medium text-gray-600">
                      <span>Khách thuê dài hạn</span>
                      <span className="text-blue-600 font-bold">85%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full w-[85%]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. CALL TO ACTION (ĐÃ SỬA LINK) */}
      <div className="py-20 bg-white text-center">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="font-headline text-3xl font-bold text-gray-900 mb-6">
            Tìm kiếm không gian sống hoàn hảo?
          </h2>
          <p className="text-gray-500 mb-8 font-sans">
            Khám phá bộ sưu tập căn hộ mới nhất của chúng tôi và chọn cho mình
            một nơi ở ưng ý ngay hôm nay.
          </p>

          {/* NÚT NÀY SẼ CUỘN LÊN DANH SÁCH CĂN HỘ */}
          <Link
            href="#apartments-list"
            className="inline-block px-10 py-4 bg-gray-900 text-white font-bold uppercase tracking-widest rounded-xl hover:bg-[#cda533] transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Xem danh sách căn hộ
          </Link>
        </div>
      </div>
    </section>
  );
}

// --- HELPER COMPONENTS (Giữ nguyên của bạn) ---

function StatItem({ number, label }: { number: string; label: string }) {
  return (
    <div className="space-y-2">
      <div className="font-headline text-4xl md:text-5xl font-bold text-[#cda533]">
        {number}
      </div>
      <div className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest">
        {label}
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: any;
  title: string;
  desc: string;
}) {
  return (
    <div className="bg-white p-8 rounded-2xl border border-gray-100 hover:border-[#cda533]/30 hover:shadow-xl hover:shadow-[#cda533]/5 transition-all group">
      <div className="h-14 w-14 rounded-xl bg-[#cda533]/10 flex items-center justify-center text-[#cda533] mb-6 group-hover:scale-110 transition-transform">
        <Icon size={28} />
      </div>
      <h3 className="font-bold text-xl text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-500 leading-relaxed text-sm font-sans">{desc}</p>
    </div>
  );
}
