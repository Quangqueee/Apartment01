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
    // #region agent log
    fetch("http://127.0.0.1:7735/ingest/430bf72e-726d-46db-8508-3f965df7f6a5", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "59fc6f",
      },
      body: JSON.stringify({
        sessionId: "59fc6f",
        hypothesisId: "A",
        location: "src/lib/notifications.ts:createNotification",
        message: "createNotification call start",
        data: {
          type: data.type,
          titleLen: data.title?.length ?? 0,
          messageLen: data.message?.length ?? 0,
          linkLen: data.link?.length ?? 0,
          hasRecipient: Boolean(data.recipientId),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    const callable = httpsCallable<
      CreateNotificationInput,
      { ok: boolean }
    >(functions, "createNotification");
    const result = await callable(data);
    // #region agent log
    fetch("http://127.0.0.1:7735/ingest/430bf72e-726d-46db-8508-3f965df7f6a5", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "59fc6f",
      },
      body: JSON.stringify({
        sessionId: "59fc6f",
        hypothesisId: "B",
        location: "src/lib/notifications.ts:createNotification",
        message: "createNotification success",
        data: { type: data.type, result: result.data ?? null },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  } catch (error) {
    const err = error as { code?: string; message?: string };
    // #region agent log
    fetch("http://127.0.0.1:7735/ingest/430bf72e-726d-46db-8508-3f965df7f6a5", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "59fc6f",
      },
      body: JSON.stringify({
        sessionId: "59fc6f",
        hypothesisId: "A",
        location: "src/lib/notifications.ts:createNotification",
        message: "createNotification failed",
        data: { type: data.type, code: err.code ?? "none", errMsg: err.message ?? String(error) },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
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
    // #region agent log
    fetch("http://127.0.0.1:7735/ingest/430bf72e-726d-46db-8508-3f965df7f6a5", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "59fc6f",
      },
      body: JSON.stringify({
        sessionId: "59fc6f",
        hypothesisId: "A",
        location: "src/lib/notifications.ts:notifyAdmins",
        message: "notifyAdmins call start",
        data: {
          type: data.type,
          titleLen: data.title?.length ?? 0,
          messageLen: data.message?.length ?? 0,
          linkLen: data.link?.length ?? 0,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    const callable = httpsCallable<
      Omit<CreateNotificationInput, "recipientId">,
      { ok: boolean; count: number }
    >(functions, "notifyAdmins");
    const result = await callable(data);
    // #region agent log
    fetch("http://127.0.0.1:7735/ingest/430bf72e-726d-46db-8508-3f965df7f6a5", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "59fc6f",
      },
      body: JSON.stringify({
        sessionId: "59fc6f",
        hypothesisId: "C",
        location: "src/lib/notifications.ts:notifyAdmins",
        message: "notifyAdmins success",
        data: { type: data.type, result: result.data ?? null },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  } catch (error) {
    const err = error as { code?: string; message?: string };
    // #region agent log
    fetch("http://127.0.0.1:7735/ingest/430bf72e-726d-46db-8508-3f965df7f6a5", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "59fc6f",
      },
      body: JSON.stringify({
        sessionId: "59fc6f",
        hypothesisId: "A",
        location: "src/lib/notifications.ts:notifyAdmins",
        message: "notifyAdmins failed",
        data: { type: data.type, code: err.code ?? "none", errMsg: err.message ?? String(error) },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    console.error("Lỗi gửi thông báo cho admin:", error);
  }
}
