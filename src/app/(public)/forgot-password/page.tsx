"use client";

import { useState, useEffect } from "react";
import { resetPassword } from "@/lib/auth-service";
import Link from "next/link";
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => setMounted(true), []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        setErrorMsg("Không tìm thấy tài khoản với email này.");
      } else if (err.code === "auth/invalid-email") {
        setErrorMsg("Định dạng email không hợp lệ.");
      } else {
        setErrorMsg("Đã có lỗi xảy ra. Vui lòng thử lại sau.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex min-h-[85vh] items-center justify-center bg-slate-50/50 px-4 py-12">
      <div className="relative w-full max-w-md rounded-[2.5rem] bg-white p-10 shadow-2xl border border-gray-100">
        <Link
          href="/login"
          className="absolute left-6 top-6 flex items-center gap-1 text-[11px] font-bold text-gray-400 hover:text-orange-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> ĐĂNG NHẬP
        </Link>

        {success ? (
          <div className="text-center mt-8">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-500">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-black uppercase text-gray-900 tracking-tighter mb-4">
              Kiểm tra hộp thư
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              Chúng tôi đã gửi một đường dẫn đặt lại mật khẩu đến email{" "}
              <span className="font-bold text-gray-800">{email}</span>. Vui lòng
              kiểm tra cả hộp thư rác (spam).
            </p>
            <Link
              href="/login"
              className="mt-8 flex w-full justify-center rounded-2xl bg-gray-900 py-4 font-bold text-white hover:bg-orange-600 transition-all shadow-lg active:scale-95"
            >
              VỀ TRANG ĐĂNG NHẬP
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-8 mt-6">
              <h1 className="text-3xl font-black uppercase text-gray-900 tracking-tighter">
                Khôi phục
              </h1>
              <p className="text-xs text-gray-400 mt-2 italic font-medium leading-relaxed px-2">
                Nhập email bạn đã dùng để đăng ký, chúng tôi sẽ gửi link đặt lại
                mật khẩu.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="Nhập email của bạn"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl bg-gray-50 py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                />
              </div>

              {errorMsg && (
                <p className="text-xs text-red-500 font-medium px-2 flex items-center gap-1">
                  <span>⚠️</span> {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full rounded-2xl bg-gray-900 py-4 font-bold text-white hover:bg-orange-600 transition-all shadow-lg active:scale-95 flex justify-center disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
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
