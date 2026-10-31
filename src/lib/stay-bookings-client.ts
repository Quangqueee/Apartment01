"use client";

import { auth } from "@/firebase";
import type { StaySelection } from "./stay-pricing";

async function postStay(body: Record<string, unknown>) {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Vui lòng đăng nhập.");
  const response = await fetch("/api/stay-bookings", { method: "POST", cache: "no-store",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Không thể xử lý đặt phòng.");
  return result;
}

export function createStayBooking(input: { apartmentId: string; selection: StaySelection; guestsCount: number; guestName: string; guestPhone: string; notes: string }) {
  return postStay({ action: "create", ...input });
}

export function confirmStayBooking(bookingId: string) {
  return postStay({ action: "confirm", bookingId });
}
