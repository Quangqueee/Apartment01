/**
 * Admin access control utilities
 * Kiểm tra quyền truy cập admin routes
 */

import { auth, db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { UserRole } from "./rbac";

/**
 * Kiểm tra xem user có quyền admin không
 * Gọi từ server-side components hoặc API routes
 */
export async function checkAdminAccess(uid: string | undefined): Promise<{
  isAdmin: boolean;
  role: UserRole;
  email?: string;
}> {
  if (!uid) {
    return { isAdmin: false, role: "user" };
  }

  try {
    const userDoc = await getDoc(doc(db, "users", uid));

    if (!userDoc.exists()) {
      return { isAdmin: false, role: "user" };
    }

    const userData = userDoc.data();
    const role: UserRole = userData.role || "user";

    // Log unauthorized admin access attempts
    if (role !== "admin") {
      console.warn(`[Security] Unauthorized admin access attempt by user: ${uid} with role: ${role}`);
    }

    return {
      isAdmin: role === "admin",
      role,
      email: userData.email,
    };
  } catch (error) {
    console.error("Error checking admin access:", error);
    return { isAdmin: false, role: "user" };
  }
}

/**
 * Kiểm tra xem user có quyền collaborator không
 */
export async function checkCollaboratorAccess(uid: string | undefined): Promise<{
  isCollaborator: boolean;
  isApproved: boolean;
  role: UserRole;
}> {
  if (!uid) {
    return { isCollaborator: false, isApproved: false, role: "user" };
  }

  try {
    const userDoc = await getDoc(doc(db, "users", uid));

    if (!userDoc.exists()) {
      return { isCollaborator: false, isApproved: false, role: "user" };
    }

    const userData = userDoc.data();
    const role: UserRole = userData.role || "user";
    const status = userData.collaboratorStatus || null;

    return {
      isCollaborator: role === "collaborator",
      isApproved: role === "collaborator" && status === "approved",
      role,
    };
  } catch (error) {
    console.error("Error checking collaborator access:", error);
    return { isCollaborator: false, isApproved: false, role: "user" };
  }
}
