import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  setDoc, // <--- Đã thêm import setDoc
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Query,
  DocumentData,
  Timestamp,
  getCountFromServer,
  collectionGroup,
} from "firebase/firestore";
import { firestore } from "@/firebase/server-init";
import { Apartment, Favorite } from "./types";
import { removeVietnameseTones } from "./utils";


const apartmentsCollection = collection(firestore, "apartments");
const usersCollection = collection(firestore, "users");


export const toApartment = (docSnap: DocumentData): Apartment => {
  const data = docSnap.data();
  const createdAt = data.createdAt?.toDate ? {
    seconds: data.createdAt.seconds,
    nanoseconds: data.createdAt.nanoseconds,
  } : { seconds: 0, nanoseconds: 0 };
  const updatedAt = data.updatedAt?.toDate ? {
    seconds: data.updatedAt.seconds,
    nanoseconds: data.updatedAt.nanoseconds,
  } : { seconds: 0, nanoseconds: 0 };

  return {
    id: docSnap.id,
    ...data,
    createdAt,
    updatedAt,
  } as Apartment;
};

export const toFavorite = (docSnap: DocumentData): Favorite => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    addedAt: data.addedAt
  }
}

// Helper function to get the last document of the previous page
async function getLastDocOfPreviousPage(q: Query, page: number, pageSize: number) {
  if (page <= 1) return null;
  const endAt = (page - 1) * pageSize;
  const prevPageQuery = query(q, limit(endAt));
  const snapshot = await getDocs(prevPageQuery);
  return snapshot.docs[snapshot.docs.length - 1];
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
    searchBy = "titleOrSourceCode",
  } = options;

  let baseQuery: Query = apartmentsCollection;
  let whereClauses = [];

  // --- Build Where Clauses (excluding price) ---
  if (district) {
    whereClauses.push(where("district", "==", district));
  }
  if (roomType) {
    whereClauses.push(where("roomType", "==", roomType));
  }

  if (whereClauses.length > 0) {
    baseQuery = query(baseQuery, ...whereClauses);
  }

  // Initial fetch from Firestore - we only order by one field to avoid complex indexes
  const querySnapshot = await getDocs(baseQuery);
  let allMatchingApartments = querySnapshot.docs.map(toApartment);

  // --- Server-side Price Filtering with rounding logic ---
  if (priceRange) {
    const [min, max] = priceRange.split("-");
    const minPrice = min ? parseInt(min, 10) : 0;
    const maxPrice = max ? parseInt(max, 10) : Infinity;

    allMatchingApartments = allMatchingApartments.filter(apt => {
      const roundedPrice = Math.floor(apt.price);
      const meetsMin = minPrice > 0 ? roundedPrice >= minPrice : true;
      const meetsMax = maxPrice !== Infinity ? roundedPrice <= maxPrice : true;
      return meetsMin && meetsMax;
    });
  }


  // --- Post-Query Text Search (if needed) ---
  if (searchQuery) {
    const normalizedQuery = removeVietnameseTones(searchQuery);
    allMatchingApartments = allMatchingApartments.filter((apt) => {
      if (searchBy === 'sourceCodeOrAddress') {
        const normalizedCode = removeVietnameseTones(apt.sourceCode);
        const normalizedAddress = removeVietnameseTones(apt.address);
        return normalizedCode.includes(normalizedQuery) || normalizedAddress.includes(normalizedQuery);
      }
      // Default to titleOrSourceCode
      const normalizedTitle = removeVietnameseTones(apt.title);
      const normalizedCode = removeVietnameseTones(apt.sourceCode);
      return normalizedTitle.includes(normalizedQuery) || normalizedCode.includes(normalizedQuery);
    });
  }

  // --- Server-Side Sorting ---
  // Now we sort the array of results in memory
  if (sortBy === 'price-asc') {
    allMatchingApartments.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-desc') {
    allMatchingApartments.sort((a, b) => b.price - b.price);
  } else { // 'newest' or default
    // Sort by updatedAt descending, if equal, then by createdAt descending
    allMatchingApartments.sort((a, b) => {
      const dateA = a.updatedAt.seconds > 0 ? a.updatedAt : a.createdAt;
      const dateB = b.updatedAt.seconds > 0 ? b.updatedAt : b.createdAt;
      return dateB.seconds - dateA.seconds;
    });
  }

  // --- Server-Side Pagination ---
  const totalResults = allMatchingApartments.length;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedApartments = allMatchingApartments.slice(startIndex, endIndex);

  return {
    apartments: paginatedApartments,
    totalResults,
  };
}

export async function getApartmentById(id: string): Promise<Apartment | null> {
  const docRef = doc(firestore, "apartments", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return toApartment(docSnap);
  }
  return null;
}

export async function createApartment(
  data: Omit<Apartment, "id">
): Promise<Apartment> {
  const docRef = await addDoc(apartmentsCollection, data);
  const newDoc = await getDoc(docRef);
  return toApartment(newDoc);
}

export async function updateApartment(
  id: string,
  data: Partial<Omit<Apartment, "id">>
): Promise<Apartment> {
  const docRef = doc(firestore, "apartments", id);
  await updateDoc(docRef, data);
  const updatedDoc = await getDoc(docRef);
  return toApartment(updatedDoc);
}

export async function deleteApartment(id: string): Promise<void> {
  const docRef = doc(firestore, "apartments", id);
  await deleteDoc(docRef);
}


// --- Favorites Functions ---

export async function addFavorite(userId: string, apartmentId: string) {
  const favoriteRef = doc(usersCollection, userId, "favorites", apartmentId);
  // FIX QUAN TRỌNG: Đổi từ updateDoc sang setDoc để tạo mới document nếu chưa có
  return await setDoc(favoriteRef, {
    addedAt: Timestamp.now()
  });
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