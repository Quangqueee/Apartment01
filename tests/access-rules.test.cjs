const fs = require('node:fs');
const cp = require('node:child_process');
const pathModule = require('node:path');
const { test, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs, serverTimestamp } = require('firebase/firestore');
let env;
const db = uid => uid ? env.authenticatedContext(uid).firestore() : env.unauthenticatedContext().firestore();
const path = (uid, name) => doc(db(uid), name);
before(async () => {
  if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('Run with Firebase emulators:exec; live Firebase is never used.');
  env = await initializeTestEnvironment({ projectId: 'demo-apartment-access', firestore: { rules: fs.readFileSync('firestore.rules', 'utf8') } });
});
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async context => {
    const firestore = context.firestore();
    const seed = {
      'users/director': { role: 'director' }, 'users/admin_a': { role: 'admin' }, 'users/admin_b': { role: 'admin' },
      'users/viewer': { role: 'user' }, 'users/other': { role: 'user' }, 'users/landlord': { role: 'landlord' },
      'users/customer_a': { role: 'user', ownerAdminId: 'admin_a' },
      'users/ctv_a': { role: 'collaborator', ownerAdminId: 'admin_a' },
      'users/unowned': { role: 'user' },
      'apartments/apt': { ownerAdminId: 'admin_a', landlordId: 'landlord', submissionStatus: 'published', landlordPhoneNumber: 'DISPLAY' },
      'apartments/pending': { landlordId: 'landlord', submissionStatus: 'pending' },
      'short_term_apartments/apt': { submissionStatus: 'published', landlordId: 'landlord' },
      'landlordContacts/apartments~apt': { phone: 'PRIVATE' },
      'landlordContacts/short_term_apartments~apt': { phone: 'PRIVATE_SHORT' },
      'user_bookings/a': { ownerAdminId: 'admin_a', userId: 'customer_a', status: 'pending' },
      'ctv_bookings/a': { ownerAdminId: 'admin_a', ctvId: 'ctv_a', status: 'pending' },
      'guest_consultations/a': { ownerAdminId: 'admin_a', status: 'pending' },
      'user_bookings/b': { ownerAdminId: 'admin_b', userId: 'other', status: 'pending' },
      'user_bookings/unowned': { userId: 'viewer', status: 'pending' },
      'stay_bookings/stay': { userId: 'viewer', status: 'pending' },
      'payments/payment': { userId: 'viewer' },
      'notifications/n': { recipientId: 'viewer', isRead: false },
    };
    await Promise.all(Object.entries(seed).map(([name, data]) => setDoc(doc(firestore, name), data)));
  });
});
after(async () => { if (env) await env.cleanup(); });
const seedGrant = (kind = 'bookings', recipient = 'viewer', active = true) => env.withSecurityRulesDisabled(async context =>
  setDoc(doc(context.firestore(), `shareGrants/admin_a~${kind}~${recipient}`), { ownerAdminId: 'admin_a', kind, recipientUid: recipient, active }));

test('director inherits apartment/stay/payment/notification administration and all managed data', async () => {
  for (const name of ['apartments/pending', 'users/customer_a', 'users/unowned', 'user_bookings/b', 'ctv_bookings/a', 'guest_consultations/a', 'stay_bookings/stay', 'payments/payment', 'notifications/n']) await assertSucceeds(getDoc(path('director', name)));
  await assertSucceeds(updateDoc(path('director', 'apartments/apt'), { title: 'Updated' }));
  await assertSucceeds(updateDoc(path('director', 'stay_bookings/stay'), { status: 'confirmed' }));
  await assertSucceeds(deleteDoc(path('director', 'guest_consultations/a')));
});
test('only director reads private phone by ID/list; admin and all other roles fail direct database reads', async () => {
  for (const name of ['landlordContacts/apartments~apt', 'landlordContacts/short_term_apartments~apt']) {
    await assertSucceeds(getDoc(path('director', name)));
    for (const uid of ['admin_a', 'viewer', 'ctv_a', 'landlord', null]) await assertFails(getDoc(path(uid, name)));
  }
  await assertSucceeds(getDocs(collection(db('director'), 'landlordContacts')));
  await assertFails(getDocs(collection(db('admin_a'), 'landlordContacts')));
  for (const uid of ['director', 'admin_a', 'viewer']) await assertFails(setDoc(path(uid, 'landlordContacts/apartments~apt'), { phone: '123456789' }));
  const publicDoc = await assertSucceeds(getDoc(path(null, 'apartments/apt')));
  assert.equal(publicDoc.data().landlordPhoneNumber, 'DISPLAY'); assert.ok(!JSON.stringify(publicDoc.data()).includes('PRIVATE'));
  await assertFails(updateDoc(path('admin_a', 'apartments/apt'), { actualLandlordPhone: '123456789' }));
});
test('admin reads/manages own records and queries; cross-owner, unowned and unrestricted queries blocked', async () => {
  for (const name of ['users/customer_a', 'users/ctv_a', 'user_bookings/a', 'ctv_bookings/a', 'guest_consultations/a']) await assertSucceeds(getDoc(path('admin_a', name)));
  await assertSucceeds(updateDoc(path('admin_a', 'user_bookings/a'), { status: 'approved' }));
  await assertSucceeds(getDocs(query(collection(db('admin_a'), 'user_bookings'), where('ownerAdminId', '==', 'admin_a'))));
  await assertSucceeds(getDocs(query(collection(db('admin_a'), 'users'), where('ownerAdminId', '==', 'admin_a'), where('role', 'in', ['user', 'collaborator']))));
  await assertFails(getDoc(path('admin_a', 'user_bookings/b')));
  await assertFails(getDoc(path('admin_a', 'users/unowned')));
  await assertFails(getDocs(collection(db('admin_a'), 'user_bookings')));
  await assertFails(getDocs(collection(db('admin_a'), 'users')));
});
test('pending/rejected requests never authorize a direct ID read', async () => {
  for (const status of ['pending', 'rejected']) {
    await env.withSecurityRulesDisabled(async context => setDoc(doc(context.firestore(), 'shareRequests/r'), {
      ownerAdminId: 'admin_a', kind: 'bookings', status, proposedRecipients: ['viewer'],
    }));
    await assertFails(getDoc(path('viewer', 'user_bookings/a')));
  }
});
test('grant boundaries: recipient, owner, type; revocation immediately blocks next direct read/list', async () => {
  await env.withSecurityRulesDisabled(async context => setDoc(doc(context.firestore(), 'users/internal_reader'), { role: 'admin' }));
  await seedGrant('bookings', 'internal_reader');
  for (const name of ['user_bookings/a', 'ctv_bookings/a', 'guest_consultations/a']) await assertSucceeds(getDoc(path('internal_reader', name)));
  await assertSucceeds(getDocs(query(collection(db('internal_reader'), 'user_bookings'), where('ownerAdminId', '==', 'admin_a'))));
  await assertFails(getDoc(path('other', 'user_bookings/a')));
  await assertFails(getDoc(path('internal_reader', 'user_bookings/b')));
  await assertFails(getDoc(path('internal_reader', 'users/ctv_a')));
  await assertFails(getDoc(path('internal_reader', 'users/customer_a')));
  await assertFails(getDoc(path('internal_reader', 'landlordContacts/apartments~apt')));
  await assertFails(updateDoc(path('internal_reader', 'user_bookings/a'), { status: 'approved', updatedAt: serverTimestamp() }));
  await assertFails(deleteDoc(path('internal_reader', 'user_bookings/a')));
  await seedGrant('bookings', 'internal_reader', false);
  await assertFails(getDoc(path('internal_reader', 'user_bookings/a')));
  await assertFails(getDocs(query(collection(db('internal_reader'), 'user_bookings'), where('ownerAdminId', '==', 'admin_a'))));
});

test('external CTV cannot read shared schedules even with historical grants; personal schedules remain accessible', async () => {
  for (const uid of ['ctv_a', 'viewer', 'landlord']) {
    await seedGrant('bookings', uid);
    await assertFails(getDoc(path(uid, 'user_bookings/a')));
    await assertFails(getDoc(path(uid, 'guest_consultations/a')));
    await assertFails(getDocs(query(collection(db(uid), 'user_bookings'), where('ownerAdminId', '==', 'admin_a'))));
  }
  await assertSucceeds(getDoc(path('ctv_a', 'ctv_bookings/a')));
  await assertSucceeds(getDocs(query(collection(db('ctv_a'), 'ctv_bookings'), where('ctvId', '==', 'ctv_a'))));
  await assertSucceeds(updateDoc(path('ctv_a', 'ctv_bookings/a'), { clientName: 'Own customer' }));
});

test('assigned admin handles only task status/notes; assignment cannot be spoofed and reassignment revokes task rights', async () => {
  await env.withSecurityRulesDisabled(async context => {
    for (const name of ['user_bookings/a', 'ctv_bookings/a', 'guest_consultations/a']) await updateDoc(doc(context.firestore(), name), { assignedAdminId: 'admin_b', assignedBy: 'director' });
  });
  for (const name of ['user_bookings/a', 'ctv_bookings/a', 'guest_consultations/a']) {
    await assertSucceeds(getDoc(path('admin_b', name)));
    await assertSucceeds(updateDoc(path('admin_b', name), { status: 'contacted', adminNotes: 'Lead handled', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(path('admin_b', name), { name: 'Edited client', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(path('admin_b', name), { ownerAdminId: 'admin_b' }));
    await assertFails(updateDoc(path('admin_b', name), { assignedAdminId: 'admin_a' }));
    await assertFails(deleteDoc(path('admin_b', name)));
    await assertFails(updateDoc(path('admin_a', name), { assignedAdminId: 'admin_a' }));
    await assertFails(updateDoc(path('director', name), { assignedAdminId: 'admin_a' })); // Server API only.
  }
  await assertSucceeds(getDocs(query(collection(db('admin_b'), 'user_bookings'), where('assignedAdminId', '==', 'admin_b'))));
  await assertFails(getDoc(path('admin_b', 'users/customer_a')));
  await assertFails(getDoc(path('admin_b', 'landlordContacts/apartments~apt')));
  await assertFails(setDoc(path('admin_a', 'user_bookings/forged_assignment'), { ownerAdminId: 'admin_a', assignedAdminId: 'admin_b' }));
  await assertFails(setDoc(path('viewer', 'user_bookings/forged_assignment'), { userId: 'viewer', apartmentId: 'apt', status: 'pending', ownerAdminId: 'admin_a', assignedAdminId: 'admin_b' }));
  await assertFails(setDoc(path('ctv_a', 'ctv_bookings/forged_assignment'), { ctvId: 'ctv_a', apartmentId: 'apt', status: 'pending', ownerAdminId: 'admin_a', assignedAdminId: 'admin_b' }));
  await env.withSecurityRulesDisabled(async context => updateDoc(doc(context.firestore(), 'user_bookings/a'), { assignedAdminId: null }));
  await assertFails(getDoc(path('admin_b', 'user_bookings/a')));
  await assertFails(updateDoc(path('admin_b', 'user_bookings/a'), { status: 'approved', updatedAt: serverTimestamp() }));
  await assertSucceeds(getDoc(path('admin_a', 'user_bookings/a')));
});
test('CTV and customer scopes independent; read grant never gives write/delete/share', async () => {
  await seedGrant('collaborators');
  await assertSucceeds(getDoc(path('viewer', 'users/ctv_a')));
  await assertFails(getDoc(path('viewer', 'users/customer_a')));
  await seedGrant('customers'); await seedGrant('bookings');
  await env.withSecurityRulesDisabled(async context => setDoc(doc(context.firestore(), 'customerVisibility/customer_a'), { legacy: true, adminReaders: [] }));
  await assertSucceeds(getDoc(path('viewer', 'users/customer_a')));
  for (const name of ['users/customer_a', 'users/ctv_a', 'user_bookings/a', 'ctv_bookings/a', 'guest_consultations/a']) {
    await assertFails(updateDoc(path('viewer', name), { phone: '123456789' }));
    await assertFails(deleteDoc(path('viewer', name)));
    await assertFails(updateDoc(path('viewer', name), { ownerAdminId: 'viewer' }));
  }
  await assertFails(setDoc(path('viewer', 'shareGrants/admin_a~bookings~other'), { active: true }));
});
test('all admins read legacy customers; new users require exact grants even with forged old dates', async () => {
  await env.withSecurityRulesDisabled(async context => {
    const firestore = context.firestore();
    await setDoc(doc(firestore, 'users/legacy'), { role: 'user', createdAt: { seconds: 0 } });
    await setDoc(doc(firestore, 'customerVisibility/legacy'), { legacy: true, adminReaders: [] });
    await setDoc(doc(firestore, 'users/new'), { role: 'user', createdAt: { seconds: 0 }, legacy: true, landlordApprovalStatus: 'pending' });
  });
  for (const uid of ['admin_a', 'admin_b']) {
    await assertSucceeds(getDoc(path(uid, 'users/legacy')));
    await assertFails(getDoc(path(uid, 'users/new')));
    await assertFails(getDoc(path(uid, 'users/director')));
    await assertFails(getDoc(path(uid, 'customerVisibility/legacy')));
    await assertFails(getDocs(collection(db(uid), 'shareRequests')));
  }
  await assertFails(setDoc(path('admin_a', 'customerVisibility/new'), { legacy: true, adminReaders: ['admin_a'] }));
  await assertFails(setDoc(path('viewer', 'customerVisibility/new'), { legacy: true }));
  await env.withSecurityRulesDisabled(async context => setDoc(doc(context.firestore(), 'customerVisibility/new'), { legacy: false, adminReaders: ['admin_b'] }));
  await assertSucceeds(getDoc(path('admin_b', 'users/new')));
  await assertFails(getDoc(path('admin_a', 'users/new')));
  await assertFails(updateDoc(path('admin_b', 'users/new'), { interests: 'Changed' }));
  await assertFails(deleteDoc(path('admin_b', 'users/new')));
  await assertFails(getDoc(path('admin_b', 'landlordContacts/apartments~apt')));
  await env.withSecurityRulesDisabled(async context => setDoc(doc(context.firestore(), 'customerVisibility/new'), { legacy: false, adminReaders: [] }));
  await assertFails(getDoc(path('admin_b', 'users/new')));
});
test('legacy transition is frozen, rerunnable and reversible without deleting grants or changing profiles', async () => {
  const folder = fs.mkdtempSync(pathModule.join(process.cwd(), '.test-runtime', 'legacy-emulator-'));
  const file = pathModule.join(folder, 'snapshot.json');
  const run = extra => cp.execFileSync(process.execPath, ['scripts/customer-legacy.cjs', '--project', 'demo-apartment-access', '--snapshot', file, ...extra], {
    cwd: process.cwd(), env: process.env, encoding: 'utf8', timeout: 60000,
  });
  await env.withSecurityRulesDisabled(async context => setDoc(doc(context.firestore(), 'customerVisibility/customer_a'), { legacy: false, adminReaders: ['admin_b'] }));
  run([]);
  const frozen = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.ok(frozen.customerIds.includes('customer_a'));
  assert.ok(!frozen.customerIds.includes('director')); assert.ok(!frozen.customerIds.includes('ctv_a'));
  await env.withSecurityRulesDisabled(async context => setDoc(doc(context.firestore(), 'users/late'), { role: 'user', createdAt: { seconds: 0 } }));
  run(['--apply', '--operator', 'director']);
  await assertSucceeds(getDoc(path('admin_b', 'users/unowned')));
  await assertFails(getDoc(path('admin_b', 'users/late')));
  assert.match(run(['--apply', '--operator', 'director']), /Already applied/);
  run(['--apply', '--rollback', '--operator', 'director']);
  await assertFails(getDoc(path('admin_b', 'users/unowned')));
  await assertSucceeds(getDoc(path('admin_b', 'users/customer_a'))); // Existing explicit grant survives rollback.
  await env.withSecurityRulesDisabled(async context => {
    assert.equal((await getDoc(doc(context.firestore(), 'users/customer_a'))).data().role, 'user');
    assert.equal((await getDoc(doc(context.firestore(), 'users/director'))).data().role, 'director');
    assert.deepEqual((await getDoc(doc(context.firestore(), 'customerVisibility/customer_a'))).data().adminReaders, ['admin_b']);
  });
});
test('existing admin compatibility covers frozen schedules and CTV; future schedules require scope and rollback keeps owners', async () => {
  const folder = fs.mkdtempSync(pathModule.join(process.cwd(), '.test-runtime', 'admin-emulator-'));
  const file = pathModule.join(folder, 'snapshot.json');
  const run = extra => cp.execFileSync(process.execPath, ['scripts/legacy-admin-access.cjs', '--project', 'demo-apartment-access', '--snapshot', file, ...extra], {
    cwd: process.cwd(), env: process.env, encoding: 'utf8', timeout: 60000,
  });
  run([]);
  assert.deepEqual(JSON.parse(fs.readFileSync(file, 'utf8')).adminUids, ['admin_a', 'admin_b']);
  await env.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), 'users/late_admin'), { role: 'admin' });
    await setDoc(doc(context.firestore(), 'users/late_customer'), { role: 'user', createdAt: { seconds: 0 } });
    await setDoc(doc(context.firestore(), 'users/late_ctv'), { role: 'collaborator' });
    await setDoc(doc(context.firestore(), 'user_bookings/late'), { status: 'pending' });
  });
  run(['--apply', '--operator', 'director']);
  assert.match(run(['--apply', '--operator', 'director']), /Already applied/);
  await env.withSecurityRulesDisabled(async context => {
    for (const key of ['user_bookings~unowned', 'ctv_bookings~a', 'guest_consultations~a']) await setDoc(doc(context.firestore(), `legacyBookingAccess/${key}`), { enabled: true });
  });
  for (const uid of ['admin_a', 'admin_b']) {
    for (const name of ['user_bookings/unowned', 'ctv_bookings/a', 'guest_consultations/a', 'users/late_ctv']) await assertSucceeds(getDoc(path(uid, name)));
    await assertFails(getDoc(path(uid, 'user_bookings/late')));
    await assertFails(getDocs(collection(db(uid), 'user_bookings')));
    await assertSucceeds(getDocs(query(collection(db(uid), 'users'), where('role', '==', 'collaborator'))));
    await assertFails(getDoc(path(uid, 'users/late_customer')));
    await assertFails(getDoc(path(uid, 'users/director')));
    await assertFails(getDoc(path(uid, 'accessConfig/legacyAdminAccess')));
    await assertFails(getDoc(path(uid, 'landlordContacts/apartments~apt')));
    await assertFails(updateDoc(path(uid, 'user_bookings/late'), { status: 'approved' }));
    await assertFails(deleteDoc(path(uid, 'user_bookings/late')));
    await assertFails(updateDoc(path(uid, 'users/late_ctv'), { role: 'user' }));
  }
  await assertFails(getDoc(path('late_admin', 'user_bookings/late')));
  await assertFails(getDoc(path('late_admin', 'users/late_ctv')));
  await assertFails(setDoc(path('late_admin', 'accessConfig/legacyAdminAccess'), { adminUids: ['late_admin'] }));
  run(['--apply', '--rollback', '--operator', 'director']);
  await assertFails(getDoc(path('admin_b', 'user_bookings/late')));
  await assertFails(getDoc(path('admin_b', 'users/late_ctv')));
  await assertSucceeds(getDoc(path('admin_b', 'user_bookings/b')));
});

test('no role elevation/profile spoofing, owner replacement, forged reviewer or audit mutations', async () => {
  for (const uid of ['viewer', 'admin_a', 'director']) {
    await assertFails(updateDoc(path(uid, `users/${uid}`), { role: uid === 'director' ? 'admin' : 'director' }));
    await assertFails(setDoc(path(uid, 'shareRequests/forged'), { status: 'approved', reviewedBy: 'director', ownerAdminId: 'admin_a' }));
    await assertFails(setDoc(path(uid, 'shareGrants/admin_a~bookings~viewer'), { active: true }));
    await assertFails(setDoc(path(uid, 'accessAudit/forged'), { actorUid: 'director' }));
  }
  await assertFails(updateDoc(path('admin_a', 'users/director'), { role: 'user' }));
  await assertFails(deleteDoc(path('admin_a', 'users/director')));
  await assertFails(updateDoc(path('admin_a', 'user_bookings/a'), { ownerAdminId: 'admin_b' }));
  await assertFails(updateDoc(path('viewer', 'users/viewer'), { ownerAdminId: 'admin_a' }));
  await assertFails(setDoc(path('new_user', 'users/new_user'), { role: 'director' }));
});

test('customer work assignment grants profile read without profile edits, schedule work, export metadata or delegation', async () => {
  await env.withSecurityRulesDisabled(async context => setDoc(doc(context.firestore(), 'customerWork/users~customer_a'), { assignedAdminId: 'admin_b', revision: 1, status: 'new' }));
  await assertSucceeds(getDoc(path('admin_b', 'users/customer_a')));
  await assertSucceeds(getDoc(path('admin_b', 'customerWork/users~customer_a')));
  await assertFails(updateDoc(path('admin_b', 'users/customer_a'), { interests: 'Not profile owner' }));
  await assertFails(deleteDoc(path('admin_b', 'users/customer_a')));
  await assertFails(updateDoc(path('admin_b', 'user_bookings/a'), { status: 'approved' }));
  await assertFails(getDoc(path('ctv_a', 'users/customer_a')));
  for (const uid of ['director', 'admin_a', 'admin_b', 'ctv_a', 'viewer']) {
    await assertFails(setDoc(path(uid, 'customerWork/users~customer_a'), { assignedAdminId: uid, revision: 2 }));
    await assertFails(setDoc(path(uid, 'customerLeadVisibility/ctv_bookings~a'), { legacy: true, adminReaders: [uid] }));
    await assertFails(setDoc(path(uid, 'operationsBulk/forged'), { actorUid: 'director' }));
    await assertFails(getDoc(path(uid, 'operationsBulk/forged')));
  }
  await env.withSecurityRulesDisabled(async context => updateDoc(doc(context.firestore(), 'customerWork/users~customer_a'), { assignedAdminId: null, revision: 2 }));
  await assertFails(getDoc(path('admin_b', 'users/customer_a')));
  await assertSucceeds(getDoc(path('admin_a', 'users/customer_a')));
});
test('lead read grants and customer assignments never become schedule management or private-phone read', async () => {
  for (const kind of ['grant', 'assignment']) {
    await env.withSecurityRulesDisabled(async context => {
      if (kind === 'grant') await setDoc(doc(context.firestore(), 'customerLeadVisibility/ctv_bookings~a'), { adminReaders: ['admin_b'] });
      else { await setDoc(doc(context.firestore(), 'customerLeadVisibility/ctv_bookings~a'), { adminReaders: [] }); await setDoc(doc(context.firestore(), 'customerWork/ctv_bookings~a'), { assignedAdminId: 'admin_b' }); }
    });
    await assertSucceeds(getDoc(path('admin_b', 'ctv_bookings/a')));
    await assertFails(updateDoc(path('admin_b', 'ctv_bookings/a'), { status: 'contacted', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(path('admin_b', 'ctv_bookings/a'), { ownerAdminId: 'admin_b' }));
    await assertFails(deleteDoc(path('admin_b', 'ctv_bookings/a')));
    await assertFails(getDoc(path('admin_b', 'landlordContacts/apartments~apt')));
  }
  await env.withSecurityRulesDisabled(async context => updateDoc(doc(context.firestore(), 'customerWork/ctv_bookings~a'), { assignedAdminId: null }));
  await assertFails(getDoc(path('admin_b', 'ctv_bookings/a')));
  await assertSucceeds(getDoc(path('ctv_a', 'ctv_bookings/a')));
  await assertFails(updateDoc(path('viewer', 'users/viewer'), { assignedAdminId: 'admin_b', referralCtvId: 'ctv_a' }));
});
test('client cannot recreate an old or shared booking ID and inherit frozen rights for a different new customer', async () => {
  await env.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), 'legacyBookingAccess/user_bookings~a'), { enabled: true });
    await setDoc(doc(context.firestore(), 'customerWork/ctv_bookings~a'), { assignedAdminId: 'admin_b', revision: 1 });
    await setDoc(doc(context.firestore(), 'customerLeadVisibility/guest_consultations~a'), { adminReaders: ['admin_b'] });
  });
  await assertSucceeds(deleteDoc(path('admin_a', 'user_bookings/a')));
  await assertSucceeds(deleteDoc(path('admin_a', 'ctv_bookings/a')));
  await assertSucceeds(deleteDoc(path('admin_a', 'guest_consultations/a')));
  await assertFails(setDoc(path('admin_a', 'user_bookings/a'), { ownerAdminId: 'admin_a', createdByAdminId: 'admin_a', status: 'approved', name: 'Different new customer' }));
  await assertFails(setDoc(path('admin_a', 'ctv_bookings/a'), { ownerAdminId: 'admin_a', ctvId: 'ctv_a', status: 'approved' }));
  await assertFails(setDoc(path('viewer', 'user_bookings/a'), { userId: 'viewer', ownerAdminId: 'admin_a', apartmentId: 'apt', status: 'pending' }));
  await assertFails(setDoc(path('ctv_a', 'ctv_bookings/a'), { ctvId: 'ctv_a', ownerAdminId: 'admin_a', apartmentId: 'apt', status: 'pending' }));
  await assertSucceeds(setDoc(path('admin_a', 'user_bookings/fresh_id'), { ownerAdminId: 'admin_a', status: 'approved' }));
});
test('server-created manual leads have the same ID read policy and deny all direct client writes', async () => {
  await env.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), 'customerLeads/manual'), { ownerAdminId: 'admin_a', displayName: 'Manual', phoneNumber: '0901234567' });
    await setDoc(doc(context.firestore(), 'customerLeadVisibility/customerLeads~manual'), { adminReaders: ['admin_b'] });
  });
  for (const uid of ['director', 'admin_a', 'admin_b']) await assertSucceeds(getDoc(path(uid, 'customerLeads/manual')));
  for (const uid of ['ctv_a', 'viewer', null]) await assertFails(getDoc(path(uid, 'customerLeads/manual')));
  for (const uid of ['director', 'admin_a', 'admin_b']) {
    await assertFails(updateDoc(path(uid, 'customerLeads/manual'), { ownerAdminId: uid }));
    await assertFails(deleteDoc(path(uid, 'customerLeads/manual')));
  }
  await env.withSecurityRulesDisabled(async context => updateDoc(doc(context.firestore(), 'customerLeadVisibility/customerLeads~manual'), { adminReaders: [] }));
  await assertFails(getDoc(path('admin_b', 'customerLeads/manual')));
});
test('lead baseline migration runs against real emulator metadata, reruns safely, and rollback preserves explicit grants and source records', async () => {
  const { initializeApp, deleteApp } = require('firebase-admin/app');
  const { getFirestore } = require('firebase-admin/firestore');
  const app = initializeApp({ projectId: 'demo-apartment-access' }, 'operations-migration');
  const admin = getFirestore(app);
  try {
    const cutoff = (await admin.doc('ctv_bookings/a').get()).readTime.toDate().toISOString();
    await admin.doc('accessConfig/customerLegacy').set({ status: 'complete', capturedAt: cutoff });
    await admin.doc('accessConfig/legacyAdminAccess').set({ status: 'complete', adminUids: ['admin_a', 'admin_b'] });
    const before = (await admin.doc('ctv_bookings/a').get()).data();
    const folder = fs.mkdtempSync(pathModule.join(process.cwd(), '.test-runtime', 'operations-emulator-'));
    const file = pathModule.join(folder, 'snapshot.json');
    const run = extra => cp.execFileSync(process.execPath, ['scripts/operations-legacy.cjs', '--project', 'demo-apartment-access', '--snapshot', file, ...extra], { cwd: process.cwd(), env: process.env, encoding: 'utf8', timeout: 60000 });
    run([]);
    const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.ok(manifest.eligible.some(e => e.key === 'ctv_bookings~a'));
    assert.ok(!manifest.eligible.some(e => e.key === 'user_bookings~a'));
    assert.ok(manifest.bookings.some(e => e.key === 'user_bookings~a'));
    await admin.doc('ctv_bookings/after').set({ ownerAdminId: 'admin_a', ctvId: 'ctv_a', status: 'pending', createdAt: { seconds: 0 } });
    run(['--apply', '--operator', 'director']);
    assert.match(run(['--apply', '--operator', 'director']), /Already applied/);
    await assertSucceeds(getDoc(path('admin_b', 'ctv_bookings/a')));
    await assertSucceeds(getDoc(path('admin_b', 'user_bookings/a')));
    await assertFails(getDoc(path('admin_b', 'ctv_bookings/after')));
    await admin.doc('customerLeadVisibility/ctv_bookings~a').update({ adminReaders: ['admin_b'] });
    run(['--apply', '--rollback', '--operator', 'director']);
    assert.match(run(['--apply', '--rollback', '--operator', 'director']), /Already applied/);
    await assertSucceeds(getDoc(path('admin_b', 'ctv_bookings/a'))); // Explicit grant survives.
    await assertFails(getDoc(path('admin_b', 'guest_consultations/a')));
    assert.deepEqual((await admin.doc('ctv_bookings/a').get()).data(), before);
    assert.equal((await admin.doc('users/director').get()).data().role, 'director');
    assert.equal((await admin.doc('landlordContacts/apartments~apt').get()).data().phone, 'PRIVATE');
  } finally { await deleteApp(app); }
});

test('operations API uses real Firestore transactions for multi-page snapshots, concurrent retries and quiet customer reassignment', async () => {
  const { initializeApp, deleteApp } = require('firebase-admin/app');
  const { getFirestore } = require('firebase-admin/firestore');
  const load = require('./load-typescript.cjs');
  const app = initializeApp({ projectId: 'demo-apartment-access' }, 'operations-api-test'), admin = getFirestore(app);
  const { POST } = load('src/app/api/operations/route.ts', { '@/firebase/admin-init': { adminDb: admin, adminAuth: {
    verifyIdToken: async token => ({ uid: token }), getUser: async uid => ({ uid, disabled: false }),
  } } });
  const call = async (actor, input) => { const r = await POST(new Request('http://localhost/api/operations', { method: 'POST', headers: { Authorization: `Bearer ${actor}` }, body: JSON.stringify(input) })); return { status: r.status, data: await r.json() }; };
  try {
    const batch = admin.batch();
    for (let i = 0; i < 61; i++) batch.set(admin.doc(`users/bulk_${i}`), { role: 'user', displayName: `Emulator batch ${i}`, ownerAdminId: 'admin_a' });
    await batch.commit();
    const listed = await call('director', { action: 'customers', pageSize: 25, filters: { search: 'Emulator batch' } });
    assert.equal(listed.status, 200, JSON.stringify(listed.data)); assert.equal(listed.data.total, 61); assert.equal(listed.data.rows.length, 25);
    const preview = await call('director', { action: 'preview', operation: 'assign', adminIds: ['admin_b'], selection: { mode: 'filter', filters: { search: 'Emulator batch' } } });
    assert.equal(preview.status, 200, JSON.stringify(preview.data)); assert.equal(preview.data.total, 61);
    await admin.doc('users/after_preview').set({ role: 'user', displayName: 'Emulator batch later' });
    const input = { action: 'apply', jobId: preview.data.jobId, offset: 0 };
    const [a, b] = await Promise.all([call('director', input), call('director', input)]);
    assert.equal(a.status, 200, JSON.stringify(a.data)); assert.equal(b.status, 200, JSON.stringify(b.data));
    assert.equal(a.data.processed, 50); assert.equal(b.data.processed, 50);
    const done = await call('director', { ...input, offset: 50 }); assert.equal(done.status, 200, JSON.stringify(done.data)); assert.equal(done.data.processed, 61);
    assert.equal((await admin.collection('customerWork').get()).size, 61);
    assert.equal((await admin.doc('customerWork/users~after_preview').get()).exists, false);
    assert.equal((await admin.collection('accessAudit').get()).size, 2);
    assert.equal((await admin.collection('notifications').get()).size, 1); // Original business notification only.
    await assertSucceeds(getDoc(path('admin_b', 'users/bulk_0')));
    const work = await call('admin_b', { action: 'work-update', key: 'users~bulk_0', revision: 1, status: 'in_progress' }); assert.equal(work.status, 200, JSON.stringify(work.data));
    const denied = await call('admin_b', { action: 'preview', operation: 'grant', adminIds: ['admin_a'], selection: { mode: 'ids', keys: ['users~bulk_0'] } }); assert.equal(denied.status, 403);
    const expired = await call('director', { action: 'preview', operation: 'assign', adminIds: ['admin_a'], selection: { mode: 'ids', keys: ['users~bulk_0'] } });
    await admin.doc(`operationsBulk/${expired.data.jobId}`).update({ expiresAtMs: 0 });
    assert.equal((await call('director', { action: 'apply', jobId: expired.data.jobId, offset: 0 })).status, 409);
  } finally { await deleteApp(app); }
});
test('existing personal/landlord/public permissions retained; non-admin cannot forge record ownership', async () => {
  await env.withSecurityRulesDisabled(async context => setDoc(doc(context.firestore(), 'users/new_partner'), {
    role: 'user', landlordApprovalStatus: 'pending', landlordRequestData: { displayName: 'Partner' },
  }));
  await assertFails(getDoc(path('admin_b', 'users/new_partner')));
  await assertFails(updateDoc(path('admin_b', 'users/new_partner'), { interests: 'Unauthorized edit' }));
  await assertFails(updateDoc(path('admin_b', 'users/new_partner'), { landlordApprovalStatus: 'approved' }));
  await assertSucceeds(updateDoc(path('admin_b', 'users/new_partner'), { landlordApprovalStatus: 'rejected', landlordRejectionReason: 'Application review' }));
  await assertFails(getDoc(path('admin_b', 'users/new_partner')));
  await assertSucceeds(getDoc(path('viewer', 'user_bookings/unowned')));
  await assertSucceeds(updateDoc(path('viewer', 'user_bookings/unowned'), { notes: 'Personal edit' }));
  await assertSucceeds(getDoc(path('ctv_a', 'ctv_bookings/a')));
  await assertSucceeds(updateDoc(path('ctv_a', 'ctv_bookings/a'), { clientName: 'Personal edit' }));
  await assertSucceeds(getDoc(path('landlord', 'apartments/pending')));
  await assertSucceeds(updateDoc(path('landlord', 'apartments/pending'), { title: 'Landlord edit' }));
  await assertFails(updateDoc(path('landlord', 'apartments/pending'), { submissionStatus: 'published' }));
  await assertSucceeds(getDoc(path(null, 'apartments/apt')));
  await assertFails(getDoc(path(null, 'apartments/pending')));
  await assertSucceeds(setDoc(path('viewer', 'user_bookings/new'), { userId: 'viewer', apartmentId: 'apt', status: 'pending', ownerAdminId: 'admin_a' }));
  await assertFails(setDoc(path('viewer', 'user_bookings/forged'), { userId: 'viewer', apartmentId: 'apt', status: 'pending', ownerAdminId: 'admin_b' }));
  await assertSucceeds(setDoc(path('admin_a', 'user_bookings/manual'), { ownerAdminId: 'admin_a', createdByAdminId: 'admin_a', status: 'approved' }));
  await assertFails(setDoc(path('admin_a', 'user_bookings/forged'), { ownerAdminId: 'admin_b', createdByAdminId: 'admin_a' }));
});
