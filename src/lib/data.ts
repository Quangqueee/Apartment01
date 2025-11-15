
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
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
import { firestore } from "@/firebase/server-init";
import { Apartment } from "./types";
import { removeVietnameseTones } from "./utils";


const apartmentsCollection = collection(firestore, "apartments");

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
    commission: data.commission || "",
    createdAt,
    updatedAt,
  } as Apartment;
};

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

  // --- Build Where Clauses ---
  if (district) {
    whereClauses.push(where("district", "==", district));
  }
  if (roomType) {
    whereClauses.push(where("roomType", "==", roomType));
  }
  
  // Apply price range filtering with where clauses
  if (priceRange) {
    const [min, max] = priceRange.split("-");
    const minPrice = min ? parseInt(min, 10) : 0;
    const maxPrice = max ? parseInt(max, 10) : Infinity;

    if (minPrice > 0) {
      whereClauses.push(where("price", ">=", minPrice));
    }
    if (maxPrice !== Infinity) {
      whereClauses.push(where("price", "<=", maxPrice));
    }
  }

  // Always apply where clauses if they exist
  if (whereClauses.length > 0) {
      baseQuery = query(baseQuery, ...whereClauses);
  }

  // Initial fetch from Firestore - we only order by one field to avoid complex indexes
  const querySnapshot = await getDocs(baseQuery);
  let allMatchingApartments = querySnapshot.docs.map(toApartment);

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
    allMatchingApartments.sort((a, b) => b.price - a.price);
  } else { // 'newest' or default
    allMatchingApartments.sort((a, b) => b.updatedAt.seconds - a.updatedAt.seconds);
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
) {
  const docRef = await addDoc(apartmentsCollection, data);
  const newDoc = await getDoc(docRef);
  return toApartment(newDoc);
}

export async function updateApartment(
  id: string,
  data: Partial<Omit<Apartment, "id">>
) {
  const docRef = doc(firestore, "apartments", id);
  await updateDoc(docRef, data);
  const updatedDoc = await getDoc(docRef);
  return toApartment(updatedDoc);
}

export async function deleteApartment(id: string): Promise<void> {
  const docRef = doc(firestore, "apartments", id);
  await deleteDoc(docRef);
}
