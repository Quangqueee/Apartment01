"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { confirmResetPassword } from "@/lib/auth-service";
import Link from "next/link";
import {
  Lock,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import { checkPasswordStrength, getPasswordStrengthColor, getPasswordStrengthMessage } from "@/lib/password-utils";

// Tách nội dung chính thành Component con
function ResetPasswordContent() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [cacLoiNhap, setCacLoiNhap] = useState<string[]>([]);
  const [doDamBao, setDoDamBao] = useState<
    "weak" | "medium" | "strong" | "very_strong"
  >("weak");

  useEffect(() => setMounted(true), []);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setPassword(newVal);
    setErrorMsg("");

 if (newVal.length > 0) {
      const ketQua = checkPasswordStrength(newVal);
      setCacLoiNhap(ketQua.errors);
      setDoDamBao(ketQua.strengthLevel);
    } else {
      setCacLoiNhap([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode) return;

    if (password !== confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không trùng khớp.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      await confirmResetPassword(oobCode, password);
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      if (err.code === "auth/invalid-action-code") {
        setErrorMsg("Đường dẫn đã hết hạn hoặc đã được sử dụng.");
      } else {
        setErrorMsg("Có lỗi xảy ra, vui lòng thử lại sau.");
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
          <ArrowLeft className="h-4 w-4" /> VỀ ĐĂNG NHẬP
        </Link>

        {success ? (
          <div className="text-center mt-8">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-500">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-black uppercase text-gray-900 tracking-tighter mb-2">
              Đổi mật khẩu thành công!
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Hệ thống đang chuyển về trang Đăng nhập...
            </p>
            <Loader2 className="h-5 w-5 animate-spin mx-auto text-orange-500" />
          </div>
        ) : !oobCode ? (
          <div className="text-center mt-8 space-y-4">
            <div className="text-4xl">⚠️</div>
            <h1 className="text-xl font-black uppercase text-red-600">
              Đường dẫn không hợp lệ
            </h1>
            <p className="text-sm text-gray-500">
              Mã xác thực không tồn tại. Vui lòng yêu cầu gửi lại link từ trang
              đăng nhập.
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8 mt-6">
              <h1 className="text-3xl font-black uppercase text-gray-900 tracking-tighter">
                Tạo Mật Khẩu Mới
              </h1>
              <p className="text-xs text-gray-400 mt-2 italic font-medium">
                Nhập mật khẩu mới theo chuẩn bảo mật của hệ thống.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mật khẩu mới"
                  required
                  value={password}
                  onChange={handlePasswordChange}
                  className="w-full rounded-2xl bg-gray-50 py-4 pl-12 pr-12 outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Xác nhận mật khẩu mới"
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrorMsg("");
                  }}
                  className="w-full rounded-2xl bg-gray-50 py-4 pl-12 pr-12 outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                />
              </div>

              {password && (
                <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                      Độ mạnh:
                    </span>
                    <span
                      className={`text-xs font-bold uppercase tracking-widest ${getPasswordStrengthColor(doDamBao)}`}
                    >
                      {doDamBao === "weak" && "⚠️ Yếu"}
                      {doDamBao === "medium" && "⚙️ Trung bình"}
                      {doDamBao === "strong" && "✅ Mạnh"}
                      {doDamBao === "very_strong" && "🔒 Rất mạnh"}
                    </span>
                  </div>
                  {cacLoiNhap.length > 0 && (
                    <div className="space-y-1">
                      {cacLoiNhap.map((loi, idx) => (
                        <p
                          key={idx}
                          className="text-xs text-red-600 flex items-start gap-2"
                        >
                          <span className="text-red-500">✗</span>{" "}
                          <span>{loi}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {errorMsg && (
                <p className="text-xs text-red-500 font-medium px-2">
                  ⚠️ {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={
                  loading ||
                  !password ||
                  !confirmPassword ||
                  cacLoiNhap.length > 0
                }
                className="w-full rounded-2xl bg-gray-900 py-4 font-bold text-white hover:bg-orange-600 transition-all shadow-lg disabled:opacity-50 mt-4"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                ) : (
                  "CẬP NHẬT MẬT KHẨU"
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// Component cha xuất ra mặc định, bọc Suspense
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[85vh] items-center justify-center bg-slate-50/50">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
