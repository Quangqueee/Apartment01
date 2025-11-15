
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
import { initializeFirebase } from "@/firebase/client-provider";
import { Apartment } from "./types";
import { toApartment } from "./data"; // Assuming toApartment can be used on client

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
