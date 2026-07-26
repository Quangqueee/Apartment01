"use client";

import { useAuth as useAppAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { db } from "@/firebase";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { Loader2, Users, CheckCircle2, PhoneCall } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import Link from "next/link";

interface UserData {
  displayName?: string;
  phoneNumber?: string;
  dob?: string;
  gender?: string;
  requestStatus?: string;
}

// Component nhỏ để đếm lùi số giây hiển thị ngay trong Toast
const CountdownToast = ({ duration }: { duration: number }) => {
  const [timeLeft, setTimeLeft] = useState(duration / 1000);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-[10px] font-bold text-green-700 ml-2 shadow-inner border border-green-200">
      {timeLeft}
    </span>
  );
};

export default function CtvRegisterPage() {
  const { user, userData, loading } = useAppAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const hasHydratedRef = useRef(false);
  const typedUserData = userData as UserData | null;

  const [ctvForm, setCtvForm] = useState({
    displayName: "",
    phoneNumber: "",
    age: "",
    gender: "",
    introduction: "",
  });

  useEffect(() => {
    if (!loading && user && !hasHydratedRef.current) {
      setCtvForm((prev) => ({
        ...prev,
        displayName: typedUserData?.displayName || user.displayName || "",
        phoneNumber: typedUserData?.phoneNumber || "",
        age: typedUserData?.dob || "",
        gender: typedUserData?.gender || "",
      }));
      hasHydratedRef.current = true;
    }
  }, [user, typedUserData, loading]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white flex-col gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-gray-900" />
        <p className="text-sm text-gray-500 font-medium animate-pulse">
          Đang tải dữ liệu...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Header />
        <main className="flex-1 container mx-auto px-6 py-20 max-w-3xl text-center flex flex-col items-center justify-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-orange-50 text-orange-600">
            <Users className="h-10 w-10" />
          </div>
          <h1 className="text-4xl font-black uppercase text-gray-900 tracking-tighter mb-4">
            Hợp tác cùng Hanoi Residences
          </h1>
          <p className="text-gray-500 mb-10 max-w-xl text-sm leading-relaxed">
            Để đảm bảo chất lượng, tính bảo mật của nguồn hàng và quyền lợi hoa
            hồng, vui lòng đăng nhập hoặc tạo tài khoản thành viên trước khi gửi
            hồ sơ đăng ký Cộng tác viên.
          </p>
          <Link
            href="/login?redirect=/ctv-register"
            className="rounded-2xl bg-gray-900 px-10 py-4 font-bold text-white hover:bg-orange-600 transition-all shadow-lg uppercase tracking-widest text-xs"
          >
            Đăng nhập / Đăng ký để tiếp tục
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const isRequestPending =
    typedUserData?.requestStatus === "pending" || hasSubmitted;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRequestPending || isSubmitting) return;

    if (
      !ctvForm.displayName.trim() ||
      !ctvForm.phoneNumber.trim() ||
      !ctvForm.age.trim() ||
      !ctvForm.gender ||
      !ctvForm.introduction.trim()
    ) {
      toast({
        variant: "destructive",
        title: "Thiếu thông tin",
        description:
          "Vui lòng điền đầy đủ tất cả các trường thông tin bắt buộc.",
      });
      return;
    }

    const ageNum = Number(ctvForm.age.trim());
    const currentYear = new Date().getFullYear();
    if (
      !/^\d{4}$/.test(ctvForm.age.trim()) ||
      ageNum < 1940 ||
      ageNum > currentYear - 16
    ) {
      toast({
        variant: "destructive",
        title: "Năm sinh không hợp lệ",
        description: "Vui lòng nhập năm sinh hợp lệ (VD: 1995).",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          email: user.email ?? "",
          displayName: ctvForm.displayName,
          phoneNumber: ctvForm.phoneNumber,
          dob: ctvForm.age,
          gender: ctvForm.gender,
          ctvIntroduction: ctvForm.introduction,
          requestStatus: "pending",
          requestSubmittedAt: serverTimestamp(),
        },
        { merge: true },
      );

      // Thời gian hiển thị Toast (10 giây)
      const toastDuration = 60000; // 60 giây

      // Render nội dung Toast cực đẹp với JSX
      toast({
        title: (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <span className="text-gray-900 font-black text-base tracking-tight">
              Gửi yêu cầu thành công!
            </span>
          </div>
        ) as any,
        description: (
          <div className="mt-2 space-y-3.5">
            <p className="text-gray-600 text-sm leading-relaxed">
              Chúng tôi đã nhận được yêu cầu của bạn. Bạn sẽ được thông báo khi
              hồ sơ của bạn được xét duyệt.
            </p>

            {/* Box Support nổi bật với nền tối và điểm nhấn màu cam */}
            <div className="group relative flex items-center justify-between overflow-hidden rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 p-3.5 shadow-lg">
              {/* Hiệu ứng sáng mờ ảo ở góc phải */}
              <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-orange-500/20 blur-2xl transition-all group-hover:scale-150"></div>

              <div className="z-10 flex items-center gap-2.5">
                <div className="flex h-7 w-7 animate-pulse items-center justify-center rounded-full bg-orange-500/20 text-orange-400">
                  <PhoneCall className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-medium text-gray-300">
                  Hỗ trợ nhanh:
                </span>
              </div>

              {/* Số điện thoại trắng nổi bật trên nền xám tối */}
              <span className="z-10 rounded-lg border border-white/10 bg-white/10 px-2.5 py-1.5 text-[13px] font-black tracking-wide text-white shadow-sm backdrop-blur-md">
                035.5885.851{" "}
                <span className="font-medium text-gray-300">(Quang)</span>
              </span>
            </div>

            <div className="flex items-center justify-end pt-1 gap-1.5">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                Tự động đóng sau
              </span>
              {/* Khuyên bạn nên đổi class text-green-700 trong CountdownToast thành text-orange-600 nếu thích đồng bộ */}
              <CountdownToast duration={toastDuration} />
            </div>
          </div>
        ) as any,
        duration: toastDuration,
        // Chuyển background Toast về trắng, tăng bo góc để viền chạy đẹp hơn
        // Xóa border-0 đi để viền sáng có đất diễn
        className:
          "bg-white backdrop-blur-sm toast-success-border shadow-2xl p-5 rounded-2xl",
      });

      setHasSubmitted(true);
    } catch (error) {
      console.error("Lỗi khi gửi yêu cầu CTV: ", error);
      toast({
        variant: "destructive",
        title: "Lỗi hệ thống",
        description: "Không thể gửi yêu cầu lúc này. Vui lòng thử lại sau.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-1 container mx-auto px-6 py-12 max-w-2xl">
        <h1 className="text-3xl font-black italic mb-2">
          Đăng ký Cộng tác viên
        </h1>
        <p className="text-gray-500 mb-8">
          Điền thông tin để trở thành đối tác của Hanoi Residences.
        </p>

        {isRequestPending ? (
          <div className="p-6 bg-amber-50 rounded-xl border border-amber-100 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 mb-4">
              <CheckCircle2 className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="text-amber-800 font-bold mb-2 text-lg">
              Hồ sơ đang được xét duyệt
            </h3>
            <p className="text-sm text-amber-700/80 max-w-md mx-auto leading-relaxed">
              Vui lòng giữ liên lạc, đội ngũ quản lý sẽ liên hệ với bạn qua số
              điện thoại đã đăng ký để trao đổi thêm.
            </p>
            <button
              onClick={() => router.push("/")}
              className="mt-6 px-6 py-2.5 bg-white rounded-xl text-sm font-bold shadow-sm border border-amber-200 hover:bg-amber-100/50 hover:text-amber-900 transition-colors"
            >
              Quay lại Trang chủ
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-gray-500">
                  Họ và tên *
                </label>
                <input
                  required
                  type="text"
                  value={ctvForm.displayName}
                  onChange={(e) =>
                    setCtvForm({ ...ctvForm, displayName: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all text-sm bg-gray-50/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-gray-500">
                  Số điện thoại *
                </label>
                <input
                  required
                  type="tel"
                  value={ctvForm.phoneNumber}
                  onChange={(e) =>
                    setCtvForm({ ...ctvForm, phoneNumber: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all text-sm bg-gray-50/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-gray-500">
                  Năm sinh *
                </label>
                <input
                  required
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="VD: 1995"
                  value={ctvForm.age}
                  onChange={(e) => {
                    const digitsOnly = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 4);
                    setCtvForm({ ...ctvForm, age: digitsOnly });
                  }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all text-sm bg-gray-50/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-gray-500">
                  Giới tính *
                </label>
                <select
                  required
                  value={ctvForm.gender}
                  onChange={(e) =>
                    setCtvForm({ ...ctvForm, gender: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all text-sm bg-gray-50/50 appearance-none"
                >
                  <option value="" disabled>
                    Chọn giới tính
                  </option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-gray-500">
                Kinh Nghiệm / Giới thiệu bản thân *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Hãy giới thiệu về bản thân, kinh nghiệm làm việc. Nếu bạn là một người mới và chưa có kinh nghiệm, hãy thẳng thắn trao đổi, chúng tôi sẽ chủ động liên hệ và hướng dẫn bạn."
                value={ctvForm.introduction}
                onChange={(e) =>
                  setCtvForm({ ...ctvForm, introduction: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all text-sm resize-none bg-gray-50/50 leading-relaxed"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || hasSubmitted}
              className="w-full px-6 py-4 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-orange-600 flex items-center justify-center transition-all shadow-lg disabled:opacity-50 mt-8 uppercase tracking-widest"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin mr-3" />
              ) : null}
              {isSubmitting ? "Đang gửi hồ sơ..." : "Xác nhận gửi hồ sơ"}
            </button>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}
