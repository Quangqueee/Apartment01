// Đường dẫn: src/components/admin/bookings/booking-modals.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  Trash2,
  MessageSquareText,
  FileText,
  ChevronLeft,
  X,
  Copy,
  CalendarDays,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Format functions
const formatCreationDate = (timestamp: any) => {
  if (!timestamp) return "N/A";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatBookingTime = (dtStr?: string) => {
  if (!dtStr) return "Chưa xác định";
  try {
    if (dtStr.includes("T")) {
      const [datePart, timePart] = dtStr.split("T");
      const [y, m, d] = datePart.split("-");
      return `${timePart} ${d}/${m}/${y}`;
    } else {
      const [y, m, d] = dtStr.split("-");
      return `${d}/${m}/${y}`;
    }
  } catch (e) {
    return dtStr;
  }
};

// 1. Popup Xác nhận Đổi trạng thái Hủy
export function CancelConfirmModal({
  isOpen,
  booking,
  onClose,
  onConfirm,
}: any) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px] bg-white rounded-3xl p-0 overflow-hidden shadow-2xl border-0">
        <div className="bg-red-50 p-6 flex flex-col items-center justify-center text-center border-b border-red-100">
          <div className="w-16 h-16 bg-white text-red-500 rounded-full flex items-center justify-center mb-4 shadow-sm border border-red-100">
            <AlertCircle className="h-8 w-8" />
          </div>
          <DialogTitle className="text-xl font-bold text-red-900">
            Xác nhận Hủy Lịch
          </DialogTitle>
          <p className="text-red-600/80 text-sm mt-1.5 font-medium">
            Hành động này sẽ thay đổi trạng thái và không thể hoàn tác.
          </p>
        </div>
        <div className="p-6">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6 space-y-2">
            <div className="text-sm text-gray-500 flex justify-between items-center gap-2">
              <span className="whitespace-nowrap">Khách hàng:</span>
              <span className="font-bold text-gray-900 text-right">
                {booking?.name || booking?.clientName || "N/A"}
              </span>
            </div>
            <div className="text-sm text-gray-500 flex justify-between items-center gap-2">
              <span className="whitespace-nowrap">Mã căn hộ:</span>
              <span className="font-bold text-gray-900 text-right">
                {booking?.apartmentCode || "N/A"}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
            >
              Thoát
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-all"
            >
              Đồng ý
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// 2. Popup Xác nhận Xóa Vĩnh Viễn
export function DeleteConfirmModal({
  isOpen,
  booking,
  onClose,
  onConfirm,
}: any) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px] bg-white rounded-3xl p-0 overflow-hidden shadow-2xl border-0">
        <div className="bg-red-600 p-6 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-white/20 text-white rounded-full flex items-center justify-center mb-4">
            <Trash2 className="h-8 w-8" />
          </div>
          <DialogTitle className="text-xl font-bold text-white">
            Xóa vĩnh viễn lịch hẹn?
          </DialogTitle>
          <p className="text-white/80 text-sm mt-1.5 font-medium px-4">
            Lịch hẹn này sẽ bị xóa hoàn toàn khỏi hệ thống và biến mất khỏi tài
            khoản của CTV/User. Không thể hoàn tác!
          </p>
        </div>
        <div className="p-6 bg-white">
          <div className="bg-red-50 rounded-xl p-4 border border-red-100 mb-6 space-y-2">
            <div className="text-sm text-red-800 flex justify-between items-center gap-2">
              <span className="whitespace-nowrap">Khách hàng:</span>
              <span className="font-bold text-right">
                {booking?.name || booking?.clientName || "N/A"}
              </span>
            </div>
            <div className="text-sm text-red-800 flex justify-between items-center gap-2">
              <span className="whitespace-nowrap">Mã căn hộ:</span>
              <span className="font-bold text-right">
                {booking?.apartmentCode || "N/A"}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
            >
              Thoát
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-all"
            >
              Xác nhận Xóa
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// 3. Popup Viết Note Nhanh
export function NoteModal({ isOpen, booking, onClose, onSave, isSaving }: any) {
  const [note, setNote] = useState("");
  useEffect(() => {
    if (isOpen && booking) setNote(booking.adminNotes || "");
  }, [isOpen, booking]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[90%] max-w-[450px] bg-white rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <MessageSquareText className="h-5 w-5 text-[#cda533]" /> Ghi chú
            phản hồi
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(note);
          }}
          className="space-y-4 mt-2"
        >
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              Ghi chú ADMIN{" "}
              <span className="text-[10px] font-normal px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                User/CTV sẽ thấy
              </span>
            </label>
            <textarea
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Đã check căn này chủ nhà đi vắng..."
              className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533]"
            />
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-gray-900 text-white font-bold text-sm flex items-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="animate-spin h-4 w-4" />
              ) : (
                "Lưu ghi chú"
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// 4. Popup Chi tiết Form Full-screen
export function DetailsModal({
  isOpen,
  booking,
  onClose,
  onSave,
  isSaving,
}: any) {
  const { toast } = useToast();
  const [note, setNote] = useState("");

  useEffect(() => {
    if (isOpen && booking) setNote(booking.adminNotes || "");
  }, [isOpen, booking]);

  const handleCopyPhone = (phone?: string) => {
    if (!phone || phone === "N/A") return;
    navigator.clipboard.writeText(phone);
    toast({
      title: "Đã copy số điện thoại",
      className: "bg-green-50 text-green-900 border-green-200",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={
          "p-0 border-none shadow-2xl z-[100] gap-0 bg-gray-50 flex flex-col [&>button.absolute]:hidden sm:max-w-[650px] sm:max-h-[85vh] sm:rounded-2xl overflow-hidden max-sm:fixed max-sm:inset-0 max-sm:w-full max-sm:h-[100dvh] max-sm:max-h-[100dvh] max-sm:rounded-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:data-[state=open]:animate-in max-sm:data-[state=closed]:animate-out max-sm:data-[state=open]:slide-in-from-bottom-full max-sm:data-[state=closed]:slide-out-to-bottom-full max-sm:duration-300 max-sm:ease-out"
        }
      >
        <div className="px-4 py-3.5 sm:px-6 sm:py-5 border-b border-gray-200 flex flex-row items-center justify-between bg-white z-20 shrink-0 shadow-sm w-full">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100 transition-colors sm:hidden"
            >
              <ChevronLeft className="h-6 w-6 text-gray-900" />
            </button>
            <DialogTitle className="font-black text-lg sm:text-xl text-gray-900 m-0 !mt-0 flex items-center gap-2">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-[#cda533]" /> Form
              Yêu Cầu
            </DialogTitle>
          </div>
          <button
            onClick={onClose}
            className="hidden sm:flex p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {booking && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSave(note);
            }}
            className="flex flex-col flex-1 h-full overflow-hidden bg-gray-50"
          >
            <div className="px-4 py-4 sm:px-6 sm:py-6 overflow-y-auto flex-1 space-y-4 no-scrollbar">
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-3">
                  <div>
                    <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest block">
                      Mã căn
                    </span>
                    <div className="font-black text-[#cda533] text-xl sm:text-2xl leading-none mt-1">
                      {booking.apartmentCode || "N/A"}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest block">
                      Ngày tạo
                    </span>
                    <div className="font-bold text-gray-700 text-xs sm:text-sm mt-1">
                      {formatCreationDate(booking.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-y-3 sm:gap-y-4 text-sm sm:text-base">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">
                      Tên khách:
                    </span>
                    <span className="font-bold text-gray-900">
                      {booking.type === "ctv"
                        ? booking.clientName
                        : booking.name || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">
                      SĐT Khách:
                    </span>
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${booking.type === "ctv" ? booking.clientPhone : booking.phone}`}
                        className="font-bold text-blue-600 hover:underline"
                      >
                        {booking.type === "ctv"
                          ? booking.clientPhone
                          : booking.phone || "N/A"}
                      </a>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyPhone(
                            booking.type === "ctv"
                              ? booking.clientPhone
                              : booking.phone,
                          )
                        }
                        className="p-1.5 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">
                      Ngân sách:
                    </span>
                    <span className="font-bold text-gray-900">
                      {booking.budget || "Không rõ"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">
                      Giá tư vấn:
                    </span>
                    <span className="font-bold text-gray-900">
                      {booking.consultationPrice || "Chưa nhập"}
                    </span>
                  </div>
                </div>
              </div>

              {booking.type === "ctv" && (
                <div className="bg-blue-50/60 rounded-xl p-4 border border-blue-100 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] sm:text-xs font-bold text-blue-500 uppercase tracking-widest block mb-1">
                      Cộng tác viên
                    </span>
                    <div className="font-bold text-gray-900 text-sm sm:text-base">
                      {booking.ctvName || "Chưa rõ"}{" "}
                      <span className="mx-2 text-gray-300">|</span>{" "}
                      <a
                        href={`tel:${booking.ctvPhone}`}
                        className="text-blue-700 hover:underline"
                      >
                        {booking.ctvPhone || "N/A"}
                      </a>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyPhone(booking.ctvPhone)}
                    className="p-2.5 bg-white text-gray-500 hover:text-gray-900 rounded-lg shadow-sm border border-blue-100 transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm space-y-3">
                <div className="flex items-start gap-3 border-b border-gray-100 pb-3">
                  <CalendarDays className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">
                      Lịch khách xem
                    </span>
                    <div className="font-bold text-gray-900 text-sm sm:text-base">
                      {formatBookingTime(booking.dateTime)}
                    </div>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">
                    Ghi chú từ khách:
                  </span>
                  <div className="font-medium text-gray-700 text-sm sm:text-base whitespace-pre-wrap leading-snug">
                    {booking.notes || (
                      <span className="italic text-gray-400">
                        Không có yêu cầu.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2 pb-2">
                <label className="text-[11px] sm:text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5 mb-2 ml-1">
                  <MessageSquareText className="h-4 w-4" /> Ghi chú ADMIN (Sửa
                  được)
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Nhập ghi chú nội bộ, lý do hủy..."
                  className="w-full border border-gray-200 rounded-xl p-3.5 text-sm sm:text-base resize-none outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533] bg-white shadow-sm transition-all"
                />
              </div>
            </div>
            <div className="shrink-0 p-3 sm:px-6 sm:py-4 border-t border-gray-200 bg-white z-20 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full h-12 rounded-xl bg-gray-900 hover:bg-[#cda533] text-white font-bold text-[15px] sm:text-base flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                {isSaving ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  "Lưu ghi chú Admin"
                )}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
