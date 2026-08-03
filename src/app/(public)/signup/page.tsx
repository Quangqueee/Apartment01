"use client";

import { useState, useEffect, Suspense } from "react";
import { signup, loginWithGoogle } from "@/lib/auth-service";
import {
  checkPasswordStrength,
  checkPasswordMatch,
  getPasswordStrengthColor,
} from "@/lib/password-utils";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  UserPlus,
  Mail,
  Lock,
  User,
  Loader2,
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";

import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";

function SignupContent() {
  const [isMounted, setIsMounted] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phoneNumber: "",
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [passwordStrength, setPasswordStrength] = useState<
    "weak" | "medium" | "strong" | "very_strong"
  >("weak");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";

  useEffect(() => setIsMounted(true), []);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setFormData({ ...formData, password: newPassword });
    setFormError(null);

    if (newPassword.length > 0) {
      const result = checkPasswordStrength(newPassword);
      setPasswordErrors(result.errors);
      setPasswordStrength(result.strengthLevel);
    } else {
      setPasswordErrors([]);
    }
  };

  const validateForm = (): boolean => {
    const validationErrors: string[] = [];

    // 1. Kiểm tra Họ và tên
    if (!formData.fullName.trim())
      validationErrors.push("Vui lòng nhập họ và tên.");

    // 2. Kiểm tra Email (Chuẩn hóa định dạng)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!formData.email.trim()) {
      validationErrors.push("Vui lòng nhập email.");
    } else if (!emailRegex.test(formData.email.trim())) {
      validationErrors.push(
        "Định dạng email không hợp lệ (Ví dụ đúng: ten@gmail.com).",
      );
    }

    // 3. Kiểm tra Số điện thoại (Chặn tuyệt đối số sai độ dài)
    if (!formData.phoneNumber) {
      validationErrors.push("Vui lòng nhập số điện thoại.");
    } else if (!isValidPhoneNumber(formData.phoneNumber)) {
      validationErrors.push(
        "Số điện thoại không hợp lệ (Sai định dạng hoặc thiếu số).",
      );
    }

    // 4. Kiểm tra Mật khẩu
    const passwordResult = checkPasswordStrength(formData.password);
    if (!passwordResult.isValid) {
      validationErrors.push(...passwordResult.errors);
    }

    // 5. Kiểm tra Xác nhận Mật khẩu
    const matchResult = checkPasswordMatch(
      formData.password,
      formData.confirmPassword,
    );
    if (!matchResult.isValid) {
      validationErrors.push(matchResult.errorMessage || "Mật khẩu không khớp.");
    }

    if (validationErrors.length > 0) {
      setFormError(validationErrors.join("\n"));
      return false;
    }

    setFormError(null);
    return true;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await signup(
        formData.email.trim(),
        formData.password,
        formData.fullName.trim(),
        formData.phoneNumber,
      );

      router.push(redirectUrl);
      router.refresh();
    } catch (err: any) {
      let errorMessage = "Đã có lỗi xảy ra trong quá trình đăng ký.";
      if (err.code === "auth/email-already-in-use") {
        errorMessage = "Email này đã được đăng ký tài khoản.";
      } else if (err.code === "auth/weak-password") {
        errorMessage = "Mật khẩu không đủ mạnh theo yêu cầu của hệ thống.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      setFormError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    loginWithGoogle()
      .then(() => {
        router.push(redirectUrl);
      })
      .catch((error) => {
        console.error("Lỗi đăng nhập Google:", error);
        setIsLoading(false);
      });
  };

  if (!isMounted) return null;

  return (
    <div className="flex min-h-[85vh] items-center justify-center bg-slate-50/50 px-4 py-12">
      <div className="relative w-full max-w-md rounded-[2.5rem] bg-white p-10 shadow-2xl border border-gray-100">
        <Link
          href="/"
          className="absolute left-6 top-6 flex items-center gap-1 text-[11px] font-bold text-gray-400 hover:text-orange-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> QUAY LẠI
        </Link>

        <div className="text-center mb-8 mt-4">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
            <UserPlus className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-black uppercase text-gray-900">
            Đăng ký
          </h1>
          <p className="text-sm text-gray-400 mt-2 italic">
            Khám phá không gian sống tại Hà Nội
          </p>
        </div>

        {formError && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-red-600 border border-red-100 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium whitespace-pre-line">
              {formError}
            </p>
          </div>
        )}

        <button
          type="button"
          disabled={isLoading}
          onClick={handleGoogleLogin}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-200 py-3.5 font-bold text-gray-700 hover:bg-gray-50 transition-all mb-6 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            className="h-5 w-5"
            alt="Google"
          />
          ĐĂNG KÝ VỚI GOOGLE
        </button>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              autoComplete="name"
              placeholder="Họ và tên"
              required
              disabled={isLoading}
              className="w-full rounded-2xl bg-gray-50 py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-orange-500 transition-all disabled:opacity-60"
              value={formData.fullName}
              onChange={(e) => {
                setFormData({ ...formData, fullName: e.target.value });
                setFormError(null);
              }}
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              autoComplete="email"
              placeholder="Email"
              required
              disabled={isLoading}
              className="w-full rounded-2xl bg-gray-50 py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-orange-500 transition-all disabled:opacity-60"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                setFormError(null);
              }}
            />
          </div>

          <div className="space-y-1">
            <div
              className={`relative rounded-2xl bg-gray-50 transition-all focus-within:bg-white focus-within:ring-2 ${phoneError ? "focus-within:ring-red-500 border border-red-300" : "focus-within:ring-orange-500"} ${isLoading ? "opacity-60 pointer-events-none" : ""}`}
            >
              <PhoneInput
                international
                defaultCountry="VN"
                countryCallingCodeEditable={false}
                limitMaxLength={true}
                placeholder="VD: 0901234567"
                value={formData.phoneNumber}
                disabled={isLoading}
                onChange={(value) => {
                  setFormData({ ...formData, phoneNumber: value || "" });
                  setFormError(null);

                  if (value) {
                    if (!isValidPhoneNumber(value)) {
                      setPhoneError(
                        "Số điện thoại chưa đúng định dạng hoặc thiếu số.",
                      );
                    } else {
                      setPhoneError(null);
                    }
                  } else {
                    setPhoneError(null);
                  }
                }}
                className="flex w-full items-center h-[56px] px-4 
                  [&_.PhoneInputCountry]:mr-3
                  [&_.PhoneInputCountryIcon]:w-6 [&_.PhoneInputCountryIcon]:h-4 [&_.PhoneInputCountryIcon]:shadow-sm
                  [&_.PhoneInputInput]:w-full [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:outline-none [&_.PhoneInputInput]:border-none [&_.PhoneInputInput]:text-gray-900"
              />
            </div>

            {phoneError ? (
              <p className="px-2 text-xs font-medium text-red-500">
                ⚠️ {phoneError}
              </p>
            ) : formData.phoneNumber ? (
              <p className="px-2 text-xs text-gray-500">
                💡 Định dạng lưu trữ:{" "}
                <span className="font-bold text-gray-700">
                  {formData.phoneNumber}
                </span>
              </p>
            ) : null}
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <button
              type="button"
              disabled={isLoading}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Mật khẩu"
              required
              disabled={isLoading}
              className="w-full rounded-2xl bg-gray-50 py-4 pl-12 pr-12 outline-none focus:ring-2 focus:ring-orange-500 transition-all disabled:opacity-60"
              value={formData.password}
              onChange={handlePasswordChange}
            />
          </div>

          {formData.password && (
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                  Độ mạnh mật khẩu:
                </span>
                <span
                  className={`text-xs font-bold uppercase tracking-widest ${getPasswordStrengthColor(passwordStrength)}`}
                >
                  {passwordStrength === "weak" && "⚠️ Yếu"}
                  {passwordStrength === "medium" && "⚙️ Trung bình"}
                  {passwordStrength === "strong" && "✅ Mạnh"}
                  {passwordStrength === "very_strong" && "🔒 Rất mạnh"}
                </span>
              </div>

              {passwordErrors.length > 0 && (
                <div className="space-y-1">
                  {passwordErrors.map((error, idx) => (
                    <p
                      key={idx}
                      className="text-xs text-red-600 flex items-start gap-2"
                    >
                      <span className="text-red-500 mt-0.5">✗</span>
                      <span>{error}</span>
                    </p>
                  ))}
                </div>
              )}

              {passwordErrors.length === 0 && formData.password && (
                <div className="space-y-1">
                  <p className="text-xs text-green-600 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Độ dài: 8-24 ký tự</span>
                  </p>
                  <p className="text-xs text-green-600 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>
                      Có chữ thường (a-z), chữ hoa (A-Z) và chữ số (0-9)
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <button
              type="button"
              disabled={isLoading}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
            <input
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Nhắc lại mật khẩu"
              required
              disabled={isLoading}
              className="w-full rounded-2xl bg-gray-50 py-4 pl-12 pr-12 outline-none focus:ring-2 focus:ring-orange-500 transition-all disabled:opacity-60"
              value={formData.confirmPassword}
              onChange={(e) => {
                setFormData({ ...formData, confirmPassword: e.target.value });
                setFormError(null);
              }}
            />
          </div>

          {formData.confirmPassword && (
            <div className="text-xs px-2">
              {checkPasswordMatch(formData.password, formData.confirmPassword)
                .isValid ? (
                <p className="text-green-600 flex items-center gap-1">
                  <span>✓</span> Mật khẩu khớp
                </p>
              ) : (
                <p className="text-red-600 flex items-center gap-1">
                  <span>✗</span> Mật khẩu không khớp
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !!phoneError}
            className="w-full rounded-2xl bg-gray-900 py-4 font-bold text-white hover:bg-orange-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin mx-auto" />
            ) : (
              "TẠO TÀI KHOẢN"
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500">
          Đã có tài khoản?{" "}
          <Link
            href={
              redirectUrl !== "/" ? `/login?redirect=${redirectUrl}` : "/login"
            }
            className="font-bold text-orange-600 hover:underline"
          >
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[85vh] items-center justify-center bg-slate-50/50">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      }
    >
      <SignupContent />
    </Suspense>
  );
}
