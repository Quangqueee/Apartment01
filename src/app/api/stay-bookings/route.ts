import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { adminAuth, adminDb } from "@/firebase/admin-init";
import { blockedStayDate, quoteStay, stayInterval, stayIntervalsOverlap, type StaySelection } from "@/lib/stay-pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const id = z.string().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), apartmentId: id, selection: z.discriminatedUnion("stayType", [
    z.object({ stayType: z.literal("nightly"), checkIn: date, checkOut: date }).strict(),
    z.object({ stayType: z.literal("hourly"), checkIn: date, startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), hours: z.number().int().min(2).max(12) }).strict(),
  ]), guestsCount: z.number().int().min(1).max(30), guestName: z.string().trim().min(2).max(80), guestPhone: z.string().trim().regex(/^[0-9+() \-]{8,20}$/), notes: z.string().trim().max(2000).default("") }).strict(),
  z.object({ action: z.literal("confirm"), bookingId: id }).strict(),
]);

class StayError extends Error { constructor(public status: number, message: string) { super(message); } }
const localToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

function selectionOf(data: Record<string, any>): StaySelection {
  if (data.bookingSchemaVersion === 2 && data.stayType === "hourly") return { stayType: "hourly", checkIn: data.checkIn, startTime: data.checkInAt?.slice(11) || "", hours: data.hours };
  return { stayType: "nightly", checkIn: data.checkIn, checkOut: data.checkOut };
}

function checkApartment(data: Record<string, any>, selection: StaySelection, guestsCount: number) {
  if (data.submissionStatus !== "published" || data.status === "rented") throw new StayError(409, "Căn hộ hiện không nhận đặt phòng.");
  if (guestsCount > data.maxGuests) throw new StayError(400, "Số khách vượt quá sức chứa của căn hộ.");
  if (selection.checkIn < localToday()) throw new StayError(400, "Ngày nhận phòng đã qua.");
  if (blockedStayDate(selection, data.blockedDates || [])) throw new StayError(409, "Khoảng thời gian này đã bị khóa trên lịch.");
}

function checkConflicts(rows: Array<{ id: string; data: Record<string, any> }>, apartment: Record<string, any>, proposed: Record<string, any>, excludeId?: string) {
  const wanted = stayInterval(proposed, apartment);
  if (!wanted || wanted.start >= wanted.end) throw new StayError(400, "Thời gian lưu trú không hợp lệ.");
  for (const row of rows) {
    if (row.id === excludeId) continue;
    const other = stayInterval(row.data, apartment);
    if (other && stayIntervalsOverlap(wanted, other)) throw new StayError(409, "Khung thời gian này đã có đơn được xác nhận.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const bearer = request.headers.get("authorization");
    if (!bearer?.startsWith("Bearer ")) throw new StayError(401, "Vui lòng đăng nhập.");
    let uid: string;
    try { uid = (await adminAuth.verifyIdToken(bearer.slice(7), true)).uid; }
    catch { throw new StayError(401, "Phiên đăng nhập không hợp lệ."); }
    const input = schema.parse(await request.json());
    const actor = (await adminDb.doc(`users/${uid}`).get()).data();
    if (!actor) throw new StayError(403, "Tài khoản chưa có hồ sơ.");

    if (input.action === "create") {
      const aptSnap = await adminDb.doc(`short_term_apartments/${input.apartmentId}`).get();
      if (!aptSnap.exists) throw new StayError(404, "Không tìm thấy căn hộ.");
      const apartment = aptSnap.data()!;
      checkApartment(apartment, input.selection, input.guestsCount);
      const quote = quoteStay(apartment as any, input.selection);
      const start = input.selection.checkIn;
      if (start > new Date(Date.now() + 366 * 86_400_000).toISOString().slice(0, 10)) throw new StayError(400, "Chỉ nhận yêu cầu trong 12 tháng tới.");
      const proposed = { ...quote, bookingSchemaVersion: 2, stayType: input.selection.stayType,
        checkInAt: quote.checkInAt || `${quote.checkIn}T${apartment.checkInTime || "14:00"}`,
        checkOutAt: quote.checkOutAt || `${quote.checkOut}T${apartment.checkOutTime || "12:00"}` };
      const localNow = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Bangkok", hour12: false }).replace(" ", "T");
      if (proposed.checkInAt <= localNow) throw new StayError(400, "Giờ nhận phòng đã qua.");
      const active = await adminDb.collection("stay_bookings").where("apartmentId", "==", input.apartmentId).where("status", "in", ["confirmed", "awaiting_payment"]).get();
      checkConflicts(active.docs.map(d => ({ id: d.id, data: d.data() })), apartment, proposed);
      const commissionSnap = actor.role === "collaborator"
        ? await adminDb.doc(`short_term_commissions/${input.apartmentId}`).get() : null;
      const booking = await adminDb.collection("stay_bookings").add({
        apartmentId: input.apartmentId, apartmentTitle: apartment.title, apartmentCode: apartment.sourceCode || "",
        userId: uid, guestName: input.guestName, guestPhone: input.guestPhone, guestsCount: input.guestsCount,
        checkIn: quote.checkIn, checkOut: quote.checkOut, checkInAt: proposed.checkInAt, checkOutAt: proposed.checkOutAt,
        stayType: input.selection.stayType, nights: quote.nights, hours: quote.hours, rateLabel: quote.rateLabel,
        bookingSchemaVersion: 2,
        nightlyPrice: apartment.nightlyPrice, totalAmount: quote.totalAmount,
        ctvId: actor.role === "collaborator" ? uid : "", ctvName: actor.role === "collaborator" ? actor.displayName || "CTV" : "",
        ...(actor.role === "collaborator" && { commissionSnapshot: commissionSnap?.data()?.commission || "" }),
        notes: input.notes, status: "pending", createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ id: booking.id, totalAmount: quote.totalAmount });
    }

    if (!["admin", "director"].includes(actor.role)) throw new StayError(403, "Không có quyền xác nhận đơn.");
    const bookingRef = adminDb.doc(`stay_bookings/${input.bookingId}`);
    await adminDb.runTransaction(async tx => {
      const bookingSnap = await tx.get(bookingRef);
      if (!bookingSnap.exists || !["pending", "awaiting_payment"].includes(bookingSnap.data()?.status)) throw new StayError(409, "Đơn không còn ở trạng thái chờ.");
      const booking = bookingSnap.data()!;
      const apartmentRef = adminDb.doc(`short_term_apartments/${booking.apartmentId}`);
      const inventoryRef = adminDb.doc(`stay_inventory/${booking.apartmentId}`);
      const [apartmentSnap] = await Promise.all([tx.get(apartmentRef), tx.get(inventoryRef)]);
      if (!apartmentSnap.exists) throw new StayError(404, "Căn hộ đã bị xóa.");
      const apartment = apartmentSnap.data()!;
      const selection = selectionOf(booking);
      checkApartment(apartment, selection, booking.guestsCount);
      if (booking.bookingSchemaVersion !== 2) {
        const currentQuote = quoteStay(apartment as any, selection);
        if (booking.totalAmount !== currentQuote.totalAmount || booking.nightlyPrice !== apartment.nightlyPrice) {
          throw new StayError(409, "Giá đơn cũ khác giá hiện tại. Vui lòng kiểm tra và tạo lại yêu cầu.");
        }
      }
      const active = await tx.get(adminDb.collection("stay_bookings").where("apartmentId", "==", booking.apartmentId).where("status", "in", ["confirmed", "awaiting_payment"]));
      checkConflicts(active.docs.map(d => ({ id: d.id, data: d.data() })), apartment, booking, input.bookingId);
      tx.set(inventoryRef, { version: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      tx.update(bookingRef, { status: "confirmed", updatedAt: FieldValue.serverTimestamp() });
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (!(error instanceof StayError) && !(error instanceof z.ZodError)) console.error("stay-bookings API:", error);
    const status = error instanceof StayError ? error.status : error instanceof z.ZodError ? 400 : 500;
    return NextResponse.json({ error: error instanceof StayError ? error.message : status === 400 ? "Thông tin đặt phòng không hợp lệ." : "Không thể xử lý đơn. Vui lòng thử lại." }, { status });
  }
}
