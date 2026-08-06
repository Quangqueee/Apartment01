"use client";

import { db } from "@/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
} from "firebase/firestore";

export type NotificationType =
  | "new_booking"
  | "status_update"
  | "system"
  | "landlord_request"
  | "landlord_approved"
  | "landlord_rejected"
  | "new_submission"
  | "submission_reviewed";

export interface CreateNotificationInput {
  recipientId: string;
  title: string;
  message: string;
  type: NotificationType;
  link: string;
}

/**
 * Ghi một thông báo mới vào collection `notifications`.
 * Lỗi được nuốt (log ra console) để không làm gián đoạn luồng nghiệp vụ chính
 * (VD: đổi trạng thái lịch hẹn vẫn thành công dù gửi thông báo thất bại).
 */
export async function createNotification(data: CreateNotificationInput) {
  try {
    await addDoc(collection(db, "notifications"), {
      recipientId: data.recipientId,
      title: data.title,
      message: data.message,
      type: data.type,
      isRead: false,
      link: data.link,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Lỗi tạo thông báo:", error);
  }
}

/**
 * Gửi thông báo tới toàn bộ user có role "admin".
 */
export async function notifyAdmins(
  data: Omit<CreateNotificationInput, "recipientId">,
) {
  try {
    const adminsSnap = await getDocs(
      query(collection(db, "users"), where("role", "==", "admin")),
    );
    await Promise.all(
      adminsSnap.docs.map((adminDoc) =>
        createNotification({ ...data, recipientId: adminDoc.id }),
      ),
    );
  } catch (error) {
    console.error("Lỗi gửi thông báo cho admin:", error);
  }
}
