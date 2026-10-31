/**
 * Hook and utilities để xử lý hiển thị dữ liệu dựa trên role
 */

import { UserRole } from "@/lib/rbac";
import { useAuth } from "@/context/auth-context";

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
  const { user, userData, loading: isLoading } = useAuth();
  const role = user ? userData?.role || null : null;
  return {
    role,
    isLoading,
    isAdmin: (role === "admin" || role === "director"),
    isCollaborator: role === "collaborator",
    isRegularUser: role === "user",
  };
}

/**
 * Format address - ẩn địa chỉ chính xác nếu là user thường
 */
export function formatAddressForDisplay(address: string, role: UserRole | null): string {
  // Admin, collaborator có thể xem full address
  if ((role === "admin" || role === "director") || role === "collaborator") {
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
  return role === "collaborator" || (role === "admin" || role === "director");
}

/**
 * Check xem có phải show full address không
 */
export function shouldShowFullAddress(role: UserRole | null): boolean {
  return (role === "admin" || role === "director") || role === "collaborator";
}
