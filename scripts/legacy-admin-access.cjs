// Restore pre-existing admin READ access without granting future admins or new customers.
const fs = require('node:fs');
const crypto = require('node:crypto');
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
async function main(args = process.argv.slice(2)) {
  const value = key => args[args.indexOf(key) + 1];
  for (const flag of ['--project', '--snapshot']) if (!args.includes(flag) || !value(flag) || value(flag).startsWith('--')) throw new Error('Project and snapshot required');
  const projectId = value('--project'), file = value('--snapshot');
  initializeApp({ projectId, credential: applicationDefault() });
  const db = getFirestore(), ref = db.doc('accessConfig/legacyAdminAccess');
  if (!fs.existsSync(file)) {
    if (args.includes('--apply') || args.includes('--rollback') || (await ref.get()).exists) throw new Error('Freeze/review a snapshot before apply; never replace an existing baseline');
    const admins = await db.collection('users').where('role', '==', 'admin').select('role').get();
    fs.writeFileSync(file, JSON.stringify({ projectId, capturedAt: admins.readTime.toDate().toISOString(), adminUids: admins.docs.map(s => s.id).sort() }, null, 2), { flag: 'wx' });
  }
  const raw = fs.readFileSync(file, 'utf8'), manifest = JSON.parse(raw);
  if (manifest.projectId !== projectId || !Array.isArray(manifest.adminUids) || manifest.adminUids.length > 500
    || manifest.adminUids.some(id => !/^[A-Za-z0-9_-]{1,128}$/.test(id)) || new Set(manifest.adminUids).size !== manifest.adminUids.length) throw new Error('Invalid snapshot');
  console.log(`Project ${projectId}: ${manifest.adminUids.length} frozen existing admins. Scope: all viewing schedules and collaborators; never new customers or management rights.`);
  if (!args.includes('--apply')) { console.log('DRY RUN: no database writes.'); return; }
  if (!args.includes('--operator') || !/^[A-Za-z0-9_-]{1,128}$/.test(value('--operator'))) throw new Error('Director operator required');
  const actorUid = value('--operator'), rollback = args.includes('--rollback');
  const baselineId = crypto.createHash('sha256').update(raw).digest('hex');
  const changed = await db.runTransaction(async tx => {
    const [actor, existing] = await Promise.all([tx.get(db.doc(`users/${actorUid}`)), tx.get(ref)]);
    if (actor.data()?.role !== 'director') throw new Error('Operator must be an existing director');
    const before = existing.data();
    if (before && before.baselineId !== baselineId) throw new Error('Baseline mismatch');
    if (rollback && !before) throw new Error('No baseline to rollback');
    const status = rollback ? 'rolled-back' : 'complete';
    if (before?.status === status) return false;
    const profiles = await Promise.all(manifest.adminUids.map(uid => tx.get(db.doc(`users/${uid}`))));
    const eligible = rollback ? [] : manifest.adminUids.filter((_, i) => profiles[i].data()?.role === 'admin');
    tx.set(ref, { baselineId, capturedAt: manifest.capturedAt, adminUids: eligible, status, updatedBy: actorUid, updatedAt: FieldValue.serverTimestamp() });
    tx.set(db.collection('accessAudit').doc(), { actorUid, action: rollback ? 'legacy-admin-read-rollback' : 'legacy-admin-read-restore', target: ref.path,
      before: { adminUids: before?.adminUids || [] }, after: { adminUids: eligible, baselineId }, createdAt: FieldValue.serverTimestamp() });
    tx.set(db.doc('customerAccessState/records'), { updatedAt: FieldValue.serverTimestamp() });
    return true;
  });
  console.log(changed ? 'Completed with audit. No roles, profiles or notifications changed.' : 'Already applied; no changes.');
}
if (require.main === module) main().catch(error => {
  const safe = ['Project and snapshot required', 'Freeze/review a snapshot before apply; never replace an existing baseline', 'Invalid snapshot', 'Director operator required', 'Operator must be an existing director', 'Baseline mismatch', 'No baseline to rollback'];
  console.error(safe.includes(error.message) ? error.message : 'Operation failed; check credentials and database access.'); process.exitCode = 1;
});
