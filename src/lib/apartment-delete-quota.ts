import { Firestore, Timestamp, doc, runTransaction } from "firebase/firestore";
import {
  APARTMENT_DELETE_LIMIT_PER_HOUR,
  APARTMENT_DELETE_WINDOW_MS,
} from "@/lib/constants";

export async function consumeApartmentDeleteQuota(
  firestore: Firestore,
  actorUid?: string,
) {
  if (!actorUid) {
    return {
      ok: false as const,
      error: "Vui lòng đăng nhập để xóa căn hộ.",
    };
  }

  const userRef = doc(firestore, "users", actorUid);

  return runTransaction(firestore, async (transaction) => {
    const snap = await transaction.get(userRef);
    const now = Date.now();
    const windowStart = now - APARTMENT_DELETE_WINDOW_MS;
    const raw = snap.exists() ? snap.data()?.apartmentDeleteTimestamps : [];
    const timestamps: number[] = (Array.isArray(raw) ? raw : [])
      .map((item: unknown) => {
        if (typeof item === "number") return item;
        if (item && typeof item === "object" && "toMillis" in item) {
          return (item as Timestamp).toMillis();
        }
        return 0;
      })
      .filter((ts: number) => ts > windowStart)
      .sort((a: number, b: number) => a - b);

    if (timestamps.length >= APARTMENT_DELETE_LIMIT_PER_HOUR) {
      const retryMs = timestamps[0] + APARTMENT_DELETE_WINDOW_MS - now;
      const retryMinutes = Math.max(1, Math.ceil(retryMs / 60000));
      return {
        ok: false as const,
        error: `Đã đạt giới hạn xóa (${APARTMENT_DELETE_LIMIT_PER_HOUR} trong 1 giờ. Vui lòng thử lại sau ${retryMinutes} phút.`,
      };
    }

    timestamps.push(now);
    transaction.set(userRef, { apartmentDeleteTimestamps: timestamps }, { merge: true });
    return {
      ok: true as const,
      remaining: APARTMENT_DELETE_LIMIT_PER_HOUR - timestamps.length,
    };
  });
}
