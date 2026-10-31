const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { patchDirectorNotifications } = require('../scripts/notification-director-patch.cjs');
const original = fs.readFileSync('tests/fixtures/notification-functions-2026-10-12.cjs', 'utf8');

function runtime(code) {
  const users = new Map([['admin_a', { role: 'admin' }], ['director', { role: 'director' }], ['ctv', { role: 'collaborator' }], ['user', { role: 'user' }]]);
  const notifications = [];
  const db = { collection(name) {
    if (name === 'notifications') return { add: async data => { notifications.push(data); return { id: String(notifications.length) }; } };
    assert.equal(name, 'users');
    return { doc: uid => ({ get: async () => ({ data: () => users.get(uid) }) }), where: (field, op, value) => {
      assert.equal(field, 'role'); assert.ok(['==', 'in'].includes(op));
      return { get: async () => { const docs = [...users].filter(([, data]) => op === 'in' ? value.includes(data.role) : data.role === value).map(([id]) => ({ id })); return { docs, size: docs.length }; } };
    } };
  } };
  class HttpsError extends Error { constructor(code, message) { super(message); this.code = code; } }
  const admin = { apps: [], initializeApp() { const app = { name: 'emulated-test' }; this.apps.push(app); return app; }, firestore: Object.assign(() => db, { FieldValue: { serverTimestamp: () => 'server-time' } }) };
  const mocks = { 'firebase-admin': admin, 'firebase-functions/v2/https': { HttpsError, onCall: (options, handler) => ({ options, run: handler }) }, 'firebase-functions/params': { defineSecret: () => ({ value: () => { throw new Error('AI secret must not be read'); } }) } };
  const module = { exports: {} };
  new Function('require', 'exports', 'module', 'console', code)(name => { assert.ok(mocks[name], `Unexpected import ${name}`); return mocks[name]; }, module.exports, module, { info() {}, error() {} });
  return { ...module.exports, users, notifications };
}
const payload = { title: 'Lịch hẹn', message: 'Phản hồi nghiệp vụ', type: 'status_update', link: '/profile/bookings' };

test('verified deployed runtime reproduces director permission-denied and missing business notification recipient', async () => {
  const source = runtime(original);
  await assert.rejects(source.createNotification.run({ auth: { uid: 'director' }, data: { ...payload, recipientId: 'ctv' } }), e => e.code === 'permission-denied');
  assert.equal(source.notifications.length, 0);
  const result = await source.notifyAdmins.run({ data: payload });
  assert.equal(result.count, 1); assert.deepEqual(source.notifications.map(n => n.recipientId), ['admin_a']);
});
test('patched callable gives director the existing admin notification capability without changing payloads', async () => {
  for (const uid of ['director', 'admin_a']) {
    const source = runtime(patchDirectorNotifications(original));
    assert.deepEqual(await source.createNotification.run({ auth: { uid }, data: { ...payload, recipientId: 'ctv' } }), { ok: true });
    assert.deepEqual(source.notifications, [{ recipientId: 'ctv', ...payload, isRead: false, createdAt: 'server-time' }]);
  }
});
test('untrusted users, forged client roles and unauthenticated callers cannot send to other accounts', async () => {
  const source = runtime(patchDirectorNotifications(original));
  for (const uid of ['ctv', 'user', 'missing']) await assert.rejects(source.createNotification.run({ auth: { uid }, data: { ...payload, recipientId: 'admin_a', role: 'director', approvedBy: 'director' } }), e => e.code === 'permission-denied');
  await assert.rejects(source.createNotification.run({ data: { ...payload, recipientId: 'ctv' } }), e => e.code === 'unauthenticated');
  assert.equal(source.notifications.length, 0);
});
test('business recipient list includes admins and directors only; private ownership/grants are never modified', async () => {
  const source = runtime(patchDirectorNotifications(original));
  const before = JSON.stringify([...source.users]);
  const result = await source.notifyAdmins.run({ data: payload });
  assert.equal(result.count, 2); assert.deepEqual(source.notifications.map(n => n.recipientId).sort(), ['admin_a', 'director']);
  assert.equal(JSON.stringify([...source.users]), before);
});
test('existing personal notifications remain available; no new permission-notification type is introduced', async () => {
  const source = runtime(patchDirectorNotifications(original));
  await source.createNotification.run({ auth: { uid: 'user' }, data: { ...payload, recipientId: 'user' } });
  assert.equal(source.notifications.length, 1);
  await assert.rejects(source.createNotification.run({ auth: { uid: 'director' }, data: { ...payload, recipientId: 'admin_a', type: 'access_granted' } }), e => e.code === 'invalid-argument');
  assert.equal(source.notifications.length, 1);
});
test('patch is repeatable and refuses unknown source instead of guessing at deployed code', () => {
  const patched = patchDirectorNotifications(original);
  assert.equal(patchDirectorNotifications(patched), patched);
  assert.throws(() => patchDirectorNotifications('different backend'), /Unexpected function source/);
});
