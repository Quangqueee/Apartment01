"use client";

import {
  arrayRemove,
  arrayUnion,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "@/firebase";
import { Apartment } from "@/lib/types";
import { FAVORITES_PAGE_LIMIT } from "@/lib/favorites";

type AuthUserLike = {
  uid: string;
  email?: string | null;
  displayName?: string | null;
};

function toPlainTimestamp(ts: unknown): { seconds: number; nanoseconds: number } {
  if (!ts || typeof ts !== "object") return { seconds: 0, nanoseconds: 0 };
  const value = ts as {
    toMillis?: () => number;
    seconds?: number;
    _seconds?: number;
    nanoseconds?: number;
    _nanoseconds?: number;
  };
  if (typeof value.toMillis === "function") {
    const ms = value.toMillis();
    return {
      seconds: Math.floor(ms / 1000),
      nanoseconds: (ms % 1000) * 1e6,
    };
  }
  const seconds = value.seconds ?? value._seconds;
  if (typeof seconds === "number") {
    return {
      seconds,
      nanoseconds: value.nanoseconds ?? value._nanoseconds ?? 0,
    };
  }
  return { seconds: 0, nanoseconds: 0 };
}

export function mapApartmentSnapshot(
  id: string,
  data: Record<string, unknown>,
): Apartment {
  const aiRaw = data.aiContent as Record<string, unknown> | null | undefined;
  const aiUpdatedAt = aiRaw?.updatedAt as
    | { toDate?: () => Date; seconds?: number }
    | string
    | null
    | undefined;

  let aiUpdated: string | null = null;
  if (aiUpdatedAt && typeof aiUpdatedAt === "object" && typeof aiUpdatedAt.toDate === "function") {
    aiUpdated = aiUpdatedAt.toDate().toISOString();
  } else if (aiUpdatedAt && typeof aiUpdatedAt === "object" && typeof aiUpdatedAt.seconds === "number") {
    aiUpdated = new Date(aiUpdatedAt.seconds * 1000).toISOString();
  } else if (typeof aiUpdatedAt === "string") {
    aiUpdated = aiUpdatedAt;
  }

  return {
    ...data,
    id,
    createdAt: toPlainTimestamp(data.createdAt),
    updatedAt: toPlainTimestamp(data.updatedAt),
    aiContent: aiRaw
      ? { ...aiRaw, updatedAt: aiUpdated }
      : null,
    imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
  } as Apartment;
}

export async function ensureUserProfile(user: AuthUserLike): Promise<void> {
  if (!user.uid) return;
  const userRef = doc(db, "users", user.uid);
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) return;
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || "",
      role: "user",
      favorites: [],
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("ensureUserProfile:", error);
    throw error;
  }
}

export async function setApartmentFavorite(
  user: AuthUserLike,
  apartmentId: string,
  nextIsFavorite: boolean,
): Promise<void> {
  if (!user.uid) throw new Error("Chưa đăng nhập.");
  if (!apartmentId) throw new Error("Thiếu mã căn hộ.");

  await ensureUserProfile(user);

  const userRef = doc(db, "users", user.uid);
  const favoriteRef = doc(db, "users", user.uid, "favorites", apartmentId);

  const writes: Promise<void>[] = [];

  writes.push(
    setDoc(
      userRef,
      {
        favorites: nextIsFavorite
          ? arrayUnion(apartmentId)
          : arrayRemove(apartmentId),
      },
      { merge: true },
    ),
  );

  writes.push(
    nextIsFavorite
      ? setDoc(favoriteRef, { addedAt: serverTimestamp() })
      : deleteDoc(favoriteRef).then(() => undefined),
  );

  const results = await Promise.allSettled(writes);
  if (results.every((result) => result.status === "rejected")) {
    const failed = results.find(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );
    console.error("setApartmentFavorite:", failed?.reason);
    throw failed?.reason ?? new Error("Không lưu được yêu thích.");
  }
}

export async function fetchFavoriteApartmentsByIds(ids: string[]): Promise<{
  apartments: Apartment[];
  unavailableCount: number;
}> {
  const idsToFetch = ids.slice(0, FAVORITES_PAGE_LIMIT);
  if (idsToFetch.length === 0) {
    return { apartments: [], unavailableCount: 0 };
  }

  try {
    const snaps = await Promise.all(
      idsToFetch.map(async (apartmentId) => {
        try {
          const snap = await getDoc(doc(db, "apartments", apartmentId));
          if (!snap.exists()) return null;
          return mapApartmentSnapshot(snap.id, snap.data() as Record<string, unknown>);
        } catch (error) {
          console.error("Không đọc được căn yêu thích:", apartmentId, error);
          return null;
        }
      }),
    );

    const byId = new Map(
      snaps
        .filter((apt): apt is Apartment => apt !== null)
        .map((apt) => [apt.id, apt]),
    );
    const apartments = idsToFetch
      .map((id) => byId.get(id))
      .filter((apt): apt is Apartment => apt !== undefined);

    return {
      apartments,
      unavailableCount: idsToFetch.length - apartments.length,
    };
  } catch (error) {
    console.error("fetchFavoriteApartmentsByIds:", error);
    throw error;
  }
}
