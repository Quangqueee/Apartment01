"use server";

import { addDays, format, parseISO } from "date-fns";
import { adminDb } from "@/firebase/admin-init";

/**
 * Ngày không trống của một căn ngắn hạn (YYYY-MM-DD).
 * Dùng Admin SDK để khách xem lịch mà không đọc PII trong `stay_bookings`.
 */
export async function getUnavailableStayDatesAction(
  apartmentId: string,
  blockedDates: string[] = [],
): Promise<string[]> {
  const unavailable = new Set<string>(
    blockedDates.filter((value) => typeof value === "string" && value.length > 0),
  );
  if (!apartmentId) return [...unavailable];

  try {
    const snap = await adminDb
      .collection("stay_bookings")
      .where("apartmentId", "==", apartmentId)
      .where("status", "in", ["awaiting_payment", "confirmed"])
      .get();

    snap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      if (!data.checkIn || !data.checkOut) return;
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
