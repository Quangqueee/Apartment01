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
    updatePassword
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export const login = async (email: string, pass: string) => {
    return await signInWithEmailAndPassword(auth, email, pass);
};

export const signup = async (email: string, pass: string, fullName: string) => {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    await setDoc(doc(db, "users", res.user.uid), {
        uid: res.user.uid,
        email: email,
        displayName: fullName,
        role: "user",
        favorites: [],
        createdAt: serverTimestamp(),
    });
    return res.user;
};

// ĐÃ THÊM: Sửa lỗi Build cho Google Login
export const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    return await signInWithPopup(auth, provider);
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