import { adminDb } from '@/firebase/admin-init';
import { createHash } from 'node:crypto';
import type { Transaction } from 'firebase-admin/firestore';
import { CUSTOMER_SOURCES, customerKey, safeText, isoTime, stringIds, type OperationCustomer } from './customer-operations';

type Source = { id: string; collection: string; data: Record<string, any>; createTime?: any };
// Freeze search membership without retaining names/phone/email search text in jobs.
export function customerSearchVersion(row: OperationCustomer) {
  return createHash('sha256').update(JSON.stringify([row.displayName, row.email, row.phoneNumber, row.referralName])).digest('hex');
}
export function operationCustomer(source: Source, work: Record<string, any> = {}, permission: Record<string, any> = {}, cutoff: string | null = null): OperationCustomer {
  const d = source.data, profile = source.collection === 'users';
  // createTime is Firestore metadata, never the client-controlled createdAt field.
  const createdAt = isoTime(source.createTime), legacy = permission.legacy === true;
  return { key: customerKey(source.collection, source.id), collection: source.collection, id: source.id,
    displayName: safeText(profile || source.collection === 'customerLeads' ? d.displayName : d.clientName || d.name),
    email: profile ? safeText(d.email) : '', phoneNumber: safeText(profile || source.collection === 'customerLeads' ? d.phoneNumber : d.clientPhone || d.phone),
    ownerAdminId: safeText(d.ownerAdminId), createdByAdminId: safeText(d.createdByAdminId),
    referralCtvId: source.collection === 'ctv_bookings' && d.ctvId !== 'manual_entry' ? safeText(d.ctvId) : safeText(d.referralCtvId),
    referralName: safeText(d.ctvName), source: profile ? 'account' : source.collection === 'ctv_bookings' ? 'ctv' : source.collection === 'guest_consultations' ? 'guest' : 'manual',
    assignedAdminId: safeText(work.assignedAdminId) || null, status: ['new', 'in_progress', 'contacted', 'completed', 'cancelled'].includes(work.status) ? work.status : 'untracked',
    revision: Number.isSafeInteger(work.revision) && work.revision >= 0 ? work.revision : 0,
    age: legacy ? 'legacy' : cutoff && createdAt && createdAt > cutoff ? 'new' : 'unknown',
    legacy, adminReaders: stringIds(permission.adminReaders), createdAt, updatedAt: isoTime(work.updatedAt || d.updatedAt), bookingKeys: [], needs: safeText(profile ? d.interests : source.collection === 'customerLeads' ? d.interests : d.budget),
    canProcess: false, canManage: false, canExport: false };
}
export const visibilityPath = (collection: string, id: string) => collection === 'users' ? `customerVisibility/${id}` : `customerLeadVisibility/${customerKey(collection, id)}`;
export async function readOperationCustomer(tx: Transaction, key: string) {
  const { parseCustomerKey } = await import('./customer-operations');
  const parsed = parseCustomerKey(key); if (!parsed) return null;
  const [source, work, permission, baseline] = await Promise.all([tx.get(adminDb.doc(`${parsed.collection}/${parsed.id}`)),
    tx.get(adminDb.doc(`customerWork/${key}`)), tx.get(adminDb.doc(visibilityPath(parsed.collection, parsed.id))), tx.get(adminDb.doc('accessConfig/customerLegacy'))]);
  if (!source.exists || parsed.collection === 'users' && source.data()?.role !== 'user') return null;
  // A booking linked to an existing customer account has one canonical customer key.
  if (parsed.collection === 'user_bookings' && source.data()?.isExternal !== true && /^[A-Za-z0-9_-]{1,128}$/.test(safeText(source.data()?.userId))) {
    const profile = await tx.get(adminDb.doc(`users/${source.data()!.userId}`));
    if (profile.data()?.role === 'user') return null;
  }
  const row = operationCustomer({ ...parsed, data: source.data()!, createTime: source.createTime }, work.data(), permission.data(),
    baseline.data()?.status === 'complete' ? baseline.data()?.capturedAt || null : null);
  if (/^[A-Za-z0-9_-]{1,128}$/.test(row.referralCtvId)) {
    const ctv = await tx.get(adminDb.doc(`users/${row.referralCtvId}`));
    if (ctv.data()?.role === 'collaborator') row.referralName = safeText(ctv.data()?.displayName) || row.referralCtvId;
  }
  return { row, work: work.data() || {}, permission: permission.data() || {} };
}
export async function loadOperationCustomers(tx: Transaction) {
  const [sources, work, profilesVisibility, leadsVisibility, baseline] = await Promise.all([
    Promise.all(CUSTOMER_SOURCES.map(c => tx.get(adminDb.collection(c)))), tx.get(adminDb.collection('customerWork')),
    tx.get(adminDb.collection('customerVisibility')), tx.get(adminDb.collection('customerLeadVisibility')), tx.get(adminDb.doc('accessConfig/customerLegacy'))]);
  const workById = new Map(work.docs.map(s => [s.id, s.data()]));
  const permissions = new Map([...profilesVisibility.docs.map(s => [customerKey('users', s.id), s.data()] as const), ...leadsVisibility.docs.map(s => [s.id, s.data()] as const)]);
  const profiles = sources[0].docs, customerIds = new Set(profiles.filter(s => s.data().role === 'user').map(s => s.id));
  const linked = new Map<string, string[]>();
  const rows: OperationCustomer[] = [];
  for (let index = 0; index < sources.length; index++) for (const s of sources[index].docs) {
    const collection = CUSTOMER_SOURCES[index], d = s.data(), key = customerKey(collection, s.id);
    if (collection === 'users' && d.role !== 'user') continue;
    if (collection === 'user_bookings' && d.isExternal !== true && customerIds.has(d.userId)) {
      linked.set(d.userId, [...(linked.get(d.userId) || []), `${collection}/${s.id}`]); continue;
    }
    const row = operationCustomer({ collection, id: s.id, data: d, createTime: s.createTime }, workById.get(key), permissions.get(key),
      baseline.data()?.status === 'complete' ? baseline.data()?.capturedAt || null : null);
    if (collection !== 'users' && collection !== 'customerLeads') row.bookingKeys.push(`${collection}/${s.id}`);
    rows.push(row);
  }
  for (const row of rows) if (row.collection === 'users') row.bookingKeys = linked.get(row.id) || [];
  return { rows, profiles, bookings: sources.slice(1, 4).flatMap((s, i) => s.docs.map(d => ({ id: d.id, collection: CUSTOMER_SOURCES[i + 1], ...d.data() }))),
    baselineReady: baseline.data()?.status === 'complete' };
}
export function visibleCustomer(row: OperationCustomer, director: boolean, uid: string) {
  const own = row.ownerAdminId === uid, assigned = row.assignedAdminId === uid;
  const { adminReaders, ...publicRow } = row;
  return { ...publicRow, canProcess: director || own || assigned, canManage: director || own,
    canExport: director || own, ...(director ? { adminReaders } : {}) };
}
