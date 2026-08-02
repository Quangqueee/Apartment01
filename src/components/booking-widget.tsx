"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { createNotification, notifyAdmins } from "@/lib/notifications";
import { ADMIN_PATH } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Heart, Phone, Loader2, UserPlus, Users, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Apartment } from "@/lib/types"; // ĐÃ GỘP IMPORT TỪ TYPES.TS

// Helper function to remove Vietnamese tone marks
const removeVietnameseTones = (str: string = "") => {
  if (!str) return "";
  return str
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")      // Bổ sung xử lý chữ đ
    .replace(/Đ/g, "D")      // Bổ sung xử lý chữ Đ
    .toLowerCase()
    .trim();
};

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

  const [ctvList, setCtvList] = useState<any[]>([]);
  const [ctvSearchTerm, setCtvSearchTerm] = useState("");
  const [isCtvDropdownOpen, setIsCtvDropdownOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: userData?.displayName || "",
    phone: userData?.phoneNumber || "",
    clientName: "",
    clientPhone: "",
    bookingDate: "",
    bookingTime: "",
    budget: "",
    notes: "",
    consultationPrice: "",
    adminBookingType: "external",
    ctvId: "",
    ctvName: "",
    ctvPhone: "",
  });

  const role = userData?.role;
  const isCollaborator = role === "collaborator" || role === "admin";
  const isGuest = !user;

  const isCtvSelectedFromList = !!(
    formData.ctvId && formData.ctvId !== "manual_entry"
  );

  useEffect(() => {
    if (role === "admin") {
      const fetchCTVs = async () => {
        const q = query(
          collection(db, "users"),
          where("role", "==", "collaborator"),
        );
        const snap = await getDocs(q);
        const ctvs = snap.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));
        setCtvList(ctvs);
      };
      fetchCTVs();
    }
  }, [role]);

  const normalizedCtvSearchTerm = removeVietnameseTones(ctvSearchTerm);
  const filteredCtvs = ctvList.filter(
    (c) =>
      removeVietnameseTones(c.displayName).includes(normalizedCtvSearchTerm) ||
      (c.phoneNumber || "").includes(ctvSearchTerm),
  );

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      let newCtvId = prev.ctvId;
      if (
        (name === "ctvName" || name === "ctvPhone") &&
        prev.ctvId &&
        prev.ctvId !== "manual_entry"
      ) {
        newCtvId = "manual_entry";
      }
      return { ...prev, [name]: value, ctvId: newCtvId };
    });
  };

  const handleSelectCtv = (ctv: any) => {
    setFormData((prev) => ({
      ...prev,
      ctvId: ctv.uid,
      ctvName: ctv.displayName || "",
      ctvPhone: ctv.phoneNumber || "",
    }));
    setCtvSearchTerm(`${ctv.displayName} - ${ctv.phoneNumber}`);
    setIsCtvDropdownOpen(false);
  };

  const handleClearSelectedCtv = () => {
    setFormData((prev) => ({ ...prev, ctvId: "", ctvName: "", ctvPhone: "" }));
    setCtvSearchTerm("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let collectionName = "guest_consultations";

      let finalDateTime = formData.bookingTime
        ? `${formData.bookingDate}T${formData.bookingTime}`
        : formData.bookingDate;

      let payload: any = {
        apartmentId: apartment.id,
        apartmentCode: apartment.sourceCode,
        apartmentLink: window.location.href,
        notes: formData.notes,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: role === "admin" ? "approved" : "pending",
      };

      if (role === "admin") {
        if (formData.adminBookingType === "ctv") {
          collectionName = "ctv_bookings";
          payload = {
            ...payload,
            ctvId: formData.ctvId || "manual_entry",
            ctvName: formData.ctvName || "Chưa rõ",
            ctvPhone: formData.ctvPhone || "N/A",
            address: apartment.title,
            consultationPrice: formData.consultationPrice,
            clientName: formData.clientName,
            clientPhone: formData.clientPhone,
            budget: formData.budget,
            dateTime: finalDateTime,
            createdByAdminId: user?.uid,
          };
        } else {
          collectionName = "user_bookings";
          payload = {
            ...payload,
            name: formData.clientName,
            phone: formData.clientPhone,
            budget: formData.budget,
            consultationPrice: formData.consultationPrice,
            dateTime: finalDateTime,
            isExternal: true,
            createdByAdminId: user?.uid,
          };
        }
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
          dateTime: finalDateTime,
        };
      }

      await addDoc(collection(db, collectionName), payload);

      const successMessage = `Bạn đã đặt lịch hẹn thành công cho căn ${apartment.sourceCode || "N/A"}.`;

      if (role === "collaborator") {
        await notifyAdmins({
          title: "Lịch hẹn CTV mới",
          message: `CTV ${userData?.displayName || user?.displayName || "Cộng tác viên"} đã đặt lịch dẫn khách ${formData.clientName || "khách hàng"} xem mã căn ${apartment.sourceCode || "N/A"}.`,
          type: "new_booking",
          link: `/${ADMIN_PATH}/bookings`,
        });
        if (user?.uid) {
          await createNotification({
            recipientId: user.uid,
            title: "Đặt lịch thành công",
            message: successMessage,
            type: "new_booking",
            link: "/profile/bookings",
          });
        }
      } else if (role === "user" && user) {
        await notifyAdmins({
          title: "Lịch hẹn mới từ khách hàng",
          message: `Khách ${formData.name || userData?.displayName || "Người dùng"} đã đặt lịch mới xem mã căn ${apartment.sourceCode || "N/A"}.`,
          type: "new_booking",
          link: `/${ADMIN_PATH}/bookings`,
        });
        await createNotification({
          recipientId: user.uid,
          title: "Đặt lịch thành công",
          message: successMessage,
          type: "new_booking",
          link: "/profile/bookings",
        });
      } else if (isGuest) {
        await notifyAdmins({
          title: "Khách vãng lai đặt lịch tư vấn",
          message: `Khách ${formData.name || "vãng lai"} (SĐT: ${formData.phone || "N/A"}) đã đặt lịch mới xem mã căn ${apartment.sourceCode || "N/A"}.`,
          type: "new_booking",
          link: `/${ADMIN_PATH}/bookings`,
        });
      }

      toast({
        title: "Gửi yêu cầu thành công!",
        className: "bg-green-50 text-green-900 border-green-200",
      });
      setIsOpen(false);
      setCtvSearchTerm("");
      setFormData({
        ...formData,
        clientName: "",
        clientPhone: "",
        bookingDate: "",
        bookingTime: "",
        notes: "",
        budget: "",
        consultationPrice: "",
        ctvId: "",
        ctvName: "",
        ctvPhone: "",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng thử lại.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getButtonText = () => {
    if (role === "admin") return "Thêm lịch cho căn này";
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

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setCtvSearchTerm("");
            setIsCtvDropdownOpen(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[450px] rounded-2xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {getButtonText()}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
            {role === "admin" && (
              <div className="flex bg-gray-100 p-1 rounded-xl mb-2">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, adminBookingType: "external" })
                  }
                  className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${formData.adminBookingType === "external" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                  <UserPlus className="h-3.5 w-3.5" /> Khách cá nhân (Private)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, adminBookingType: "ctv" })
                  }
                  className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${formData.adminBookingType === "ctv" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                  <Users className="h-3.5 w-3.5" /> Khách CTV (Shared)
                </button>
              </div>
            )}

            {role === "admin" && formData.adminBookingType === "ctv" && (
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-3 animate-in slide-in-from-top-2">
                <div className="space-y-1.5 relative">
                  <label className="text-xs font-bold text-blue-800">
                    Tìm & chọn CTV trong hệ thống
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
                    <input
                      type="text"
                      placeholder="Gõ tên hoặc SĐT để tìm..."
                      value={ctvSearchTerm}
                      onChange={(e) => {
                        setCtvSearchTerm(e.target.value);
                        setIsCtvDropdownOpen(true);
                      }}
                      onFocus={() => setIsCtvDropdownOpen(true)}
                      className="w-full pl-9 pr-3 py-2.5 border border-blue-200 rounded-lg text-sm outline-none bg-white focus:border-blue-400 shadow-sm transition-all"
                    />

                    {isCtvDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsCtvDropdownOpen(false)}
                        ></div>
                        <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-100 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] max-h-48 overflow-y-auto divide-y divide-gray-50">
                          {filteredCtvs.length > 0 ? (
                            filteredCtvs.map((c) => (
                              <div
                                key={c.uid}
                                onClick={() => handleSelectCtv(c)}
                                className="px-4 py-2.5 hover:bg-blue-50/80 cursor-pointer flex flex-col transition-colors"
                              >
                                <span className="font-bold text-gray-900 text-sm">
                                  {c.displayName}
                                </span>
                                <span className="text-gray-500 text-xs">
                                  {c.phoneNumber}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-4 text-sm text-gray-400 text-center italic">
                              Không tìm thấy CTV nào.
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-blue-100/50 relative">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">
                      Tên CTV <span className="text-red-500">*</span>
                    </label>
                    <input
                      required={formData.adminBookingType === "ctv"}
                      type="text"
                      name="ctvName"
                      value={formData.ctvName}
                      onChange={handleChange}
                      readOnly={isCtvSelectedFromList}
                      className={`w-full border rounded-md p-2 text-sm outline-none ${isCtvSelectedFromList ? "bg-gray-100 text-gray-500 border-gray-200" : "bg-white/60 focus:border-blue-400"}`}
                      placeholder="Tên CTV..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">
                      SĐT CTV
                    </label>
                    <input
                      type="text"
                      name="ctvPhone"
                      value={formData.ctvPhone}
                      onChange={handleChange}
                      readOnly={isCtvSelectedFromList}
                      className={`w-full border rounded-md p-2 text-sm outline-none ${isCtvSelectedFromList ? "bg-gray-100 text-gray-500 border-gray-200" : "bg-white/60 focus:border-blue-400"}`}
                      placeholder="SĐT CTV..."
                    />
                  </div>
                  {isCtvSelectedFromList && (
                    <div className="col-span-2 text-right">
                      <button
                        type="button"
                        onClick={handleClearSelectedCtv}
                        className="text-xs font-bold text-red-500 hover:text-red-700 underline"
                      >
                        Huỷ chọn CTV này (Nhập tay)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

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
                      className="border rounded-lg p-2 outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533]"
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
                      className="border rounded-lg p-2 outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533]"
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
                      className="border rounded-lg p-2 outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533] text-sm"
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
                    className="border rounded-lg p-2 outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533] text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold">
                      Ngày dẫn khách <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="date"
                      name="bookingDate"
                      value={formData.bookingDate}
                      onChange={handleChange}
                      className="border rounded-lg p-2 outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533]"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold whitespace-nowrap">
                      Giờ dẫn{" "}
                      <span className="text-gray-400 text-[11px] font-normal">
                        (Có thể bỏ trống)
                      </span>
                    </label>
                    <input
                      type="time"
                      name="bookingTime"
                      value={formData.bookingTime}
                      onChange={handleChange}
                      className="border rounded-lg p-2 outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533]"
                    />
                  </div>
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
                    className="border rounded-lg p-2 outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533]"
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
                    className="border rounded-lg p-2 outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533]"
                  />
                </div>

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
                      className="border rounded-lg p-2 outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533]"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold">
                      Giờ xem{" "}
                      <span className="text-gray-400 text-[11px] font-normal">
                        (Bỏ trống)
                      </span>
                    </label>
                    <input
                      type="time"
                      name="bookingTime"
                      value={formData.bookingTime}
                      onChange={handleChange}
                      className="border rounded-lg p-2 outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold">Ngân sách</label>
                  <input
                    type="text"
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    placeholder="VD: 5-7 triệu"
                    className="border rounded-lg p-2 outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533]"
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
                className="border rounded-lg p-2 resize-none h-20 outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533]"
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
                "Xác nhận tạo lịch"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
