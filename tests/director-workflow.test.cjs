const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-typescript.cjs');
const { createRefreshQueue } = load('src/lib/refresh-queue.ts');
const { filterWorkBookings, workLoad, assignmentPreview, bookingSlot, workDate } = load('src/lib/booking-workflow.ts');
const { mergeAccountDirectory } = load('src/lib/director-account-directory.ts');
const defer = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
test('refresh bursts coalesce before execution and never start concurrent reads', async () => {
  const tasks = [], first = defer(), second = defer(), received = []; let reads = 0;
  const queue = createRefreshQueue(() => (++reads === 1 ? first : second).promise, { data: v => received.push(v), error: assert.fail }, cb => tasks.push(cb));
  const a = queue.request(), b = queue.request(), c = queue.request();
  assert.equal(tasks.length, 1); tasks[0](); assert.equal(reads, 1);
  const d = queue.request(true), e = queue.request(true); assert.equal(reads, 1);
  first.resolve('outdated'); await Promise.resolve(); await Promise.resolve(); assert.equal(reads, 2);
  second.resolve('fresh'); await Promise.all([a, b, c, d, e]); assert.deepEqual(received, ['fresh']); queue.dispose();
});
test('disposed refresh queue skips cancelled mounts and ignores old-account data/errors', async () => {
  const tasks = []; let reads = 0;
  const cancelled = createRefreshQueue(async () => { reads++; }, { data: assert.fail, error: assert.fail }, cb => tasks.push(cb));
  const pending = cancelled.request(); cancelled.dispose(); tasks[0](); await pending; assert.equal(reads, 0);
  const response = defer(), old = createRefreshQueue(() => response.promise, { data: assert.fail, error: assert.fail });
  const read = old.request(); await Promise.resolve(); old.dispose(); response.reject(new Error('old account')); await read; await Promise.resolve();
});
test('refresh errors settle waiters and permit a later retry', async () => {
  const errors = [], values = []; let attempts = 0;
  const queue = createRefreshQueue(async () => { if (!attempts++) throw new Error('permission denied'); return 'current'; }, { data: v => values.push(v), error: e => errors.push(e.message) });
  await queue.request(); assert.deepEqual(errors, ['permission denied']); await queue.request(); assert.deepEqual(values, ['current']); queue.dispose();
});
const now = new Date('2026-10-12T10:00:00Z');
const rows = [
  { collection: 'user_bookings', id: 'closed', status: 'contacted', dateTime: '2026-10-12T09:00', assignedAdminId: 'a' },
  { collection: 'ctv_bookings', id: 'ctv', status: 'pending', dateTime: '2026-10-12T10:00', clientName: 'Đặng Thị Hà', assignedAdminId: 'a', type: 'ctv' },
  { collection: 'user_bookings', id: 'late', status: 'approved', dateTime: '2026-10-11T15:00', assignedAdminId: 'a' },
  { collection: 'guest_consultations', id: 'future', status: 'pending', dateTime: '2026-10-13T10:00', assignedAdminId: null },
];
const filters = { search: '', assignment: 'all', status: 'open', day: 'all', source: 'all', adminUid: '' };
test('assignment filters prioritize appointment dates, hide closed schedules and support Vietnamese search and overdue dates', () => {
  assert.deepEqual(filterWorkBookings(rows, filters, now).map(b => b.id), ['late', 'ctv', 'future']);
  assert.equal(filterWorkBookings(rows, { ...filters, search: 'dang thi ha' }, now)[0].id, 'ctv');
  assert.deepEqual(filterWorkBookings(rows, { ...filters, day: 'overdue' }, now).map(b => b.id), ['late']);
  assert.deepEqual(filterWorkBookings(rows, { ...filters, day: 'today', adminUid: 'a' }, now).map(b => b.id), ['ctv']);
  assert.deepEqual(workLoad(rows, 'a', now), { active: 2, today: 1, overdue: 1 });
});
test('business time uses client timezone and invalid dates never become scheduling conflicts', () => {
  assert.equal(workDate(new Date('2026-10-12T20:00:00Z')), '2026-10-13');
  assert.deepEqual(bookingSlot({ dateTime: '2026-10-12T20:00:00Z' }), { day: '2026-10-13', time: '03:00' });
  assert.deepEqual(bookingSlot({ dateTime: '2026-02-30T10:00' }), { day: '', time: '' });
  assert.deepEqual(bookingSlot({ dateTime: '2026-10-12T25:00' }), { day: '', time: '' });
});
test('assignment preview excludes closed/no-op rows, includes hidden selections and flags exact time collisions', () => {
  const incoming = { collection: 'user_bookings', id: 'new', status: 'pending', dateTime: '2026-10-12T10:00' };
  const all = [...rows, incoming];
  const plan = assignmentPreview(all, ['user_bookings/closed', 'ctv_bookings/ctv', 'user_bookings/new', 'user_bookings/missing'], 'a', all);
  assert.equal(plan.changes.length, 1); assert.equal(plan.closed, 1); assert.equal(plan.unchanged, 1); assert.equal(plan.missing, 1); assert.equal(plan.conflicts, 1);
});
test('malformed profile names/roles do not break the director directory or infer customer privileges', () => {
  const result = mergeAccountDirectory([{ id: 'bad', data: () => ({ displayName: { unsafe: true }, role: { admin: true }, email: 123 }) }], [{ uid: 'bad', displayName: 'Auth name', email: 'valid@example.test' }]);
  assert.equal(result.accounts[0].displayName, 'Auth name'); assert.equal(result.accounts[0].role, 'unclassified'); assert.equal(result.counts.customers, 0);
});

test('duplicate contact warning recognizes local/international phone formats without merging or blocking legitimate visits', () => {
  const a = { collection: 'user_bookings', id: 'a', status: 'pending', phone: '0901234567' };
  const b = { collection: 'ctv_bookings', id: 'b', status: 'approved', clientPhone: '+84 901 234 567' };
  const plan = assignmentPreview([a, b], ['user_bookings/a'], 'admin', [a, b]);
  assert.equal(plan.duplicateContacts, 1); assert.equal(plan.changes.length, 1); assert.ok(!a.assignedAdminId);
});
