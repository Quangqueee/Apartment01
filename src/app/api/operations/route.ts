import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { adminAuth, adminDb } from '@/firebase/admin-init';
import { customerCanRead, customerCanProcess, customerMatches, parseCustomerKey, safeText, stringIds, CUSTOMER_STATUSES, type OperationCustomer } from '@/lib/customer-operations';
import { loadOperationCustomers, readOperationCustomer, visibleCustomer, visibilityPath, customerSearchVersion } from '@/lib/customer-operations-server';
import { bookingSlot, closedBooking, workDate, workLoad } from '@/lib/booking-workflow';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const uid = z.string().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/);
const key = z.string().refine(v => !!parseCustomerKey(v));
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => { const d = new Date(`${v}T00:00:00Z`); return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === v; });
const filters = z.object({ search: z.string().trim().max(200).optional(), ownerAdminId: uid.optional(), assignedAdminId: uid.optional(), ctvId: uid.optional(),
  age: z.enum(['all', 'legacy', 'new', 'unknown']).optional(), assignment: z.enum(['all', 'assigned', 'unassigned']).optional(), status: z.enum(['all', ...CUSTOMER_STATUSES]).optional(),
  source: z.enum(['all', 'account', 'ctv', 'guest', 'manual']).optional(), createdFrom: date.optional(), createdTo: date.optional() }).strict();
const selection = z.discriminatedUnion('mode', [z.object({ mode: z.literal('ids'), keys: z.array(key).min(1).max(1000) }).strict(),
  z.object({ mode: z.literal('filter'), filters, excludeKeys: z.array(key).max(1000).default([]) }).strict()]);
const bodySchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('customers'), filters: filters.default({}), page: z.number().int().min(1).max(100000).default(1), pageSize: z.number().int().min(1).max(100).default(25), workOnly: z.boolean().default(false) }).strict(),
  z.object({ action: z.literal('detail'), key }).strict(),
  z.object({ action: z.literal('dashboard') }).strict(),
  z.object({ action: z.literal('preview'), selection, operation: z.enum(['assign', 'grant', 'revoke']), adminIds: z.array(uid).max(50) }).strict(),
  z.object({ action: z.literal('apply'), jobId: uid, offset: z.number().int().min(0).max(10000) }).strict(),
  z.object({ action: z.literal('work-update'), key, revision: z.number().int().min(0), status: z.enum(CUSTOMER_STATUSES).refine(s => s !== 'untracked') }).strict(),
  z.object({ action: z.literal('create-customer'), displayName: z.string().trim().min(2).max(100), phoneNumber: z.string().trim().regex(/^[0-9+() \-]{8,20}$/),
    interests: z.string().trim().max(2000).default(''), referralCtvId: uid.optional() }).strict(),
]);
class AccessError extends Error { constructor(public status: number, message: string) { super(message); } }
function deny(): never { throw new AccessError(403, 'Không có quyền truy cập.'); }
const signal = (tx: FirebaseFirestore.Transaction) => tx.set(adminDb.doc('customerAccessState/records'), { updatedAt: FieldValue.serverTimestamp() });
const audit = (tx: FirebaseFirestore.Transaction, actorUid: string, action: string, changes: unknown, target: string[]) =>
  tx.set(adminDb.collection('accessAudit').doc(), { actorUid, action, target, changes, createdAt: FieldValue.serverTimestamp() });
async function activeAdmins(ids: string[]) {
  for (const id of ids) {
    try { if ((await adminAuth.getUser(id)).disabled) throw new Error(); }
    catch { throw new AccessError(400, 'Admin nhận việc/quyền phải có tài khoản đăng nhập đang hoạt động.'); }
  }
}
export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) throw new AccessError(401, 'Vui lòng đăng nhập.');
    let actorUid: string;
    try { actorUid = (await adminAuth.verifyIdToken(authorization.slice(7), true)).uid; }
    catch { throw new AccessError(401, 'Phiên đăng nhập không hợp lệ.'); }
    const input = bodySchema.parse(await request.json()), actorRef = adminDb.doc(`users/${actorUid}`);
    const role = (await actorRef.get()).data()?.role;
    if (!['admin', 'director'].includes(role)) deny();
    const director = role === 'director';
    if (['dashboard', 'preview', 'apply'].includes(input.action) && !director) deny();

    if (input.action === 'create-customer') {
      const ref = adminDb.collection('customerLeads').doc();
      await adminDb.runTransaction(async tx => {
        const [actor, ctv, baseline] = await Promise.all([tx.get(actorRef), input.referralCtvId ? tx.get(adminDb.doc(`users/${input.referralCtvId}`)) : Promise.resolve(null), tx.get(adminDb.doc('accessConfig/legacyAdminAccess'))]);
        if (actor.data()?.role !== role) deny();
        if (input.referralCtvId && (ctv?.data()?.role !== 'collaborator' || !(director || ctv.data()?.ownerAdminId === actorUid || stringIds(baseline.data()?.adminUids).includes(actorUid)))) deny();
        tx.set(ref, { displayName: input.displayName, phoneNumber: input.phoneNumber, interests: input.interests,
          ...(input.referralCtvId ? { referralCtvId: input.referralCtvId } : {}), ownerAdminId: actorUid, createdByAdminId: actorUid,
          createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
        audit(tx, actorUid, 'customer-create', { created: true }, [ref.path]); signal(tx);
      });
      return reply({ success: true, key: `customerLeads~${ref.id}` });
    }
    if (input.action === 'work-update') {
      await adminDb.runTransaction(async tx => {
        const [actor, customer] = await Promise.all([tx.get(actorRef), readOperationCustomer(tx, input.key)]);
        if (actor.data()?.role !== role || !customer || !customerCanProcess(customer.row, role, actorUid)) deny();
        if (customer.row.revision !== input.revision) throw new AccessError(409, 'Tiến độ hoặc phân công đã đổi. Tải lại khách hàng.');
        if (customer.row.status === input.status) return;
        tx.set(adminDb.doc(`customerWork/${input.key}`), { ...customer.work, status: input.status, revision: input.revision + 1, updatedAt: FieldValue.serverTimestamp() });
        audit(tx, actorUid, 'customer-progress', { before: customer.row.status, after: input.status }, [input.key]); signal(tx);
      });
      return reply({ success: true });
    }
    if (input.action === 'detail') {
      return reply(await adminDb.runTransaction(async tx => {
        const [actor, customer] = await Promise.all([tx.get(actorRef), readOperationCustomer(tx, input.key)]);
        if (actor.data()?.role !== role || !customer || !customerCanRead(customer.row, role, actorUid)) deny();
        if (director && customer.row.collection === 'users') {
          const bookings = await tx.get(adminDb.collection('user_bookings').where('userId', '==', customer.row.id));
          customer.row.bookingKeys = bookings.docs.filter(s => s.data().isExternal !== true).map(s => `user_bookings/${s.id}`);
        } else if (director && ['user_bookings', 'ctv_bookings', 'guest_consultations'].includes(customer.row.collection)) customer.row.bookingKeys = [`${customer.row.collection}/${customer.row.id}`];
        return { customer: visibleCustomer(customer.row, director, actorUid) };
      }));
    }
    if (input.action === 'apply') {
      // Recipient Auth status is checked again for each chunk; role is checked in the transaction.
      const initial = (await adminDb.doc(`operationsBulk/${input.jobId}`).get()).data();
      if (!initial || initial.actorUid !== actorUid) deny();
      if (initial.operation !== 'revoke' && input.offset >= initial.processed && initial.processed < initial.total) await activeAdmins(stringIds(initial.adminIds));
      return reply(await adminDb.runTransaction(async tx => {
        const jobRef = adminDb.doc(`operationsBulk/${input.jobId}`);
        const [actor, snapshot] = await Promise.all([tx.get(actorRef), tx.get(jobRef)]);
        if (actor.data()?.role !== 'director') deny();
        const job = snapshot.data(); if (!job || job.actorUid !== actorUid) deny();
        const progress = () => ({ total: job!.total, processed: job!.processed, changed: job!.changed, done: job!.processed === job!.total, jobId: input.jobId });
        // Retrying a committed request never advances a second chunk or duplicates its audit.
        if (input.offset < job!.processed || job!.processed === job!.total) return progress();
        if (input.offset !== job!.processed) throw new AccessError(409, 'Thứ tự lô không hợp lệ.');
        if (Date.now() > job!.expiresAtMs) throw new AccessError(409, 'Phiên thao tác đã hết hạn. Chọn lại dữ liệu còn lại.');
        const chunk = await tx.get(adminDb.doc(`operationsBulk/${input.jobId}/chunks/${Math.floor(job!.processed / 50)}`));
        const entries = chunk.data()?.entries as { key: string; revision: number; searchVersion?: string }[] | undefined;
        if (!entries?.length) throw new AccessError(409, 'Lô dữ liệu không hợp lệ.');
        const [admins, customers] = await Promise.all([
          Promise.all(job!.adminIds.map((id: string) => tx.get(adminDb.doc(`users/${id}`)))),
          Promise.all(entries.map(e => readOperationCustomer(tx, e.key))),
        ]);
        if (job!.operation !== 'revoke' && admins.some(s => s.data()?.role !== 'admin')) throw new AccessError(400, 'Chỉ chọn Admin nội bộ đang hoạt động.');
        const changes: { key: string; before: unknown; after: unknown }[] = [];
        const writes: { path: string; data: Record<string, any> }[] = [];
        for (let i = 0; i < customers.length; i++) {
          const item = customers[i], entry = entries[i];
          if (!item || job!.filters && !customerMatches(item.row, job!.filters)) throw new AccessError(409, 'Có khách không còn phù hợp phạm vi đã xác nhận. Tải lại trước khi tiếp tục.');
          if (entry.searchVersion && entry.searchVersion !== customerSearchVersion(item.row)) throw new AccessError(409, 'Thông tin tìm kiếm đã thay đổi. Chọn lại phạm vi trước khi tiếp tục.');
          if (job!.operation === 'assign') {
            if (item.row.revision !== entry.revision) throw new AccessError(409, 'Có phân công/tiến độ đã đổi. Tải lại trước khi giao việc.');
            const after = job!.adminIds[0] || null;
            if (item.row.assignedAdminId === after) continue;
            writes.push({ path: `customerWork/${entry.key}`, data: { ...item.work, assignedAdminId: after, assignedAt: FieldValue.serverTimestamp(),
              status: item.row.status === 'untracked' ? 'new' : item.row.status, revision: item.row.revision + 1, updatedAt: FieldValue.serverTimestamp() } });
            changes.push({ key: entry.key, before: item.row.assignedAdminId, after });
          } else {
            const before = stringIds(item.permission.adminReaders), add = job!.operation === 'grant';
            // Legacy access is already universal; do not create redundant explicit grants.
            if (add && item.row.legacy) continue;
            const after = add ? [...new Set([...before, ...job!.adminIds])] : before.filter(id => !job!.adminIds.includes(id));
            if (after.length > 50) throw new AccessError(400, 'Tối đa 50 Admin được cấp quyền riêng cho mỗi khách.');
            if (after.length === before.length && before.every(id => after.includes(id))) continue;
            writes.push({ path: visibilityPath(item.row.collection, item.row.id), data: { ...item.permission, adminReaders: after, updatedBy: actorUid, updatedAt: FieldValue.serverTimestamp() } });
            changes.push({ key: entry.key, before, after });
          }
        }
        for (const w of writes) tx.set(adminDb.doc(w.path), w.data);
        tx.update(jobRef, { processed: job!.processed + entries.length, changed: job!.changed + changes.length, updatedAt: FieldValue.serverTimestamp() });
        if (changes.length) { audit(tx, actorUid, job!.operation === 'assign' ? 'customer-work-assign' : `customer-view-${job!.operation}`, changes, changes.map(c => c.key)); signal(tx); }
        return { ...progress(), processed: job!.processed + entries.length, changed: job!.changed + changes.length, done: job!.processed + entries.length === job!.total };
      }));
    }
    if (input.action === 'preview' && input.operation !== 'revoke') await activeAdmins([...new Set(input.adminIds)]);
    const result = await adminDb.runTransaction(async tx => {
      const [actor, state] = await Promise.all([tx.get(actorRef), loadOperationCustomers(tx)]);
      if (actor.data()?.role !== role) deny();
      const admins = state.profiles.filter(s => s.data().role === 'admin').map(s => ({ uid: s.id, displayName: safeText(s.data().displayName) || safeText(s.data().email) || s.id, email: safeText(s.data().email) }));
      const ctvNames = new Map(state.profiles.filter(s => s.data().role === 'collaborator').map(s => [s.id, safeText(s.data().displayName) || s.id]));
      for (const c of state.rows) if (c.referralCtvId) c.referralName = ctvNames.get(c.referralCtvId) || c.referralName;
      if (input.action === 'dashboard') {
        const bookings = state.bookings as any[], today = workDate();
        return { total: state.rows.length, accounts: state.rows.filter(c => c.source === 'account').length, leads: state.rows.filter(c => c.source !== 'account').length,
          newCustomers: state.rows.filter(c => c.age === 'new').length, unknownAge: state.rows.filter(c => c.age === 'unknown').length,
          unassigned: state.rows.filter(c => !c.assignedAdminId).length, processing: state.rows.filter(c => !!c.assignedAdminId && ['new', 'in_progress', 'contacted'].includes(c.status)).length,
          todayBookings: bookings.filter(b => bookingSlot(b).day === today && b.status !== 'failed').length,
          unassignedBookings: bookings.filter(b => !b.assignedAdminId && !closedBooking(b)).length, baselineReady: state.baselineReady,
          admins: admins.map(a => ({ ...a, customers: state.rows.filter(c => c.assignedAdminId === a.uid).length,
            processing: state.rows.filter(c => c.assignedAdminId === a.uid && ['new', 'in_progress', 'contacted'].includes(c.status)).length, ...workLoad(bookings, a.uid) })) };
      }
      if (input.action === 'customers') {
        const matched = state.rows.filter(c => customerCanRead(c, role, actorUid) && (!input.workOnly || customerCanProcess(c, role, actorUid)) && customerMatches(c, input.filters))
          .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '') || a.key.localeCompare(b.key));
        const page = Math.min(input.page, Math.max(1, Math.ceil(matched.length / input.pageSize)));
        return { rows: matched.slice((page - 1) * input.pageSize, page * input.pageSize).map(c => visibleCustomer(c, director, actorUid)),
          total: matched.length, page, pageSize: input.pageSize, ...(director ? { admins, collaborators: [...ctvNames].map(([uid, displayName]) => ({ uid, displayName })), baselineReady: state.baselineReady } : {}) };
      }
      if (input.action === 'preview') {
        const ids = [...new Set(input.adminIds)];
        if (input.operation === 'assign' ? ids.length > 1 : !ids.length) throw new AccessError(400, 'Chọn đúng Admin nhận thao tác.');
        if (input.operation !== 'revoke' && ids.some(id => !admins.some(a => a.uid === id))) throw new AccessError(400, 'Chỉ chọn Admin nội bộ.');
        const requested = input.selection.mode === 'ids' ? new Set(input.selection.keys) : null;
        const excluded = new Set(input.selection.mode === 'filter' ? input.selection.excludeKeys : []);
        const matched = state.rows.filter(c => requested ? requested.has(c.key) : !excluded.has(c.key) && customerMatches(c, input.selection.mode === 'filter' ? input.selection.filters : {}));
        if (requested && matched.length !== requested.size) throw new AccessError(409, 'Có khách không còn tồn tại hoặc nguồn đã thay đổi.');
        if (!matched.length || matched.length > 10000) throw new AccessError(400, 'Chọn từ 1 đến 10.000 khách mỗi lượt.');
        const ref = adminDb.collection('operationsBulk').doc(), createdAt = Date.now();
        const searchFiltered = input.selection.mode === 'filter' && !!input.selection.filters.search?.trim();
        const entries = matched.map(c => ({ key: c.key, revision: c.revision, ...(searchFiltered ? { searchVersion: customerSearchVersion(c) } : {}) }));
        const safeFilters = input.selection.mode === 'filter' ? { ...input.selection.filters } : null;
        if (safeFilters) delete safeFilters.search;
        tx.set(ref, { actorUid, operation: input.operation, adminIds: ids, total: matched.length, processed: 0, changed: 0,
          ...(safeFilters ? { filters: safeFilters } : {}), createdAt: FieldValue.serverTimestamp(), expiresAtMs: createdAt + 15 * 60000 });
        for (let i = 0; i < entries.length; i += 50) tx.set(adminDb.doc(`operationsBulk/${ref.id}/chunks/${i / 50}`), { entries: entries.slice(i, i + 50) });
        return { jobId: ref.id, total: matched.length, legacy: matched.filter(c => c.legacy).length,
          reassigning: matched.filter(c => !!c.assignedAdminId && c.assignedAdminId !== ids[0]).length,
          sample: matched.slice(0, 5).map(c => c.displayName || c.key), expiresAtMs: createdAt + 15 * 60000 };
      }
      throw new AccessError(400, 'Thao tác không hợp lệ.');
    });
    return reply(result);
  } catch (error) {
    const status = error instanceof AccessError ? error.status : error instanceof z.ZodError ? 400 : 500;
    // Never echo request bodies, customer contact data or credentials in errors/logs.
    return reply({ error: error instanceof AccessError ? error.message : status === 400 ? 'Dữ liệu yêu cầu không hợp lệ.' : 'Không thể xử lý dữ liệu vận hành.' }, status);
  }
}
function reply(body: unknown, status = 200) { return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store, max-age=0', Vary: 'Authorization' } }); }
