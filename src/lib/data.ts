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

// Helper to convert Firestore timestamp to ISO string
const toApartment = (docSnap: DocumentData): Apartment => {
  const data = docSnap.data();
  // Handle both Timestamp and string for createdAt for consistency
  const createdAt = data.createdAt;
  let createdAtString: string;
  if (createdAt instanceof Timestamp) {
    createdAtString = createdAt.toDate().toISOString();
  } else {
    createdAtString = createdAt || new Date().toISOString();
  }

  return {
    id: docSnap.id,
    ...data,
    createdAt: createdAtString,
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

  // This is not efficient on large datasets. For production, use a dedicated search service like Algolia.
  // We will filter by query client-side after fetching.

  const constraints = [];
  if (district) {
    constraints.push(where("district", "==", district));
  }
  if (roomType) {
    constraints.push(where("roomType", "==", roomType));
  }
  
  let hasPriceInequality = false;
  if (priceRange) {
    const [min, max] = priceRange.split("-");
    const minPrice = min ? parseInt(min) : 0;
    const maxPrice = max ? parseInt(max) : Infinity;
    if (minPrice > 0) {
      constraints.push(where("price", ">=", minPrice));
      hasPriceInequality = true;
    }
    if (maxPrice !== Infinity) {
      constraints.push(where("price", "<=", maxPrice));
      hasPriceInequality = true;
    }
  }
  
  // Firestore requires the first orderBy field to match the inequality field if one exists.
  if (hasPriceInequality) {
     if (sortBy === 'price-desc') {
        constraints.push(orderBy("price", "desc"));
     } else {
        // Default to price-asc if a price range is set, unless explicitly price-desc
        constraints.push(orderBy("price", "asc"));
     }
     constraints.push(orderBy("createdAt", "desc")); // Secondary sort
  } else {
      if (sortBy === 'price-asc') {
          constraints.push(orderBy("price", "asc"));
          constraints.push(orderBy("createdAt", "desc"));
      } else if (sortBy === 'price-desc') {
          constraints.push(orderBy("price", "desc"));
          constraints.push(orderBy("createdAt", "desc"));
      } else { // Default to newest
          constraints.push(orderBy("createdAt", "desc"));
      }
  }

  q = query(apartmentsCollection, ...constraints);
  
  const querySnapshot = await getDocs(q);
  let apartments = querySnapshot.docs.map(toApartment);

  // Client-side search
  if (searchQuery) {
    const lowercasedQuery = searchQuery.toLowerCase();
    apartments = apartments.filter((apt) => {
      const fieldToSearch = searchBy === 'sourceCode' ? apt.sourceCode : apt.title;
      return fieldToSearch.toLowerCase().includes(lowercasedQuery);
    });
  }
  
  // If sorting was not on price but a price range was applied, we need to sort manually
  if (hasPriceInequality && sortBy !== 'price-asc' && sortBy !== 'price-desc') {
      if (sortBy === 'newest') {
        // Already sorted by createdAt as secondary
      }
  }

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
  return { ...newApartmentData, id: docRef.id, createdAt: newApartmentData.createdAt.toDate().toISOString() };
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
