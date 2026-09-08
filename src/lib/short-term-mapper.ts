import type { DocumentData } from "firebase/firestore";
import type { ShortTermApartment } from "./types";

const toPlainTimestamp = (ts: any) => {
  if (!ts) return { seconds: 0, nanoseconds: 0 };
  if (typeof ts.toMillis === "function") {
    const ms = ts.toMillis();
    return {
      seconds: Math.floor(ms / 1000),
      nanoseconds: (ms % 1000) * 1e6,
    };
  }
  const seconds = ts.seconds ?? ts._seconds;
  if (typeof seconds === "number") {
    return {
      seconds,
      nanoseconds: ts.nanoseconds ?? ts._nanoseconds ?? 0,
    };
  }
  return { seconds: 0, nanoseconds: 0 };
};

export const toShortTermApartment = (
  docSnap: DocumentData,
): ShortTermApartment => {
  const data = docSnap.data();
  const aiContent = data.aiContent
    ? {
        ...data.aiContent,
        updatedAt: data.aiContent.updatedAt?.toDate
          ? data.aiContent.updatedAt.toDate().toISOString()
          : data.aiContent.updatedAt?.seconds
            ? new Date(data.aiContent.updatedAt.seconds * 1000).toISOString()
            : (data.aiContent.updatedAt ?? null),
      }
    : null;

  return {
    id: docSnap.id,
    ...data,
    amenities: data.amenities || [],
    blockedDates: data.blockedDates || [],
    imageUrls: data.imageUrls || [],
    createdAt: toPlainTimestamp(data.createdAt),
    updatedAt: toPlainTimestamp(data.updatedAt),
    aiContent,
  } as ShortTermApartment;
};
