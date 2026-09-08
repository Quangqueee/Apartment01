"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  doc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  BadgeCheck,
  CalendarDays,
  Loader2,
  MessageSquareText,
  Moon,
  XCircle,
} from "lucide-react";
import { db } from "@/firebase";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import {
  SHORT_TERM_PUBLIC_ACCESS,
  STAY_BOOKING_STATUS_LABELS,
} from "@/lib/constants";
import type { StayBooking } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  awaiting_payment: "bg-amber-100 text-amber-800 border-amber-200",
  confirmed: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-gray-100 text-gray-700 border-gray-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
  expired: "bg-red-50 text-red-600 border-red-100",
};

function formatVnDate(iso?: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default function StayBookingsList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<StayBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<StayBooking | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const q = query(
        collection(db, "stay_bookings"),
        where("userId", "==", user.uid),
      );
      const snap = await getDocs(q);
      const list = snap.docs
        .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as StayBooking)
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setBookings(list);
    } catch (error) {
      console.error("StayBookingsList fetch:", error);
      toast({
        variant: "destructive",
        title: "Lỗi tải dữ liệu",
        description: "Không thể lấy danh sách đặt phòng.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setIsCancelling(true);
    try {
      await updateDoc(doc(db, "stay_bookings", cancelTarget.id), {
        status: "cancelled",
        updatedAt: Timestamp.now(),
      });
      toast({
        title: "Đã hủy đặt phòng.",
        className: "bg-green-50 text-green-900 border-green-200",
      });
      fetchBookings();
    } catch (error) {
      console.error("handleCancel:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể hủy. Vui lòng thử lại.",
      });
    } finally {
      setIsCancelling(false);
      setCancelTarget(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#cda533]" />
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
        <Moon className="mx-auto h-12 w-12 text-gray-200 mb-3" />
        <p className="font-bold text-gray-500">
          Bạn chưa có đặt phòng ngắn hạn nào.
        </p>
        {SHORT_TERM_PUBLIC_ACCESS ? (
          <Button
            asChild
            className="mt-4 bg-[#cda533] hover:bg-[#b88e22] text-white font-bold rounded-xl"
          >
            <Link href="/can-ho-ngan-han">Khám phá căn hộ ngắn hạn</Link>
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full overflow-x-hidden">
      {bookings.map((booking) => {
        const canCancel =
          booking.status === "pending" || booking.status === "awaiting_payment";

        return (
          <div
            key={booking.id}
            className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100 flex flex-col gap-3 w-full"
          >
            <div className="flex items-start justify-between gap-3 border-b border-gray-50 pb-3">
              <div className="min-w-0">
                <p className="font-bold text-gray-900 truncate">
                  {booking.apartmentTitle || "Căn hộ ngắn hạn"}
                </p>
                <Link
                  href={`/can-ho-ngan-han/${booking.apartmentId}`}
                  className="text-xs text-blue-600 hover:underline font-semibold"
                >
                  Xem căn hộ
                </Link>
              </div>
              <span
                className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md border whitespace-nowrap shrink-0 ${STATUS_STYLES[booking.status] || STATUS_STYLES.pending}`}
              >
                {STAY_BOOKING_STATUS_LABELS[booking.status] || booking.status}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                  Nhận phòng
                </span>
                <span className="font-bold text-gray-900 flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                  {formatVnDate(booking.checkIn)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                  Trả phòng
                </span>
                <span className="font-bold text-gray-900 flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                  {formatVnDate(booking.checkOut)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                  Số đêm / khách
                </span>
                <span className="font-bold text-gray-900">
                  {booking.nights} đêm · {booking.guestsCount} khách
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                  Ước tính
                </span>
                <span className="font-black text-[#cda533]">
                  {(booking.totalAmount || 0).toLocaleString("vi-VN")}đ
                </span>
              </div>
            </div>

            {booking.status === "pending" ||
            booking.status === "awaiting_payment" ? (
              <p className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                Yêu cầu đang chờ đội ngũ xác nhận. Chúng tôi sẽ liên hệ với bạn.
              </p>
            ) : null}

            {booking.status === "confirmed" && (
              <p className="text-xs font-semibold text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2 flex items-center gap-1.5">
                <BadgeCheck className="h-4 w-4" /> Đã xác nhận. Hẹn gặp bạn
                ngày {formatVnDate(booking.checkIn)}!
              </p>
            )}

            {booking.adminNotes && (
              <div className="bg-blue-50/50 p-2.5 rounded-lg border border-blue-100/50 flex items-start gap-2">
                <MessageSquareText className="h-4 w-4 text-blue-500 shrink-0" />
                <span className="text-xs font-semibold text-blue-800">
                  {booking.adminNotes}
                </span>
              </div>
            )}

            {canCancel && (
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <Button
                  variant="outline"
                  onClick={() => setCancelTarget(booking)}
                  className="h-11 rounded-xl text-red-600 border-red-200 hover:bg-red-50 font-bold"
                >
                  <XCircle className="h-4 w-4 mr-1.5" /> Hủy đặt phòng
                </Button>
              </div>
            )}
          </div>
        );
      })}

      <AlertDialog
        open={!!cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
      >
        <AlertDialogContent className="bg-white z-[100] shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Hủy đặt phòng?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn chắc chắn muốn hủy đặt phòng &quot;
              {cancelTarget?.apartmentTitle}&quot; ({cancelTarget?.nights} đêm)?
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>
              Giữ đặt phòng
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleCancel();
              }}
              disabled={isCancelling}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isCancelling ? "Đang hủy..." : "Hủy đặt phòng"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
