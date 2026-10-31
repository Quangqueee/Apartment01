import type { NotificationType } from "./notifications";
import { callCloudFunction } from "./callable-http";

export interface CreateNotificationServerInput {
  recipientId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
}

/**
 * Server twin of createNotification().
 * P0: không addDoc client SDK (create: false). Callable yêu cầu auth —
 * Server Action không có token user nên lệnh này sẽ fail cho đến khi
 * action chạy từ client đã login (httpsCallable) hoặc có ID token.
 */
export async function createNotificationServer(
  data: CreateNotificationServerInput,
) {
  try {
    await callCloudFunction("createNotification", {
      recipientId: data.recipientId,
      title: data.title,
      message: data.message,
      type: data.type,
      link: data.link ?? "",
    });
  } catch (error) {
    console.error("Lỗi tạo thông báo (server):", error);
  }
}

/**
 * Guest + Server Action đều gọi được: notifyAdmins không bắt buộc auth.
 */
export async function notifyAdminsServer(
  data: Omit<CreateNotificationServerInput, "recipientId">,
) {
  try {
    await callCloudFunction("notifyAdmins", {
      title: data.title,
      message: data.message,
      type: data.type,
      link: data.link ?? "",
    });
  } catch (error) {
    console.error("Lỗi gửi thông báo cho admin (server):", error);
  }
}
