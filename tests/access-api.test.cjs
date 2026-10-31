const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-typescript.cjs');
const { planOwnership } = require('../scripts/access-migration-plan.cjs');
const { ROLE_PERMISSIONS, isAdmin, hasMinimumRole } = load('src/lib/rbac.ts');
const DELETE = Symbol('delete');
let records, nextId, authPages, authCalls;
function ref(path) {
  return { path, id: path.split('/').at(-1), get: async () => snapshot(path) };
}
function snapshot(path) {
  const data = records.get(path);
  return { exists: !!data, id: path.split('/').at(-1), ref: ref(path), createTime: { seconds: 1792717200 }, data: () => data ? structuredClone(data) : undefined };
}
function collection(path, filters = [], order = null, maximum = Infinity) {
  return { doc: id => ref(`${path}/${id || `generated_${++nextId}`}`),
    where: (key, op, value) => { assert.equal(op, '=='); return collection(path, [...filters, [key, value]], order, maximum); },
    orderBy: (key, direction) => collection(path, filters, [key, direction], maximum),
    limit: maximum => collection(path, filters, order, maximum),
    get: async () => ({ docs: [...records.keys()].filter(p => p.startsWith(`${path}/`) && p.split('/').length === 2)
      .filter(p => filters.every(([k, v]) => records.get(p)[k] === v))
      .sort((a, b) => order ? (records.get(b)[order[0]]?.seconds || 0) - (records.get(a)[order[0]]?.seconds || 0) : 0).slice(0, maximum).map(snapshot) }) };
}
const adminDb = { doc: ref, collection,
  runTransaction: async callback => {
    const writes = []; let writing = false;
    const tx = { get: async target => { assert.equal(writing, false, 'Firestore transactions require all reads before writes'); return target.get(); },
      set: (target, data) => { writing = true; writes.push([target.path, data, false]); },
      update: (target, data) => { writing = true; writes.push([target.path, data, true]); } };
    const result = await callback(tx);
    for (const [path, patch, merge] of writes) {
      const data = merge ? { ...records.get(path) } : {};
      for (const [key, value] of Object.entries(patch)) { if (value === DELETE) delete data[key]; else data[key] = value; }
      records.set(path, data);
    }
    return result;
  },
};
const mocks = {
  '@/firebase/admin-init': { adminDb, adminAuth: { verifyIdToken: async (token, revoked) => {
    assert.equal(revoked, true); if (!records.has(`users/${token}`)) throw new Error('invalid'); return { uid: token };
  }, getUser: async uid => { if (!records.has(`users/${uid}`)) throw new Error('Missing Auth account'); return { uid, disabled: records.get(`users/${uid}`).disabled === true }; }, listUsers: async (limit, pageToken) => {
    assert.equal(limit, 1000); authCalls.push(pageToken);
    return authPages[pageToken ? 1 : 0] || { users: [...records.keys()].filter(p => p.startsWith('users/')).map(p => ({ uid: p.split('/')[1] })) };
  } } },
  'firebase-admin/firestore': { FieldValue: { serverTimestamp: () => 'server-time', delete: () => DELETE } },
};
const { POST } = load('src/app/api/access/route.ts', mocks);
const customerPost = load('src/app/api/customer-access/route.ts', mocks).POST;
const operationsPost = load('src/app/api/operations/route.ts', mocks).POST;
async function operationsCall(uid, body) {
  const response = await operationsPost(new Request('http://localhost/api/operations', { method: 'POST', headers: uid ? { Authorization: `Bearer ${uid}`, 'Content-Type': 'application/json' } : {}, body: JSON.stringify(body) }));
  assert.match(response.headers.get('Cache-Control'), /no-store/);
  return { status: response.status, body: await response.json() };
}
async function customerCall(uid, body) {
  const response = await customerPost(new Request('http://localhost/api/customer-access', {method: 'POST', headers: {Authorization: `Bearer ${uid}`, 'Content-Type': 'application/json'}, body: JSON.stringify(body)}));
  assert.match(response.headers.get('Cache-Control'), /no-store/);
  return {status: response.status, body: await response.json()};
}
async function call(uid, body) {
  const response = await POST(new Request('http://localhost/api/access', { method: 'POST',
    headers: uid ? { Authorization: `Bearer ${uid}`, 'Content-Type': 'application/json' } : {}, body: JSON.stringify(body) }));
  assert.match(response.headers.get('Cache-Control'), /no-store/);
  return { status: response.status, body: await response.json() };
}
beforeEach(() => {
  nextId = 0; authPages = []; authCalls = []; records = new Map(Object.entries({
    'users/director': { role: 'director' }, 'users/admin_a': { role: 'admin' }, 'users/admin_b': { role: 'admin' },
    'users/viewer': { role: 'user' }, 'users/other': { role: 'user' },
    'users/customer_a': { role: 'user', ownerAdminId: 'admin_a', phoneNumber: '0901234567' },
    'users/ctv_a': { role: 'collaborator', ownerAdminId: 'admin_a' },
    'apartments/apt': { submissionStatus: 'published', ownerAdminId: 'admin_a', landlordPhoneNumber: 'DISPLAY' },
    'landlordContacts/apartments~apt': { phone: 'PRIVATE_PHONE' },
    'user_bookings/a': { ownerAdminId: 'admin_a', userId: 'customer_a', name: 'Customer', adminNotes: 'INTERNAL' },
    'user_bookings/b': { ownerAdminId: 'admin_b', userId: 'other', name: 'Other' },
  }));
});

test('director directory includes all Auth pages and orphan profiles without inferring missing roles', async () => {
  records.set('users/missing_role', { displayName: 'Incomplete' });
  authPages = [{ users: [{ uid: 'director' }, { uid: 'auth_only', email: 'auth@example.test', displayName: 'Auth only' }], pageToken: 'next' },
    { users: [{ uid: 'customer_a', email: 'customer@example.test' }] }];
  assert.equal((await customerCall('admin_a', { action: 'accounts' })).status, 403);
  assert.equal(authCalls.length, 0);
  const result = await customerCall('director', { action: 'accounts' });
  assert.equal(result.status, 200); assert.equal(result.body.counts.authentication, 3);
  assert.equal(result.body.counts.profiles, 8); assert.equal(result.body.counts.total, 9);
  assert.equal(result.body.counts.withoutProfile, 1); assert.equal(result.body.counts.withoutAuth, 6);
  assert.equal(result.body.accounts.find(a => a.uid === 'auth_only').role, 'unclassified');
  assert.equal(result.body.accounts.find(a => a.uid === 'missing_role').role, 'unclassified');
  assert.deepEqual(authCalls, [undefined, 'next']);
  assert.ok(!JSON.stringify(result).includes('PRIVATE_PHONE'));
});

test('frozen existing admins see only frozen old schedules and all CTV, never automatically future customer schedules', async () => {
  records.set('accessConfig/legacyAdminAccess', { status: 'complete', adminUids: ['admin_b'] });
  records.set('user_bookings/unassigned', { name: 'Unassigned', adminNotes: 'SECRET' });
  records.set('ctv_bookings/future', { ownerAdminId: 'admin_a', clientName: 'Later schedule' });
  records.set('users/unowned_ctv', { role: 'collaborator' });
  records.set('users/future_customer', { role: 'user', createdAt: { seconds: 0 } });
  records.set('legacyBookingAccess/user_bookings~a', { enabled: true });
  records.set('legacyBookingAccess/user_bookings~unassigned', { enabled: true });
  const schedules = await customerCall('admin_b', { action: 'bookings' });
  assert.equal(schedules.body.rows.length, 3);
  assert.ok(!schedules.body.rows.some(r => r.id === 'future'));
  assert.equal(schedules.body.rows.find(r => r.id === 'unassigned').canManage, false);
  assert.ok(!JSON.stringify(schedules).includes('SECRET'));
  assert.equal((await customerCall('admin_b', { action: 'list', id: 'ctv_a' })).status, 200);
  assert.equal((await customerCall('admin_b', { action: 'list', id: 'unowned_ctv' })).status, 200);
  assert.equal((await call('admin_b', { action: 'shared', ownerAdminId: 'admin_a', kind: 'collaborators', id: 'ctv_a', collection: 'users' })).body.rows.length, 1);
  assert.equal((await customerCall('admin_a', { action: 'list', id: 'unowned_ctv' })).status, 403);
  assert.equal((await customerCall('admin_b', { action: 'list', id: 'future_customer' })).status, 403);
  assert.equal((await call('admin_b', { action: 'phone-read', collection: 'apartments', id: 'apt' })).status, 403);
  assert.equal((await call('admin_b', { action: 'role', uid: 'unowned_ctv', role: 'user' })).status, 403);
  assert.equal((await call('admin_b', { action: 'assign', collection: 'users', id: 'unowned_ctv', ownerAdminId: 'admin_b' })).status, 403);
  records.set('users/admin_b', { role: 'user' });
  assert.equal((await customerCall('admin_b', { action: 'bookings' })).status, 403);
});
test('director inherits each admin permission and hierarchy', () => {
  for (const permission of ROLE_PERMISSIONS.admin) assert.ok(ROLE_PERMISSIONS.director.includes(permission));
  assert.ok(isAdmin('director')); assert.ok(hasMinimumRole('director', 'admin')); assert.ok(!hasMinimumRole('admin', 'director'));
});

async function prepared(operation, keys, adminIds = ['admin_b']) {
  const result = await operationsCall('director', { action: 'preview', operation, adminIds, selection: { mode: 'ids', keys } });
  assert.equal(result.status, 200, JSON.stringify(result.body)); return result.body;
}
async function applyPrepared(plan, offset = 0) {
  const result = await operationsCall('director', { action: 'apply', jobId: plan.jobId, offset });
  assert.equal(result.status, 200, JSON.stringify(result.body)); return result.body;
}
test('customer operations authorize ID and filtered pages; linked accounts do not duplicate booking customers', async () => {
  records.set('ctv_bookings/lead', { ownerAdminId: 'admin_a', ctvId: 'ctv_a', clientName: 'Nguồn CTV', clientPhone: '0901234567' });
  for (const uid of ['admin_b', 'ctv_a', 'viewer']) assert.equal((await operationsCall(uid, { action: 'detail', key: 'users~customer_a' })).status, 403);
  assert.equal((await operationsCall(null, { action: 'customers' })).status, 401);
  const result = await operationsCall('director', { action: 'customers', pageSize: 1 });
  assert.equal(result.status, 200); assert.equal(result.body.rows.length, 1);
  assert.ok(result.body.total > 1);
  const all = await operationsCall('director', { action: 'customers', pageSize: 100 });
  assert.ok(!all.body.rows.some(c => c.key === 'user_bookings~a'));
  assert.deepEqual(all.body.rows.find(c => c.key === 'users~customer_a').bookingKeys, ['user_bookings/a']);
  assert.ok(all.body.rows.some(c => c.key === 'ctv_bookings~lead'));
  assert.ok(!JSON.stringify(all).includes('PRIVATE_PHONE'));
  const scoped = await operationsCall('admin_a', { action: 'customers', filters: { assignedAdminId: 'admin_b' } });
  assert.deepEqual(scoped.body.rows, []); // Client filters never enlarge authority.
});
test('assigning customers is distinct from schedule assignment, ownership, referral and read-only shares', async () => {
  const source = structuredClone(records.get('users/customer_a'));
  const plan = await prepared('assign', ['users~customer_a']);
  assert.equal((await operationsCall('admin_b', { action: 'detail', key: 'users~customer_a' })).status, 403); // Preview grants nothing.
  const done = await applyPrepared(plan); assert.equal(done.changed, 1);
  assert.deepEqual(records.get('users/customer_a'), source);
  assert.equal(records.get('user_bookings/a').assignedAdminId, undefined);
  const assigned = await operationsCall('admin_b', { action: 'detail', key: 'users~customer_a' });
  assert.equal(assigned.status, 200); assert.equal(assigned.body.customer.canProcess, true);
  assert.equal(assigned.body.customer.canManage, false); assert.equal(assigned.body.customer.canExport, false);
  assert.equal((await customerCall('admin_b', { action: 'list', id: 'customer_a' })).status, 200);
  assert.equal((await operationsCall('admin_b', { action: 'work-update', key: 'users~customer_a', revision: 1, status: 'in_progress' })).status, 200);
  await applyPrepared(await prepared('assign', ['users~customer_a'], ['admin_a']));
  assert.equal((await operationsCall('admin_b', { action: 'detail', key: 'users~customer_a' })).status, 403);
  assert.equal((await operationsCall('admin_b', { action: 'work-update', key: 'users~customer_a', revision: 3, status: 'completed' })).status, 403);
  assert.equal((await operationsCall('admin_a', { action: 'detail', key: 'users~customer_a' })).status, 200);
  assert.deepEqual(records.get('users/customer_a'), source);
  assert.ok([...records.keys()].some(p => p.startsWith('accessAudit/')));
  assert.ok(![...records.keys()].some(p => p.startsWith('notifications/')));
});
test('legacy view is not processing/export; grants and revocation keep independent owner/assignee rights', async () => {
  records.set('customerVisibility/customer_a', { legacy: true, baselineId: 'frozen', adminReaders: [] });
  let detail = await operationsCall('admin_b', { action: 'detail', key: 'users~customer_a' });
  assert.equal(detail.status, 200); assert.equal(detail.body.customer.canProcess, false); assert.equal(detail.body.customer.canExport, false);
  const grant = await applyPrepared(await prepared('grant', ['users~customer_a']));
  assert.equal(grant.changed, 0); assert.deepEqual(records.get('customerVisibility/customer_a').adminReaders, []);
  assert.equal((await operationsCall('admin_b', { action: 'work-update', key: 'users~customer_a', revision: 0, status: 'completed' })).status, 403);
  records.set('customerVisibility/customer_a', { legacy: false, adminReaders: [] });
  await applyPrepared(await prepared('grant', ['users~customer_a']));
  detail = await operationsCall('admin_b', { action: 'detail', key: 'users~customer_a' });
  assert.equal(detail.status, 200); assert.equal(detail.body.customer.canProcess, false);
  assert.equal(detail.body.customer.adminReaders, undefined);
  await applyPrepared(await prepared('revoke', ['users~customer_a']));
  assert.equal((await operationsCall('admin_b', { action: 'detail', key: 'users~customer_a' })).status, 403);
  assert.equal((await operationsCall('admin_a', { action: 'detail', key: 'users~customer_a' })).status, 200);
});
test('bulk across pages freezes verified matches, leaves later customers untouched and is idempotent by offset', async () => {
  for (let i = 0; i < 113; i++) records.set(`users/bulk_${i}`, { role: 'user', displayName: `Batch ${i}`, ownerAdminId: 'admin_a' });
  const page = await operationsCall('director', { action: 'customers', filters: { search: 'Batch' }, pageSize: 25 });
  assert.equal(page.body.total, 113); assert.equal(page.body.rows.length, 25);
  const preview = await operationsCall('director', { action: 'preview', operation: 'assign', adminIds: ['admin_b'], selection: { mode: 'filter', filters: { search: 'Batch' } } });
  assert.equal(preview.status, 200); assert.equal(preview.body.total, 113);
  records.set('users/later', { role: 'user', displayName: 'Batch later' });
  const first = await applyPrepared(preview.body); assert.equal(first.processed, 50);
  const auditCount = [...records.keys()].filter(p => p.startsWith('accessAudit/')).length;
  assert.deepEqual(await applyPrepared(preview.body), first);
  assert.equal([...records.keys()].filter(p => p.startsWith('accessAudit/')).length, auditCount);
  const second = await applyPrepared(preview.body, 50); assert.equal(second.processed, 100);
  const third = await applyPrepared(preview.body, 100); assert.equal(third.processed, 113); assert.equal(third.done, true);
  assert.equal([...records.keys()].filter(p => p.startsWith('customerWork/')).length, 113);
  assert.ok(!records.has('customerWork/users~later'));
});
test('bulk optimistic version, stale filters and invalid IDs prevent writes; completed earlier chunks remain inspectable', async () => {
  const plan = await prepared('assign', ['users~customer_a']);
  records.set('customerWork/users~customer_a', { assignedAdminId: 'admin_a', revision: 4 });
  assert.equal((await operationsCall('director', { action: 'apply', jobId: plan.jobId, offset: 0 })).status, 409);
  assert.equal(records.get('customerWork/users~customer_a').revision, 4);
  const other = await operationsCall('director', { action: 'preview', operation: 'assign', adminIds: ['admin_b'], selection: { mode: 'filter', filters: { assignedAdminId: 'admin_a' } } });
  records.set('customerWork/users~customer_a', { assignedAdminId: null, revision: 5 });
  assert.equal((await operationsCall('director', { action: 'apply', jobId: other.body.jobId, offset: 0 })).status, 409);
  assert.equal((await operationsCall('director', { action: 'preview', operation: 'assign', adminIds: ['admin_b'], selection: { mode: 'ids', keys: ['users~missing'] } })).status, 409);
  assert.equal((await operationsCall('director', { action: 'detail', key: '../landlordContacts~apt' })).status, 400);
});
test('no admin/CTV may forge bulk jobs or approvers, assign inactive/external targets, or apply another director job', async () => {
  for (const uid of ['admin_a', 'ctv_a', 'viewer']) {
    assert.equal((await operationsCall(uid, { action: 'preview', operation: 'assign', adminIds: ['admin_b'], selection: { mode: 'ids', keys: ['users~customer_a'] } })).status, 403);
    assert.equal((await operationsCall(uid, { action: 'dashboard' })).status, 403);
  }
  assert.equal((await operationsCall('director', { action: 'preview', operation: 'assign', adminIds: ['ctv_a'], selection: { mode: 'ids', keys: ['users~customer_a'] } })).status, 400);
  records.set('users/admin_b', { role: 'admin', disabled: true });
  assert.equal((await operationsCall('director', { action: 'preview', operation: 'grant', adminIds: ['admin_b'], selection: { mode: 'ids', keys: ['users~customer_a'] } })).status, 400);
  const forged = await operationsCall('director', { action: 'preview', operation: 'assign', adminIds: ['admin_a'], approvedBy: 'director', selection: { mode: 'ids', keys: ['users~customer_a'] } });
  assert.equal(forged.status, 400);
  const plan = await prepared('assign', ['users~customer_a'], ['admin_a']); records.set('users/another_director', { role: 'director' });
  assert.equal((await operationsCall('another_director', { action: 'apply', jobId: plan.jobId, offset: 0 })).status, 403);
});
test('customer creator and trusted CTV source are preserved; forged creator/legacy/assignment fields rejected', async () => {
  const created = await operationsCall('admin_a', { action: 'create-customer', displayName: 'Khách mới', phoneNumber: '0901234567', referralCtvId: 'ctv_a', interests: 'Hai phòng ngủ' });
  assert.equal(created.status, 200);
  const row = records.get(created.body.key.replace('~', '/'));
  assert.equal(row.ownerAdminId, 'admin_a'); assert.equal(row.createdByAdminId, 'admin_a'); assert.equal(row.referralCtvId, 'ctv_a');
  assert.equal((await operationsCall('admin_b', { action: 'detail', key: created.body.key })).status, 403);
  await applyPrepared(await prepared('assign', [created.body.key]));
  assert.equal((await operationsCall('admin_b', { action: 'detail', key: created.body.key })).status, 200);
  assert.deepEqual(records.get(created.body.key.replace('~', '/')), row);
  assert.equal((await operationsCall('admin_b', { action: 'create-customer', displayName: 'Khách mới', phoneNumber: '0901234567', referralCtvId: 'ctv_a' })).status, 403);
  assert.equal((await operationsCall('admin_a', { action: 'create-customer', displayName: 'Khách mới', phoneNumber: '0901234567', ownerAdminId: 'admin_b', legacy: true })).status, 400);
});
test('dashboard has real denominators, and export is authorized again by server rather than client flags', async () => {
  records.set('accessConfig/customerLegacy', { status: 'complete', capturedAt: '2026-10-12T00:00:00.000Z' });
  records.set('customerWork/users~customer_a', { assignedAdminId: 'admin_b', revision: 1, status: 'in_progress' });
  const result = await operationsCall('director', { action: 'dashboard' });
  assert.equal(result.status, 200); assert.equal(result.body.total, result.body.accounts + result.body.leads);
  assert.equal(result.body.processing, 1); assert.equal(result.body.admins.find(a => a.uid === 'admin_b').customers, 1);
  assert.equal((await customerCall('admin_b', { action: 'export', ids: ['customer_a'] })).status, 403);
  assert.equal((await customerCall('admin_a', { action: 'export', ids: ['customer_a'] })).status, 200);
  const exported = await customerCall('director', { action: 'export', ids: ['customer_a'] }); assert.equal(exported.status, 200); assert.ok(!JSON.stringify(exported).includes('PRIVATE_PHONE'));
});
test('migration uses only SDK creation metadata; missing dates and linked profiles never get guessed', () => {
  const { planLegacyLeads } = require('../scripts/operations-legacy-plan.cjs');
  const records = [
    { collection: 'ctv_bookings', id: 'old', data: { createdAt: '2099-01-01' }, createTime: '2026-10-01T00:00:00Z' },
    { collection: 'guest_consultations', id: 'missing', data: { createdAt: '2000-01-01', legacy: true } },
    { collection: 'ctv_bookings', id: 'new', data: { createdAt: '2000-01-01' }, createTime: '2026-10-23T00:00:00Z' },
    { collection: 'user_bookings', id: 'linked', data: { userId: 'customer_a' }, createTime: '2026-10-01T00:00:00Z' },
  ];
  const plan = planLegacyLeads(records, '2026-10-12T00:00:00Z', new Set(['customer_a']));
  assert.deepEqual(plan.eligible.map(e => e.key), ['ctv_bookings~old']);
  assert.deepEqual(plan.unresolved, ['guest_consultations~missing']); assert.deepEqual(plan.current, ['ctv_bookings~new']);
  assert.deepEqual(plan.bookings.map(e => e.key), ['ctv_bookings~old', 'user_bookings~linked']);
  assert.deepEqual(planLegacyLeads(records, '2026-10-12T00:00:00Z', new Set(['customer_a'])), plan);
});
test('select all accepts exclusions across pages, and stale recipients may only have existing rights removed', async () => {
  for (let i = 0; i < 54; i++) records.set(`users/filtered_${i}`, { role: 'user', displayName: `Filtered ${i}` });
  const preview = await operationsCall('director', { action: 'preview', operation: 'grant', adminIds: ['admin_b'], selection: { mode: 'filter', filters: { search: 'Filtered' }, excludeKeys: ['users~filtered_0', 'users~filtered_53'] } });
  assert.equal(preview.status, 200); assert.equal(preview.body.total, 52);
  await applyPrepared(preview.body); await applyPrepared(preview.body, 50);
  assert.equal(records.has('customerVisibility/filtered_0'), false); assert.equal(records.has('customerVisibility/filtered_53'), false);
  assert.equal([...records.keys()].filter(p => p.startsWith('customerVisibility/filtered_')).length, 52);
  records.delete('users/admin_b');
  const revoke = await prepared('revoke', ['users~filtered_1']); await applyPrepared(revoke);
  assert.deepEqual(records.get('customerVisibility/filtered_1').adminReaders, []);
  assert.deepEqual(records.get('customerVisibility/filtered_2').adminReaders, ['admin_b']);
});
test('partial failure preserves earlier committed progress and a repeat completed request never re-applies assignments', async () => {
  for (let i = 0; i < 51; i++) records.set(`users/partial_${i}`, { role: 'user', displayName: `Partial ${i}` });
  const preview = await operationsCall('director', { action: 'preview', operation: 'assign', adminIds: ['admin_b'], selection: { mode: 'filter', filters: { search: 'Partial' } } });
  const first = await applyPrepared(preview.body); assert.equal(first.processed, 50);
  records.set('users/partial_50', { role: 'collaborator' });
  assert.equal((await operationsCall('director', { action: 'apply', jobId: preview.body.jobId, offset: 50 })).status, 409);
  assert.equal(records.get(`operationsBulk/${preview.body.jobId}`).processed, 50);
  assert.equal([...records.keys()].filter(p => p.startsWith('customerWork/')).length, 50);
  const done = await prepared('assign', ['users~customer_a']); await applyPrepared(done);
  records.set('users/admin_b', { role: 'admin', disabled: true });
  assert.equal((await operationsCall('director', { action: 'apply', jobId: done.jobId, offset: 0 })).status, 200);
});
test('bulk jobs do not retain search PII and fail safely if matching contact information changes after preview', async () => {
  records.set('users/customer_a', { ...records.get('users/customer_a'), displayName: 'PRIVATE_CUSTOMER_NAME' });
  const preview = await operationsCall('director', { action: 'preview', operation: 'assign', adminIds: ['admin_b'], selection: { mode: 'filter', filters: { search: '0901234567' } } });
  assert.equal(preview.status, 200);
  const jobData = JSON.stringify([...records].filter(([p]) => p.startsWith('operationsBulk/')));
  assert.ok(!jobData.includes('0901234567')); assert.ok(!jobData.includes('PRIVATE_CUSTOMER_NAME'));
  records.set('users/customer_a', { ...records.get('users/customer_a'), phoneNumber: '0900000000' });
  assert.equal((await operationsCall('director', { action: 'apply', jobId: preview.body.jobId, offset: 0 })).status, 409);
  assert.equal(records.has('customerWork/users~customer_a'), false);
});
test('ID token required; client authority and forged approver are rejected', async () => {
  assert.equal((await call(null, { action: 'overview' })).status, 401);
  assert.equal((await call('invalid', { action: 'overview' })).status, 401);
  assert.equal((await call('viewer', { action: 'grant', ownerAdminId: 'admin_a', kind: 'bookings', recipients: ['viewer'] })).status, 403);
  assert.equal((await call('admin_a', { action: 'grant', ownerAdminId: 'admin_a', kind: 'bookings', recipients: ['viewer'], reviewedBy: 'director' })).status, 400);
});
test('only director reads/writes actual phone; no cache or private logging', async () => {
  for (const uid of ['admin_a', 'viewer', 'ctv_a']) {
    const read = await call(uid, { action: 'phone-read', collection: 'apartments', id: 'apt' });
    assert.equal(read.status, 403); assert.ok(!JSON.stringify(read).includes('PRIVATE_PHONE'));
    assert.equal((await call(uid, { action: 'phone-write', collection: 'apartments', id: 'apt', phone: '0909999999' })).status, 403);
  }
  assert.equal((await call('director', { action: 'phone-read', collection: 'apartments', id: 'apt' })).body.phone, 'PRIVATE_PHONE');
  assert.equal((await call('director', { action: 'phone-write', collection: 'apartments', id: 'apt', phone: '0909999999' })).status, 200);
  assert.equal(records.get('apartments/apt').landlordPhoneNumber, 'DISPLAY');
  const log = JSON.stringify([...records].filter(([p]) => p.startsWith('accessAudit/')));
  assert.ok(!log.includes('PRIVATE_PHONE')); assert.ok(!log.includes('0909999999'));
  assert.equal((await call('director', { action: 'phone-read', collection: 'apartments', id: 'missing' })).body.phone, '');
});
test('admins see own managed data; other admin and unapproved viewer denied by ID', async () => {
  const values = { action: 'shared', ownerAdminId: 'admin_a', kind: 'bookings', id: 'a', collection: 'user_bookings' };
  assert.equal((await call('admin_a', values)).body.rows.length, 1);
  assert.equal((await call('director', values)).body.rows.length, 1);
  assert.equal((await call('admin_b', values)).status, 403);
  assert.equal((await call('viewer', values)).status, 403);
});
test('pending and rejected requests give no access; admin cannot approve', async () => {
  records.set('shareRequests/pending', { ownerAdminId: 'admin_a', kind: 'bookings', proposedRecipients: ['viewer'], status: 'pending' });
  const request = [...records].find(([path]) => path.startsWith('shareRequests/'));
  const id = request[0].split('/')[1];
  assert.equal((await call('viewer', { action: 'shared', ownerAdminId: 'admin_a', kind: 'bookings' })).status, 403);
  assert.equal((await call('admin_a', { action: 'review', id, decision: 'approved', recipients: ['viewer'] })).status, 403);
  assert.equal((await call('director', { action: 'review', id, decision: 'rejected', recipients: [] })).status, 200);
  assert.equal((await call('viewer', { action: 'shared', ownerAdminId: 'admin_a', kind: 'bookings' })).status, 403);
  assert.equal((await call('director', { action: 'review', id, decision: 'approved', recipients: ['viewer'] })).status, 409);
});
test('approval can change recipients; exact recipient, owner and kind boundaries', async () => {
  records.set('shareRequests/pending', { ownerAdminId: 'admin_a', kind: 'bookings', proposedRecipients: ['other'], status: 'pending' });
  const id = [...records.keys()].find(p => p.startsWith('shareRequests/')).split('/')[1];
  assert.equal((await call('director', { action: 'review', id, decision: 'approved', recipients: ['admin_b'] })).status, 200);
  const values = { action: 'shared', ownerAdminId: 'admin_a', kind: 'bookings' };
  const view = await call('admin_b', values);
  assert.equal(view.body.rows.length, 1); assert.ok(!JSON.stringify(view).includes('INTERNAL'));
  assert.equal((await call('other', values)).status, 403);
  assert.equal((await call('viewer', { ...values, ownerAdminId: 'admin_b' })).status, 403);
  assert.equal((await call('admin_b', { ...values, kind: 'customers' })).status, 403);
  assert.equal((await call('admin_b', { ...values, id: 'b', collection: 'user_bookings' })).body.rows.length, 0);
  assert.equal(records.get(`shareRequests/${id}`).reviewedBy, 'director');
});

test('schedule shares accept only internal admins, including approval and historical grant reads', async () => {
  const grant = { action: 'grant', ownerAdminId: 'admin_a', kind: 'bookings', recipients: ['ctv_a'] };
  assert.equal((await call('director', grant)).status, 400);
  assert.equal((await call('director', { ...grant, recipients: ['viewer'] })).status, 400);
  assert.equal((await call('director', { ...grant, recipients: ['admin_b'] })).status, 200);
  records.set('shareRequests/external', { status: 'pending', ownerAdminId: 'admin_a', kind: 'bookings', proposedRecipients: ['ctv_a'] });
  assert.equal((await call('director', { action: 'review', id: 'external', decision: 'approved', recipients: ['ctv_a'] })).status, 400);
  assert.equal(records.get('shareRequests/external').status, 'pending');
  records.set('shareGrants/admin_a~bookings~ctv_a', { active: true, ownerAdminId: 'admin_a', recipientUid: 'ctv_a', kind: 'bookings' });
  assert.equal((await call('ctv_a', { action: 'shared', ownerAdminId: 'admin_a', kind: 'bookings', id: 'a', collection: 'user_bookings' })).status, 403);
  assert.equal((await call('director', { action: 'request', kind: 'bookings', recipients: ['ctv_a'], note: 'Test' })).status, 400);
});

test('history is director-only, limited and never exposes note/private values from audit content', async () => {
  for (let i = 0; i < 60; i++) records.set(`accessAudit/event_${i}`, { actorUid: 'director', action: 'phone-update', target: 'landlordContacts/apartments~apt',
    before: { phone: 'PRIVATE_VALUE' }, after: { note: 'PRIVATE_NOTE' }, createdAt: { seconds: i } });
  for (const uid of ['admin_a', 'ctv_a', 'viewer']) assert.equal((await call(uid, { action: 'history' })).status, 403);
  const result = await call('director', { action: 'history' });
  assert.equal(result.body.events.length, 50); assert.equal(result.body.events[0].id, 'event_59');
  assert.ok(!JSON.stringify(result).includes('PRIVATE_VALUE')); assert.ok(!JSON.stringify(result).includes('PRIVATE_NOTE'));
});

test('director can remove stale rights for a former or deleted admin without granting external accounts', async () => {
  records.set('customerVisibility/customer_a', { legacy: false, adminReaders: ['ctv_a', 'deleted_admin'] });
  const mutation = { action: 'grant', customerIds: ['customer_a'], adminIds: ['ctv_a', 'deleted_admin'], operation: 'remove' };
  assert.equal((await customerCall('admin_a', mutation)).status, 403);
  assert.equal((await customerCall('director', { ...mutation, operation: 'add' })).status, 400);
  assert.equal((await customerCall('director', mutation)).body.updatedCount, 1);
  assert.deepEqual(records.get('customerVisibility/customer_a').adminReaders, []);
  records.set('customerVisibility/other', { legacy: false, adminReaders: 'admin_b accidental string' });
  assert.equal((await customerCall('admin_b', { action: 'list', id: 'other' })).status, 403);
});

test('unchanged grants and assignments do not reset assignment time, write audit or invalidate readers; version catches ABA changes', async () => {
  const initial = { action: 'assign-bookings', adminUid: 'admin_b', bookings: [{ collection: 'user_bookings', id: 'a', expectedAdminUid: null }] };
  assert.equal((await customerCall('director', initial)).body.updatedCount, 1);
  const first = records.get('user_bookings/a');
  const saved = { ...initial, bookings: [{ ...initial.bookings[0], expectedAdminUid: 'admin_b', expectedVersion: 'admin_b@server-time' }] };
  const unchanged = await customerCall('director', saved);
  assert.equal(unchanged.body.updatedCount, 0); assert.equal(unchanged.body.unchangedCount, 1);
  assert.equal(records.get('user_bookings/a').assignedAt, first.assignedAt);
  assert.equal([...records.keys()].filter(p => p.startsWith('accessAudit/')).length, 1);
  records.set('user_bookings/a', { ...first, assignedAt: { seconds: 10, nanoseconds: 1 } });
  assert.equal((await customerCall('director', saved)).status, 409);
  const grant = { action: 'grant', customerIds: ['customer_a'], adminIds: ['admin_b'], operation: 'add' };
  assert.equal((await customerCall('director', grant)).body.updatedCount, 1);
  assert.equal((await customerCall('director', grant)).body.updatedCount, 0);
  assert.equal([...records.keys()].filter(p => p.startsWith('accessAudit/')).length, 2);
});

test('director assigns individual schedules to admins without changing ownership or granting customer profiles', async () => {
  const action = { action: 'assign-bookings', adminUid: 'admin_b', bookings: [{ collection: 'user_bookings', id: 'a', expectedAdminUid: null }] };
  assert.equal((await customerCall('admin_a', action)).status, 403);
  assert.equal((await customerCall('ctv_a', action)).status, 403);
  assert.equal((await customerCall('director', { ...action, adminUid: 'ctv_a' })).status, 400);
  assert.equal((await customerCall('director', { ...action, adminUid: 'missing' })).status, 400);
  records.set('users/disabled_admin', { role: 'admin', disabled: true });
  assert.equal((await customerCall('director', { ...action, adminUid: 'disabled_admin' })).status, 400);
  assert.equal((await customerCall('director', { ...action, assignedBy: 'admin_a' })).status, 400);
  assert.equal((await customerCall('director', { ...action, bookings: [action.bookings[0], action.bookings[0]] })).status, 400);
  assert.equal((await customerCall('director', { ...action, bookings: [action.bookings[0], { collection: 'ctv_bookings', id: 'missing', expectedAdminUid: null }] })).status, 404);
  assert.ok(!records.get('user_bookings/a').assignedAdminId); // Invalid bulk request must not partially assign valid rows.
  assert.equal((await customerCall('director', action)).status, 200);
  const stored = records.get('user_bookings/a');
  assert.equal(stored.ownerAdminId, 'admin_a'); assert.equal(stored.assignedAdminId, 'admin_b'); assert.ok(!('assignedBy' in stored));
  const rows = (await customerCall('admin_b', { action: 'bookings' })).body.rows;
  const assigned = rows.find(r => r.id === 'a'); assert.equal(assigned.canManage, true); assert.equal(assigned.canDelete, false);
  assert.equal(assigned.adminNotes, 'INTERNAL'); assert.equal(assigned.isAssignedToMe, true); assert.ok(!JSON.stringify(assigned).includes('director'));
  assert.equal((await customerCall('admin_b', { action: 'list', id: 'customer_a' })).status, 403);
  assert.equal([...records.keys()].filter(p => p.startsWith('notifications/')).length, 0);
  assert.equal((await customerCall('director', { ...action, adminUid: null })).status, 409);
  assert.equal((await customerCall('director', { ...action, adminUid: null, bookings: [{ ...action.bookings[0], expectedAdminUid: 'admin_b' }] })).status, 200);
  assert.ok(!(await customerCall('admin_b', { action: 'bookings' })).body.rows.some(r => r.id === 'a'));
  assert.equal([...records.keys()].filter(p => p.startsWith('accessAudit/')).length, 2);
  assert.ok([...records].filter(([p]) => p.startsWith('accessAudit/')).every(([, d]) => d.actorUid === 'director'));
});
test('per-customer grants are quiet, read-only and revocable', async () => {
  records.set('users/new_customer', { role: 'user' });
  const grant = { action: 'grant', customerIds: ['new_customer'], adminIds: ['admin_b'], operation: 'add' };
  assert.equal((await customerCall('admin_a', grant)).status, 403);
  assert.equal((await customerCall('director', grant)).status, 200);
  const row = (await customerCall('admin_b', { action: 'list', id: 'new_customer' })).body.rows[0];
  assert.equal(row.canManage, false); assert.equal(row.canExport, false);
  assert.equal((await call('admin_b', { action: 'assign', collection: 'users', id: 'new_customer', ownerAdminId: 'admin_b' })).status, 403);
  assert.equal((await call('admin_b', { action: 'role', uid: 'new_customer', role: 'admin' })).status, 403);
  assert.equal([...records.keys()].filter(p => p.startsWith('notifications/')).length, 0);
  await customerCall('director', { ...grant, operation: 'remove' });
  assert.equal((await customerCall('admin_b', { action: 'list', id: 'new_customer' })).status, 403);
});
test('no self elevation, no admin changing director, audited legitimate role changes', async () => {
  assert.equal((await call('admin_a', { action: 'role', uid: 'admin_a', role: 'director' })).status, 403);
  assert.equal((await call('admin_a', { action: 'role', uid: 'director', role: 'user' })).status, 403);
  assert.equal((await call('admin_a', { action: 'role', uid: 'customer_a', role: 'director' })).status, 403);
  assert.equal((await call('admin_a', { action: 'role', uid: 'customer_a', role: 'collaborator' })).status, 200);
  assert.equal((await call('director', { action: 'role', uid: 'admin_b', role: 'director' })).status, 200);
  assert.equal(records.get('users/admin_b').role, 'director');
  assert.equal([...records.keys()].filter(p => p.startsWith('accessAudit/')).length, 2);
});
test('only director assigns unowned records; new owner must be a trusted admin', async () => {
  records.set('users/unowned', { role: 'user' });
  const assignment = { action: 'assign', collection: 'users', id: 'unowned', ownerAdminId: 'admin_a' };
  assert.equal((await call('admin_a', assignment)).status, 403);
  assert.equal((await call('director', { ...assignment, ownerAdminId: 'viewer' })).status, 400);
  assert.equal((await call('director', assignment)).status, 200);
  assert.equal(records.get('users/unowned').ownerAdminId, 'admin_a');
});
test('migration never infers ownership/phone; rerunnable reviewed mapping, conflicts protected', () => {
  const records = [{ collection: 'users', id: 'a', data: { role: 'user', createdByAdminId: 'admin_a' } },
    { collection: 'apartments', id: 'apt', data: { landlordPhoneNumber: 'DISPLAY' } }];
  const admins = new Set(['admin_a']);
  assert.equal(planOwnership(records, admins).changes.length, 0);
  assert.equal(planOwnership(records, admins).unresolved.length, 2);
  const mapping = [{ collection: 'users', id: 'a', ownerAdminId: 'admin_a', evidence: 'Reviewed by operator' }];
  const planned = planOwnership(records, admins, mapping);
  assert.equal(planned.changes.length, 1); assert.ok(!JSON.stringify(planned).includes('DISPLAY'));
  records[0].data.ownerAdminId = 'admin_a';
  assert.equal(planOwnership(records, admins, mapping).changes.length, 0);
  assert.equal(planOwnership(records, admins, [{ ...mapping[0], ownerAdminId: 'different' }]).conflicts.length, 1);
  assert.throws(() => planOwnership(records, admins, [{ ...mapping[0], id: 'missing' }]));
});

test('every admin sees frozen legacy customers; new customers and director identities stay private', async () => {
  records.set('users/legacy', {role:'user', email:'legacy@example.com'});
  records.set('customerVisibility/legacy', {legacy:true, adminReaders:[]});
  records.set('users/new', {role:'user', createdAt:{seconds:1}, landlordApprovalStatus:'pending', landlordRequestData:{displayName:'Application'}, interests:'PRIVATE_CUSTOMER_NOTE'});
  for(const uid of ['admin_a','admin_b']) {
    assert.equal((await customerCall(uid, {action:'list', id:'legacy'})).status, 200);
    assert.equal((await customerCall(uid, {action:'list', id:'new'})).status, 403);
    assert.equal((await customerCall(uid, {action:'list', id:'director'})).status, 403);
    const result=await customerCall(uid, {action:'list'});
    assert.ok(!JSON.stringify(result).includes('director'));
    assert.equal((await call(uid, {action:'overview'})).status, 403);
    assert.equal((await customerCall(uid, {action:'manage'})).status, 403);
    const partners=await customerCall(uid, {action:'partners'});
    assert.ok(!JSON.stringify(partners).includes('PRIVATE_CUSTOMER_NOTE'));
  }
});
test('bulk grants apply only to explicit customers and valid admins, never to future signups', async () => {
  records.set('users/new_a', {role:'user'}); records.set('users/new_b', {role:'user'});
  const grant={action:'grant', customerIds:['new_a','new_b'], adminIds:['admin_b'], operation:'add'};
  assert.equal((await customerCall('director', grant)).body.updatedCount, 2);
  records.set('users/future', {role:'user', createdAt:{seconds:1}});
  assert.equal((await customerCall('admin_b', {action:'list', id:'future'})).status, 403);
  assert.equal((await customerCall('director', {...grant, adminIds:['viewer']})).status, 400);
  assert.equal((await customerCall('director', {...grant, customerIds:['director']})).status, 400);
  assert.equal((await call('director', {action:'grant', ownerAdminId:'admin_a', kind:'customers', recipients:['admin_b']})).status, 400);
});
test('approved booking scopes are available in the normal admin screen with no management authority', async () => {
  const grant = { action: 'grant', ownerAdminId: 'admin_a', kind: 'bookings', recipients: ['admin_b'] };
  await call('director', grant);
  const response = await customerCall('admin_b', { action: 'bookings' });
  const shared = response.body.rows.find(row => row.id === 'a');
  assert.equal(shared.canManage, false); assert.ok(!('ownerAdminId' in shared)); assert.ok(!('adminNotes' in shared));
  await call('director', { ...grant, recipients: [] });
  assert.ok(!(await customerCall('admin_b', { action: 'bookings' })).body.rows.some(row => row.id === 'a'));
  assert.equal([...records.keys()].filter(p => p.startsWith('notifications/')).length, 0);
});
test('admin menus never expose access management or the shared view', () => {
  const policy=load('src/lib/customer-access-policy.ts');
  assert.equal(policy.showAccessManagement('admin'), false);
  assert.equal(policy.showSharedMenu('admin'), false);
  assert.equal(policy.showAccessManagement('director'), true);
  assert.deepEqual(policy.freezeLegacyCustomerIds([{id:'old',role:'user'},{id:'staff',role:'director'},{id:'ctv',role:'collaborator'}]), ['old']);
});
test('grants preserve frozen baseline identity and registrations never announce or approve customers', async () => {
  records.set('customerVisibility/customer_a', { legacy: true, adminReaders: [], baselineId: 'frozen-baseline' });
  await customerCall('director', { action: 'grant', customerIds: ['customer_a'], adminIds: ['admin_b'], operation: 'add' });
  assert.equal(records.get('customerVisibility/customer_a').baselineId, 'frozen-baseline');
  assert.equal(records.get('customerVisibility/customer_a').legacy, true);
  assert.deepEqual(records.get('customerVisibility/customer_a').adminReaders, []);
  assert.equal((await customerCall('viewer', { action: 'register' })).status, 200);
  assert.equal((await customerCall('viewer', { action: 'register' })).status, 200);
  assert.equal((await customerCall('admin_a', { action: 'list', id: 'viewer' })).status, 403);
  assert.equal((await customerCall('viewer', { action: 'register', uid: 'other' })).status, 400);
  assert.equal([...records.keys()].filter(p => p.startsWith('notifications/')).length, 0);
});
