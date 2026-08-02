// Đường dẫn: src/components/admin/bookings/add-booking-modal.tsx
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
import { createNotification } from "@/lib/notifications";
import { ADMIN_PATH } from "@/lib/constants";
import { Loader2, Search, UserPlus, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const removeVietnameseTones = (str: string = "") => {
  if (!str) return "";
  return str
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
};

export function AddBookingModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [ctvList, setCtvList] = useState<any[]>([]);
  const [ctvSearchTerm, setCtvSearchTerm] = useState("");
  const [isCtvDropdownOpen, setIsCtvDropdownOpen] = useState(false);

  const [addForm, setAddForm] = useState({
    bookingType: "external",
    ctvId: "",
    ctvName: "",
    ctvPhone: "",
    name: "",
    phone: "",
    apartmentCode: "",
    budget: "",
    consultationPrice: "",
    bookingDate: "",
    bookingTime: "",
    notes: "",
  });

  const isCtvSelectedFromList = !!(
    addForm.ctvId && addForm.ctvId !== "manual_entry"
  );

  useEffect(() => {
    const fetchCTVs = async () => {
      const q = query(
        collection(db, "users"),
        where("role", "==", "collaborator"),
      );
      const snap = await getDocs(q);
      setCtvList(snap.docs.map((doc) => ({ uid: doc.id, ...doc.data() })));
    };
    fetchCTVs();
  }, []);

  const filteredCtvs = ctvList.filter(
    (c) =>
      removeVietnameseTones(c.displayName).includes(
        removeVietnameseTones(ctvSearchTerm),
      ) || (c.phoneNumber || "").includes(ctvSearchTerm),
  );

  const handleAddFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setAddForm((prev) => {
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

  const handleSelectCtvForAdd = (ctv: any) => {
    setAddForm((prev) => ({
      ...prev,
      ctvId: ctv.uid,
      ctvName: ctv.displayName || "",
      ctvPhone: ctv.phoneNumber || "",
    }));
    setCtvSearchTerm(`${ctv.displayName} - ${ctv.phoneNumber}`);
    setIsCtvDropdownOpen(false);
  };

  const notifyAdminsOfManualBooking = async (
    clientName: string,
    apartmentCode?: string,
  ) => {
    try {
      const adminsSnap = await getDocs(
        query(collection(db, "users"), where("role", "==", "admin")),
      );
      await Promise.all(
        adminsSnap.docs.map((adminDoc) =>
          createNotification({
            recipientId: adminDoc.id,
            title: "Lịch hẹn thủ công mới",
            message: `Đã tạo lịch hẹn thủ công cho khách ${clientName || "khách hàng"}${apartmentCode ? ` - mã căn ${apartmentCode}` : ""}.`,
            type: "new_booking",
            link: `/${ADMIN_PATH}/bookings`,
          }),
        ),
      );
    } catch (error) {
      console.error("Lỗi gửi thông báo cho admin:", error);
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      const finalDateTime = addForm.bookingTime
        ? `${addForm.bookingDate}T${addForm.bookingTime}`
        : addForm.bookingDate;
      let payload: any = {
        apartmentCode: addForm.apartmentCode,
        budget: addForm.budget,
        consultationPrice: addForm.consultationPrice,
        dateTime: finalDateTime,
        notes: addForm.notes,
        status: "approved",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (addForm.bookingType === "ctv") {
        payload = {
          ...payload,
          ctvId: addForm.ctvId || "manual_entry",
          ctvName: addForm.ctvName || "Chưa rõ",
          ctvPhone: addForm.ctvPhone || "N/A",
          clientName: addForm.name,
          clientPhone: addForm.phone,
          createdByAdminId: user?.uid,
        };
        await addDoc(collection(db, "ctv_bookings"), payload);
      } else {
        payload = {
          ...payload,
          name: addForm.name,
          phone: addForm.phone,
          isExternal: true,
          createdByAdminId: user?.uid,
        };
        await addDoc(collection(db, "user_bookings"), payload);
      }

      await notifyAdminsOfManualBooking(addForm.name, addForm.apartmentCode);

      toast({
        title: "Đã tạo lịch thành công",
        className: "bg-green-50 text-green-900 border-green-200",
      });
      onClose();
      setCtvSearchTerm("");
      setAddForm({
        bookingType: "external",
        ctvId: "",
        ctvName: "",
        ctvPhone: "",
        name: "",
        phone: "",
        apartmentCode: "",
        budget: "",
        consultationPrice: "",
        bookingDate: "",
        bookingTime: "",
        notes: "",
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Lỗi tạo lịch" });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="w-[90%] max-w-[500px] bg-white rounded-3xl p-6 h-[90vh] md:h-auto overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Thêm lịch thủ công
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleManualAdd} className="space-y-4 mt-2">
          {/* Cụm nút chọn loại khách */}
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() =>
                setAddForm({ ...addForm, bookingType: "external" })
              }
              className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${addForm.bookingType === "external" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              <UserPlus className="h-4 w-4" /> Khách cá nhân
            </button>
            <button
              type="button"
              onClick={() => setAddForm({ ...addForm, bookingType: "ctv" })}
              className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${addForm.bookingType === "ctv" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              <Users className="h-4 w-4" /> Khách CTV
            </button>
          </div>

          {/* Form tìm kiếm CTV */}
          {addForm.bookingType === "ctv" && (
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-3">
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
                              onClick={() => handleSelectCtvForAdd(c)}
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
                    required={addForm.bookingType === "ctv"}
                    type="text"
                    name="ctvName"
                    value={addForm.ctvName}
                    onChange={handleAddFormChange}
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
                    value={addForm.ctvPhone}
                    onChange={handleAddFormChange}
                    readOnly={isCtvSelectedFromList}
                    className={`w-full border rounded-md p-2 text-sm outline-none ${isCtvSelectedFromList ? "bg-gray-100 text-gray-500 border-gray-200" : "bg-white/60 focus:border-blue-400"}`}
                    placeholder="SĐT CTV..."
                  />
                </div>
                {isCtvSelectedFromList && (
                  <div className="col-span-2 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setAddForm((p) => ({
                          ...p,
                          ctvId: "",
                          ctvName: "",
                          ctvPhone: "",
                        }));
                        setCtvSearchTerm("");
                      }}
                      className="text-xs font-bold text-red-500 hover:text-red-700 underline"
                    >
                      Huỷ chọn CTV này (Nhập tay)
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form thông tin Khách hàng */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">
                Tên khách <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                name="name"
                value={addForm.name}
                onChange={handleAddFormChange}
                className="w-full border rounded-xl p-3 md:p-2.5 text-sm outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">
                SĐT khách <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="tel"
                name="phone"
                value={addForm.phone}
                onChange={handleAddFormChange}
                className="w-full border rounded-xl p-3 md:p-2.5 text-sm outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533]"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Mã căn</label>
              <input
                type="text"
                name="apartmentCode"
                value={addForm.apartmentCode}
                onChange={handleAddFormChange}
                className="w-full border rounded-xl p-3 md:p-2.5 text-sm outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Ngân sách</label>
              <input
                type="text"
                name="budget"
                value={addForm.budget}
                onChange={handleAddFormChange}
                placeholder="VD: 5-7tr"
                className="w-full border rounded-xl p-3 md:p-2.5 text-sm outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533]"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">
                Ngày xem <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="date"
                name="bookingDate"
                value={addForm.bookingDate}
                onChange={handleAddFormChange}
                className="w-full border rounded-xl p-3 md:p-2.5 text-sm outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">
                Giờ xem{" "}
                <span className="text-gray-400 text-xs font-normal">
                  (Có thể bỏ trống)
                </span>
              </label>
              <input
                type="time"
                name="bookingTime"
                value={addForm.bookingTime}
                onChange={handleAddFormChange}
                className="w-full border rounded-xl p-3 md:p-2.5 text-sm outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533]"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Giá tư vấn</label>
            <input
              type="text"
              name="consultationPrice"
              value={addForm.consultationPrice}
              onChange={handleAddFormChange}
              placeholder="Giá báo khách..."
              className="w-full border rounded-xl p-3 md:p-2.5 text-sm outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Lưu ý thêm</label>
            <textarea
              rows={2}
              name="notes"
              value={addForm.notes}
              onChange={handleAddFormChange}
              placeholder="Tài chính, xe điện, pet..."
              className="w-full border rounded-xl p-3 md:p-2.5 text-sm resize-none outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533]"
            />
          </div>

          <div className="pt-4 md:pt-2 flex flex-col md:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="order-2 md:order-1 px-5 py-3 md:py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isAdding}
              className="order-1 md:order-2 px-5 py-3 md:py-2.5 rounded-xl bg-[#cda533] hover:bg-[#b88e22] text-white font-bold text-sm flex items-center justify-center gap-2"
            >
              {isAdding ? (
                <Loader2 className="animate-spin h-4 w-4" />
              ) : (
                "Tạo lịch hẹn"
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
