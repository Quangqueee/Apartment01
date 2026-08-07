"use client";
import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
// BỔ SUNG: import thêm updateDoc và serverTimestamp
import {
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
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
  // BỔ SUNG: Trường theo dõi hoạt động
  lastActiveAt?: any;
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
    let activityInterval: NodeJS.Timeout | null = null; // BỔ SUNG: Biến lưu trữ bộ đếm thời gian

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      // Xóa các listener và interval cũ nếu có
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
        unsubscribeUserDoc = null;
      }
      if (activityInterval) {
        clearInterval(activityInterval);
        activityInterval = null;
      }

      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);

        // 1. Lắng nghe dữ liệu User
        unsubscribeUserDoc = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              setUserData(docSnap.data() as UserData);
            } else {
              setUserData(null);
            }
            setLoading(false);
          },
          (error) => {
            console.error("Auth Snapshot Error:", error);
            setLoading(false);
          },
        );

        // 2. BỔ SUNG: Logic cập nhật thời gian hoạt động (lastActiveAt)
        const updateActivity = async () => {
          try {
            await updateDoc(userDocRef, {
              lastActiveAt: serverTimestamp(),
            });
          } catch (error) {
            console.error("Lỗi cập nhật lastActiveAt:", error);
          }
        };

        // Ghi nhận ngay lần đầu đăng nhập/mở app
        updateActivity();

        // Ghi nhận lặp lại mỗi 15 phút (15 * 60 * 1000 ms) nếu user vẫn đang dùng app
        activityInterval = setInterval(updateActivity, 15 * 60 * 1000);
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
      if (activityInterval) clearInterval(activityInterval); // Dọn dẹp interval khi unmount
    };
  }, []);

  const value = useMemo(
    () => ({ user, userData, loading }),
    [user, userData, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
