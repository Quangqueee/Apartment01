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
    searchBy?: "title" | "sourceCode" | "sourceCodeOrAddress";
    lastVisible?: any; // For pagination
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
    searchBy = "title",
    lastVisible: lastVisibleDoc,
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
  if (priceRange) {
    const [min, max] = priceRange.split("-");
    const minPrice = min ? parseInt(min) : 0;
    const maxPrice = max ? parseInt(max) : Infinity;
    if (minPrice > 0) whereClauses.push(where("price", ">=", minPrice));
    if (maxPrice !== Infinity) whereClauses.push(where("price", "<=", maxPrice));
  }
  
  // --- Text Search Filter (Client-Side) ---
  // Firestore doesn't support native text search on multiple fields well without a third-party service.
  // We'll keep this part client-side as a post-filter if a search query exists.
  // Or, if search is the only filter, we can't optimize it with Firestore queries alone.
  // For now, we apply it after fetching.
  
  if (whereClauses.length > 0) {
      baseQuery = query(baseQuery, ...whereClauses);
  }

  // --- Get Total Count for the filtered query ---
  const countSnapshot = await getCountFromServer(baseQuery);
  let totalResults = countSnapshot.data().count;

  // --- Build OrderBy Clause ---
  // Firestore requires the first orderBy to match the inequality field if one exists
  if (priceRange && sortBy.startsWith('price')) {
      baseQuery = query(baseQuery, orderBy("price", sortBy === 'price-asc' ? 'asc' : 'desc'));
  } else if (sortBy === 'price-asc') {
      baseQuery = query(baseQuery, orderBy("price", "asc"));
  } else if (sortBy === 'price-desc') {
      baseQuery = query(baseQuery, orderBy("price", "desc"));
  }
  // Always add a secondary sort for consistent ordering
  baseQuery = query(baseQuery, orderBy("createdAt", "desc"));

  // --- Pagination ---
  if (page > 1 && !lastVisibleDoc) {
      const lastDoc = await getLastDocOfPreviousPage(baseQuery, page, pageSize);
      if (lastDoc) {
        baseQuery = query(baseQuery, startAfter(lastDoc));
      }
  } else if (lastVisibleDoc) {
      const docRef = doc(firestore, "apartments", lastVisibleDoc.id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()){
          baseQuery = query(baseQuery, startAfter(docSnap));
      }
  }
  
  baseQuery = query(baseQuery, limit(pageSize));

  const querySnapshot = await getDocs(baseQuery);
  let apartments = querySnapshot.docs.map(toApartment);

  // --- Apply Text Search if present ---
  if (searchQuery) {
    const normalizedQuery = removeVietnameseTones(searchQuery);
    apartments = apartments.filter((apt) => {
      if (searchBy === 'sourceCodeOrAddress') {
        const normalizedCode = removeVietnameseTones(apt.sourceCode);
        const normalizedAddress = removeVietnameseTones(apt.address);
        return normalizedCode.includes(normalizedQuery) || normalizedAddress.includes(normalizedQuery);
      }
      
      const fieldToSearch = searchBy === 'sourceCode' ? apt.sourceCode : apt.title;
      const normalizedField = removeVietnameseTones(fieldToSearch);
      return normalizedField.includes(normalizedQuery);
    });
    // If we filter by text search, totalResults needs to be re-evaluated.
    // For simplicity with server components, we'll show totalResults pre-text-search.
    // A more complex setup would run two queries or do counts differently.
  }
  
  const lastFetchedDoc = querySnapshot.docs[querySnapshot.docs.length - 1];

  return { 
      apartments, 
      totalResults,
      lastVisible: lastFetchedDoc ? toApartment(lastFetchedDoc) : null 
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
