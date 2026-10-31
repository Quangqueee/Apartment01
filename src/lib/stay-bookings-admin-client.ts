"use client";

import {
  deleteDoc,
  doc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/firebase";
import { createNotification } from "@/lib/notifications";
import type { StayBooking } from "@/lib/types";
import { confirmStayBooking } from "@/lib/stay-bookings-client";

/** Admin duyệt đơn: pending → confirmed (môi giới, không thu tiền online). */
export async function approveStayBookingClient(booking: StayBooking) {
  try {
    await confirmStayBooking(booking.id);
    await createNotification({
      recipientId: booking.userId,
      title: "Đặt phòng đã được xác nhận",
      message: `Yêu cầu đặt "${booking.apartmentTitle || "căn hộ"}" (${booking.rateLabel || `${booking.nights} đêm`}, nhận phòng ${booking.checkIn}) đã được xác nhận. Đội ngũ sẽ liên hệ với bạn.`,
      type: "status_update",
      link: "/profile/bookings?tab=stay",
    });
    return { success: true as const };
  } catch (error) {
    console.error("approveStayBookingClient:", error);
    return { error: error instanceof Error ? error.message : "Không thể duyệt đơn. Vui lòng thử lại." };
  }
}

/** Admin từ chối đơn (kèm lý do). */
export async function rejectStayBookingClient(
  booking: StayBooking,
  adminNotes?: string,
) {
  try {
    await updateDoc(doc(db, "stay_bookings", booking.id), {
      status: "rejected",
      adminNotes: adminNotes || "",
      updatedAt: Timestamp.now(),
    });
    await createNotification({
      recipientId: booking.userId,
      title: "Đặt phòng chưa được duyệt",
      message: `Yêu cầu đặt "${booking.apartmentTitle || "căn hộ"}" chưa được duyệt.${adminNotes ? ` Lý do: ${adminNotes}` : ""}`,
      type: "status_update",
      link: "/profile/bookings?tab=stay",
    });
    return { success: true as const };
  } catch (error) {
    console.error("rejectStayBookingClient:", error);
    return { error: "Không thể từ chối đơn. Vui lòng thử lại." };
  }
}

/** Cập nhật trạng thái đơn giản (completed / expired / cancelled) + ghi chú. */
export async function updateStayBookingStatusClient(
  bookingId: string,
  status: string,
  adminNotes?: string,
) {
  try {
    const payload: Record<string, unknown> = {
      status,
      updatedAt: Timestamp.now(),
    };
    if (adminNotes !== undefined) payload.adminNotes = adminNotes;
    await updateDoc(doc(db, "stay_bookings", bookingId), payload);
    return { success: true as const };
  } catch (error) {
    console.error("updateStayBookingStatusClient:", error);
    return { error: "Không thể cập nhật trạng thái." };
  }
}

export async function deleteStayBookingClient(bookingId: string) {
  try {
    await deleteDoc(doc(db, "stay_bookings", bookingId));
    return { success: true as const };
  } catch (error) {
    console.error("deleteStayBookingClient:", error);
    return { error: "Không thể xóa đơn." };
  }
}
