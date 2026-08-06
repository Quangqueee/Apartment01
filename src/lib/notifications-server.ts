import { firestore } from "@/firebase/server-init";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import type { NotificationType } from "./notifications";

export interface CreateNotificationServerInput {
  recipientId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
}

/**
 * Server-side twin of createNotification() in notifications.ts.
 * Writes the same document shape but via @/firebase/server-init, never the
 * client @/firebase barrel — that barrel re-exports client-provider.tsx,
 * which imports AuthProvider from auth-context.tsx, closing the known
 * useAuth import cycle. Server Actions must not import that barrel.
 */
export async function createNotificationServer(
  data: CreateNotificationServerInput,
) {
  try {
    await addDoc(collection(firestore, "notifications"), {
      recipientId: data.recipientId,
      title: data.title,
      message: data.message,
      type: data.type,
      isRead: false,
      link: data.link ?? "",
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Lỗi tạo thông báo (server):", error);
  }
}

export async function notifyAdminsServer(
  data: Omit<CreateNotificationServerInput, "recipientId">,
) {
  try {
    const adminsSnap = await getDocs(
      query(collection(firestore, "users"), where("role", "==", "admin")),
    );
    await Promise.all(
      adminsSnap.docs.map((adminDoc) =>
        createNotificationServer({ ...data, recipientId: adminDoc.id }),
      ),
    );
  } catch (error) {
    console.error("Lỗi gửi thông báo cho admin (server):", error);
  }
}
