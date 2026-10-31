import { searchText } from './booking-workflow';

export const CUSTOMER_SOURCES = ['users', 'user_bookings', 'ctv_bookings', 'guest_consultations', 'customerLeads'] as const;
export const CUSTOMER_STATUSES = ['untracked', 'new', 'in_progress', 'contacted', 'completed', 'cancelled'] as const;
export const CUSTOMER_STATUS_LABELS: Record<string, string> = { untracked: 'Chưa cập nhật', new: 'Mới tiếp nhận', in_progress: 'Đang xử lý', contacted: 'Đã liên hệ', completed: 'Đã xử lý', cancelled: 'Dừng xử lý' };
export type CustomerFilters = { search?: string; ownerAdminId?: string; assignedAdminId?: string; ctvId?: string;
  age?: 'all' | 'legacy' | 'new' | 'unknown'; assignment?: 'all' | 'assigned' | 'unassigned'; status?: string;
  source?: string; createdFrom?: string; createdTo?: string };
export type OperationCustomer = { key: string; collection: string; id: string; displayName: string; phoneNumber: string; email: string;
  ownerAdminId: string; createdByAdminId: string; referralCtvId: string; referralName: string; source: string;
  assignedAdminId: string | null; status: string; revision: number; age: 'legacy' | 'new' | 'unknown';
  createdAt: string | null; updatedAt: string | null; legacy: boolean; adminReaders: string[]; bookingKeys: string[]; needs: string;
  canProcess: boolean; canManage: boolean; canExport: boolean };
export function customerKey(collection: string, id: string) { return `${collection}~${id}`; }
export function parseCustomerKey(key: string) {
  const match = /^(users|user_bookings|ctv_bookings|guest_consultations|customerLeads)~([A-Za-z0-9_-]{1,128})$/.exec(key);
  return match ? { collection: match[1], id: match[2] } : null;
}
export function safeText(value: unknown) { return typeof value === 'string' ? value : ''; }
export function stringIds(value: unknown): string[] { return Array.isArray(value) ? [...new Set(value.filter((v): v is string => typeof v === 'string'))] : []; }
export function isoTime(value: any): string | null {
  const millis = typeof value?.toMillis === 'function' ? value.toMillis() : typeof value?.seconds === 'number' ? value.seconds * 1000 : typeof value === 'string' ? Date.parse(value) : NaN;
  return Number.isFinite(millis) && Number.isFinite(new Date(millis).getTime()) ? new Date(millis).toISOString() : null;
}
export function customerMatches(c: OperationCustomer, f: CustomerFilters) {
  const needle = searchText(f.search || '');
  const day = c.createdAt ? new Date(Date.parse(c.createdAt) + 7 * 3600000).toISOString().slice(0, 10) : '';
  return (!needle || searchText(`${c.displayName} ${c.email} ${c.phoneNumber} ${c.referralName}`).includes(needle))
    && (!f.ownerAdminId || c.ownerAdminId === f.ownerAdminId)
    && (!f.assignedAdminId || c.assignedAdminId === f.assignedAdminId)
    && (!f.ctvId || c.referralCtvId === f.ctvId)
    && (!f.age || f.age === 'all' || c.age === f.age)
    && (!f.assignment || f.assignment === 'all' || (f.assignment === 'assigned' ? !!c.assignedAdminId : !c.assignedAdminId))
    && (!f.status || f.status === 'all' || c.status === f.status)
    && (!f.source || f.source === 'all' || c.source === f.source)
    && (!f.createdFrom || !!day && day >= f.createdFrom) && (!f.createdTo || !!day && day <= f.createdTo);
}
export function customerCanRead(c: OperationCustomer, role: string, uid: string) {
  return role === 'director' || role === 'admin' && (c.legacy || c.ownerAdminId === uid || c.assignedAdminId === uid || c.adminReaders.includes(uid));
}
export function customerCanProcess(c: OperationCustomer, role: string, uid: string) {
  return role === 'director' || role === 'admin' && (c.ownerAdminId === uid || c.assignedAdminId === uid);
}
