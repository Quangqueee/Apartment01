const fs = require('node:fs');
const { test, before, after } = require('node:test');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { doc, getDoc, setDoc } = require('firebase/firestore');

let env;
before(async () => {
  if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('Firestore emulator required.');
  env = await initializeTestEnvironment({ projectId: 'demo-apartment-access', firestore: { rules: fs.readFileSync('firestore.rules', 'utf8') } });
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await Promise.all([
      setDoc(doc(db, 'users/admin'), { role: 'admin' }),
      setDoc(doc(db, 'users/ctv'), { role: 'collaborator' }),
      setDoc(doc(db, 'users/customer'), { role: 'user' }),
      setDoc(doc(db, 'users/landlord'), { role: 'landlord' }),
      setDoc(doc(db, 'short_term_apartments/published'), { submissionStatus: 'published', nightlyPrice: 800000 }),
      setDoc(doc(db, 'short_term_apartments/pending'), { submissionStatus: 'pending', nightlyPrice: 800000 }),
      setDoc(doc(db, 'short_term_commissions/published'), { commission: '10%' }),
      setDoc(doc(db, 'short_term_commissions/pending'), { commission: '10%' }),
    ]);
  });
});
after(async () => { if (env) await env.cleanup(); });
const ref = (uid, name) => doc(env.authenticatedContext(uid).firestore(), name);

test('hoa hồng chỉ nhân sự đọc; CTV chỉ xem tin đã duyệt', async () => {
  await assertSucceeds(getDoc(ref('ctv', 'short_term_commissions/published')));
  await assertFails(getDoc(ref('ctv', 'short_term_commissions/pending')));
  await assertFails(getDoc(ref('customer', 'short_term_commissions/published')));
  await assertFails(getDoc(ref('landlord', 'short_term_commissions/published')));
  await assertSucceeds(getDoc(ref('admin', 'short_term_commissions/published')));
  await assertFails(setDoc(ref('ctv', 'short_term_commissions/published'), { commission: '100%' }));
});

test('chủ nhà chỉ tạo phòng đối tác, không ghi hoa hồng vào tin công khai', async () => {
  const base = { title: 'Studio', nightlyPrice: 800000, landlordId: 'landlord', submissionStatus: 'pending' };
  await assertSucceeds(setDoc(ref('landlord', 'short_term_apartments/valid'), { ...base, operationModel: 'partner' }));
  await assertFails(setDoc(ref('landlord', 'short_term_apartments/self'), { ...base, operationModel: 'self' }));
  await assertFails(setDoc(ref('landlord', 'short_term_apartments/with-commission'), { ...base, commission: '10%' }));
});

test('đặt phòng giờ phiên bản mới chỉ được ghi qua API máy chủ', async () => {
  const base = { userId: 'customer', apartmentId: 'published', guestName: 'Khach Test', guestPhone: '0912345678',
    checkIn: '2026-11-01', checkOut: '2026-11-02', nights: 1, totalAmount: 800000, status: 'pending' };
  await assertSucceeds(setDoc(ref('customer', 'stay_bookings/legacy'), base));
  await assertFails(setDoc(ref('customer', 'stay_bookings/forged'), { ...base, bookingSchemaVersion: 2,
    stayType: 'hourly', checkInAt: '2026-11-01T10:00', checkOutAt: '2026-11-01T12:00' }));
});
