"use client";
import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/firebase";

const AuthContext = createContext<any>({});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        // Lắng nghe dữ liệu người dùng
        const unsubDoc = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              setUserData(docSnap.data());
            }
            setLoading(false); // Dừng loading ngay khi có dữ liệu
          },
          (error) => {
            console.error("Auth Snapshot Error:", error);
            setLoading(false); // Dừng loading kể cả khi có lỗi
          }
        );
        return () => unsubDoc();
      } else {
        setUserData(null);
        setLoading(false); // Dừng loading nếu không có user
      }
    });
    return () => unsubscribe();
  }, []);

  const value = useMemo(
    () => ({ user, userData, loading }),
    [user, userData, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
