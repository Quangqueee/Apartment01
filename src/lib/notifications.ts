import { db } from "@/firebase";
import {
    addDoc,
    collection,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
    doc,
} from "firebase/firestore";

export interface AppNotification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: any;
}

export async function createNotification(
    userId: string,
    title: string,
    message: string,
    type = "system"
) {
    if (!userId) return null;

    const notificationsRef = collection(db, "notifications", userId, "items");
    const docRef = await addDoc(notificationsRef, {
        userId,
        title,
        message,
        type,
        isRead: false,
        createdAt: serverTimestamp(),
    });

    return docRef.id;
}

export async function getNotificationsForUser(userId: string) {
    if (!userId) return [];

    const notificationsRef = collection(db, "notifications", userId, "items");
    const q = query(notificationsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((item) => ({
        id: item.id,
        ...(item.data() as Omit<AppNotification, "id">),
    })) as AppNotification[];
}

export async function markNotificationAsRead(userId: string, notificationId: string) {
    if (!userId || !notificationId) return;

    const notificationRef = doc(db, "notifications", userId, "items", notificationId);
    await updateDoc(notificationRef, { isRead: true });
}

export async function ensureUserNotification(
    userId: string,
    type: string,
    title: string,
    message: string
) {
    if (!userId) return null;

    const notifications = await getNotificationsForUser(userId);
    const existing = notifications.find((item) => item.type === type);
    if (existing) return existing;

    return createNotification(userId, title, message, type);
}
