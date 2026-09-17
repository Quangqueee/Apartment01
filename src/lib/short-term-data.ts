import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { firestore } from "@/firebase/server-init";
import { toShortTermApartment } from "./short-term-mapper";
import type { ShortTermApartment } from "./types";

const shortTermCollection = collection(firestore, "short_term_apartments");

function sortNewestFirst(apartments: ShortTermApartment[]) {
  return apartments.sort(
    (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
  );
}

/** Danh sách căn ngắn hạn đã publish, mới nhất trước. */
export async function getPublishedShortTermApartments(): Promise<
  ShortTermApartment[]
> {
  const published = where("submissionStatus", "==", "published");
  try {
    const q = query(
      shortTermCollection,
      published,
      orderBy("createdAt", "desc"),
    );
    const snap = await getDocs(q);
    return snap.docs.map(toShortTermApartment);
  } catch {
    // Composite index (submissionStatus + createdAt) có thể đang build sau deploy.
    try {
      const snap = await getDocs(query(shortTermCollection, published));
      return sortNewestFirst(snap.docs.map(toShortTermApartment));
    } catch (fallbackError) {
      console.error(
        "getPublishedShortTermApartments:",
        fallbackError instanceof Error ? fallbackError.message : fallbackError,
      );
      return [];
    }
  }
}

export async function getShortTermApartmentById(
  id: string,
): Promise<ShortTermApartment | null> {
  try {
    const snap = await getDoc(doc(firestore, "short_term_apartments", id));
    if (!snap.exists()) return null;
    return toShortTermApartment(snap);
  } catch (error) {
    console.error(
      "getShortTermApartmentById:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}
