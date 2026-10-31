import type { ShortTermApartment } from "./types";

export type StaySelection =
  | { stayType: "nightly"; checkIn: string; checkOut: string }
  | { stayType: "hourly"; checkIn: string; startTime: string; hours: number };

const DAY_MS = 86_400_000;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export function validStayDate(value: string): boolean {
  if (!datePattern.test(value)) return false;
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value;
}

export function stayNightCount(checkIn: string, checkOut: string): number {
  if (!validStayDate(checkIn) || !validStayDate(checkOut)) return 0;
  return (Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`)) / DAY_MS;
}

export function quoteStay(apartment: Pick<ShortTermApartment, "nightlyPrice" | "weeklyPrice" | "hourlyPrice" | "minNights" | "minHours">, selection: StaySelection) {
  if (selection.stayType === "nightly") {
    const nights = stayNightCount(selection.checkIn, selection.checkOut);
    if (!Number.isInteger(nights) || nights < (apartment.minNights || 1) || nights > 90) throw new Error("Số đêm lưu trú không hợp lệ.");
    const weekly = apartment.weeklyPrice && apartment.weeklyPrice > 0 ? apartment.weeklyPrice : 7 * apartment.nightlyPrice;
    const weeks = Math.floor(nights / 7);
    const totalAmount = weeks * weekly + (nights % 7) * apartment.nightlyPrice;
    if (!Number.isSafeInteger(totalAmount) || totalAmount <= 0) throw new Error("Giá lưu trú không hợp lệ.");
    return { checkIn: selection.checkIn, checkOut: selection.checkOut, nights, hours: 0, totalAmount,
      rateLabel: weeks && apartment.weeklyPrice ? `${weeks} tuần + ${nights % 7} đêm` : `${nights} đêm` };
  }
  const { checkIn, startTime, hours } = selection;
  if (!validStayDate(checkIn) || !timePattern.test(startTime) || !Number.isInteger(hours) || hours < (apartment.minHours || 2) || hours > 12 || !apartment.hourlyPrice || apartment.hourlyPrice <= 0) {
    throw new Error("Khung giờ lưu trú không hợp lệ.");
  }
  const startMinute = Number(startTime.slice(0, 2)) * 60 + Number(startTime.slice(3));
  const endMinute = startMinute + hours * 60;
  if (endMinute >= 24 * 60) throw new Error("Khung giờ theo giờ phải kết thúc trong cùng ngày.");
  const endTime = `${String(Math.floor(endMinute / 60)).padStart(2, "0")}:${String(endMinute % 60).padStart(2, "0")}`;
  const totalAmount = hours * apartment.hourlyPrice;
  if (!Number.isSafeInteger(totalAmount) || totalAmount <= 0) throw new Error("Giá lưu trú không hợp lệ.");
  return { checkIn, checkOut: checkIn, nights: 0, hours, totalAmount, rateLabel: `${hours} giờ`,
    checkInAt: `${checkIn}T${startTime}`, checkOutAt: `${checkIn}T${endTime}` };
}

export function stayInterval(booking: Record<string, any>, apartment: { checkInTime?: string; checkOutTime?: string }) {
  if (booking.stayType === "hourly" && booking.bookingSchemaVersion === 2) {
    if (!booking.checkInAt || !booking.checkOutAt) return null;
    return { start: booking.checkInAt, end: booking.checkOutAt };
  }
  if (booking.bookingSchemaVersion === 2 && typeof booking.checkInAt === "string" && typeof booking.checkOutAt === "string") return { start: booking.checkInAt, end: booking.checkOutAt };
  if (!validStayDate(booking.checkIn) || !validStayDate(booking.checkOut)) return null;
  return { start: `${booking.checkIn}T${apartment.checkInTime || "14:00"}`, end: `${booking.checkOut}T${apartment.checkOutTime || "12:00"}` };
}

export function stayIntervalsOverlap(a: { start: string; end: string }, b: { start: string; end: string }) {
  return a.start < b.end && b.start < a.end;
}

export function blockedStayDate(selection: StaySelection, blockedDates: string[]): boolean {
  if (selection.stayType === "hourly") return blockedDates.includes(selection.checkIn);
  const nights = stayNightCount(selection.checkIn, selection.checkOut);
  if (nights <= 0) return true;
  const start = Date.parse(`${selection.checkIn}T00:00:00Z`);
  for (let i = 0; i < nights; i++) {
    if (blockedDates.includes(new Date(start + i * DAY_MS).toISOString().slice(0, 10))) return true;
  }
  return false;
}
