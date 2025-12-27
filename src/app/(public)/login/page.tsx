"use client";

import { useState, useEffect } from "react";
import { login, loginWithGoogle } from "@/lib/auth-service";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Loader2, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      router.push("/");
      router.refresh();
    } catch (err) {
      alert("Thông tin đăng nhập không chính xác!");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex min-h-[85vh] items-center justify-center bg-slate-50/50 px-4 py-12">
      <div className="relative w-full max-w-md rounded-[2.5rem] bg-white p-10 shadow-2xl border border-gray-100">
        <Link
          href="/"
          className="absolute left-6 top-6 flex items-center gap-1 text-[11px] font-bold text-gray-400 hover:text-orange-600"
        >
          <ArrowLeft className="h-4 w-4" /> TRANG CHỦ
        </Link>

        <div className="text-center mb-8 mt-6">
          <h1 className="text-3xl font-black uppercase text-gray-900 tracking-tighter">
            Đăng nhập
          </h1>
          <p className="text-xs text-gray-400 mt-2 italic font-medium">
            Chào mừng trở lại Hanoi Residences
          </p>
        </div>

        <button
          onClick={() => loginWithGoogle().then(() => router.push("/"))}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-200 py-3.5 font-bold text-gray-700 hover:bg-gray-50 transition-all mb-6 shadow-sm active:scale-95"
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            className="h-5 w-5"
            alt="Google"
          />
          TIẾP TỤC VỚI GOOGLE
        </button>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              placeholder="Email"
              required
              className="w-full rounded-2xl bg-gray-50 py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="password"
              placeholder="Mật khẩu"
              required
              className="w-full rounded-2xl bg-gray-50 py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
          </div>

          {/* NÚT QUÊN MẬT KHẨU ĐÃ ĐƯỢC THÊM TẠI ĐÂY */}
          <div className="flex justify-end pr-2">
            <Link
              href="/forgot-password"
              className="text-[11px] font-bold text-gray-400 hover:text-orange-600 transition-colors uppercase tracking-widest"
            >
              Quên mật khẩu?
            </Link>
          </div>

          <button className="w-full rounded-2xl bg-gray-900 py-4 font-bold text-white hover:bg-orange-600 transition-all shadow-lg active:scale-95 flex justify-center">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "ĐĂNG NHẬP"
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500 font-medium">
          Chưa có tài khoản?{" "}
          <Link
            href="/signup"
            className="font-bold text-orange-600 hover:underline"
          >
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
