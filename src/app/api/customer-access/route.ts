import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { adminAuth, adminDb } from '@/firebase/admin-init';
import { customerReadable } from '@/lib/customer-access-policy';
import { grantId } from '@/lib/sharing-policy';
import type { UserRole } from '@/lib/rbac';
import { directoryText, mergeAccountDirectory } from '@/lib/director-account-directory';
import { assignmentVersion } from '@/lib/booking-workflow';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const uid = z.string().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/);
const bookingCollection = z.enum(['user_bookings', 'ctv_bookings', 'guest_consultations']);
const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('list'), id: uid.optional() }).strict(),
  z.object({ action: z.literal('export'), ids: z.array(uid).min(1).max(1000) }).strict(),
  z.object({ action: z.literal('manage') }).strict(),
  z.object({ action: z.literal('accounts') }).strict(),
  z.object({ action: z.literal('partners'), id: uid.optional() }).strict(),
  z.object({ action: z.literal('bookings') }).strict(),
  z.object({ action: z.literal('assign-bookings'), bookings: z.array(z.object({ collection: bookingCollection, id: uid,
    expectedAdminUid: uid.nullable(), expectedVersion: z.string().min(1).max(300).optional() }).strict()).min(1).max(100), adminUid: uid.nullable() }).strict(),
  z.object({ action: z.literal('register') }).strict(),
  z.object({ action: z.literal('grant'), customerIds: z.array(uid).min(1).max(100),
    adminIds: z.array(uid).min(1).max(50), operation: z.enum(['add', 'remove']) }).strict(),
]);
class AccessError extends Error { constructor(public status: number, message: string) { super(message); } }
const deny = () => { throw new AccessError(403, 'Không có quyền truy cập.'); };
const profileKeys = ['email', 'displayName', 'phoneNumber', 'photoURL', 'dob', 'gender', 'interests',
  'ctvIntroduction', 'role', 'requestStatus', 'createdAt', 'lastActiveAt'];
function profileView(id: string, data: Record<string, any>, director: boolean, own: boolean, legacy: boolean) {
  const row: Record<string, unknown> = { uid: id, canManage: director || own, canExport: director || own };
  for (const key of profileKeys) {
    if (data[key] === undefined) continue;
    row[key] = ['createdAt', 'lastActiveAt'].includes(key) ? (typeof data[key]?.toMillis === 'function'
      ? { seconds: data[key].seconds, nanoseconds: data[key].nanoseconds } : data[key]) : directoryText(data[key]);
  }
  if (director) row.ownerAdminId = data.ownerAdminId || '';
  return row;
}
export async function POST(request: NextRequest) {
  try {
    const bearer = request.headers.get('authorization');
    if (!bearer?.startsWith('Bearer ')) throw new AccessError(401, 'Vui lòng đăng nhập.');
    let actorUid: string;
    try { actorUid = (await adminAuth.verifyIdToken(bearer.slice(7), true)).uid; }
    catch { throw new AccessError(401, 'Phiên đăng nhập không hợp lệ.'); }
    const input = schema.parse(await request.json());
    const actorRef = adminDb.doc(`users/${actorUid}`);
    const role = (await actorRef.get()).data()?.role as UserRole;
    if (input.action === 'register') {
      if (role !== 'user') deny();
      await adminDb.runTransaction(async tx => {
        const signal = adminDb.doc(`customerRegistrations/${actorUid}`);
        const [profile, previous] = await Promise.all([tx.get(actorRef), tx.get(signal)]);
        if (profile.data()?.role !== 'user') deny();
        if (previous.exists) return;
        tx.set(signal, { registeredAt: FieldValue.serverTimestamp() });
        tx.set(adminDb.doc('customerAccessState/records'), { updatedAt: FieldValue.serverTimestamp() });
      });
      return reply({ success: true });
    }
    if (!['admin', 'director'].includes(role)) deny();
    const director = role === 'director';
    if (input.action === 'export') {
      return reply(await adminDb.runTransaction(async tx => {
        const [actor, profiles] = await Promise.all([tx.get(actorRef), Promise.all([...new Set(input.ids)].map(id => tx.get(adminDb.doc(`users/${id}`))))]);
        if (actor.data()?.role !== role) deny();
        if (profiles.some(s => !s.exists || !(director || s.data()?.ownerAdminId === actorUid) || !director && ['admin', 'director'].includes(s.data()?.role))) deny();
        return { rows: profiles.map(s => profileView(s.id, s.data()!, director, s.data()?.ownerAdminId === actorUid, false)) };
      }));
    }
    if (input.action === 'assign-bookings') {
      if (!director) deny();
      if (new Set(input.bookings.map(b => `${b.collection}/${b.id}`)).size !== input.bookings.length) throw new AccessError(400, 'Danh sách lịch bị trùng.');
      if (input.adminUid) {
        try { if ((await adminAuth.getUser(input.adminUid)).disabled) throw new Error('Disabled'); }
        catch { throw new AccessError(400, 'Admin nhận việc phải có tài khoản đăng nhập đang hoạt động.'); }
      }
      const changedCount = await adminDb.runTransaction(async tx => {
        const [actor, admin, bookings] = await Promise.all([tx.get(actorRef),
          input.adminUid ? tx.get(adminDb.doc(`users/${input.adminUid}`)) : Promise.resolve(null),
          Promise.all(input.bookings.map(b => tx.get(adminDb.doc(`${b.collection}/${b.id}`)))),
        ]);
        if (actor.data()?.role !== 'director') deny();
        if (input.adminUid && admin?.data()?.role !== 'admin') throw new AccessError(400, 'Chỉ phân công lịch dẫn khách cho Admin nội bộ.');
        if (bookings.some(b => !b.exists)) throw new AccessError(404, 'Có lịch không còn tồn tại.');
        if (bookings.some((b, i) => (b.data()?.assignedAdminId || null) !== input.bookings[i].expectedAdminUid)) throw new AccessError(409, 'Phân công đã thay đổi. Tải lại lịch trước khi giao việc.');
        if (bookings.some((b, i) => input.bookings[i].expectedVersion && assignmentVersion(b.data()!) !== input.bookings[i].expectedVersion)) throw new AccessError(409, 'Phân công đã thay đổi. Tải lại lịch trước khi giao việc.');
        const changes = bookings.map((b, i) => ({ path: `${input.bookings[i].collection}/${b.id}`, before: b.data()?.assignedAdminId || null, after: input.adminUid })).filter(c => c.before !== c.after);
        if (!changes.length) return 0;
        for (const c of changes) tx.update(adminDb.doc(c.path), { assignedAdminId: input.adminUid,
          assignedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
        tx.set(adminDb.collection('accessAudit').doc(), { actorUid, action: input.adminUid ? 'booking-work-assign' : 'booking-work-unassign',
          target: changes.map(c => c.path), before: changes.map(c => ({ path: c.path, assignedAdminId: c.before })),
          after: changes.map(c => ({ path: c.path, assignedAdminId: c.after })), createdAt: FieldValue.serverTimestamp() });
        tx.set(adminDb.doc('customerAccessState/records'), { updatedAt: FieldValue.serverTimestamp() });
        return changes.length;
      });
      return reply({ success: true, updatedCount: changedCount, unchangedCount: input.bookings.length - changedCount });
    }
    if (input.action === 'accounts') {
      if (!director) deny();
      const profiles = await adminDb.collection('users').get();
      const authAccounts = []; let pageToken: string | undefined;
      do {
        const page = await adminAuth.listUsers(1000, pageToken);
        authAccounts.push(...page.users); pageToken = page.pageToken;
      } while (pageToken);
      if ((await actorRef.get()).data()?.role !== 'director') deny();
      return reply(mergeAccountDirectory(profiles.docs, authAccounts));
    }
    if (input.action === 'grant') {
      if (!director) deny();
      const customerIds = [...new Set(input.customerIds)], adminIds = [...new Set(input.adminIds)];
      const changedCount = await adminDb.runTransaction(async tx => {
        if ((await tx.get(actorRef)).data()?.role !== 'director') deny();
        const [customers, admins, permissions] = await Promise.all([
          Promise.all(customerIds.map(id => tx.get(adminDb.doc(`users/${id}`)))),
          Promise.all(adminIds.map(id => tx.get(adminDb.doc(`users/${id}`)))),
          Promise.all(customerIds.map(id => tx.get(adminDb.doc(`customerVisibility/${id}`)))),
        ]);
        if (customers.some(s => s.data()?.role !== 'user')) throw new AccessError(400, 'Chỉ chọn hồ sơ khách hàng.');
        if (input.operation === 'add' && admins.some(s => s.data()?.role !== 'admin')) throw new AccessError(400, 'Tài khoản nhận quyền phải là Admin.');
        const changes = permissions.map((s, i) => {
          const before = Array.isArray(s.data()?.adminReaders) ? s.data()!.adminReaders.filter((id: unknown) => typeof id === 'string') : [];
          const after = input.operation === 'add' ? s.data()?.legacy === true ? before : [...new Set([...before, ...adminIds])]
            : before.filter((id: string) => !adminIds.includes(id));
          if (after.length > 50) throw new AccessError(400, 'Tối đa 50 Admin được cấp quyền riêng cho mỗi khách hàng.');
          return { id: customerIds[i], before, after, legacy: s.data()?.legacy === true };
        });
        const changed = changes.filter(c => c.before.length !== c.after.length || c.before.some((uid: string) => !c.after.includes(uid)));
        if (!changed.length) return 0;
        for (const change of changed) tx.set(adminDb.doc(`customerVisibility/${change.id}`), {
          ...permissions[customerIds.indexOf(change.id)].data(),
          legacy: change.legacy, adminReaders: change.after, updatedBy: actorUid,
          updatedAt: FieldValue.serverTimestamp(),
        });
        tx.set(adminDb.collection('accessAudit').doc(), { actorUid, action: `customer-view-${input.operation}`,
          target: changed.map(c => c.id), before: changed.map(c => ({ id: c.id, adminReaders: c.before })),
          after: changed.map(c => ({ id: c.id, adminReaders: c.after })), createdAt: FieldValue.serverTimestamp() });
        tx.set(adminDb.doc('customerAccessState/records'), { updatedAt: FieldValue.serverTimestamp() });
        // Deliberately no notification, email or client announcement.
        return changed.length;
      });
      return reply({ success: true, updatedCount: changedCount, unchangedCount: customerIds.length - changedCount });
    }
    if (input.action === 'bookings') {
      // Use one consistent authority/data snapshot for work assignments and revoked grants.
      const result = await adminDb.runTransaction(async tx => {
      const [fresh, finalGrants, oldAdmins, admins, bookings, frozenBookings, leadPermissions, leadWork] = await Promise.all([tx.get(actorRef),
        tx.get(adminDb.collection('shareGrants').where('recipientUid', '==', actorUid).where('active', '==', true)),
        tx.get(adminDb.doc('accessConfig/legacyAdminAccess')), tx.get(adminDb.collection('users').where('role', '==', 'admin')),
        Promise.all(['user_bookings', 'ctv_bookings', 'guest_consultations'].map(name => tx.get(adminDb.collection(name)))),
        tx.get(adminDb.collection('legacyBookingAccess')), tx.get(adminDb.collection('customerLeadVisibility')), tx.get(adminDb.collection('customerWork')),
      ]);
      if (fresh.data()?.role !== role) deny();
      const owners = new Set(finalGrants.docs.filter(s => s.data().kind === 'bookings').map(s => s.data().ownerAdminId));
      const allBookings = role === 'admin' && oldAdmins.data()?.adminUids?.includes(actorUid) === true;
      const frozenKeys = new Set(frozenBookings.docs.filter(s => s.data().enabled === true).map(s => s.id));
      const leadByKey = new Map(leadPermissions.docs.map(s => [s.id, s.data()]));
      const workByKey = new Map(leadWork.docs.map(s => [s.id, s.data()]));
      const adminNames = new Map(admins.docs.map(s => [s.id, directoryText(s.data().displayName) || directoryText(s.data().email) || 'Admin']));
      const allowedKeys = ['apartmentId', 'apartmentCode', 'apartmentLink', 'clientName', 'clientPhone', 'ctvName', 'ctvPhone',
        'name', 'phone', 'dateTime', 'budget', 'consultationPrice', 'status', 'isExternal', 'createdAt', 'updatedAt'];
      const rows = bookings.flatMap((snapshot, index) => snapshot.docs.flatMap(s => {
        const data = s.data(), own = data.ownerAdminId === actorUid, assigned = data.assignedAdminId === actorUid;
        const leadKey = `${['user_bookings', 'ctv_bookings', 'guest_consultations'][index]}~${s.id}`;
        const lead = leadByKey.get(leadKey), leadAssigned = workByKey.get(leadKey)?.assignedAdminId === actorUid;
        const leadRead = lead?.legacy === true || Array.isArray(lead?.adminReaders) && lead.adminReaders.includes(actorUid) || leadAssigned;
        if (!director && !(allBookings && frozenKeys.has(leadKey)) && !leadRead && !own && !assigned && !owners.has(data.ownerAdminId)) return [];
        const row: Record<string, unknown> = { id: s.id, collection: ['user_bookings', 'ctv_bookings', 'guest_consultations'][index], type: index === 0 ? data.isExternal === true ? 'external' : 'user' : index === 1 ? 'ctv' : 'guest',
          canManage: director || own || assigned, canDelete: director || own, isAssignedToMe: assigned,
          assignedAdminId: data.assignedAdminId || null, assignedAdminName: data.assignedAdminId ? adminNames.get(data.assignedAdminId) || 'Admin không còn hoạt động' : '' };
        for (const key of [...allowedKeys, ...(director || own || assigned ? ['notes', 'adminNotes', 'userId', 'ctvId'] : []), ...(director ? ['ownerAdminId', 'createdByAdminId', 'assignedAt'] : [])]) {
          if (data[key] !== undefined) row[key] = ['createdAt', 'updatedAt', 'assignedAt'].includes(key)
            ? typeof data[key]?.toMillis === 'function' ? { seconds: data[key].seconds, nanoseconds: data[key].nanoseconds } : data[key]
            : key === 'isExternal' ? data[key] === true : directoryText(data[key]);
        }
        if (director) row.assignmentVersion = assignmentVersion(data);
        return [row];
      }));
      return { rows, ...(director ? { admins: admins.docs.map(s => ({ uid: s.id, displayName: directoryText(s.data().displayName) || directoryText(s.data().email) || 'Admin', email: directoryText(s.data().email) })) } : {}) };
      });
      return reply(result);
    }
    if (input.action === 'manage' && !director) deny();
    const profiles = (input.action === 'list' || input.action === 'partners') && input.id ? [await adminDb.doc(`users/${input.id}`).get()]
      : (await adminDb.collection('users').get()).docs;
    if (input.action === 'partners') {
      if ((await actorRef.get()).data()?.role !== role) deny();
      const partners = profiles.filter(s => s.data() && !['admin', 'director'].includes(s.data()!.role)
        && ['pending', 'approved', 'rejected'].includes(s.data()!.landlordApprovalStatus)).map(s => {
        const data = s.data()!, application = data.landlordRequestData || {}, submittedAt = data.landlordRequestSubmittedAt;
        return { id: s.id, email: data.email || '', role: data.role, status: data.landlordApprovalStatus,
          displayName: application.displayName || '', phoneNumber: application.phoneNumber || '', district: application.district || '', message: application.message || '',
          submittedAt: submittedAt ? { seconds: submittedAt.seconds, nanoseconds: submittedAt.nanoseconds } : null };
      });
      if (input.id && !partners.length) deny();
      return reply({ partners });
    }
    // Re-read all authority before responding; no profile fields are exposed through metadata.
    const [permissions, freshActor, grants, baseline, oldAdmins, customerWork] = await Promise.all([
      adminDb.collection('customerVisibility').get(), actorRef.get(),
      director ? Promise.resolve(null) : adminDb.collection('shareGrants').where('recipientUid', '==', actorUid).where('active', '==', true).get(),
      director ? adminDb.doc('accessConfig/customerLegacy').get() : Promise.resolve(null),
      adminDb.doc('accessConfig/legacyAdminAccess').get(),
      adminDb.collection('customerWork').get(),
    ]);
    if (freshActor.data()?.role !== role) deny();
    const byId = new Map(permissions.docs.map(s => [s.id, s.data()]));
    const workById = new Map(customerWork.docs.map(s => [s.id, s.data()]));
    if (input.action === 'manage') return reply({
      customers: profiles.filter(s => s.data()?.role === 'user').map(s => ({ ...profileView(s.id, s.data()!, true, false, false),
        legacy: byId.get(s.id)?.legacy === true, adminReaders: Array.isArray(byId.get(s.id)?.adminReaders) ? byId.get(s.id)!.adminReaders.filter((id: unknown) => typeof id === 'string') : [] })),
      admins: profiles.filter(s => s.data()?.role === 'admin').map(s => ({ uid: s.id, displayName: directoryText(s.data()?.displayName) || s.id, email: directoryText(s.data()?.email) })),
      baselineReady: baseline?.data()?.status === 'complete',
      legacyAdminAccess: oldAdmins.data()?.status === 'complete' ? oldAdmins.data()?.adminUids || [] : [],
    });
    const activeGrantIds = new Set(grants?.docs.map(s => s.id) || []);
    const rows = [];
    for (const s of profiles) {
      const data = s.data(); if (!data) continue;
      const own = data.ownerAdminId === actorUid;
      const visible = director || customerReadable(role, actorUid, data, { ...byId.get(s.id), assignedAdminId: workById.get(`users~${s.id}`)?.assignedAdminId })
        || (data.role === 'collaborator' && (oldAdmins.data()?.adminUids?.includes(actorUid) === true || own || activeGrantIds.has(grantId(data.ownerAdminId || '', 'collaborators', actorUid))))
        || data.role === 'landlord';
      if (!visible || (!director && data.role === 'director')) continue;
      rows.push(profileView(s.id, data, director, own, byId.get(s.id)?.legacy === true && data.role === 'user'));
    }
    if (input.action === 'list' && input.id && !rows.length) deny();
    return reply({ rows });
  } catch (e) {
    const status = e instanceof AccessError ? e.status : e instanceof z.ZodError ? 400 : 500;
    return reply({ error: e instanceof AccessError ? e.message : status === 400 ? 'Dữ liệu không hợp lệ.' : 'Không thể tải dữ liệu.' }, status);
  }
}
function reply(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store, max-age=0', Vary: 'Authorization' } });
}
