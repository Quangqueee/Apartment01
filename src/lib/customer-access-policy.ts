import type { UserRole } from './rbac';

export type CustomerVisibility = { legacy?: boolean; adminReaders?: string[]; assignedAdminId?: string | null };
export function customerReadable(role: UserRole, uid: string, profile: { role?: string; ownerAdminId?: string }, visibility?: CustomerVisibility) {
  if (role === 'director') return true;
  if (role !== 'admin' || profile.role !== 'user') return false;
  return visibility?.legacy === true || profile.ownerAdminId === uid || visibility?.assignedAdminId === uid || Array.isArray(visibility?.adminReaders) && visibility.adminReaders.includes(uid);
}
export function showAccessManagement(role?: string) { return role === 'director'; }
export function showSharedMenu(role?: string) { return !!role && role !== 'admin' && role !== 'director'; }
export function freezeLegacyCustomerIds(profiles: { id: string; role?: string }[]) {
  return profiles.filter(p => p.role === 'user').map(p => p.id).sort();
}
