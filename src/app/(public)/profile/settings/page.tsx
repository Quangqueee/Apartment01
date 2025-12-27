"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/firebase/provider";
import { db, auth } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import {
  ArrowLeft,
  Save,
  Lock,
  User,
  Calendar,
  Heart,
  Loader2,
  KeyRound,
  ShieldCheck,
  Type,
  AlertCircle,
  Phone, // Import thêm icon Phone
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Header from "@/components/header";
import Footer from "@/components/footer";

export default function SettingsPage() {
  const { user } = useUser() as any;
  const userData = (useUser() as any).userData;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const isSocialLogin = user?.providerData.some(
    (p: any) => p.providerId === "google.com" || p.providerId === "facebook.com"
  );

  // Thêm phoneNumber vào state
  const [infoForm, setInfoForm] = useState({
    displayName: "",
    phoneNumber: "",
    dob: "",
    gender: "",
    interests: "",
  });

  const [passForm, setPassForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (userData || user) {
      setInfoForm({
        displayName: userData?.displayName || user?.displayName || "",
        phoneNumber: userData?.phoneNumber || "", // Load SĐT cũ nếu có
        dob: userData?.dob || "",
        gender: userData?.gender || "",
        interests: userData?.interests || "",
      });
    }
  }, [userData, user]);

  const showToast = (
    title: string,
    description: string,
    isError: boolean = false
  ) => {
    toast({
      title: title,
      description: description,
      className: isError
        ? "bg-red-50 border-red-200 text-red-900 shadow-xl opacity-100"
        : "bg-white border-gray-200 text-gray-900 shadow-xl opacity-100",
      variant: isError ? "destructive" : "default",
    });
  };

  const handleSaveInfo = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        displayName: infoForm.displayName,
        phoneNumber: infoForm.phoneNumber, // Lưu SĐT vào Firestore
        dob: infoForm.dob,
        gender: infoForm.gender,
        interests: infoForm.interests,
      });
      showToast("Thành công", "Đã cập nhật thông tin cá nhân.");
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      showToast("Lỗi", "Không thể lưu thông tin.", true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;

    if (!passForm.currentPassword) {
      showToast("Thiếu thông tin", "Vui lòng nhập mật khẩu hiện tại.", true);
      return;
    }
    if (passForm.newPassword.length < 6) {
      showToast("Mật khẩu yếu", "Mật khẩu mới phải có ít nhất 6 ký tự.", true);
      return;
    }
    if (passForm.newPassword !== passForm.confirmPassword) {
      showToast("Không khớp", "Mật khẩu xác nhận không đúng.", true);
      return;
    }

    setIsLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.email) {
        const credential = EmailAuthProvider.credential(
          currentUser.email,
          passForm.currentPassword
        );
        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, passForm.newPassword);

        showToast("Thành công", "Mật khẩu đã được thay đổi.");
        setPassForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error: any) {
      console.error("Change Pass Error:", error.code);
      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password"
      ) {
        showToast("Sai mật khẩu", "Mật khẩu hiện tại không đúng.", true);
      } else if (error.code === "auth/requires-recent-login") {
        showToast(
          "Yêu cầu đăng nhập lại",
          "Vui lòng đăng xuất và đăng nhập lại để bảo mật.",
          true
        );
      } else if (error.code === "auth/too-many-requests") {
        showToast(
          "Bị chặn tạm thời",
          "Bạn nhập sai quá nhiều lần. Vui lòng thử lại sau.",
          true
        );
      } else {
        showToast(
          "Lỗi hệ thống",
          "Không thể đổi mật khẩu. Vui lòng thử lại.",
          true
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-body">
      <Header />
      <main className="container mx-auto max-w-2xl px-6 py-12 pb-32">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-3 bg-white hover:bg-gray-100 rounded-full transition-colors shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-headline text-3xl font-bold text-gray-900">
            Cài đặt tài khoản
          </h1>
        </div>

        <div className="space-y-8">
          {/* --- PHẦN 1: THÔNG TIN CÁ NHÂN --- */}
          <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
              <div className="p-2 bg-[#cda533]/10 rounded-lg text-[#cda533]">
                <User size={20} />
              </div>
              <h2 className="text-lg font-bold uppercase tracking-widest text-gray-800">
                Thông tin cá nhân
              </h2>
            </div>

            <div className="space-y-5">
              {/* Họ tên */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Type size={12} /> Họ và tên
                </label>
                <Input
                  value={infoForm.displayName}
                  onChange={(e) =>
                    setInfoForm({ ...infoForm, displayName: e.target.value })
                  }
                  className="h-14 rounded-xl bg-white border-gray-200 text-gray-900 font-bold focus-visible:ring-[#cda533]"
                  placeholder="Nhập tên hiển thị"
                />
              </div>

              {/* SỐ ĐIỆN THOẠI (MỚI) */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Phone size={12} /> Số điện thoại
                </label>
                <Input
                  type="tel" // Bàn phím số trên điện thoại
                  value={infoForm.phoneNumber}
                  onChange={(e) =>
                    setInfoForm({ ...infoForm, phoneNumber: e.target.value })
                  }
                  className="h-14 rounded-xl bg-white border-gray-200 text-gray-900 font-bold focus-visible:ring-[#cda533]"
                  placeholder="09xx..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Ngày sinh */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <Calendar size={12} /> Ngày sinh
                  </label>
                  <Input
                    type="date"
                    value={infoForm.dob}
                    onChange={(e) =>
                      setInfoForm({ ...infoForm, dob: e.target.value })
                    }
                    className="h-14 rounded-xl bg-white border-gray-200 text-gray-900 font-medium block w-full"
                    style={{ colorScheme: "light" }}
                  />
                </div>

                {/* Giới tính */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider">
                    Giới tính
                  </label>
                  <Select
                    value={infoForm.gender}
                    onValueChange={(val) =>
                      setInfoForm({ ...infoForm, gender: val })
                    }
                  >
                    <SelectTrigger className="h-14 rounded-xl bg-white border-gray-200 text-gray-900 font-medium z-10">
                      <SelectValue placeholder="Chọn giới tính" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-100 shadow-xl z-50">
                      <SelectItem
                        value="male"
                        className="cursor-pointer py-3 hover:bg-gray-50 focus:bg-gray-50"
                      >
                        Nam
                      </SelectItem>
                      <SelectItem
                        value="female"
                        className="cursor-pointer py-3 hover:bg-gray-50 focus:bg-gray-50"
                      >
                        Nữ
                      </SelectItem>
                      <SelectItem
                        value="other"
                        className="cursor-pointer py-3 hover:bg-gray-50 focus:bg-gray-50"
                      >
                        Khác
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Sở thích */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Heart size={12} /> Sở thích / Ghi chú
                </label>
                <Textarea
                  value={infoForm.interests}
                  onChange={(e) =>
                    setInfoForm({ ...infoForm, interests: e.target.value })
                  }
                  placeholder="VD: Thích căn hộ nhiều ánh sáng, tầng cao..."
                  className="min-h-[100px] rounded-xl bg-white border-gray-200 text-gray-900 resize-none p-4"
                />
              </div>

              <Button
                onClick={handleSaveInfo}
                disabled={isLoading}
                className="w-full h-14 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-all shadow-lg mt-2"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin mr-2" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Lưu thông tin
              </Button>
            </div>
          </div>

          {/* --- PHẦN 2: BẢO MẬT --- */}
          {!isSocialLogin ? (
            <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                <div className="p-2 bg-red-50 rounded-lg text-red-500">
                  <ShieldCheck size={20} />
                </div>
                <h2 className="text-lg font-bold uppercase tracking-widest text-gray-800">
                  Bảo mật
                </h2>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <KeyRound size={12} /> Mật khẩu hiện tại
                  </label>
                  <Input
                    type="password"
                    value={passForm.currentPassword}
                    onChange={(e) =>
                      setPassForm({
                        ...passForm,
                        currentPassword: e.target.value,
                      })
                    }
                    className="h-14 rounded-xl bg-white border-gray-200"
                    placeholder="Nhập mật khẩu cũ để xác thực"
                  />
                </div>

                <hr className="border-dashed border-gray-100 my-2" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider">
                      Mật khẩu mới
                    </label>
                    <Input
                      type="password"
                      value={passForm.newPassword}
                      onChange={(e) =>
                        setPassForm({
                          ...passForm,
                          newPassword: e.target.value,
                        })
                      }
                      className="h-14 rounded-xl bg-white border-gray-200"
                      placeholder="Tối thiểu 6 ký tự"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider">
                      Xác nhận mật khẩu
                    </label>
                    <Input
                      type="password"
                      value={passForm.confirmPassword}
                      onChange={(e) =>
                        setPassForm({
                          ...passForm,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="h-14 rounded-xl bg-white border-gray-200"
                      placeholder="Nhập lại mật khẩu mới"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleChangePassword}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full h-14 rounded-xl border-2 border-gray-100 text-gray-700 font-bold hover:bg-gray-50 hover:border-gray-200 hover:text-red-500 transition-colors"
                >
                  Cập nhật mật khẩu
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 rounded-[2rem] p-6 border border-blue-100 flex items-start gap-4">
              <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-blue-900 mb-1">
                  Tài khoản liên kết Google
                </h3>
                <p className="text-sm text-blue-700">
                  Bạn đang sử dụng tài khoản Google nên không cần đổi mật khẩu
                  tại đây.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
