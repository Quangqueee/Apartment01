"use client";

import { useAuth as useAppAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { db } from "@/firebase";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";

export default function CtvRegisterPage() {
  const { user, userData, loading } = useAppAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [ctvForm, setCtvForm] = useState({
    displayName: "",
    phoneNumber: "",
    age: "",
    gender: "Nam",
    introduction: "",
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/login?redirect=/ctv-register`);
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      setCtvForm((prev) => ({
        ...prev,
        displayName: (userData as any)?.displayName || user.displayName || "",
        phoneNumber: (userData as any)?.phoneNumber || "",
        age: (userData as any)?.dob || "",
        gender: (userData as any)?.gender || "Nam",
      }));
    }
  }, [user, userData]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-gray-900" />
      </div>
    );
  }

  const isRequestPending =
    (userData as any)?.requestStatus === "pending" || hasSubmitted;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRequestPending || isSubmitting) return;

    if (!ctvForm.displayName || !ctvForm.phoneNumber) {
      toast({
        variant: "destructive",
        title: "Thiếu thông tin",
        description: "Vui lòng điền đầy đủ Tên và Số điện thoại.",
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
          interests: `[Yêu cầu làm CTV]: ${ctvForm.introduction}`,
          role: (userData as any)?.role ?? "user",
          requestStatus: "pending",
          requestSubmittedAt: serverTimestamp(),
        },
        { merge: true },
      );

      toast({
        title: "Gửi yêu cầu thành công!",
        description: "BQT sẽ xem xét và liên hệ sớm.",
      });
      setHasSubmitted(true);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể gửi yêu cầu.",
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
          <div className="p-6 bg-amber-50 rounded-xl border border-amber-100 text-center">
            <h3 className="text-amber-600 font-bold mb-2">
              Yêu cầu đã được gửi
            </h3>
            <p className="text-sm text-amber-700">
              Chúng tôi đang xét duyệt hồ sơ của bạn.
            </p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 px-4 py-2 bg-white rounded-lg text-sm font-bold shadow-sm border border-amber-200"
            >
              Về trang chủ
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-gray-500">
                  Họ và tên *
                </label>
                <input
                  required
                  type="text"
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
                Kinh Nghiệm làm việc / Giới thiệu bản thân
              </label>
              <textarea
                rows={4}
                value={ctvForm.introduction}
                onChange={(e) =>
                  setCtvForm({ ...ctvForm, introduction: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-primary text-sm resize-none"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-6 py-3 rounded-lg bg-gray-900 text-white font-bold text-sm hover:bg-primary flex items-center justify-center transition-colors mt-6"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {isSubmitting ? "Đang gửi..." : "Xác nhận gửi"}
            </button>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}
