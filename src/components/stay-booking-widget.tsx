"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { differenceInCalendarDays, format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { CalendarDays, Loader2, Minus, Plus } from "lucide-react";
import { db } from "@/firebase";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { createNotification, notifyAdmins } from "@/lib/notifications";
import { ADMIN_PATH } from "@/lib/constants";
import { rangeHasConflict } from "@/lib/short-term-data-client";
import type { ShortTermApartment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type StayBookingWidgetProps = {
  apartment: ShortTermApartment;
  unavailableDates: Set<string>;
  hideMobileBar?: boolean;
};

export default function StayBookingWidget({
  apartment,
  unavailableDates,
  hideMobileBar = false,
}: StayBookingWidgetProps) {
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(1);
  const [guestName, setGuestName] = useState(userData?.displayName || "");
  const [guestPhone, setGuestPhone] = useState(userData?.phoneNumber || "");
  const [notes, setNotes] = useState("");

  const isPaused = apartment.status === "rented";

  const nights = useMemo(() => {
    if (!range?.from || !range?.to) return 0;
    return differenceInCalendarDays(range.to, range.from);
  }, [range]);

  const totalAmount = nights * (apartment.nightlyPrice || 0);

  const disabledDays = useMemo(() => {
    const blocked = Array.from(unavailableDates).map(
      (d) => new Date(`${d}T00:00:00`),
    );
    return [{ before: new Date() }, ...blocked];
  }, [unavailableDates]);

  const validate = (): string | null => {
    if (!range?.from || !range?.to) return "Vui lòng chọn ngày nhận và trả phòng.";
    if (nights < (apartment.minNights || 1)) {
      return `Căn này yêu cầu ở tối thiểu ${apartment.minNights || 1} đêm.`;
    }
    if (guests < 1 || guests > (apartment.maxGuests || 1)) {
      return `Căn này nhận tối đa ${apartment.maxGuests || 1} khách.`;
    }
    const checkIn = format(range.from, "yyyy-MM-dd");
    const checkOut = format(range.to, "yyyy-MM-dd");
    if (rangeHasConflict(checkIn, checkOut, unavailableDates)) {
      return "Khoảng ngày bạn chọn có ngày đã kín. Vui lòng chọn lại.";
    }
    if (!guestName.trim() || guestName.trim().length < 2) {
      return "Vui lòng nhập họ tên.";
    }
    if (!guestPhone.trim() || guestPhone.trim().length < 8) {
      return "Vui lòng nhập số điện thoại hợp lệ.";
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!user) return;
    const errorMessage = validate();
    if (errorMessage) {
      toast({
        variant: "destructive",
        title: "Chưa thể gửi yêu cầu",
        description: errorMessage,
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const checkIn = format(range!.from!, "yyyy-MM-dd");
      const checkOut = format(range!.to!, "yyyy-MM-dd");
      await addDoc(collection(db, "stay_bookings"), {
        apartmentId: apartment.id,
        apartmentTitle: apartment.title,
        apartmentCode: apartment.sourceCode || "",
        userId: user.uid,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        checkIn,
        checkOut,
        nights,
        guestsCount: guests,
        nightlyPrice: apartment.nightlyPrice,
        totalAmount,
        notes: notes.trim(),
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await notifyAdmins({
        title: "Yêu cầu đặt phòng ngắn hạn mới",
        message: `Khách ${guestName.trim()} yêu cầu đặt "${apartment.title}" từ ${checkIn} đến ${checkOut} (${nights} đêm).`,
        type: "new_booking",
        link: `/${ADMIN_PATH}/stay-bookings`,
      });
      await createNotification({
        recipientId: user.uid,
        title: "Đã gửi yêu cầu đặt phòng",
        message: `Yêu cầu đặt "${apartment.title}" (${nights} đêm) đang chờ xác nhận. Chúng tôi sẽ phản hồi sớm nhất.`,
        type: "new_booking",
        link: "/profile/bookings?tab=stay",
      });

      toast({
        title: "Gửi yêu cầu thành công!",
        description:
          "Đội ngũ sẽ xác nhận trong ngày và liên hệ với bạn để chốt lịch lưu trú.",
        className: "bg-green-50 text-green-900 border-green-200",
      });
      setIsOpen(false);
      router.push("/profile/bookings?tab=stay");
    } catch (error) {
      console.error("StayBookingWidget submit:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể gửi yêu cầu. Vui lòng thử lại.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full border border-[#e2e2e2] rounded-lg px-3 py-2.5 text-base outline-none focus:border-[#cda533] focus:ring-1 focus:ring-[#cda533]";
  const labelClass = "text-sm font-semibold text-[#222222]";

  const bookingForm = (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-2">
        <Calendar
          mode="range"
          selected={range}
          onSelect={setRange}
          disabled={disabledDays}
          numberOfMonths={1}
          className="rounded-xl border"
        />
        <p className="text-xs text-gray-500">
          {range?.from && range?.to
            ? `${format(range.from, "dd/MM/yyyy")} → ${format(range.to, "dd/MM/yyyy")} · ${nights} đêm`
            : `Chọn ngày nhận và trả phòng (tối thiểu ${apartment.minNights || 1} đêm)`}
        </p>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-[#e2e2e2] px-4 py-3">
        <span className={labelClass}>
          Số khách{" "}
          <span className="text-xs font-normal text-gray-400">
            (tối đa {apartment.maxGuests})
          </span>
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setGuests((g) => Math.max(1, g - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:border-[#cda533] disabled:opacity-40"
            disabled={guests <= 1}
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-6 text-center font-bold">{guests}</span>
          <button
            type="button"
            onClick={() =>
              setGuests((g) => Math.min(apartment.maxGuests || 1, g + 1))
            }
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:border-[#cda533] disabled:opacity-40"
            disabled={guests >= (apartment.maxGuests || 1)}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>
            Họ và tên <span className="text-red-500">*</span>
          </label>
          <input
            required
            type="text"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>
            Số điện thoại <span className="text-red-500">*</span>
          </label>
          <input
            required
            type="tel"
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Ghi chú</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Giờ đến dự kiến, yêu cầu đặc biệt..."
          className={`${inputClass} resize-none h-20`}
        />
      </div>

      {nights > 0 && (
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>
              {(apartment.nightlyPrice || 0).toLocaleString("vi-VN")}đ ×{" "}
              {nights} đêm
            </span>
            <span>{totalAmount.toLocaleString("vi-VN")}đ</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2">
            <span>Tổng cộng</span>
            <span className="text-[#cda533]">
              {totalAmount.toLocaleString("vi-VN")}đ
            </span>
          </div>
          <p className="text-[11px] text-gray-400 pt-1">
            Giá ước tính. Đây là website môi giới — chưa thu tiền online.
            Đội ngũ sẽ liên hệ để chốt sau khi xác nhận yêu cầu.
          </p>
        </div>
      )}

      {user ? (
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || isPaused}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-[#FF385C] to-[#D70466] hover:from-[#E31C5F] hover:to-[#BD0458] text-white font-bold shadow-[0_8px_20px_rgba(215,4,102,0.28)]"
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isPaused ? (
            "Căn này tạm ngưng nhận khách"
          ) : (
            "Gửi yêu cầu đặt phòng"
          )}
        </Button>
      ) : (
        <Button
          asChild
          className="w-full h-12 rounded-xl bg-gray-900 hover:bg-[#cda533] text-white font-bold"
        >
          <Link href={`/login?redirect=${encodeURIComponent(pathname || "/can-ho-ngan-han")}`}>
            Đăng nhập để đặt phòng
          </Link>
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop: widget sticky bên phải */}
      <div className="hidden lg:block sticky top-[calc(var(--site-header-height)+0.75rem)]">
        <div className="rounded-2xl bg-white p-5 shadow-[0_6px_20px_rgba(0,0,0,0.08)] border border-[#e2e2e2] max-h-[calc(100vh-8rem)] overflow-y-auto overflow-x-hidden">
          <div className="mb-4 pb-4 border-b border-[#e2e2e2]">
            <p className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-[#cda533]">
                {(apartment.nightlyPrice || 0).toLocaleString("vi-VN")}đ
              </span>
              <span className="text-sm text-[#757575]">/đêm</span>
            </p>
            <p className="text-xs text-[#757575] mt-1">
              Nhận phòng {apartment.checkInTime} · Trả phòng{" "}
              {apartment.checkOutTime}
            </p>
          </div>
          {bookingForm}
        </div>
      </div>

      {/* Mobile: thanh CTA cố định đáy màn hình */}
      <div
        className={cn(
          "listing-sticky-cta lg:hidden fixed left-0 right-0 z-40 bg-white border-t border-[#e2e2e2] px-5 py-3 flex items-center gap-3 overflow-x-hidden",
          hideMobileBar && "hidden",
        )}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1">
            <p className="font-bold text-[20px] leading-7 text-[#cda533] truncate">
              {(apartment.nightlyPrice || 0).toLocaleString("vi-VN")}đ
            </p>
            <p className="font-normal text-[14px] leading-5 text-[#757575] shrink-0">
              /đêm
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="shrink-0 min-w-[148px] bg-gradient-to-r from-[#FF385C] to-[#D70466] hover:from-[#E31C5F] hover:to-[#BD0458] active:scale-[0.98] text-white font-bold text-[15px] leading-5 px-5 py-3.5 rounded-xl shadow-[0_8px_20px_rgba(215,4,102,0.35)] transition-all flex items-center justify-center gap-1.5"
        >
          <CalendarDays className="h-4 w-4" /> Đặt phòng
        </button>
      </div>

      {/* Mobile: dialog form đặt phòng */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-2xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Đặt phòng ngắn hạn
            </DialogTitle>
          </DialogHeader>
          {bookingForm}
        </DialogContent>
      </Dialog>
    </>
  );
}
