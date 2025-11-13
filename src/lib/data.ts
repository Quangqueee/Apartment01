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
  return {
    id: docSnap.id,
    ...data,
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

  let q: Query<DocumentData> = apartmentsCollection;

  const constraints = [];
  if (district) {
    constraints.push(where("district", "==", district));
  }
  if (roomType) {
    constraints.push(where("roomType", "==", roomType));
  }
  
  if (priceRange) {
    const [min, max] = priceRange.split("-");
    const minPrice = min ? parseInt(min) : 0;
    const maxPrice = max ? parseInt(max) : Infinity;
    if (minPrice > 0) {
      constraints.push(where("price", ">=", minPrice));
    }
    if (maxPrice !== Infinity) {
      constraints.push(where("price", "<=", maxPrice));
    }
  }
  
  // Apply sorting
  if (sortBy === 'price-asc') {
      constraints.push(orderBy("price", "asc"));
  } else if (sortBy === 'price-desc') {
      constraints.push(orderBy("price", "desc"));
  }
  // Always sort by createdAt as a secondary, stable sort order.
  constraints.push(orderBy("createdAt", "desc"));

  q = query(apartmentsCollection, ...constraints);
  
  const querySnapshot = await getDocs(q);
  let apartments = querySnapshot.docs.map(toApartment);

  // Client-side search (as Firestore doesn't support partial text search natively)
  if (searchQuery) {
    const lowercasedQuery = searchQuery.toLowerCase();
    apartments = apartments.filter((apt) => {
      const fieldToSearch = searchBy === 'sourceCode' ? apt.sourceCode : apt.title;
      return fieldToSearch.toLowerCase().includes(lowercasedQuery);
    });
  }

  // Manual pagination after client-side filtering
  const totalPages = Math.ceil(apartments.length / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedApartments = apartments.slice(start, end);


  return { apartments: paginatedApartments, totalPages };
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
