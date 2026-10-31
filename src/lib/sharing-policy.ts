import type { UserRole } from './rbac';

export const SHARE_KINDS = ['bookings', 'collaborators', 'customers'] as const;
export type ShareKind = typeof SHARE_KINDS[number];
export const SHARE_LABELS: Record<ShareKind, string> = {
  bookings: 'Lịch xem nhà', collaborators: 'Danh sách CTV', customers: 'Khách hàng',
};
export function grantId(owner: string, kind: ShareKind, recipient: string) {
  // UID values are validated at the API boundary; use an unambiguous encoding.
  return `${owner}~${kind}~${recipient}`;
}
export function canManageOwned(role: UserRole, uid: string, owner?: string) {
  return role === 'director' || (role === 'admin' && owner === uid);
}
export function canChangeRole(actorRole: UserRole, actorUid: string, targetUid: string,
  targetRole: string, nextRole: string, owner?: string, landlordRequest = false) {
  if (actorUid === targetUid) return false;
  if (actorRole === 'director') return ['user', 'collaborator', 'landlord', 'admin', 'director'].includes(nextRole);
  return actorRole === 'admin' && !['admin', 'director'].includes(targetRole)
    && (owner === actorUid || landlordRequest)
    && ['user', 'collaborator', 'landlord'].includes(nextRole);
}

/** Shared views intentionally omit internal notes and arbitrary profile fields. */
export function sharedView(id: string, collection: string, data: Record<string, unknown>) {
  const keys = collection === 'users'
    ? ['displayName', 'email', 'phoneNumber', 'role', 'ownerAdminId']
    : ['apartmentId', 'apartmentCode', 'clientName', 'clientPhone', 'name', 'phone',
      'ctvName', 'dateTime', 'status', 'ownerAdminId'];
  return Object.fromEntries([['id', id], ['collection', collection],
    ...keys.filter(key => data[key] !== undefined).map(key => [key, data[key]])]);
}
