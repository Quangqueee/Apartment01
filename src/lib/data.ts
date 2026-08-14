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
  startAfter,
  Query,
  DocumentData,
  Timestamp,
  getCountFromServer,
} from "firebase/firestore";
import { unstable_cache } from "next/cache";
import { firestore } from "@/firebase/server-init";
import { Apartment, Favorite, UserProfile } from "./types";
import { removeVietnameseTones } from "./utils";
import { isPriceInRange, parsePriceRange } from "./price-range";
import { APARTMENTS_CACHE_TAG } from "./apartment-cache-tag";

const HOME_CACHE_REVALIDATE_SECONDS = 600;
const FEATURED_DISTRICTS = ["Tây Hồ", "Ba Đình", "Đống Đa", "Cầu Giấy"] as const;

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
    cursor?: string;
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
    cursor,
  } = options;

  let baseQuery: Query = apartmentsCollection;
  let whereClauses: any[] = [];

  // Chỉ hiển thị công khai các tin đã published. Yêu cầu chạy
  // backfillSubmissionStatusAction() một lần trước khi filter này lên production,
  // vì Firestore loại bỏ hẳn các document không có field submissionStatus khi
  // dùng toán tử so sánh (==) trên field đó.
  whereClauses.push(where("submissionStatus", "==", "published"));

  // Multi-select filter: "district"/"roomType" trên URL có thể là chuỗi nhiều giá trị
  // phân tách bằng dấu phẩy (vd: "Ba Đình,Tây Hồ") -> parse thành mảng, trim khoảng
  // trắng thừa và loại bỏ phần tử rỗng trước khi đưa vào query.
  const districtArray =
    district && district !== "all"
      ? district.split(",").map((d) => d.trim()).filter(Boolean)
      : [];
  const roomTypeArray =
    roomType && roomType !== "all"
      ? roomType.split(",").map((r) => r.trim()).filter(Boolean)
      : [];

  // Firestore giới hạn toán tử 'in' tối đa 30 giá trị/query — chặn sớm thay vì
  // tự ý chia nhỏ thành nhiều query (cần bàn thêm nếu gặp trường hợp này).
  if (districtArray.length > 30 || roomTypeArray.length > 30) {
    throw new Error(
      "Số lượng giá trị lọc (district/roomType) vượt quá giới hạn 30 của toán tử Firestore 'in'. Cần thiết kế lại truy vấn (ví dụ chia nhỏ thành nhiều query) trước khi tiếp tục.",
    );
  }

  // Đổi so khớp tuyệt đối (==) sang "nằm trong mảng" (in) để hỗ trợ multi-select.
  // Mảng rỗng (không lọc) -> không thêm whereClause, giữ nguyên hành vi lấy tất cả.
  if (districtArray.length > 0) {
    whereClauses.push(where("district", "in", districtArray));
  }

  if (roomTypeArray.length > 0) {
    whereClauses.push(where("roomType", "in", roomTypeArray));
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
    return { apartments: [], totalResults: 0, nextCursor: null as string | null };
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

  const maxPage = Math.max(1, Math.ceil(totalResults / pageSize));
  const safePage = Math.min(Math.max(1, page), maxPage);
  let paginatedApartments: Apartment[] = [];

  if (cursor) {
    try {
      const cursorRef = doc(firestore, "apartments", cursor);
      const cursorSnap = await getDoc(cursorRef);
      if (cursorSnap.exists()) {
        const cursorQuery = query(baseQuery, startAfter(cursorSnap), limit(pageSize));
        const cursorSnapshot = await getDocs(cursorQuery);
        paginatedApartments = cursorSnapshot.docs.map(toApartment);
      } else {
        const firstPageSnapshot = await getDocs(query(baseQuery, limit(pageSize)));
        paginatedApartments = firstPageSnapshot.docs.map(toApartment);
      }
    } catch (error) {
      console.error("Cursor pagination failed:", error);
      const firstPageSnapshot = await getDocs(query(baseQuery, limit(pageSize)));
      paginatedApartments = firstPageSnapshot.docs.map(toApartment);
    }
  } else if (safePage > 1) {
    const fetchLimit = safePage * pageSize;
    const offsetSnapshot = await getDocs(query(baseQuery, limit(fetchLimit)));
    const allFetchedApartments = offsetSnapshot.docs.map(toApartment);
    const startIndex = (safePage - 1) * pageSize;
    paginatedApartments = allFetchedApartments.slice(startIndex, startIndex + pageSize);
  } else {
    const firstPageSnapshot = await getDocs(query(baseQuery, limit(pageSize)));
    paginatedApartments = firstPageSnapshot.docs.map(toApartment);
  }

  const lastApartment = paginatedApartments[paginatedApartments.length - 1];

  return {
    apartments: paginatedApartments,
    totalResults,
    nextCursor: lastApartment?.id ?? null,
  };
}

/** Count-only query — avoids fetching apartment docs for district stats. */
export async function getPublishedCountByDistrict(
  district: string,
): Promise<number> {
  const countQuery = query(
    apartmentsCollection,
    where("submissionStatus", "==", "published"),
    where("district", "==", district),
  );
  const snapshot = await getCountFromServer(countQuery);
  return snapshot.data().count;
}

export const getCachedHomeApartments = unstable_cache(
  async () => {
    const result = await getApartments({
      page: 1,
      limit: 12,
      sortBy: "newest",
    });
    return JSON.parse(JSON.stringify(result)) as {
      apartments: Apartment[];
      totalResults: number;
      nextCursor: string | null;
    };
  },
  ["home-apartments-v1"],
  { revalidate: HOME_CACHE_REVALIDATE_SECONDS, tags: [APARTMENTS_CACHE_TAG] },
);

export const getCachedFeaturedDistrictStats = unstable_cache(
  async () => {
    const stats = await Promise.all(
      FEATURED_DISTRICTS.map(async (name) => ({
        name,
        count: await getPublishedCountByDistrict(name),
      })),
    );
    return stats;
  },
  ["featured-district-stats-v1"],
  { revalidate: HOME_CACHE_REVALIDATE_SECONDS, tags: [APARTMENTS_CACHE_TAG] },
);

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