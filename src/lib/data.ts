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
} from "firebase/firestore";
import { firestore } from "@/firebase/server-init";
import { Apartment } from "./types";


const apartmentsCollection = collection(firestore, "apartments");

const toApartment = (docSnap: DocumentData): Apartment => {
  const data = docSnap.data();
  // Firestore's Timestamp is an object with methods, which Next.js
  // cannot serialize from a Server Component to a Client Component.
  // We convert it to a plain object.
  const createdAt = data.createdAt?.toDate ? {
    seconds: data.createdAt.seconds,
    nanoseconds: data.createdAt.nanoseconds,
  } : { seconds: 0, nanoseconds: 0 }; // Provide a default if createdAt is missing

  return {
    id: docSnap.id,
    ...data,
    createdAt,
  } as Apartment;
};

export async function getApartments(
  options: {
    query?: string;
    district?: string;
    priceRange?: string;
    roomType?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    searchBy?: "title" | "sourceCode";
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
  } = options;

  // --- Step 1: Fetch ALL apartments from Firestore ---
  const q = query(apartmentsCollection);
  const querySnapshot = await getDocs(q);
  let apartments = querySnapshot.docs.map(toApartment);

  // --- Step 2: Perform ALL filtering and sorting on the client-side ---
  
  // District Filter
  if (district) {
    apartments = apartments.filter(apt => apt.district === district);
  }

  // Room Type Filter
  if (roomType) {
    apartments = apartments.filter(apt => apt.roomType === roomType);
  }

  // Price Range Filter
  if (priceRange) {
    const [min, max] = priceRange.split("-");
    const minPrice = min ? parseInt(min) : 0;
    const maxPrice = max ? parseInt(max) : Infinity;
    
    apartments = apartments.filter(apt => {
        let passes = true;
        if (minPrice > 0) passes = passes && apt.price >= minPrice;
        if (maxPrice !== Infinity) passes = passes && apt.price <= maxPrice;
        return passes;
    });
  }

  // Search Filter
  if (searchQuery) {
    const lowercasedQuery = searchQuery.toLowerCase();
    apartments = apartments.filter((apt) => {
      const fieldToSearch = searchBy === 'sourceCode' ? apt.sourceCode : apt.title;
      return fieldToSearch.toLowerCase().includes(lowercasedQuery);
    });
  }
  
  const totalResults = apartments.length;

  // Sorting
  if (sortBy === 'price-asc') {
    apartments.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-desc') {
    apartments.sort((a, b) => b.price - a.price);
  } else { // Default to 'newest'
    apartments.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
  }

  // Pagination (after all filtering and sorting is done)
  const totalPages = Math.ceil(apartments.length / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedApartments = apartments.slice(start, end);


  return { apartments: paginatedApartments, totalPages, totalResults };
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
