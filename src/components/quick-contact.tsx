import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";

export default function QuickContact() {
  return (
    <section className="bg-gray-50/50 py-20 lg:py-32 border-t border-gray-100">
      <div className="container mx-auto px-6">
        <div className="lg:grid lg:grid-cols-12 lg:gap-20 items-center">
          
          {/* Trái/Trên: Branding & Slogan */}
          <div className="lg:col-span-6 mb-16 lg:mb-0">
            <h2 className="font-headline text-5xl lg:text-7xl font-black tracking-tighter italic leading-none text-gray-900">
              Kết nối với <br />
              <span className="text-primary">Tư vấn viên</span>
            </h2>
            <p className="mt-8 text-gray-500 font-medium italic border-l-4 border-primary pl-8 max-w-md leading-relaxed">
              "Chúng tôi không chỉ cung cấp căn hộ, chúng tôi định nghĩa lại chuẩn mực sống giữa lòng thủ đô."
            </p>
          </div>

          {/* Phải/Dưới: Contact Cards */}
          <div className="lg:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
              <div className="p-4 bg-primary/5 rounded-2xl w-fit mb-6 group-hover:bg-primary transition-colors">
                <Phone size={24} className="text-primary group-hover:text-white" />
              </div>
              <span className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Hotline 24/7</span>
              <a href="tel:+84355885851" className="text-lg font-black text-gray-900 hover:text-primary transition-colors">+84 355 885 851</a>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
              <div className="p-4 bg-primary/5 rounded-2xl w-fit mb-6 group-hover:bg-primary transition-colors">
                <Mail size={24} className="text-primary group-hover:text-white" />
              </div>
              <span className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Email gửi báo giá</span>
              <a href="mailto:contact@hanoiresidences.vn" className="text-lg font-black text-gray-900 hover:text-primary transition-colors break-all">contact@hanoiresidences.vn</a>
            </div>

            <div className="md:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-xl transition-all group flex items-start gap-8">
              <div className="p-4 bg-primary/5 rounded-2xl w-fit group-hover:bg-primary transition-colors shrink-0">
                <MapPin size={24} className="text-primary group-hover:text-white" />
              </div>
              <div>
                <span className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Trụ sở chính</span>
                <p className="text-lg font-black text-gray-900 leading-tight italic">173B Truong Chinh, Dong Da, Hanoi</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}