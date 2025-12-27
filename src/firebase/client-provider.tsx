"use client";
import React, { useMemo, type ReactNode } from "react";
import { FirebaseProvider } from "@/firebase/provider";
import { initializeFirebase } from "@/firebase";
import { AuthProvider } from "@/context/auth-context";

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const firebaseServices = useMemo(() => initializeFirebase(), []);

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      <AuthProvider>{children}</AuthProvider>
    </FirebaseProvider>
  );
}
