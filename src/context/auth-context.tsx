"use client";
import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/firebase";

export type UserRole = "user" | "collaborator" | "admin" | "landlord";

export type UserData = {
  uid?: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  preferredDistrict?: string;
  dob?: string;
  gender?: string;
  interests?: string;
  favorites?: string[];
  role?: UserRole;
  landlordApprovalStatus?: "pending" | "approved" | "rejected";
};

type AuthContextValue = {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  userData: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
        unsubscribeUserDoc = null;
      }

      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        unsubscribeUserDoc = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              setUserData(docSnap.data() as UserData);
            } else {
              setUserData(null);
            }
            setLoading(false); // Dừng loading ngay khi có dữ liệu
          },
          (error) => {
            console.error("Auth Snapshot Error:", error);
            setLoading(false); // Dừng loading kể cả khi có lỗi
          },
        );
      } else {
        setUserData(null);
        setLoading(false); // Dừng loading nếu không có user
      }
    });

    return () => {
      unsubscribe();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
    };
  }, []);

  const value = useMemo(
    () => ({ user, userData, loading }),
    [user, userData, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
