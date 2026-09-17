// src/lib/auth-service.ts
import { auth, db } from "@/firebase";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword,
    confirmPasswordReset as firebaseConfirmPasswordReset
} from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { notifyAdmins } from "@/lib/notifications";
import { ADMIN_PATH } from "@/lib/constants";

export const login = async (email: string, pass: string) => {
    return await signInWithEmailAndPassword(auth, email, pass);
};

// ĐÃ THÊM: Bổ sung tham số thứ 4 là phoneNumber (có dấu ? để thành tùy chọn)
export const signup = async (email: string, pass: string, fullName: string, phoneNumber?: string) => {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    await setDoc(doc(db, "users", res.user.uid), {
        uid: res.user.uid,
        email: email,
        displayName: fullName,
        phoneNumber: phoneNumber || "", // Lưu số điện thoại vào database nếu có
        role: "user",
        favorites: [],
        createdAt: serverTimestamp(),
    });
    await notifyAdmins({
        title: "Thành viên mới đăng ký",
        message: `${fullName || email} vừa đăng ký tài khoản mới trên hệ thống.`,
        type: "system",
        link: `/${ADMIN_PATH}/users`,
    });
    return res.user;
};

// ĐÃ THÊM: Sửa lỗi Build cho Google Login
export const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const res = await signInWithPopup(auth, provider);
    try {
        const userRef = doc(db, "users", res.user.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
            await setDoc(userRef, {
                uid: res.user.uid,
                email: res.user.email || "",
                displayName: res.user.displayName || "",
                phoneNumber: res.user.phoneNumber || "",
                role: "user",
                favorites: [],
                createdAt: serverTimestamp(),
            });
            await notifyAdmins({
                title: "Thành viên mới đăng ký",
                message: `${res.user.displayName || res.user.email} vừa đăng ký tài khoản mới trên hệ thống.`,
                type: "system",
                link: `/${ADMIN_PATH}/users`,
            });
        }
    } catch (error) {
        console.error("Lỗi tạo hồ sơ Google:", error);
    }
    return res;
};

export const resetPassword = async (email: string) => {
    return await sendPasswordResetEmail(auth, email);
};

export const changePassword = async (newPassword: string, currentPassword: string) => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
        const error = new Error("No authenticated user.");
        (error as Error & { code?: string }).code = "auth/no-current-user";
        throw error;
    }

    if (!currentUser.email) {
        const error = new Error("Current user has no email.");
        (error as Error & { code?: string }).code = "auth/missing-email";
        throw error;
    }

    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
    await reauthenticateWithCredential(currentUser, credential);
    await updatePassword(currentUser, newPassword);
};

export const logout = () => signOut(auth);

export const confirmResetPassword = async (oobCode: string, newPassword: string) => {
    return await firebaseConfirmPasswordReset(auth, oobCode, newPassword);
};

export const getCurrentUserRole = async (uid: string) => {
    if (!uid) return null;
    
    try {
        const userDocRef = doc(db, "users", uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
            return userDocSnap.data().role;
        }
        
        return null;
    } catch (error) {
        console.error("Lỗi khi truy xuất phân quyền người dùng:", error);
        return null;
    }
};