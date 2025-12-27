"use client";

import { useState } from "react";
import { resetPassword } from "@/lib/auth-service";
import Link from "next/link";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(email);
      setIsSent(true);
    } catch (error: any) {
      alert("Lỗi: Email không tồn tại hoặc có sự cố xảy ra!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center bg-slate-50/50 px-4">
      <div className="relative w-full max-w-md rounded-[2.5rem] bg-white p-10 shadow-2xl border border-gray-100">
        <Link
          href="/login"
          className="absolute left-6 top-6 flex items-center gap-1 text-[11px] font-bold text-gray-400 hover:text-orange-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> QUAY LẠI
        </Link>

        {isSent ? (
          <div className="text-center py-6">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-500">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h1 className="text-2xl font-black uppercase text-gray-900">
              Kiểm tra Email
            </h1>
            <p className="mt-4 text-sm text-gray-500">
              Chúng tôi đã gửi link đặt lại mật khẩu đến <b>{email}</b>. Vui
              lòng kiểm tra hộp thư đến của bạn.
            </p>
            <Link
              href="/login"
              className="mt-8 block w-full rounded-2xl bg-gray-900 py-4 font-bold text-white transition-all hover:bg-orange-600"
            >
              QUAY LẠI ĐĂNG NHẬP
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-10 mt-6">
              <h1 className="text-3xl font-black uppercase tracking-tighter text-gray-900">
                Quên mật khẩu?
              </h1>
              <p className="mt-2 text-sm text-gray-400 italic">
                Nhập email để nhận hướng dẫn khôi phục.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="Email của bạn"
                  required
                  className="w-full rounded-2xl border-none bg-gray-50 py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-inner"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <button
                disabled={loading}
                className="w-full rounded-2xl bg-gray-900 py-4 font-bold text-white transition-all hover:bg-orange-600 shadow-lg disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                ) : (
                  "GỬI YÊU CẦU"
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
