
'use client';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Query,
  DocumentData,
} from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import { initializeFirebase } from "@/firebase";
import { Apartment } from "./types";
import { toApartment } from "./data"; // Assuming toApartment can be used on client
import { removeVietnameseTones } from "./utils";


// Initialize Firebase on the client
const { firestore } = initializeFirebase();
const apartmentsCollection = collection(firestore, "apartments");

// This function is intended to run on the client side.
export async function getApartmentById(id: string): Promise<Apartment | null> {
  if (!id) return null;
  const docRef = doc(firestore, "apartments", id);
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return toApartment(docSnap);
    }
    return null;
  } catch (error) {
    console.error("Error fetching apartment client-side:", error);
    // In case of permissions errors, it might be better to fail silently
    // or handle it in the UI layer.
    return null;
  }
}

// Client-side version of getApartments for the admin dashboard
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
    limit: pageSize = 1000, // Default to a large number for admin
    sortBy = "newest",
    searchBy = "sourceCodeOrAddress",
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

  // Initial fetch from Firestore
  const querySnapshot = await getDocs(baseQuery);
  let allMatchingApartments = querySnapshot.docs.map(toApartment);

  // --- Client-side Price Filtering with rounding logic ---
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

  // --- Client-side Text Search ---
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

  // --- Client-side Sorting ---
  if (sortBy === 'price-asc') {
    allMatchingApartments.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-desc') {
    allMatchingApartments.sort((a, b) => b.price - a.price);
  } else { // 'newest' or default
     allMatchingApartments.sort((a, b) => {
        const dateA = a.updatedAt.seconds > 0 ? a.updatedAt : a.createdAt;
        const dateB = b.updatedAt.seconds > 0 ? b.updatedAt : b.createdAt;
        return dateB.seconds - dateA.seconds;
    });
  }

  // --- Client-side Pagination ---
  const totalResults = allMatchingApartments.length;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedApartments = allMatchingApartments.slice(startIndex, endIndex);

  return { 
      apartments: paginatedApartments, 
      totalResults,
  };
}
