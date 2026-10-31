import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { adminAuth, adminDb } from '@/firebase/admin-init';
import { canChangeRole, grantId, SHARE_KINDS, sharedView } from '@/lib/sharing-policy';
import type { UserRole } from '@/lib/rbac';
import { directoryText } from '@/lib/director-account-directory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const uidSchema = z.string().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/);
const idSchema = z.string().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/);
const kindSchema = z.enum(SHARE_KINDS);
const recipientsSchema = z.array(uidSchema).max(50).transform(values => [...new Set(values)]);
const managedCollections = ['users', 'user_bookings', 'ctv_bookings', 'guest_consultations',
  'apartments', 'short_term_apartments'] as const;
const bodySchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('overview') }).strict(),
  z.object({ action: z.literal('history') }).strict(),
  z.object({ action: z.literal('request'), kind: kindSchema, recipients: recipientsSchema,
    note: z.string().trim().min(1).max(1000) }).strict(),
  z.object({ action: z.literal('review'), id: idSchema, decision: z.enum(['approved', 'rejected']),
    recipients: recipientsSchema }).strict(),
  z.object({ action: z.literal('grant'), ownerAdminId: uidSchema, kind: kindSchema,
    recipients: recipientsSchema }).strict(),
  z.object({ action: z.literal('shared'), ownerAdminId: uidSchema, kind: kindSchema,
    id: idSchema.optional(), collection: z.enum(managedCollections).optional() }).strict(),
  z.object({ action: z.literal('phone-read'), collection: z.enum(['apartments', 'short_term_apartments']), id: idSchema }).strict(),
  z.object({ action: z.literal('phone-write'), collection: z.enum(['apartments', 'short_term_apartments']), id: idSchema,
    phone: z.string().trim().max(20).refine(v => v === '' || /^[0-9+() \-]{8,20}$/.test(v)) }).strict(),
  z.object({ action: z.literal('role'), uid: uidSchema,
    role: z.enum(['user', 'collaborator', 'landlord', 'admin', 'director']),
    approveLandlord: z.boolean().optional() }).strict(),
  z.object({ action: z.literal('assign'), collection: z.enum(managedCollections), id: idSchema,
    ownerAdminId: uidSchema }).strict(),
  z.object({ action: z.literal('unassigned'), collection: z.enum(managedCollections) }).strict(),
]);
class AccessError extends Error { constructor(public status: number, message: string) { super(message); } }
const denied = () => { throw new AccessError(403, 'Không có quyền truy cập.'); };
function audit(actor: string, action: string, target: string, before: unknown, after: unknown) {
  return { actorUid: actor, action, target, before, after, createdAt: FieldValue.serverTimestamp() };
}

export async function POST(request: NextRequest) {
  try {
    const bearer = request.headers.get('authorization');
    if (!bearer?.startsWith('Bearer ')) throw new AccessError(401, 'Vui lòng đăng nhập.');
    let actorUid: string;
    try { actorUid = (await adminAuth.verifyIdToken(bearer.slice(7), true)).uid; }
    catch { throw new AccessError(401, 'Phiên đăng nhập không hợp lệ.'); }
    const input = bodySchema.parse(await request.json());
    // Every operation re-reads authority. Mutations also re-read it inside their transaction.
    const actorRef = adminDb.doc(`users/${actorUid}`);
    const actor = (await actorRef.get()).data();
    if (!actor) denied();
    const role = actor!.role as UserRole;
    const staff = role === 'admin' || role === 'director';
    const director = role === 'director';
    if (input.action === 'history') {
      if (!director) denied();
      const events = await adminDb.collection('accessAudit').orderBy('createdAt', 'desc').limit(50).get();
      if ((await actorRef.get()).data()?.role !== 'director') denied();
      return reply({ events: events.docs.map(s => {
        const event = s.data();
        return { id: s.id, actorUid: event.actorUid || '', action: event.action || '',
          count: Array.isArray(event.target) ? event.target.length : 1,
          target: Array.isArray(event.target) ? event.target.filter((v: unknown) => typeof v === 'string') : typeof event.target === 'string' ? [event.target] : [],
          createdAt: typeof event.createdAt?.seconds === 'number' && Number.isFinite(new Date(event.createdAt.seconds * 1000).getTime()) ? { seconds: event.createdAt.seconds, nanoseconds: event.createdAt.nanoseconds || 0 } : null };
      }) });
    }

    if (input.action === 'overview') {
      if (!director) denied();
      const requestsQuery = director ? adminDb.collection('shareRequests')
        : adminDb.collection('shareRequests').where('ownerAdminId', '==', actorUid);
      const grantsQuery = director ? adminDb.collection('shareGrants')
        : adminDb.collection('shareGrants').where(staff ? 'ownerAdminId' : 'recipientUid', '==', actorUid);
      const [requests, grants, accounts, legacyAdmins] = await Promise.all([
        staff ? requestsQuery.get() : Promise.resolve(null), grantsQuery.get(),
        staff ? adminDb.collection('users').get() : Promise.resolve(null),
        adminDb.doc('accessConfig/legacyAdminAccess').get(),
      ]);
      // Admins get only a minimal account picker; no customer/CTV profile data outside their scope.
      const picker = accounts?.docs.map(s => ({ uid: s.id, label: directoryText(s.data().displayName) || directoryText(s.data().email) || s.id,
        email: directoryText(s.data().email), role: directoryText(s.data().role) || 'unclassified' })) || [];
      if ((await actorRef.get()).data()?.role !== role) denied();
      return reply({ requests: requests?.docs.map(s => ({ ...s.data(), id: s.id })) || [],
        grants: grants.docs.map(s => ({ ...s.data(), id: s.id })), accounts: picker,
        legacyAdminAccess: legacyAdmins.data()?.status === 'complete' ? legacyAdmins.data()?.adminUids || [] : [] });
    }

    if (input.action === 'shared') {
      if (input.kind === 'bookings' && !staff) denied();
      const collections = input.kind === 'bookings' ? ['user_bookings', 'ctv_bookings', 'guest_consultations'] : ['users'];
      const ref = adminDb.doc(`shareGrants/${grantId(input.ownerAdminId, input.kind, actorUid)}`);
      await adminDb.runTransaction(async tx => {
        const freshActor = (await tx.get(actorRef)).data();
        if (input.kind === 'bookings' && !['admin', 'director'].includes(freshActor?.role)) denied();
        const grant = (await tx.get(ref)).data();
        const legacy = (await tx.get(adminDb.doc('accessConfig/legacyAdminAccess'))).data();
        if (!(freshActor?.role === 'director' || (freshActor?.role === 'admin' && input.ownerAdminId === actorUid)
          || (freshActor?.role === 'admin' && input.kind === 'collaborators' && legacy?.adminUids?.includes(actorUid) === true)
          || grant?.active === true)) denied();
      });
      const rows: Record<string, unknown>[] = [];
      if (input.id && (!input.collection || !collections.includes(input.collection))) denied();
      for (const collection of collections) {
        const query = adminDb.collection(collection).where('ownerAdminId', '==', input.ownerAdminId);
        const docs = input.id ? (collection === input.collection ? [await adminDb.doc(`${collection}/${input.id}`).get()] : [])
          : (await (collection === 'users' ? query.where('role', '==', input.kind === 'collaborators' ? 'collaborator' : 'user') : query).get()).docs;
        for (const s of docs) {
          const data = s.data();
          if (!data || data.ownerAdminId !== input.ownerAdminId) continue;
          if (collection === 'users' && data.role !== (input.kind === 'collaborators' ? 'collaborator' : 'user')) continue;
          if (input.kind === 'customers' && role !== 'director') {
            const permission = (await adminDb.doc(`customerVisibility/${s.id}`).get()).data();
            if (permission?.legacy !== true && !(role === 'admin' && data.ownerAdminId === actorUid)) continue;
          }
          rows.push(sharedView(s.id, collection, data));
        }
      }
      // Recheck after reads so a concurrent revocation cannot authorize a later response.
      const [freshActor, freshGrant, legacy] = await Promise.all([actorRef.get(), ref.get(), adminDb.doc('accessConfig/legacyAdminAccess').get()]);
      if (input.kind === 'bookings' && !['admin', 'director'].includes(freshActor.data()?.role)) denied();
      if (!(freshActor.data()?.role === 'director' || (freshActor.data()?.role === 'admin' && input.ownerAdminId === actorUid)
        || (freshActor.data()?.role === 'admin' && input.kind === 'collaborators' && legacy.data()?.adminUids?.includes(actorUid) === true)
        || freshGrant.data()?.active === true)) denied();
      return reply({ rows });
    }

    if (input.action === 'phone-read') {
      if (!director) denied();
      const s = await adminDb.doc(`landlordContacts/${input.collection}~${input.id}`).get();
      if ((await actorRef.get()).data()?.role !== 'director') denied();
      return reply({ phone: s.data()?.phone || '' });
    }

    if (input.action === 'unassigned') {
      if (!director) denied();
      const docs = await adminDb.collection(input.collection).get();
      if ((await actorRef.get()).data()?.role !== 'director') denied();
      return reply({ rows: docs.docs.filter(s => !s.data().ownerAdminId
        && !(input.collection === 'users' && ['admin', 'director'].includes(s.data().role))).map(s => ({ id: s.id,
        label: s.data().title || s.data().displayName || s.data().name || s.data().clientName || s.id,
        role: s.data().role || null })) });
    }

    const auditRef = adminDb.collection('accessAudit').doc();
    await adminDb.runTransaction(async tx => {
      const freshActor = (await tx.get(actorRef)).data();
      const currentRole = freshActor?.role as UserRole;
      const isDirector = currentRole === 'director';
      const isStaff = isDirector || currentRole === 'admin';
      if (!isStaff) denied();

      if (input.action === 'phone-write') {
        if (!isDirector) denied();
        const apartment = await tx.get(adminDb.doc(`${input.collection}/${input.id}`));
        if (!apartment.exists) throw new AccessError(404, 'Không tìm thấy căn hộ.');
        const contactRef = adminDb.doc(`landlordContacts/${input.collection}~${input.id}`);
        tx.set(contactRef, { phone: input.phone, updatedBy: actorUid, updatedAt: FieldValue.serverTimestamp() });
        // Never log old or new phone values.
        tx.set(auditRef, audit(actorUid, 'phone-update', contactRef.path, null, { updated: true }));
        return;
      }
      if (input.action === 'role') {
        const targetRef = adminDb.doc(`users/${input.uid}`);
        const target = (await tx.get(targetRef)).data();
        if (!target) throw new AccessError(404, 'Không tìm thấy tài khoản.');
        const landlordRequest = target.landlordApprovalStatus === 'pending' && input.role === 'landlord' && input.approveLandlord === true;
        if (!canChangeRole(currentRole, actorUid, input.uid, target.role, input.role, target.ownerAdminId, landlordRequest)) denied();
        if (input.approveLandlord && input.role !== 'landlord') denied();
        tx.update(targetRef, { role: input.role, requestStatus: FieldValue.delete(),
          ...(input.approveLandlord ? { landlordApprovalStatus: 'approved' } : {}) });
        tx.set(adminDb.doc('customerAccessState/records'), { updatedAt: FieldValue.serverTimestamp() });
        tx.set(auditRef, audit(actorUid, 'role-change', targetRef.path, { role: target.role }, { role: input.role }));
        return;
      }
      if (input.action === 'assign') {
        if (!isDirector) denied();
        const owner = (await tx.get(adminDb.doc(`users/${input.ownerAdminId}`))).data();
        if (!['admin', 'director'].includes(owner?.role)) throw new AccessError(400, 'Chủ sở hữu phải là Admin hoặc Giám đốc.');
        const targetRef = adminDb.doc(`${input.collection}/${input.id}`);
        const target = (await tx.get(targetRef)).data();
        if (!target) throw new AccessError(404, 'Không tìm thấy bản ghi.');
        if (input.collection === 'users' && ['director', 'admin'].includes(target.role)) denied();
        if (target.ownerAdminId) throw new AccessError(409, 'Bản ghi đã có chủ quản lý. Dùng phân công công việc để giữ nguyên nguồn tạo.');
        tx.update(targetRef, { ownerAdminId: input.ownerAdminId });
        tx.set(adminDb.doc('customerAccessState/records'), { updatedAt: FieldValue.serverTimestamp() });
        tx.set(auditRef, audit(actorUid, 'owner-assign', targetRef.path,
          { ownerAdminId: target.ownerAdminId || null }, { ownerAdminId: input.ownerAdminId }));
        return;
      }
      if (input.action === 'request') {
        if (!isDirector) denied();
        if (input.kind === 'customers') throw new AccessError(400, 'Chọn khách hàng cụ thể ở khu vực Khách hàng.');
        // Admin can only propose sharing their own lists; recipients must exist.
        const targets = await Promise.all(input.recipients.map(uid => tx.get(adminDb.doc(`users/${uid}`))));
        if (!input.recipients.length || targets.some(s => !s.exists)) throw new AccessError(400, 'Chọn tài khoản hợp lệ.');
        if (input.kind === 'bookings' && targets.some(s => s.data()?.role !== 'admin')) throw new AccessError(400, 'Lịch dẫn khách chỉ được chia sẻ cho Admin nội bộ.');
        const ref = adminDb.collection('shareRequests').doc();
        tx.set(ref, { ownerAdminId: actorUid, kind: input.kind, proposedRecipients: input.recipients,
          note: input.note, status: 'pending', createdAt: FieldValue.serverTimestamp() });
        tx.set(adminDb.doc('customerAccessState/records'), { updatedAt: FieldValue.serverTimestamp() });
        tx.set(auditRef, audit(actorUid, 'share-request', ref.path, null, { kind: input.kind, recipients: input.recipients }));
        return;
      }
      if (input.action === 'review' || input.action === 'grant') {
        if (!isDirector) denied();
        const requestRef = input.action === 'review' ? adminDb.doc(`shareRequests/${input.id}`) : null;
        const pending = requestRef ? (await tx.get(requestRef)).data() : null;
        if (requestRef && (!pending || pending.status !== 'pending')) throw new AccessError(409, 'Đề nghị đã được xử lý hoặc không tồn tại.');
        const owner = input.action === 'grant' ? input.ownerAdminId : pending!.ownerAdminId;
        const kind = input.action === 'grant' ? input.kind : kindSchema.parse(pending!.kind);
        if (kind === 'customers' && !(input.action === 'review' && input.decision === 'rejected')) {
          throw new AccessError(400, 'Quyền khách hàng cần cấp theo từng khách hàng.');
        }
        const ownerDoc = (await tx.get(adminDb.doc(`users/${owner}`))).data();
        if (!['admin', 'director'].includes(ownerDoc?.role)) throw new AccessError(400, 'Admin sở hữu không hợp lệ.');
        const rejected = input.action === 'review' && input.decision === 'rejected';
        const old = await tx.get(adminDb.collection('shareGrants').where('ownerAdminId', '==', owner).where('kind', '==', kind).where('active', '==', true));
        const targets = await Promise.all(input.recipients.map(uid => tx.get(adminDb.doc(`users/${uid}`))));
        if (!rejected && targets.some(s => !s.exists)) throw new AccessError(400, 'Tài khoản được cấp quyền không tồn tại.');
        if (!rejected && kind === 'bookings' && targets.some(s => s.data()?.role !== 'admin')) throw new AccessError(400, 'Lịch dẫn khách chỉ được chia sẻ cho Admin nội bộ.');
        const previous = old.docs.filter(s => s.data().active).map(s => s.data().recipientUid);
        if (!rejected) {
          // Replace the exact recipient list, atomically revoke removed recipients.
          for (const s of old.docs) tx.update(s.ref, { active: false, updatedBy: actorUid, updatedAt: FieldValue.serverTimestamp() });
          for (const uid of input.recipients) tx.set(adminDb.doc(`shareGrants/${grantId(owner, kind, uid)}`), {
            ownerAdminId: owner, kind, recipientUid: uid, active: true,
            updatedBy: actorUid, updatedAt: FieldValue.serverTimestamp(),
          });
        }
        if (requestRef) tx.update(requestRef, { status: input.action === 'review' ? input.decision : 'approved',
          approvedRecipients: rejected ? [] : input.recipients, reviewedBy: actorUid, reviewedAt: FieldValue.serverTimestamp() });
        tx.set(adminDb.doc('customerAccessState/records'), { updatedAt: FieldValue.serverTimestamp() });
        tx.set(auditRef, audit(actorUid, rejected ? 'share-rejected' : input.action === 'review' ? 'share-approved' : 'share-replaced',
          `${owner}/${kind}`, { recipients: previous }, { recipients: rejected ? previous : input.recipients,
            requestId: requestRef?.id || null }));
      }
    });
    return reply({ success: true });
  } catch (error) {
    // No request bodies, private values, credential errors or document contents in logs.
    const status = error instanceof AccessError ? error.status : error instanceof z.ZodError ? 400 : 500;
    return reply({ error: error instanceof AccessError ? error.message : status === 400 ? 'Dữ liệu yêu cầu không hợp lệ.' : 'Không thể xử lý yêu cầu.' }, status);
  }
}
function reply(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store, max-age=0', Vary: 'Authorization' } });
}
