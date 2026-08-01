"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Heart, Phone, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Apartment } from "@/lib/types";

interface BookingWidgetProps {
  apartment: Apartment;
  isFavorited: boolean;
  onFavoriteToggle: (e?: React.MouseEvent) => void;
  isFavLoading: boolean;
  statusHeader: string;
  statusLabel: string;
  statusTextColor: string;
  statusDotColor: string;
}

export default function BookingWidget({
  apartment,
  isFavorited,
  onFavoriteToggle,
  isFavLoading,
  statusHeader,
  statusLabel,
  statusTextColor,
  statusDotColor,
}: BookingWidgetProps) {
  const { user, userData } = useAuth();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Thêm các state mới cho Tên khách (CTV), Ngày riêng, Giờ riêng (User)
  const [formData, setFormData] = useState({
    name: userData?.displayName || "",
    phone: userData?.phoneNumber || "",
    clientName: "",
    clientPhone: "",
    bookingDate: "", // Dùng cho User
    bookingTime: "", // Dùng cho User (Optional)
    dateTime: "", // Dùng cho CTV
    budget: "",
    notes: "",
    consultationPrice: "",
  });

  const role = userData?.role;
  const isCollaborator = role === "collaborator" || role === "admin";
  const isGuest = !user;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let collectionName = "guest_consultations";

      let finalDateTime = "";
      if (isCollaborator) {
        finalDateTime = formData.dateTime;
      } else if (!isGuest) {
        finalDateTime = formData.bookingTime
          ? `${formData.bookingDate}T${formData.bookingTime}`
          : formData.bookingDate;
      }

      // Khởi tạo Payload chung (Admin tự tạo thì Auto Approved)
      let payload: any = {
        apartmentId: apartment.id,
        apartmentCode: apartment.sourceCode,
        apartmentLink: window.location.href,
        notes: formData.notes,
        createdAt: serverTimestamp(),
        status: role === "admin" ? "approved" : "pending",
      };

      // Tách bạch rõ ràng Admin và CTV
      if (role === "admin") {
        collectionName = "user_bookings";
        payload = {
          ...payload,
          name: formData.clientName, // Form đang dùng tên field của CTV
          phone: formData.clientPhone,
          budget: formData.budget,
          consultationPrice: formData.consultationPrice, // Lưu cả giá báo nếu admin nhập
          dateTime: finalDateTime,
          isExternal: true, // Đánh dấu đây là "Khách ngoài"
        };
      } else if (role === "collaborator") {
        collectionName = "ctv_bookings";
        payload = {
          ...payload,
          ctvId: user?.uid,
          ctvName:
            userData?.displayName || user?.displayName || "Cộng tác viên",
          ctvPhone: userData?.phoneNumber || user?.phoneNumber || "N/A",
          address: apartment.title,
          consultationPrice: formData.consultationPrice,
          clientName: formData.clientName,
          clientPhone: formData.clientPhone,
          budget: formData.budget,
          dateTime: finalDateTime,
        };
      } else if (role === "user") {
        collectionName = "user_bookings";
        payload = {
          ...payload,
          userId: user?.uid,
          name: formData.name,
          phone: formData.phone,
          budget: formData.budget,
          dateTime: finalDateTime,
        };
      } else {
        payload = {
          ...payload,
          name: formData.name,
          phone: formData.phone,
          budget: formData.budget,
        };
      }

      await addDoc(collection(db, collectionName), payload);

      toast({
        title: "Gửi yêu cầu thành công!",
        description: "Thông tin đã được ghi nhận trên hệ thống.",
        className: "bg-green-50 text-green-900 border-green-200",
      });
      setIsOpen(false);
      setFormData({
        ...formData,
        clientName: "",
        clientPhone: "",
        bookingDate: "",
        bookingTime: "",
        dateTime: "",
        notes: "",
        budget: "",
        consultationPrice: "",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể gửi yêu cầu. Vui lòng thử lại.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getButtonText = () => {
    if (isCollaborator) return "Đặt lịch dẫn khách";
    if (role === "user") return "Đặt lịch xem phòng";
    return "Nhận tư vấn";
  };

  return (
    <>
      <div className="sticky top-28">
        <div className="rounded-[2.5rem] bg-white p-8 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          <div className="relative z-10 space-y-6">
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100/50">
              <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                  {statusHeader}
                </span>
                <span
                  className={`flex items-center gap-2 ${statusTextColor} text-xs font-bold uppercase tracking-wide`}
                >
                  <span className="relative flex h-2.5 w-2.5">
                    <span
                      className={`animate-ping absolute inline-flex h-full w-full rounded-full ${statusDotColor} opacity-40`}
                    ></span>
                    <span
                      className={`relative inline-flex rounded-full h-2.5 w-2.5 ${statusDotColor}`}
                    ></span>
                  </span>
                  {statusLabel}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                  Hotline 24/7
                </span>
                <span className="font-mono text-xl font-bold text-gray-900 tracking-wide">
                  0355.885.851
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => setIsOpen(true)}
                className="flex items-center justify-center w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-[#b88e22] text-white font-bold uppercase tracking-widest hover:shadow-[0_10px_25px_rgba(205,165,51,0.3)] hover:scale-[1.01] transition-all duration-300 gap-2 shadow-lg"
              >
                <Phone className="h-5 w-5 fill-current" /> {getButtonText()}
              </button>

              <button
                onClick={onFavoriteToggle}
                disabled={isFavLoading}
                className={cn(
                  "hidden lg:flex items-center justify-center w-full py-4 rounded-2xl border-2 font-bold uppercase tracking-widest transition-all group gap-2 text-xs",
                  isFavorited
                    ? "border-red-200 bg-red-50 text-red-500 hover:bg-red-100 hover:border-red-300"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-primary hover:text-primary",
                )}
              >
                <Heart
                  className={cn(
                    "h-5 w-5 transition-transform group-hover:scale-110",
                    isFavorited && "fill-current",
                  )}
                />
                {isFavorited ? "Đã lưu tin" : "Lưu tin này"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {getButtonText()}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
            {isCollaborator ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold">
                      Tên khách <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      name="clientName"
                      value={formData.clientName}
                      onChange={handleChange}
                      className="border rounded-lg p-2"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold">
                      SĐT khách <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="tel"
                      name="clientPhone"
                      value={formData.clientPhone}
                      onChange={handleChange}
                      className="border rounded-lg p-2"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold">Mã căn</label>
                    <input
                      type="text"
                      value={apartment.sourceCode}
                      readOnly
                      className="border rounded-lg p-2 bg-gray-50 text-gray-500 outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold">Ngân sách</label>
                    <input
                      type="text"
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                      placeholder="VD: 5-7tr"
                      className="border rounded-lg p-2"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold">
                    Giá tư vấn <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    name="consultationPrice"
                    value={formData.consultationPrice}
                    onChange={handleChange}
                    placeholder="Giá báo khách..."
                    className="border rounded-lg p-2"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold">
                    Ngày/Giờ dẫn khách <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="datetime-local"
                    name="dateTime"
                    value={formData.dateTime}
                    onChange={handleChange}
                    className="border rounded-lg p-2"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="border rounded-lg p-2"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="border rounded-lg p-2"
                  />
                </div>

                {/* User Đăng nhập: Tách Ngày và Giờ */}
                {!isGuest && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold">
                        Ngày xem <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="date"
                        name="bookingDate"
                        value={formData.bookingDate}
                        onChange={handleChange}
                        className="border rounded-lg p-2"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold">
                        Giờ xem{" "}
                        <span className="text-gray-400 text-xs font-normal">
                          (Có thể bỏ trống)
                        </span>
                      </label>
                      <input
                        type="time"
                        name="bookingTime"
                        value={formData.bookingTime}
                        onChange={handleChange}
                        className="border rounded-lg p-2"
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold">Ngân sách</label>
                  <input
                    type="text"
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    placeholder="VD: 5-7 triệu"
                    className="border rounded-lg p-2"
                  />
                </div>
              </>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold">Lưu ý thêm</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder={
                  isCollaborator
                    ? "Tài chính, xe điện, pet..."
                    : "Yêu cầu đặc biệt (pet, chỗ để oto...)"
                }
                className="border rounded-lg p-2 resize-none h-20"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#cda533] hover:bg-[#b88e22] text-white font-bold h-11 mt-2 rounded-xl transition-colors"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                "Gửi thông tin"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
