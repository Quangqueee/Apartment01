// Freeze explicit existing customer IDs. Never classify using client-controlled createdAt.
const fs = require('node:fs');
const crypto = require('node:crypto');
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const args = process.argv.slice(2);
const value = key => args[args.indexOf(key) + 1];
async function main() {
  for (const flag of ['--project', '--snapshot']) if (!args.includes(flag) || !value(flag) || value(flag).startsWith('--')) throw new Error('Required project and snapshot');
  const projectId = value('--project'), snapshotPath = value('--snapshot');
  initializeApp({ projectId, credential: applicationDefault() });
  const db = getFirestore(), configRef = db.doc('accessConfig/customerLegacy');
  if (!fs.existsSync(snapshotPath)) {
    if (args.includes('--apply') || args.includes('--rollback')) throw new Error('Create/review snapshot with a dry run first');
    if ((await configRef.get()).exists) throw new Error('Baseline already exists; do not create a new cutoff');
    const snapshot = await db.collection('users').where('role', '==', 'user').select('role').get();
    const manifest = { projectId, capturedAt: snapshot.readTime.toDate().toISOString(), customerIds: snapshot.docs.map(s => s.id).sort() };
    fs.writeFileSync(snapshotPath, JSON.stringify(manifest, null, 2), { flag: 'wx' });
  }
  const raw = fs.readFileSync(snapshotPath, 'utf8'), manifest = JSON.parse(raw);
  if (manifest.projectId !== projectId || !Array.isArray(manifest.customerIds)
    || manifest.customerIds.some(id => !/^[A-Za-z0-9_-]{1,128}$/.test(id))) throw new Error('Invalid snapshot');
  const baselineId = crypto.createHash('sha256').update(raw).digest('hex');
  console.log(`Project ${projectId}: ${manifest.customerIds.length} frozen customer IDs; captured at ${manifest.capturedAt}.`);
  if (!args.includes('--apply')) { console.log('DRY RUN: no Firebase writes.'); return; }
  if (!args.includes('--operator')) throw new Error('Operator UID required for audit');
  const operatorUid = value('--operator');
  if ((await db.doc(`users/${operatorUid}`).get()).data()?.role !== 'director') throw new Error('Operator must be an existing director');
  const current = (await configRef.get()).data();
  if (current && current.baselineId !== baselineId) throw new Error('Different baseline exists; never expand legacy membership on rerun');
  const rollback = args.includes('--rollback');
  if (current?.status === (rollback ? 'rolled-back' : 'complete')) { console.log('Already applied; no changes.'); return; }
  if (rollback && !current) throw new Error('No baseline to rollback');
  await configRef.set({ baselineId, capturedAt: manifest.capturedAt, customerCount: manifest.customerIds.length,
    status: rollback ? 'rolling-back' : 'applying', updatedBy: operatorUid, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  let changed = 0;
  for (const id of manifest.customerIds) {
    const didChange = await db.runTransaction(async tx => {
      const ref = db.doc(`customerVisibility/${id}`);
      const [profile, visibility] = await Promise.all([tx.get(db.doc(`users/${id}`)), tx.get(ref)]);
      const data = visibility.data();
      if (rollback) {
        if (!data?.legacy || data.baselineId !== baselineId) return;
        tx.set(ref, { ...data, legacy: false, updatedBy: operatorUid, updatedAt: FieldValue.serverTimestamp() });
      } else {
        if (profile.data()?.role !== 'user' || data?.legacy === true) return;
        tx.set(ref, { ...data, legacy: true, baselineId, adminReaders: data?.adminReaders || [],
          updatedBy: operatorUid, updatedAt: FieldValue.serverTimestamp() });
      }
      return true;
    });
    if (didChange) changed++;
  }
  const batch = db.batch();
  batch.set(configRef, { status: rollback ? 'rolled-back' : 'complete', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  batch.set(db.doc('customerAccessState/records'), { updatedAt: FieldValue.serverTimestamp() });
  batch.set(db.collection('accessAudit').doc(), { actorUid: operatorUid, action: rollback ? 'customer-legacy-rollback' : 'customer-legacy-baseline',
    target: 'customerVisibility', before: { status: current?.status || null },
    after: { baselineId, changedCount: changed, frozenCount: manifest.customerIds.length }, createdAt: FieldValue.serverTimestamp() });
  await batch.commit();
  console.log(`${rollback ? 'Rollback' : 'Baseline'} completed: ${changed} changed. No customer profile or role was modified.`);
}
if (require.main === module) main().catch(error => {
  const known = ['Required project and snapshot', 'Create/review snapshot with a dry run first',
    'Baseline already exists; do not create a new cutoff', 'Invalid snapshot', 'Operator UID required for audit',
    'Operator must be an existing director', 'Different baseline exists; never expand legacy membership on rerun', 'No baseline to rollback'];
  console.error(known.includes(error.message) ? error.message : 'Baseline operation failed. Verify project, ADC and database access.');
  process.exitCode = 1;
});
