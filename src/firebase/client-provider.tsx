'use client';

import React, { type ReactNode } from "react";
import { FirebaseProvider } from "@/firebase/provider";
import { AuthProvider } from "@/context/auth-context";

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  return (
    <FirebaseProvider>
      <AuthProvider>{children}</AuthProvider>
    </FirebaseProvider>
  );
}