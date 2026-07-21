"use client";

import { useState, useEffect } from "react";
import { signup, loginWithGoogle } from "@/lib/auth-service";
import {
  kiemTraMatKhau,
  kiemTraXacNhanMatKhau,
  kiemTraSoDienThoai,
  layMauSacDoDamBao,
} from "@/lib/kiem-tra-mat-khau";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  UserPlus,
  Mail,
  Lock,
  User,
  Loader2,
  ArrowLeft,
  Phone,
  Eye,
  EyeOff,
} from "lucide-react";

export default function SignupPage() {
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    xacNhanMatKhau: "",
    fullName: "",
    phoneNumber: "",
  });

  // State cho validation
  const [cacLoiNhap, setCacLoiNhap] = useState<string[]>([]);
  const [doDamBao, setDoDamBao] = useState<
    "yeu" | "trung_binh" | "manh" | "rat_manh"
  >("yeu");

  // State cho hiển thị mật khẩu
  const [hienThiMatKhau, setHienThiMatKhau] = useState(false);
  const [hienThiXacNhanMatKhau, setHienThiXacNhanMatKhau] = useState(false);

  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  // Xử lý khi người dùng thay đổi mật khẩu
  const xuLyDoiMatKhau = (e: React.ChangeEvent<HTMLInputElement>) => {
    const matKhauMoi = e.target.value;
    setFormData({ ...formData, password: matKhauMoi });

    // Kiểm tra độ mạnh mật khẩu
    if (matKhauMoi.length > 0) {
      const ketQua = kiemTraMatKhau(matKhauMoi);
      setCacLoiNhap(ketQua.cacLoiNhap);
      setDoDamBao(ketQua.doDamBao);
    } else {
      setCacLoiNhap([]);
    }
  };

  // Kiểm tra toàn bộ form trước khi gửi
  const kiemTraFormToanBo = (): boolean => {
    const cacLoi: string[] = [];

    // Kiểm tra họ tên
    if (!formData.fullName.trim()) {
      cacLoi.push("Vui lòng nhập họ và tên");
    }

    // Kiểm tra email
    if (!formData.email.trim()) {
      cacLoi.push("Vui lòng nhập email");
    }

    // Kiểm tra mật khẩu
    const ketQuaMK = kiemTraMatKhau(formData.password);
    if (!ketQuaMK.hopLe) {
      cacLoi.push(...ketQuaMK.cacLoiNhap);
    }

    // Kiểm tra xác nhận mật khẩu
    const ketQuaXacNhan = kiemTraXacNhanMatKhau(
      formData.password,
      formData.xacNhanMatKhau,
    );
    if (!ketQuaXacNhan.hopLe) {
      cacLoi.push(ketQuaXacNhan.loiNhap || "");
    }

    // Kiểm tra số điện thoại
    if (formData.phoneNumber.trim()) {
      const ketQuaSoDienThoai = kiemTraSoDienThoai(formData.phoneNumber);
      if (!ketQuaSoDienThoai.hopLe) {
        cacLoi.push(ketQuaSoDienThoai.loiNhap || "");
      }
    }

    if (cacLoi.length > 0) {
      alert("❌ " + cacLoi.join("\n"));
      return false;
    }

    return true;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Kiểm tra form trước khi gửi
    if (!kiemTraFormToanBo()) {
      return;
    }

    setLoading(true);
    try {
      await signup(
        formData.email,
        formData.password,
        formData.fullName,
        formData.phoneNumber,
      );
      router.push("/");
      router.refresh();
    } catch (err: any) {
      let thongBaoLoi = "Lỗi đăng ký";

      // Xử lý các lỗi Firebase phổ biến
      if (err.code === "auth/email-already-in-use") {
        thongBaoLoi = "Email này đã được sử dụng";
      } else if (err.code === "auth/weak-password") {
        thongBaoLoi = "Mật khẩu không đủ mạnh";
      } else if (err.message) {
        thongBaoLoi = err.message;
      }

      alert("❌ " + thongBaoLoi);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex min-h-[85vh] items-center justify-center bg-slate-50/50 px-4 py-12">
      <div className="relative w-full max-w-md rounded-[2.5rem] bg-white p-10 shadow-2xl border border-gray-100">
        {/* NÚT VỀ TRANG CHỦ */}
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

        <button
          onClick={() => loginWithGoogle().then(() => router.push("/"))}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-200 py-3.5 font-bold text-gray-700 hover:bg-gray-50 transition-all mb-6 shadow-sm"
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            className="h-5 w-5"
            alt="Google"
          />
          ĐĂNG KÝ VỚI GOOGLE
        </button>

        <form onSubmit={handleSignup} className="space-y-4">
          {/* TRƯỜNG HỌ VÀ TÊN */}
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Họ và tên"
              required
              className="w-full rounded-2xl bg-gray-50 py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
            />
          </div>

          {/* TRƯỜNG EMAIL */}
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

          {/* TRƯỜNG SỐ ĐIỆN THOẠI */}
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="tel"
              placeholder="Số điện thoại (không bắt buộc)"
              className="w-full rounded-2xl bg-gray-50 py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              onChange={(e) =>
                setFormData({ ...formData, phoneNumber: e.target.value })
              }
            />
            {formData.phoneNumber && (
              <p className="text-xs text-gray-500 mt-1 px-2">
                💡 Định dạng: 0901234567 hoặc +84901234567
              </p>
            )}
          </div>

          {/* TRƯỜNG MẬT KHẨU */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <button
              type="button"
              onClick={() => setHienThiMatKhau(!hienThiMatKhau)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {hienThiMatKhau ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
            <input
              type={hienThiMatKhau ? "text" : "password"}
              placeholder="Mật khẩu"
              required
              className="w-full rounded-2xl bg-gray-50 py-4 pl-12 pr-12 outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              onChange={xuLyDoiMatKhau}
            />
          </div>

          {/* THÔNG TIN ĐỘ MẠNH MẬT KHẨU */}
          {formData.password && (
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                  Độ mạnh mật khẩu:
                </span>
                <span
                  className={`text-xs font-bold uppercase tracking-widest ${layMauSacDoDamBao(doDamBao)}`}
                >
                  {doDamBao === "yeu" && "⚠️ Yếu"}
                  {doDamBao === "trung_binh" && "⚙️ Trung bình"}
                  {doDamBao === "manh" && "✅ Mạnh"}
                  {doDamBao === "rat_manh" && "🔒 Rất mạnh"}
                </span>
              </div>

              {/* DANH SÁCH LỖI */}
              {cacLoiNhap.length > 0 && (
                <div className="space-y-1">
                  {cacLoiNhap.map((loi, idx) => (
                    <p
                      key={idx}
                      className="text-xs text-red-600 flex items-start gap-2"
                    >
                      <span className="text-red-500 mt-0.5">✗</span>
                      <span>{loi}</span>
                    </p>
                  ))}
                </div>
              )}

              {/* HIỂN THỊ TIÊU CHÍ ĐẠT */}
              {cacLoiNhap.length === 0 && formData.password && (
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

          {/* TRƯỜNG XÁC NHẬN MẬT KHẨU */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <button
              type="button"
              onClick={() => setHienThiXacNhanMatKhau(!hienThiXacNhanMatKhau)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {hienThiXacNhanMatKhau ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
            <input
              type={hienThiXacNhanMatKhau ? "text" : "password"}
              placeholder="Nhắc lại mật khẩu"
              required
              className="w-full rounded-2xl bg-gray-50 py-4 pl-12 pr-12 outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              onChange={(e) =>
                setFormData({ ...formData, xacNhanMatKhau: e.target.value })
              }
            />
          </div>

          {/* KIỂM TRA XÁC NHẬN MẬT KHẨU */}
          {formData.xacNhanMatKhau && (
            <div className="text-xs px-2">
              {kiemTraXacNhanMatKhau(formData.password, formData.xacNhanMatKhau)
                .hopLe ? (
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

          {/* NÚT TẠO TÀI KHOẢN */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gray-900 py-4 font-bold text-white hover:bg-orange-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin mx-auto" />
            ) : (
              "TẠO TÀI KHOẢN"
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500">
          Đã có tài khoản?{" "}
          <Link
            href="/login"
            className="font-bold text-orange-600 hover:underline"
          >
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
