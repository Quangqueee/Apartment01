"use client";

import { httpsCallable } from "firebase/functions";
import { functions } from "@/firebase";

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
 * P0: notifications.create = false trên client SDK.
 * Ghi qua callable `createNotification` (Admin SDK, repo mobile/functions).
 * Auth bắt buộc; recipientId phải là uid hiện tại hoặc caller là admin.
 */
export async function createNotification(data: CreateNotificationInput) {
  try {
    const callable = httpsCallable<
      CreateNotificationInput,
      { ok: boolean }
    >(functions, "createNotification");
    await callable(data);
  } catch (error) {
    console.error("Lỗi tạo thông báo:", error);
  }
}

/**
 * Gửi thông báo tới mọi user role admin.
 * Guest cũng gọi được (Function không bắt buộc auth).
 */
export async function notifyAdmins(
  data: Omit<CreateNotificationInput, "recipientId">,
) {
  try {
    const callable = httpsCallable<
      Omit<CreateNotificationInput, "recipientId">,
      { ok: boolean; count: number }
    >(functions, "notifyAdmins");
    await callable(data);
  } catch (error) {
    console.error("Lỗi gửi thông báo cho admin:", error);
  }
}
