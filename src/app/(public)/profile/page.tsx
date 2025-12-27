"use client";
import { useUser, useAuth } from "@/firebase/provider";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  Loader2,
  ChevronRight,
  Settings,
  ShieldCheck,
  HelpCircle,
  LogOut,
  Sparkles,
  Bell,
  BadgeCheck,
} from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import MobileNav from "@/components/mobile-nav";
import Link from "next/link";

export default function ProfilePage() {
  const { user, isUserLoading } = useUser() as any;
  const userData = (useUser() as any).userData;
  const auth = useAuth();
  const router = useRouter();

  if (isUserLoading || !user)
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="flex min-h-screen flex-col bg-white font-body">
      <Header />

      <main className="flex-1 container mx-auto px-6 py-12 lg:py-24">
        {/* TIÊU ĐỀ TRANG: Chỉ hiện rõ trên Desktop */}
        <div className="hidden lg:flex items-center justify-between mb-16">
          <h1 className="font-headline text-5xl font-black tracking-tighter italic">
            Hồ sơ cá nhân
          </h1>
          <button className="p-4 bg-gray-50 rounded-full border border-gray-100 hover:bg-gray-100 transition-colors">
            <Bell size={24} />
          </button>
        </div>

        {/* BỐ CỤC GRID: 1 cột trên Mobile, 12 cột trên Desktop */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-20">
          {/* CỘT TRÁI (4/12): THẺ ĐỊNH DANH AIRBNB STYLE */}
          <div className="lg:col-span-4 mb-12 lg:mb-0">
            <div className="bg-white rounded-[3rem] p-10 shadow-[0_30px_100px_rgba(0,0,0,0.08)] border border-gray-50 flex flex-col items-center text-center sticky top-32">
              <div className="h-32 w-32 lg:h-40 lg:w-40 rounded-full overflow-hidden shadow-2xl border-4 border-white mb-8 bg-gray-50">
                {/* FIX: Hiển thị ảnh từ userData để cập nhật tức thì */}
                <img
                  src={
                    userData?.photoURL || user.photoURL || "/default-avatar.png"
                  }
                  className="h-full w-full object-cover transition-opacity duration-500"
                  alt="Avatar"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/default-avatar.png";
                  }}
                />
              </div>
              <h2 className="text-3xl font-black tracking-tight text-gray-900 flex items-center gap-2">
                {userData?.displayName || user.displayName || "Người dùng"}
                <BadgeCheck className="h-6 w-6 text-blue-500 fill-blue-50" />
              </h2>
              <p className="text-gray-400 font-bold text-xs mt-2 uppercase tracking-widest italic leading-none">
                Thành viên Hanoi Residences
              </p>

              <div className="mt-10 pt-8 border-t border-gray-50 w-full text-left space-y-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                    Email xác thực
                  </span>
                  <span className="text-sm font-bold text-gray-700">
                    {user.email}
                  </span>
                </div>
                {userData?.phoneNumber && (
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                      Số điện thoại
                    </span>
                    <span className="text-sm font-bold text-gray-700">
                      {userData.phoneNumber}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (8/12): MENU VÀ HÀNH ĐỘNG */}
          <div className="lg:col-span-8">
            {/* NÚT THU HÚT: Giữ nguyên phong cách đen sang trọng */}
            <Link href="/profile/edit" className="block mb-12 group">
              <div className="relative overflow-hidden rounded-[2.5rem] bg-gray-900 p-10 md:p-14 shadow-2xl transition-all hover:shadow-primary/10 active:scale-[0.98]">
                <div className="relative z-10 flex items-center justify-between text-white">
                  <div className="max-w-[75%] md:max-w-[60%]">
                    <h3 className="text-2xl md:text-3xl font-black tracking-tight mb-3 italic">
                      Cập nhật hồ sơ nhu cầu
                    </h3>
                    <p className="text-xs md:text-sm font-medium opacity-70 leading-relaxed uppercase tracking-[0.2em]">
                      Cho chúng tôi biết gu thẩm mỹ của bạn để nhận báo giá
                      những căn hộ "vừa vặn" nhất.
                    </p>
                  </div>
                  <Sparkles className="h-12 w-12 md:h-16 md:w-16 text-primary animate-pulse shrink-0" />
                </div>
                <div className="absolute top-0 right-0 h-full w-1/2 bg-gradient-to-l from-primary/20 to-transparent opacity-50" />
              </div>
            </Link>

            {/* DANH SÁCH MENU: Giao diện thoáng cho Desktop */}
            <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
              {[
                {
                  icon: Settings,
                  label: "Cài đặt tài khoản",
                  sub: "Quản lý mật khẩu và bảo mật",
                },
                {
                  icon: ShieldCheck,
                  label: "Quyền riêng tư",
                  sub: "Kiểm soát dữ liệu chia sẻ",
                },
                {
                  icon: HelpCircle,
                  label: "Hỗ trợ khách hàng",
                  sub: "Chat trực tiếp với tư vấn viên",
                },
              ].map((item, idx) => (
                <Link
                  key={idx}
                  href="#"
                  className="flex items-center justify-between p-8 rounded-[2rem] border border-gray-50 bg-white hover:bg-gray-50/50 hover:shadow-lg transition-all group"
                >
                  <div className="flex items-center gap-6">
                    <div className="p-4 bg-gray-50 rounded-2xl group-hover:bg-primary/10 transition-colors">
                      <item.icon
                        size={24}
                        className="text-gray-400 group-hover:text-primary"
                      />
                    </div>
                    <div>
                      <span className="block text-base font-black text-gray-800 tracking-tight">
                        {item.label}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {item.sub}
                      </span>
                    </div>
                  </div>
                  <ChevronRight
                    size={20}
                    className="text-gray-300 group-hover:text-primary transition-colors"
                  />
                </Link>
              ))}

              {/* NÚT ĐĂNG XUẤT CHO DESKTOP */}
              <button
                onClick={() => signOut(auth).then(() => router.push("/"))}
                className="flex items-center justify-between p-8 rounded-[2rem] border border-red-50 bg-red-50/30 hover:bg-red-50 transition-all group"
              >
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-white rounded-2xl">
                    <LogOut size={24} className="text-red-500" />
                  </div>
                  <span className="text-sm font-black uppercase tracking-[0.2em] text-red-500">
                    Đăng xuất
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
