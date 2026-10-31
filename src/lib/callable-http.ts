import { firebaseConfig } from "@/firebase/config";

const CALLABLE_BASE = `https://asia-southeast1-${firebaseConfig.projectId}.cloudfunctions.net`;

/**
 * Gọi callable Gen2 bằng HTTP (Server Action không có ID token user).
 * Body theo protocol callable: `{ data: ... }`.
 */
export async function callCloudFunction(
  name: "notifyAdmins" | "createNotification",
  data: Record<string, unknown>,
) {
  const res = await fetch(`${CALLABLE_BASE}/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `${name} HTTP ${res.status}`);
  }
}
