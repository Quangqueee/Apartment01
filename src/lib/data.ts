
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
    q: searchQuery, 
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

  if (whereClauses.length > 0) {
      baseQuery = query(baseQuery, ...whereClauses);
  }

  // --- Build OrderBy Clause ---
  if (sortBy === 'price-asc') {
    baseQuery = query(baseQuery, orderBy("price", "asc"), orderBy("updatedAt", "desc"));
  } else if (sortBy === 'price-desc') {
    baseQuery = query(baseQuery, orderBy("price", "desc"), orderBy("updatedAt", "desc"));
  } else { // 'newest' or default
    baseQuery = query(baseQuery, orderBy("updatedAt", "desc"));
  }

  // --- Total Count for Pagination ---
  // Create a separate query for counting that matches the where clauses
  const countQuery = whereClauses.length > 0 ? query(apartmentsCollection, ...whereClauses) : apartmentsCollection;
  const countSnapshot = await getCountFromServer(countQuery);
  const totalResults = countSnapshot.data().count;

  // --- Pagination ---
  if (page > 1) {
    // To get the correct starting point, we need to fetch the documents up to the previous page's end
    const lastDoc = await getLastDocOfPreviousPage(baseQuery, page, pageSize);
    if (lastDoc) {
      baseQuery = query(baseQuery, startAfter(lastDoc));
    }
  }

  // Apply the final limit
  baseQuery = query(baseQuery, limit(pageSize));
  
  const querySnapshot = await getDocs(baseQuery);
  let apartments = querySnapshot.docs.map(toApartment);

  // --- Post-Query Text Search (if needed) ---
  // This is not ideal for performance with large datasets but works for this structure
  if (searchQuery) {
    const normalizedQuery = removeVietnameseTones(searchQuery);
    apartments = apartments.filter((apt) => {
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
