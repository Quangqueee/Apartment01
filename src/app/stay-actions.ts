"use server";

import { addDays, format, parseISO } from "date-fns";
import { adminDb } from "@/firebase/admin-init";
import { stayInterval } from "@/lib/stay-pricing";

/**
 * Ngày không trống của một căn ngắn hạn (YYYY-MM-DD).
 * Dùng Admin SDK để khách xem lịch mà không đọc PII trong `stay_bookings`.
 */
export async function getUnavailableStayDatesAction(
  apartmentId: string,
  _blockedDates: string[] = [],
): Promise<string[]> {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(apartmentId)) return [];
  const apartment = await adminDb.doc(`short_term_apartments/${apartmentId}`).get();
  if (!apartment.exists || apartment.data()?.submissionStatus !== "published") return [];
  const unavailable = new Set<string>((apartment.data()?.blockedDates || []).filter((value: unknown) => typeof value === "string"));

  try {
    const snap = await adminDb
      .collection("stay_bookings")
      .where("apartmentId", "==", apartmentId)
      .where("status", "in", ["awaiting_payment", "confirmed"])
      .get();

    snap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      if (!data.checkIn || !data.checkOut) return;
      if (data.stayType === "hourly") {
        if ((data.checkOutAt || "").slice(11) > (apartment.data()?.checkInTime || "14:00")) unavailable.add(data.checkIn);
        return;
      }
      try {
        let day = parseISO(data.checkIn);
        const end = parseISO(data.checkOut);
        while (day < end) {
          unavailable.add(format(day, "yyyy-MM-dd"));
          day = addDays(day, 1);
        }
      } catch {
        // Bỏ qua booking có ngày không hợp lệ
      }
    });
  } catch (error) {
    console.error(
      "getUnavailableStayDatesAction:",
      error instanceof Error ? error.message : error,
    );
  }

  return [...unavailable];
}

/** Khoảng giờ đã giữ chỗ, chỉ có thời gian, không trả thông tin khách. */
export async function getStayBookedIntervalsAction(apartmentId: string): Promise<Array<{ start: string; end: string }>> {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(apartmentId)) return [];
  const apartment = await adminDb.doc(`short_term_apartments/${apartmentId}`).get();
  if (!apartment.exists || apartment.data()?.submissionStatus !== "published") return [];
  const active = await adminDb.collection("stay_bookings").where("apartmentId", "==", apartmentId)
    .where("status", "in", ["confirmed", "awaiting_payment"]).get();
  return active.docs.map(snap => stayInterval(snap.data(), apartment.data()!)).filter((interval): interval is { start: string; end: string } => !!interval);
}
