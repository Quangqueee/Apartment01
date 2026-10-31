// Explicit dry-run snapshot; never infer owners, creators, phone numbers or referral sources.
const fs = require('node:fs');
const crypto = require('node:crypto');
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { planLegacyLeads, SOURCES, keyPattern } = require('./operations-legacy-plan.cjs');
const args = process.argv.slice(2), value = flag => args[args.indexOf(flag) + 1];
async function main() {
  for (const flag of ['--project', '--snapshot']) if (!args.includes(flag) || !value(flag) || value(flag).startsWith('--')) throw new Error('Required project and snapshot');
  if (args.includes('--rollback') && !args.includes('--apply')) throw new Error('Rollback requires --apply');
  const projectId = value('--project'), snapshotPath = value('--snapshot');
  initializeApp({ projectId, credential: applicationDefault() });
  const db = getFirestore(), configRef = db.doc('accessConfig/operationsLegacy');
  const baseline = (await db.doc('accessConfig/customerLegacy').get()).data();
  if (baseline?.status !== 'complete' || !Number.isFinite(Date.parse(baseline.capturedAt))) throw new Error('Existing customer baseline must be complete');
  if (!fs.existsSync(snapshotPath)) {
    if (args.includes('--apply')) throw new Error('Create and review a dry-run snapshot first');
    if ((await configRef.get()).exists) throw new Error('A lead baseline already exists');
    const [snapshots, users] = await Promise.all([Promise.all(SOURCES.map(name => db.collection(name).get())), db.collection('users').where('role', '==', 'user').get()]);
    const records = snapshots.flatMap((s, i) => s.docs.map(d => ({ collection: SOURCES[i], id: d.id, data: d.data(), createTime: d.createTime })));
    const plan = planLegacyLeads(records, baseline.capturedAt, new Set(users.docs.map(d => d.id)));
    fs.writeFileSync(snapshotPath, JSON.stringify({ projectId, cutoff: baseline.capturedAt, capturedAt: new Date().toISOString(), ...plan }, null, 2), { flag: 'wx' });
  }
  const raw = fs.readFileSync(snapshotPath, 'utf8'), manifest = JSON.parse(raw), baselineId = crypto.createHash('sha256').update(raw).digest('hex');
  if (manifest.projectId !== projectId || manifest.cutoff !== baseline.capturedAt || !Array.isArray(manifest.eligible) || !Array.isArray(manifest.bookings)
    || [...manifest.eligible, ...manifest.bookings].some(e => !keyPattern.test(e.key) || !Number.isFinite(Date.parse(e.createTime)) || Date.parse(e.createTime) > Date.parse(manifest.cutoff))
    || manifest.bookings.some(e => e.key.startsWith('customerLeads~'))
    || new Set(manifest.eligible.map(e => e.key)).size !== manifest.eligible.length || new Set(manifest.bookings.map(e => e.key)).size !== manifest.bookings.length) throw new Error('Invalid reviewed snapshot');
  console.log(`Frozen leads: ${manifest.eligible.length}; unresolved: ${manifest.unresolved?.length || 0}; after cutoff: ${manifest.current?.length || 0}; linked profiles: ${manifest.linked?.length || 0}.`);
  if (!args.includes('--apply')) { console.log('DRY RUN: no database writes. Review unresolved keys in snapshot.'); return; }
  const operatorUid = value('--operator');
  if (!args.includes('--operator') || !/^[A-Za-z0-9_-]{1,128}$/.test(operatorUid)) throw new Error('Existing director operator required');
  const rollback = args.includes('--rollback');
  const previous = (await configRef.get()).data();
  if (previous && previous.baselineId !== baselineId) throw new Error('Different baseline; never expand on rerun');
  if (previous?.status === (rollback ? 'rolled-back' : 'complete')) { console.log('Already applied; no changes.'); return; }
  if (rollback && !previous) throw new Error('No baseline to rollback');
  let changed = 0;
  // Each row and the operator are revalidated atomically. A partial run is safely resumable.
  const entries = [...manifest.eligible.map(e => ({ ...e, collection: 'customerLeadVisibility', field: 'legacy' })),
    ...manifest.bookings.map(e => ({ ...e, collection: 'legacyBookingAccess', field: 'enabled' }))];
  for (const entry of entries) {
    const didChange = await db.runTransaction(async tx => {
      const separator = entry.key.indexOf('~'), collection = entry.key.slice(0, separator), id = entry.key.slice(separator + 1);
      const ref = db.doc(`${entry.collection}/${entry.key}`);
      const [actor, source, current, config] = await Promise.all([tx.get(db.doc(`users/${operatorUid}`)), tx.get(db.doc(`${collection}/${id}`)), tx.get(ref), tx.get(configRef)]);
      if (actor.data()?.role !== 'director') throw new Error('Existing director operator required');
      if (config.exists && config.data().baselineId !== baselineId) throw new Error('Different baseline; never expand on rerun');
      if (!source.exists) return false;
      if (!rollback && source.createTime?.toDate().toISOString() !== entry.createTime) throw new Error('Source was recreated; review required');
      const data = current.data() || {};
      if (rollback ? !data[entry.field] || data.baselineId !== baselineId : data[entry.field] === true) return false;
      tx.set(configRef, { baselineId, cutoff: manifest.cutoff, status: rollback ? 'rolling-back' : 'applying' }, { merge: true });
      tx.set(ref, { ...data, [entry.field]: !rollback, ...(rollback ? {} : { baselineId }), updatedAt: FieldValue.serverTimestamp() });
      tx.set(db.collection('accessAudit').doc(), { actorUid: operatorUid, action: rollback ? 'customer-lead-legacy-rollback' : 'customer-lead-legacy-baseline',
        target: ref.path, before: { [entry.field]: data[entry.field] === true }, after: { [entry.field]: !rollback, baselineId }, createdAt: FieldValue.serverTimestamp() });
      tx.set(db.doc('customerAccessState/records'), { updatedAt: FieldValue.serverTimestamp() });
      return true;
    });
    if (didChange) changed++;
  }
  await db.runTransaction(async tx => {
    const [actor, config] = await Promise.all([tx.get(db.doc(`users/${operatorUid}`)), tx.get(configRef)]);
    if (actor.data()?.role !== 'director') throw new Error('Existing director operator required');
    if (config.exists && config.data().baselineId !== baselineId) throw new Error('Different baseline; never expand on rerun');
    tx.set(configRef, { baselineId, cutoff: manifest.cutoff, status: rollback ? 'rolled-back' : 'complete', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    tx.set(db.doc('customerAccessState/records'), { updatedAt: FieldValue.serverTimestamp() });
  });
  console.log(`${rollback ? 'Rollback' : 'Apply'} completed: ${changed} changed. Source records, owners, assignments and role data untouched.`);
}
if (require.main === module) main().catch(error => { console.error(['Existing customer baseline must be complete', 'Create and review a dry-run snapshot first', 'Invalid reviewed snapshot', 'Different baseline; never expand on rerun', 'Existing director operator required', 'No baseline to rollback', 'Source was recreated; review required', 'Required project and snapshot', 'Rollback requires --apply', 'A lead baseline already exists'].includes(error.message) ? error.message : 'Operation failed; verify project, ADC and reviewed snapshot.'); process.exitCode = 1; });
