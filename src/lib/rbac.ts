/**
 * RBAC (Role-Based Access Control) utilities
 * Định nghĩa các role, quyền hạn, và các hàm kiểm tra quyền
 */

// Định nghĩa các role có trong hệ thống
export type UserRole = 'user' | 'collaborator' | 'admin';

// Định nghĩa các permission (quyền hạn)
export type Permission =
    | 'view_full_address'
    | 'view_commission'
    | 'manage_apartments'
    | 'approve_collaborators'
    | 'view_analytics'
    | 'manage_notifications';

// Mapping giữa role và các permission tương ứng
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    user: [
        // User thường chỉ có quyền xem tin đăng cơ bản
    ],
    collaborator: [
        'view_commission',  // Chỉ CTV mới thấy hoa hồng
    ],
    admin: [
        'view_full_address',
        'view_commission',
        'manage_apartments',
        'approve_collaborators',
        'view_analytics',
        'manage_notifications',
    ],
};

/**
 * Kiểm tra xem user có permission nào đó không
 * @param role - Role của user
 * @param permission - Permission cần kiểm tra
 * @returns true nếu user có permission đó
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
    return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Kiểm tra xem user có role nào đó không
 * @param role - Role của user
 * @param targetRole - Role cần kiểm tra
 * @returns true nếu role khớp
 */
export function hasRole(role: UserRole | null | undefined, targetRole: UserRole): boolean {
    return role === targetRole;
}

/**
 * Kiểm tra xem role có >= quyền hạn của target role không (dùng cho hierarchy)
 * @param role - Role của user
 * @param minRequiredRole - Role tối thiểu cần có
 * @returns true nếu user có đủ quyền hạn
 */
export function hasMinimumRole(role: UserRole | null | undefined, minRequiredRole: UserRole): boolean {
    const roleHierarchy: Record<UserRole, number> = {
        user: 0,
        collaborator: 1,
        admin: 2,
    };

    if (!role) return false;
    return roleHierarchy[role] >= roleHierarchy[minRequiredRole];
}

/**
 * Kiểm tra xem user là admin không
 */
export function isAdmin(role: UserRole | null | undefined): boolean {
    return role === 'admin';
}

/**
 * Kiểm tra xem user là collaborator không
 */
export function isCollaborator(role: UserRole | null | undefined): boolean {
    return role === 'collaborator';
}

/**
 * Kiểm tra xem user là user thường không
 */
export function isRegularUser(role: UserRole | null | undefined): boolean {
    return role === 'user';
}

/**
 * Lấy label tiếng Việt cho role
 */
export function getRoleLabel(role: UserRole): string {
    const labels: Record<UserRole, string> = {
        user: 'Khách hàng',
        collaborator: 'Cộng tác viên',
        admin: 'Quản trị viên',
    };
    return labels[role];
}
