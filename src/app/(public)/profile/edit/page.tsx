"use client";
import { useState, useRef, useEffect } from "react";
import { useUser } from "@/firebase/provider";
import { db, storage } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  Camera,
  Save,
  Phone,
  MapPin,
  User,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Header from "@/components/header";
import Footer from "@/components/footer";

export default function ProfileEditPage() {
  const { user, isUserLoading } = useUser() as any;
  const userData = (useUser() as any).userData;
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    displayName: "",
    phoneNumber: "",
    preferredDistrict: "",
  });

  useEffect(() => {
    if (user || userData) {
      setFormData({
        displayName: userData?.displayName || user?.displayName || "",
        phoneNumber: userData?.phoneNumber || "",
        preferredDistrict: userData?.preferredDistrict || "",
      });
    }
  }, [user, userData]);

  const handleUpdate = async () => {
    if (!user) return;
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { ...formData });
      toast({
        title: "Thành công",
        description: "Hồ sơ nhu cầu đã được cập nhật.",
      });
      router.push("/profile");
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể lưu.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-body">
      <Header />
      <main className="container mx-auto max-w-4xl px-6 py-12 lg:py-24">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 hover:text-primary mb-10"
        >
          <ArrowLeft size={16} /> Quay lại hồ sơ
        </button>

        <div className="lg:grid lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-5 mb-12 lg:mb-0">
            <h1 className="font-headline text-5xl font-black tracking-tighter italic mb-6">
              Hồ sơ nhu cầu
            </h1>
            <p className="text-gray-500 font-medium italic border-l-4 border-primary pl-6 leading-relaxed">
              Thông tin này sẽ giúp đội ngũ Sale của Hanoi Residences chọn lọc
              những căn hộ tinh túy nhất dành riêng cho bạn.
            </p>

            {/* Đổi Avatar ngay trang Edit */}
            <div className="mt-12 flex flex-col items-center lg:items-start">
              <div className="relative">
                <div className="h-40 w-40 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-gray-50">
                  <img
                    src={
                      userData?.photoURL ||
                      user?.photoURL ||
                      "/default-avatar.png"
                    }
                    className="h-full w-full object-cover"
                    alt="Avatar"
                  />
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 p-3 bg-primary text-white rounded-full shadow-xl border-4 border-white active:scale-90 transition-all"
                >
                  <Camera size={20} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !user) return;
                    setIsUpdating(true);
                    const storageRef = ref(storage, `avatars/${user.uid}`);
                    await uploadBytes(storageRef, file);
                    const url = await getDownloadURL(storageRef);
                    await updateDoc(doc(db, "users", user.uid), {
                      photoURL: url,
                    });
                    setIsUpdating(false);
                    toast({ title: "Đã cập nhật ảnh" });
                  }}
                  accept="image/*"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-8 bg-gray-50/50 p-8 lg:p-12 rounded-[3rem] border border-gray-100">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                Họ và tên
              </label>
              <Input
                value={formData.displayName}
                onChange={(e) =>
                  setFormData({ ...formData, displayName: e.target.value })
                }
                className="h-16 rounded-2xl border-none bg-white px-6 font-bold shadow-sm"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                Số điện thoại (Nhận báo giá Zalo)
              </label>
              <Input
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
                className="h-16 rounded-2xl border-none bg-white px-6 font-bold shadow-sm"
                placeholder="09xx..."
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                Khu vực ưu tiên thuê
              </label>
              <Input
                value={formData.preferredDistrict}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    preferredDistrict: e.target.value,
                  })
                }
                className="h-16 rounded-2xl border-none bg-white px-6 font-bold shadow-sm"
                placeholder="VD: Tây Hồ, Ba Đình..."
              />
            </div>

            <Button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="w-full h-18 rounded-3xl bg-primary text-white font-black uppercase tracking-widest shadow-2xl mt-6"
            >
              {isUpdating ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Lưu hồ sơ ngay
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
