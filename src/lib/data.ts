import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  Query,
  DocumentData,
  Timestamp,
  getCountFromServer,
} from "firebase/firestore";
import { firestore } from "@/firebase/server-init";
import { Apartment, Favorite, UserProfile } from "./types";
import { removeVietnameseTones } from "./utils";
import { isPriceInRange, parsePriceRange } from "./price-range";

const apartmentsCollection = collection(firestore, "apartments");
const usersCollection = collection(firestore, "users");

// DÁN ĐOẠN MỚI NÀY VÀO
export const toApartment = (docSnap: DocumentData): Apartment => {
  const data = docSnap.data();

  // 1. Helper bóc tách Timestamp an toàn (chống lỗi cache)
  const toPlainTimestamp = (ts: any) => {
    if (!ts) return { seconds: 0, nanoseconds: 0 };
    if (typeof ts.toDate === "function") {
      return { seconds: ts.seconds, nanoseconds: ts.nanoseconds };
    }
    if (typeof ts.seconds === "number") {
      return { seconds: ts.seconds, nanoseconds: ts.nanoseconds || 0 };
    }
    return { seconds: 0, nanoseconds: 0 };
  };

  const createdAt = toPlainTimestamp(data.createdAt);
  const updatedAt = toPlainTimestamp(data.updatedAt);

  // 2. Xử lý triệt để kẻ gây lỗi ẩn nấp bên trong aiContent
  const aiContent = data.aiContent
    ? {
      ...data.aiContent,
      updatedAt: data.aiContent.updatedAt?.toDate
        ? data.aiContent.updatedAt.toDate().toISOString() // Dữ liệu thật từ Firebase
        : data.aiContent.updatedAt?.seconds
          ? new Date(data.aiContent.updatedAt.seconds * 1000).toISOString() // Dữ liệu bị Cache
          : data.aiContent.updatedAt ?? null,
    }
    : null;

  return {
    id: docSnap.id,
    ...data,
    createdAt,
    updatedAt,
    aiContent
  } as Apartment;
};

export const toFavorite = (docSnap: DocumentData): Favorite => {
  const data = docSnap.data();
  return { id: docSnap.id, addedAt: data.addedAt }
}

export async function getApartments(
  options: {
    query?: string;
    district?: string;
    priceRange?: string;
    roomType?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    searchBy?: "title" | "sourceCode" | "sourceCodeOrAddress" | "titleOrSourceCode";
  } = {}
) {
  const {
    query: searchQuery,
    district,
    priceRange,
    roomType,
    page = 1,
    limit: pageSize = 9,
    sortBy = "newest",
  } = options;

  let baseQuery: Query = apartmentsCollection;
  let whereClauses: any[] = [];

  if (district && district !== "all") {
    whereClauses.push(where("district", "==", district));
  }

  if (roomType && roomType !== "all") {
    whereClauses.push(where("roomType", "==", roomType));
  }

  if (searchQuery && searchQuery.trim() !== "") {
    const searchWords = removeVietnameseTones(searchQuery.trim()).toLowerCase().split(/\s+/);
    if (searchWords.length > 0) {
      whereClauses.push(where("searchKeywords", "array-contains", searchWords[0]));
    }
  }

  let isFilteringPrice = false;
  if (priceRange && priceRange !== "all") {
    const parsedRange = parsePriceRange(priceRange);
    if (parsedRange) {
      isFilteringPrice = true;
      if (parsedRange.min > 0) whereClauses.push(where("price", ">=", parsedRange.min));
      if (parsedRange.max !== null && parsedRange.max < Infinity) {
        whereClauses.push(where("price", "<=", parsedRange.max));
      }
    }
  }

  if (whereClauses.length > 0) {
    baseQuery = query(baseQuery, ...whereClauses);
  }

  const countSnapshot = await getCountFromServer(baseQuery);
  const totalResults = countSnapshot.data().count;

  if (totalResults === 0) {
    return { apartments: [], totalResults: 0 };
  }

  if (isFilteringPrice) {
    baseQuery = query(baseQuery, orderBy("price", sortBy === "price-desc" ? "desc" : "asc"));
  } else {
    if (sortBy === 'price-asc') {
      baseQuery = query(baseQuery, orderBy("price", "asc"));
    } else if (sortBy === 'price-desc') {
      baseQuery = query(baseQuery, orderBy("price", "desc"));
    } else {
      baseQuery = query(baseQuery, orderBy("createdAt", "desc"));
    }
  }

  const fetchLimit = page * pageSize;
  baseQuery = query(baseQuery, limit(fetchLimit));

  const querySnapshot = await getDocs(baseQuery);
  const allFetchedApartments = querySnapshot.docs.map(toApartment);

  const startIndex = (page - 1) * pageSize;
  const paginatedApartments = allFetchedApartments.slice(startIndex, startIndex + pageSize);

  return {
    apartments: paginatedApartments,
    totalResults,
  };
}

export async function getApartmentById(id: string): Promise<Apartment | null> {
  if (!id || typeof id !== 'string') return null;
  try {
    const docRef = doc(firestore, "apartments", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return toApartment(docSnap);
  } catch (error) {
    console.error("Error fetching apartment by ID:", error);
  }
  return null;
}

export async function createApartment(data: Omit<Apartment, "id">): Promise<Apartment> {
  const docRef = await addDoc(apartmentsCollection, data);
  const newDoc = await getDoc(docRef);
  return toApartment(newDoc);
}

export async function updateApartment(id: string, data: Partial<Omit<Apartment, "id">>): Promise<Apartment> {
  const docRef = doc(firestore, "apartments", id);
  await updateDoc(docRef, data);
  const updatedDoc = await getDoc(docRef);
  return toApartment(updatedDoc);
}

export async function deleteApartment(id: string): Promise<void> {
  const docRef = doc(firestore, "apartments", id);
  await deleteDoc(docRef);
}

export async function addFavorite(userId: string, apartmentId: string) {
  const favoriteRef = doc(usersCollection, userId, "favorites", apartmentId);
  return await setDoc(favoriteRef, { addedAt: Timestamp.now() });
}

export async function removeFavorite(userId: string, apartmentId: string) {
  const favoriteRef = doc(usersCollection, userId, "favorites", apartmentId);
  return await deleteDoc(favoriteRef);
}

export async function isApartmentFavorited(userId: string, apartmentId: string): Promise<boolean> {
  const favoriteRef = doc(usersCollection, userId, "favorites", apartmentId);
  const docSnap = await getDoc(favoriteRef);
  return docSnap.exists();
}

export async function getFavoriteApartments(userId: string): Promise<Favorite[]> {
  if (!userId) return [];
  const favoritesCol = collection(usersCollection, userId, "favorites");
  const q = query(favoritesCol, orderBy("addedAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(toFavorite);
}

export async function getFullFavoriteApartments(userId: string): Promise<Apartment[]> {
  if (!userId) return [];
  const favoriteIds = await getFavoriteApartments(userId);
  if (favoriteIds.length === 0) return [];
  const apartmentPromises = favoriteIds.map(fav => getApartmentById(fav.id));
  const apartments = await Promise.all(apartmentPromises);
  return apartments.filter((apt): apt is Apartment => apt !== null);
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!userId) return null;
  const userRef = doc(firestore, "users", userId);
  const docSnap = await getDoc(userRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      email: data.email,
      displayName: data.displayName,
      phoneNumber: data.phoneNumber,
      address: data.address,
      createdAt: data.createdAt,
    };
  }
  return null;
}

export async function updateUserProfile(userId: string, data: Partial<Omit<UserProfile, "id" | "email" | "createdAt">>) {
  const userRef = doc(firestore, "users", userId);
  return await updateDoc(userRef, data);
}

export async function getRelatedApartments(currentApartment: Apartment): Promise<Apartment[]> {
  if (!currentApartment || !currentApartment.district) return [];

  try {
    const q = query(
      apartmentsCollection,
      where("district", "==", currentApartment.district),
      limit(30)
    );

    const snapshot = await getDocs(q);
    const fetched: Apartment[] = [];

    snapshot.forEach((docSnap) => {
      if (docSnap.id !== currentApartment.id) {
        fetched.push(toApartment(docSnap));
      }
    });

    const currentPrice = currentApartment.price;
    const priceLimit = Math.max(currentPrice * 0.3, 3);

    let filtered = fetched.filter((apt) => {
      const priceDiff = Math.abs(apt.price - currentPrice);
      return priceDiff <= priceLimit;
    });

    if (filtered.length < 4) {
      const relaxedLimit = priceLimit * 1.5;
      filtered = fetched.filter((apt) => {
        const priceDiff = Math.abs(apt.price - currentPrice);
        return priceDiff <= relaxedLimit;
      });
    }

    const scored = filtered.map((apt) => {
      let score = 0;

      if (apt.roomType === currentApartment.roomType) score += 5;

      const priceDiff = Math.abs(apt.price - currentPrice);
      const priceScore = Math.max(0, 3 - (priceDiff / priceLimit) * 3);
      score += priceScore;

      return { ...apt, score };
    });

    scored.sort((a, b) => b.score - a.score);

    const result = scored.slice(0, 8).map((apt) => {
      const { score, ...rest } = apt;
      return rest as Apartment;
    });

    return result;

  } catch (error) {
    console.error("Lỗi khi tìm căn hộ gợi ý:", error);
    return [];
  }
}