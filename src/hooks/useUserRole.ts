/**
 * Hook and utilities để xử lý hiển thị dữ liệu dựa trên role
 */

import { useUser } from "@/firebase/provider";
import { useEffect, useState } from "react";
import { UserRole } from "@/lib/rbac";
import { getCurrentUserRole } from "@/lib/auth-service";

/**
 * Hook lấy role của user hiện tại
 */
export function useUserRole(): {
  role: UserRole | null;
  isLoading: boolean;
  isAdmin: boolean;
  isCollaborator: boolean;
  isRegularUser: boolean;
} {
  const { user, isUserLoading } = useUser() as any;
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      // Chờ user loading hoàn toàn trước khi fetch role
      if (isUserLoading) {
        console.log(`[useUserRole] Waiting for user auth state...`);
        return;
      }

      // Nếu không có user, role là null
      if (!user) {
        console.log(`[useUserRole] No user found`);
        setRole(null);
        setIsLoading(false);
        return;
      }

      try {
        console.log(`[useUserRole] Fetching role for user: ${user.uid}`);
        
        // Set a timeout to prevent infinite loading
        const rolePromise = getCurrentUserRole(user.uid);
        const timeoutPromise = new Promise<UserRole>((resolve) => {
          setTimeout(() => {
            console.warn(`[useUserRole] Fetch timeout after 5s, using default 'user'`);
            resolve("user");
          }, 5000);
        });
        
        const userRole = await Promise.race([rolePromise, timeoutPromise]);
        console.log(`[useUserRole] Role fetched successfully:`, userRole);
        setRole(userRole);
      } catch (error) {
        console.error("[useUserRole] Error fetching user role:", error);
        setRole("user");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRole();
  }, [user, isUserLoading]); // Thêm isUserLoading vào dependency

  return {
    role,
    isLoading,
    isAdmin: role === "admin",
    isCollaborator: role === "collaborator",
    isRegularUser: role === "user",
  };
}

/**
 * Format address - ẩn địa chỉ chính xác nếu là user thường
 */
export function formatAddressForDisplay(address: string, role: UserRole | null): string {
  // Admin, collaborator có thể xem full address
  if (role === "admin" || role === "collaborator") {
    return address;
  }

  // Regular users chỉ xem được quận
  // Ví dụ: "Số 123, Ngách 5, Phố Tây Hồ, Quận Tây Hồ" -> "Quận Tây Hồ"
  const parts = address.split(",").map((p) => p.trim());
  if (parts.length > 0) {
    // Lấy phần cuối cùng (thường là quận)
    const lastPart = parts[parts.length - 1];
    return lastPart || address;
  }

  return address;
}

/**
 * Check xem có phải show commission không
 */
export function shouldShowCommission(role: UserRole | null): boolean {
  return role === "collaborator" || role === "admin";
}

/**
 * Check xem có phải show full address không
 */
export function shouldShowFullAddress(role: UserRole | null): boolean {
  return role === "admin" || role === "collaborator";
}
