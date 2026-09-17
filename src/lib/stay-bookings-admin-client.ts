"use client";

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/firebase";
import { createNotification } from "@/lib/notifications";
import type { StayBooking } from "@/lib/types";

/** Hai khoảng [checkIn, checkOut) giao nhau? */
function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
) {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Kiểm tra đơn có trùng ngày với booking đang giữ chỗ/đã xác nhận khác
 * của cùng căn, hoặc đụng ngày chặn tay của căn hộ.
 */
export async function checkStayBookingConflict(
  booking: Pick<StayBooking, "id" | "apartmentId" | "checkIn" | "checkOut">,
): Promise<{ conflict: boolean; reason?: string }> {
  try {
    const q = query(
      collection(db, "stay_bookings"),
      where("apartmentId", "==", booking.apartmentId),
      where("status", "in", ["awaiting_payment", "confirmed"]),
    );
    const snap = await getDocs(q);
    for (const docSnap of snap.docs) {
      if (docSnap.id === booking.id) continue;
      const other = docSnap.data();
      if (
        other.checkIn &&
        other.checkOut &&
        rangesOverlap(
          booking.checkIn,
          booking.checkOut,
          other.checkIn,
          other.checkOut,
        )
      ) {
        return {
          conflict: true,
          reason: `Trùng với đơn của khách ${other.guestName || ""} (${other.checkIn} → ${other.checkOut}).`,
        };
      }
    }

    const aptSnap = await getDoc(
      doc(db, "short_term_apartments", booking.apartmentId),
    );
    const blockedDates: string[] = aptSnap.data()?.blockedDates || [];
    const hit = blockedDates.find(
      (d) => d >= booking.checkIn && d < booking.checkOut,
    );
    if (hit) {
      return {
        conflict: true,
        reason: `Ngày ${hit} đang bị chặn tay trên lịch căn hộ.`,
      };
    }

    return { conflict: false };
  } catch (error) {
    console.error("checkStayBookingConflict:", error);
    return { conflict: true, reason: "Không kiểm tra được trùng lịch." };
  }
}

/** Admin duyệt đơn: pending → confirmed (môi giới, không thu tiền online). */
export async function approveStayBookingClient(booking: StayBooking) {
  try {
    const { conflict, reason } = await checkStayBookingConflict(booking);
    if (conflict) {
      return { error: reason || "Đơn bị trùng lịch." };
    }
    await updateDoc(doc(db, "stay_bookings", booking.id), {
      status: "confirmed",
      updatedAt: Timestamp.now(),
    });
    await createNotification({
      recipientId: booking.userId,
      title: "Đặt phòng đã được xác nhận",
      message: `Yêu cầu đặt "${booking.apartmentTitle || "căn hộ"}" (${booking.nights} đêm, nhận phòng ${booking.checkIn}) đã được xác nhận. Đội ngũ sẽ liên hệ với bạn.`,
      type: "status_update",
      link: "/profile/bookings?tab=stay",
    });
    return { success: true as const };
  } catch (error) {
    console.error("approveStayBookingClient:", error);
    return { error: "Không thể duyệt đơn. Vui lòng thử lại." };
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
