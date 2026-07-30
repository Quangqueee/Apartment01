"use client";
import { useAuth as useAppAuth } from "@/context/auth-context";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { db, auth } from "@/firebase";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
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
  User as UserIcon,
} from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import MobileNav from "@/components/mobile-nav";
import Link from "next/link";

// Import Dialog components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function ProfilePage() {
  const { user, userData, loading: isUserLoading } = useAppAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Trạng thái Form & Modal
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [hasSubmittedRequest, setHasSubmittedRequest] = useState(false);
  const [isCtvModalOpen, setIsCtvModalOpen] = useState(false);

  // Dữ liệu Form
  const [ctvForm, setCtvForm] = useState({
    displayName: "",
    phoneNumber: "",
    age: "",
    gender: "Nam",
    introduction: "",
  });

  const currentRole = userData?.role;
  const isPrivilegedUser =
    currentRole === "collaborator" || currentRole === "admin";
  const isRequestPending =
    (userData as any)?.requestStatus === "pending" || hasSubmittedRequest;

  // Hàm mở Modal và nạp sẵn dữ liệu cũ nếu có
  const handleOpenCtvModal = () => {
    if (isRequestPending || isSubmittingRequest) return;
    setCtvForm({
      displayName: userData?.displayName || user?.displayName || "",
      phoneNumber: userData?.phoneNumber || "",
      age: userData?.dob || "",
      gender: userData?.gender || "Nam",
      introduction: "",
    });
    setIsCtvModalOpen(true);
  };

  // Hàm Submit Form CTV
  const handleSubmitCollaboratorRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isRequestPending || isSubmittingRequest) return;

    // Validate sơ bộ
    if (!ctvForm.displayName || !ctvForm.phoneNumber) {
      toast({
        variant: "destructive",
        title: "Thiếu thông tin",
        description: "Vui lòng điền đầy đủ Tên và Số điện thoại.",
      });
      return;
    }

    setIsSubmittingRequest(true);
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          email: user.email ?? "",
          displayName: ctvForm.displayName,
          phoneNumber: ctvForm.phoneNumber,
          dob: ctvForm.age, // Lưu tuổi/năm sinh vào dob
          gender: ctvForm.gender,
          interests: `[Yêu cầu làm CTV]: ${ctvForm.introduction}`, // Đánh dấu đây là yêu cầu CTV
          role: userData?.role ?? "user",
          requestStatus: "pending",
          requestSubmittedAt: serverTimestamp(),
        },
        { merge: true },
      );

      toast({
        title: "Gửi yêu cầu thành công!",
        description:
          "Thông tin của bạn đã được gửi. BQT sẽ xem xét và liên hệ sớm.",
      });
      setHasSubmittedRequest(true);
      setIsCtvModalOpen(false); // Đóng modal
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Gửi yêu cầu thất bại",
        description: "Không thể gửi yêu cầu đăng ký CTV. Vui lòng thử lại.",
      });
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  if (isUserLoading || !user)
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );

  const rawAvatar = userData?.photoURL || user.photoURL;
  const displayAvatar = rawAvatar
    ? `${rawAvatar}?t=${new Date().getTime()}`
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-white font-body">
      <Header />

      <main className="flex-1 container mx-auto px-6 py-12 lg:py-24">
        {/* Header Desktop */}
        <div className="hidden lg:flex items-center justify-between mb-16">
          <h1 className="font-headline text-5xl font-black tracking-tighter italic">
            Hồ sơ cá nhân
          </h1>
          <button className="p-4 bg-gray-50 rounded-full border border-gray-100 hover:bg-gray-100 transition-colors">
            <Bell size={24} />
          </button>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-20">
          {/* CỘT TRÁI: INFO CARD */}
          <div className="lg:col-span-4 mb-12 lg:mb-0">
            <div className="bg-white rounded-[3rem] p-10 shadow-[0_30px_100px_rgba(0,0,0,0.08)] border border-gray-50 flex flex-col items-center text-center sticky top-32">
              <div className="h-32 w-32 lg:h-40 lg:w-40 rounded-full overflow-hidden shadow-2xl border-4 border-white mb-8 bg-gray-50 flex items-center justify-center">
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    className="h-full w-full object-cover"
                    alt="Avatar"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <UserIcon className="h-16 w-16 text-gray-300" />
                )}
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
                    Email
                  </span>
                  <span className="text-sm font-bold text-gray-700 truncate">
                    {user.email}
                  </span>
                </div>
                {userData?.phoneNumber && (
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                      SĐT
                    </span>
                    <span className="text-sm font-bold text-gray-700">
                      {userData.phoneNumber}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: MENU */}
          <div className="lg:col-span-8">
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

            {/* BLOCK ĐĂNG KÝ CTV */}
            {!isPrivilegedUser && (
              <div className="mb-12 rounded-[2.5rem] border border-amber-100 bg-amber-50/40 p-8 md:p-10">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-black tracking-tight text-gray-900 italic">
                      Đăng ký CTV
                    </h3>
                    <p className="mt-2 text-xs font-bold uppercase tracking-widest text-gray-500">
                      Mở quyền đăng tin và hỗ trợ khách hàng cùng đội ngũ.
                    </p>
                  </div>
                </div>

                {isRequestPending ? (
                  <div className="mt-6 inline-flex items-center justify-center rounded-2xl bg-gray-300 px-6 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white">
                    Đã gửi yêu cầu
                  </div>
                ) : (
                  <button
                    onClick={handleOpenCtvModal}
                    className="mt-6 inline-flex items-center justify-center rounded-2xl bg-gray-900 px-6 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-primary"
                  >
                    Gửi yêu cầu ngay
                  </button>
                )}
              </div>
            )}

            <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
              {[
                {
                  icon: Settings,
                  label: "Cài đặt tài khoản",
                  sub: "Đổi mật khẩu & thông tin cá nhân",
                  href: "/profile/settings",
                },
                {
                  icon: ShieldCheck,
                  label: "Quyền riêng tư",
                  sub: "Kiểm soát dữ liệu chia sẻ",
                  href: "#",
                },
                {
                  icon: HelpCircle,
                  label: "Hỗ trợ khách hàng",
                  sub: "Chat trực tiếp với tư vấn viên",
                  href: "https://zalo.me/0355885851",
                },
              ].map((item, idx) => (
                <Link
                  key={idx}
                  href={item.href}
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

              <button
                onClick={() => signOut(auth).then(() => router.push("/"))}
                className="flex items-center justify-between p-8 rounded-[2rem] border border-red-50 bg-red-50/30 hover:bg-red-50 transition-all group w-full"
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

      {/* DIALOG (MODAL) ĐĂNG KÝ CTV */}
      <Dialog open={isCtvModalOpen} onOpenChange={setIsCtvModalOpen}>
        <DialogContent className="bg-white z-[100] sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black italic tracking-tight">
              Biểu mẫu Đăng ký CTV
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-sm">
              Vui lòng điền thông tin để chúng tôi liên hệ và xét duyệt cấp
              quyền cho bạn.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmitCollaboratorRequest}
            className="space-y-4 mt-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-gray-500">
                  Họ và tên *
                </label>
                <input
                  required
                  type="text"
                  placeholder="Nhập họ tên"
                  value={ctvForm.displayName}
                  onChange={(e) =>
                    setCtvForm({ ...ctvForm, displayName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-primary text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-gray-500">
                  Số điện thoại *
                </label>
                <input
                  required
                  type="tel"
                  placeholder="Nhập SĐT (có Zalo)"
                  value={ctvForm.phoneNumber}
                  onChange={(e) =>
                    setCtvForm({ ...ctvForm, phoneNumber: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-primary text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-gray-500">
                  Năm sinh
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: 1998"
                  value={ctvForm.age}
                  onChange={(e) =>
                    setCtvForm({ ...ctvForm, age: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-primary text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-gray-500">
                  Giới tính
                </label>
                <select
                  value={ctvForm.gender}
                  onChange={(e) =>
                    setCtvForm({ ...ctvForm, gender: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-primary text-sm bg-white"
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-gray-500">
                Kinh nghiệm / Giới thiệu bản thân
              </label>
              <textarea
                rows={4}
                placeholder="Kinh nghiệm của bạn, khu vực muốn chạy, quỹ thời gian rảnh..."
                value={ctvForm.introduction}
                onChange={(e) =>
                  setCtvForm({ ...ctvForm, introduction: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-primary text-sm resize-none"
              ></textarea>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCtvModalOpen(false)}
                className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmittingRequest}
                className="px-6 py-2 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary/90 flex items-center"
              >
                {isSubmittingRequest ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Đang gửi...
                  </>
                ) : (
                  "Xác nhận gửi"
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
