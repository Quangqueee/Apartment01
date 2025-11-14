
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

const toApartment = (docSnap: DocumentData): Apartment => {
  const data = docSnap.data();
  const createdAt = data.createdAt?.toDate ? {
    seconds: data.createdAt.seconds,
    nanoseconds: data.createdAt.nanoseconds,
  } : { seconds: 0, nanoseconds: 0 }; 

  return {
    id: docSnap.id,
    ...data,
    createdAt,
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

  // --- Build Where Clauses (only for equality checks) ---
  if (district) {
    whereClauses.push(where("district", "==", district));
  }
  if (roomType) {
    whereClauses.push(where("roomType", "==", roomType));
  }
  
  if (whereClauses.length > 0) {
      baseQuery = query(baseQuery, ...whereClauses);
  }

  // --- Build OrderBy Clause ---
  // Firestore requires the first orderBy field to be the same as the inequality field if one is used.
  // Since we filter price on the server, we can order by anything.
  if (sortBy === 'price-asc') {
      baseQuery = query(baseQuery, orderBy("price", "asc"));
  } else if (sortBy === 'price-desc') {
      baseQuery = query(baseQuery, orderBy("price", "desc"));
  } else { // Default to newest
      baseQuery = query(baseQuery, orderBy("createdAt", "desc"));
  }
  
  // This is the query that will be used for counting total results and for fetching all pages.
  const filteredQuery = baseQuery;

  // --- Post-Query Filtering (on server) ---
  // First, get ALL documents that match the Firestore query. We'll paginate manually after.
  const querySnapshot = await getDocs(filteredQuery);
  let allMatchingApartments = querySnapshot.docs.map(toApartment);

  // Apply Price Range Filter on the server
  if (priceRange) {
    const [min, max] = priceRange.split("-");
    const minPrice = min ? parseInt(min, 10) : 0;
    const maxPrice = max ? parseInt(max, 10) : Infinity;
    allMatchingApartments = allMatchingApartments.filter(apt => {
        const price = apt.price;
        const meetsMin = minPrice > 0 ? price >= minPrice : true;
        const meetsMax = maxPrice !== Infinity ? price <= maxPrice : true;
        return meetsMin && meetsMax;
    });
  }

  // Apply Text Search Filter on the server
  if (searchQuery) {
    const normalizedQuery = removeVietnameseTones(searchQuery);
    allMatchingApartments = allMatchingApartments.filter((apt) => {
      if (searchBy === 'sourceCodeOrAddress') {
        const normalizedCode = removeVietnameseTones(apt.sourceCode);
        const normalizedAddress = removeVietnameseTones(apt.address);
        return normalizedCode.includes(normalizedQuery) || normalizedAddress.includes(normalizedQuery);
      }
      
      // Default behavior for public page (titleOrSourceCode)
      const normalizedTitle = removeVietnameseTones(apt.title);
      const normalizedCode = removeVietnameseTones(apt.sourceCode);
      return normalizedTitle.includes(normalizedQuery) || normalizedCode.includes(normalizedQuery);
    });
  }

  // --- Manual Pagination on the final filtered list ---
  const totalResults = allMatchingApartments.length;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const apartments = allMatchingApartments.slice(startIndex, endIndex);

  return { 
      apartments, 
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
  data: Omit<Apartment, "id" | "createdAt">
) {
  const newApartmentData = {
    ...data,
    createdAt: Timestamp.now(),
  };
  const docRef = await addDoc(apartmentsCollection, newApartmentData);
  const newDoc = await getDoc(docRef);
  return toApartment(newDoc);
}

export async function updateApartment(
  id: string,
  data: Partial<Omit<Apartment, "id" | "createdAt">>
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
