"use client";

import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "@/firebase";
import { matchesAllSearchTokens, planApartmentTextSearch } from "@/lib/utils";
import type { Apartment } from "@/lib/types";

const COLLECTION = "apartments";
export const ADMIN_APARTMENTS_PAGE_SIZE = 10;

function mapApartment(docSnap: { id: string; data: () => unknown }): Apartment {
  return { id: docSnap.id, ...(docSnap.data() as object) } as Apartment;
}

function apartmentsCol() {
  return collection(db, COLLECTION);
}

async function firstWhereEqual(
  field: "sourceCode" | "landlordPhoneNumber",
  value: string,
): Promise<Apartment | null> {
  const snap = await getDocs(
    query(apartmentsCol(), where(field, "==", value), limit(1)),
  );
  if (snap.empty) return null;
  return mapApartment(snap.docs[0]);
}

async function findExactAdminApartment(
  raw: string,
): Promise<Apartment | null> {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (/^[A-Za-z0-9]{16,}$/.test(trimmed)) {
    const snap = await getDoc(doc(db, COLLECTION, trimmed));
    if (snap.exists()) return mapApartment(snap);
  }

  const lookups: Array<Promise<Apartment | null>> = [
    firstWhereEqual("sourceCode", trimmed),
  ];
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length >= 8) {
    lookups.push(firstWhereEqual("landlordPhoneNumber", trimmed));
    if (digits !== trimmed) {
      lookups.push(firstWhereEqual("landlordPhoneNumber", digits));
    }
  }

  const found = await Promise.all(lookups);
  return found.find((item): item is Apartment => item !== null) ?? null;
}

export async function getAdminApartmentCounts(): Promise<{
  total: number;
  published: number;
  pushRequested: number;
  error?: string;
}> {
  try {
    const col = apartmentsCol();
    const [allSnap, publishedSnap, pushSnap] = await Promise.all([
      getCountFromServer(col),
      getCountFromServer(
        query(col, where("submissionStatus", "==", "published")),
      ),
      getCountFromServer(query(col, where("isPushRequested", "==", true))),
    ]);
    return {
      total: allSnap.data().count,
      published: publishedSnap.data().count,
      pushRequested: pushSnap.data().count,
    };
  } catch (error) {
    console.error("getAdminApartmentCounts:", error);
    return {
      total: 0,
      published: 0,
      pushRequested: 0,
      error: "Không lấy được số liệu danh sách.",
    };
  }
}

export async function listAdminApartmentsPage(options: {
  pageSize?: number;
  cursorId?: string | null;
  searchQuery?: string;
  pushRequestedOnly?: boolean;
}): Promise<{
  apartments: Apartment[];
  nextCursorId: string | null;
  total: number;
  error?: string;
}> {
  const pageSize = options.pageSize ?? ADMIN_APARTMENTS_PAGE_SIZE;
  const searchQuery = options.searchQuery?.trim() ?? "";
  const pushRequestedOnly = options.pushRequestedOnly === true;
  const cursorId = options.cursorId ?? null;

  try {
    if (searchQuery && !cursorId && !pushRequestedOnly) {
      const exact = await findExactAdminApartment(searchQuery);
      if (exact) {
        return { apartments: [exact], nextCursorId: null, total: 1 };
      }
    }

    const col = apartmentsCol();
    const plan = searchQuery ? planApartmentTextSearch(searchQuery) : null;

    // Hàng chờ đẩy thường rất ít: 1 query equality, sort/paginate trên client.
    // Tránh composite index isPushRequested + createdAt khi chưa deploy.
    if (pushRequestedOnly) {
      const snap = await getDocs(
        query(col, where("isPushRequested", "==", true), limit(80)),
      );
      let items = snap.docs
        .map(mapApartment)
        .sort(
          (a, b) =>
            (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0),
        );
      if (plan) {
        items = items.filter((apt) =>
          matchesAllSearchTokens(apt, plan.tokens, [apt.landlordPhoneNumber]),
        );
      }
      const start = cursorId
        ? Math.max(0, items.findIndex((item) => item.id === cursorId) + 1)
        : 0;
      const pageItems = items.slice(start, start + pageSize);
      return {
        apartments: pageItems,
        nextCursorId:
          start + pageItems.length < items.length
            ? pageItems[pageItems.length - 1]?.id ?? null
            : null,
        total: items.length,
      };
    }

    const filters: QueryConstraint[] = [];
    if (plan) {
      filters.push(
        where("searchKeywords", "array-contains", plan.firestoreValue),
      );
    }

    const countPromise = cursorId
      ? Promise.resolve(null)
      : getCountFromServer(query(col, ...filters));

    const pageFilters: QueryConstraint[] = [
      ...filters,
      orderBy("createdAt", "desc"),
    ];
    if (cursorId) {
      const cursorSnap = await getDoc(doc(db, COLLECTION, cursorId));
      if (cursorSnap.exists()) {
        pageFilters.push(startAfter(cursorSnap));
      }
    }
    pageFilters.push(limit(pageSize));

    const [pageSnap, countSnap] = await Promise.all([
      getDocs(query(col, ...pageFilters)),
      countPromise,
    ]);

    let apartments = pageSnap.docs.map(mapApartment);
    if (plan) {
      apartments = apartments.filter((apt) =>
        matchesAllSearchTokens(apt, plan.tokens, [apt.landlordPhoneNumber]),
      );
    }

    const last = pageSnap.docs[pageSnap.docs.length - 1];
    return {
      apartments,
      nextCursorId:
        last && pageSnap.docs.length === pageSize ? last.id : null,
      total: countSnap ? countSnap.data().count : 0,
    };
  } catch (error) {
    console.error("listAdminApartmentsPage:", error);
    return {
      apartments: [],
      nextCursorId: null,
      total: 0,
      error: "Không tải được danh sách căn hộ.",
    };
  }
}
