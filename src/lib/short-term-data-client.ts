"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { addDays, format, parseISO } from "date-fns";
import { db } from "@/firebase";
import { getUnavailableStayDatesAction } from "@/app/stay-actions";
import { toShortTermApartment } from "./short-term-mapper";
import type { ShortTermApartment } from "./types";

/** Admin: danh sách tin ngắn hạn đang chờ duyệt. */
export async function fetchPendingShortTermSubmissionsClient(): Promise<{
  apartments: ShortTermApartment[];
  error?: string;
}> {
  try {
    const q = query(
      collection(db, "short_term_apartments"),
      where("submissionStatus", "==", "pending"),
    );
    const snap = await getDocs(q);
    const apartments = snap.docs
      .map(toShortTermApartment)
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    return { apartments };
  } catch (error) {
    console.error(
      "fetchPendingShortTermSubmissionsClient:",
      error instanceof Error ? error.message : error,
    );
    return { apartments: [], error: "Không thể tải danh sách tin chờ duyệt." };
  }
}

export async function getShortTermApartmentByIdClient(
  id: string,
): Promise<ShortTermApartment | null> {
  try {
    const snap = await getDoc(doc(db, "short_term_apartments", id));
    if (!snap.exists()) return null;
    return toShortTermApartment(snap);
  } catch (error) {
    console.error(
      "getShortTermApartmentByIdClient:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

/**
 * Trả về tập ngày (YYYY-MM-DD) KHÔNG thể nhận phòng của một căn:
 * các đêm thuộc booking confirmed/awaiting_payment + blockedDates chặn tay.
 * Ngày checkOut của booking không bị chặn (khách trả phòng buổi sáng).
 */
export async function getUnavailableDatesClient(
  apartmentId: string,
  blockedDates: string[] = [],
): Promise<Set<string>> {
  try {
    const dates = await getUnavailableStayDatesAction(apartmentId, blockedDates);
    return new Set(dates);
  } catch (error) {
    console.error(
      "getUnavailableDatesClient:",
      error instanceof Error ? error.message : error,
    );
    return new Set(blockedDates);
  }
}

/** Kiểm tra khoảng [checkIn, checkOut) có đụng ngày không trống nào không. */
export function rangeHasConflict(
  checkIn: string,
  checkOut: string,
  unavailable: Set<string>,
): boolean {
  try {
    let day = parseISO(checkIn);
    const end = parseISO(checkOut);
    while (day < end) {
      if (unavailable.has(format(day, "yyyy-MM-dd"))) return true;
      day = addDays(day, 1);
    }
    return false;
  } catch {
    return true;
  }
}
