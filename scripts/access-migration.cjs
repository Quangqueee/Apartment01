// Explicit project + ADC required. Dry run is default; never uses the repository service account file.
const fs = require('node:fs');
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { planOwnership } = require('./access-migration-plan.cjs');
const args = process.argv.slice(2);
const value = name => args[args.indexOf(name) + 1];
const collections = ['users', 'user_bookings', 'ctv_bookings', 'guest_consultations', 'apartments', 'short_term_apartments'];
async function main() {
  if (!args.includes('--project') || !args.includes('--report')) throw new Error('Required: --project PROJECT_ID --report LOCAL_JSON [--mapping REVIEWED_JSON] [--apply]');
  if (args.includes('--apply') && !args.includes('--operator')) throw new Error('--apply requires --operator OPERATOR_UID');
  initializeApp({ projectId: value('--project'), credential: applicationDefault() });
  const db = getFirestore();
  const snapshots = await Promise.all(collections.map(c => db.collection(c).get()));
  const records = snapshots.flatMap((s, i) => s.docs.map(d => ({ collection: collections[i], id: d.id, data: d.data() })));
  const admins = new Set(records.filter(r => r.collection === 'users' && ['admin', 'director'].includes(r.data.role)).map(r => r.id));
  const mapping = args.includes('--mapping') ? JSON.parse(fs.readFileSync(value('--mapping'), 'utf8')) : [];
  const plan = planOwnership(records, admins, mapping);
  // No phone values or profiles are included in reports.
  const report = { projectId: value('--project'), mode: args.includes('--apply') ? 'apply' : 'dry-run', ...plan, applied: [] };
  if (plan.conflicts.length) throw new Error('Existing owners conflict with mapping; no writes performed.');
  fs.writeFileSync(value('--report'), JSON.stringify(report, null, 2));
  if (args.includes('--apply')) {
    for (const change of plan.changes) {
      await db.runTransaction(async tx => {
        const ref = db.doc(change.path);
        const current = (await tx.get(ref)).data();
        const owner = (await tx.get(db.doc(`users/${change.ownerAdminId}`))).data();
        if (!current || current.ownerAdminId || !['admin', 'director'].includes(owner?.role)) throw new Error(`Concurrent change: ${change.path}`);
        tx.update(ref, { ownerAdminId: change.ownerAdminId });
        tx.set(db.collection('accessAudit').doc(), { actorUid: value('--operator'), action: 'migration-owner', target: change.path,
          before: { ownerAdminId: null }, after: { ownerAdminId: change.ownerAdminId }, createdAt: FieldValue.serverTimestamp() });
      });
      report.applied.push(change);
      fs.writeFileSync(value('--report'), JSON.stringify(report, null, 2));
    }
  }
  console.log(`Changes: ${plan.changes.length}; unresolved: ${plan.unresolved.length}; applied: ${report.applied.length}`);
}
main().catch(() => { console.error('Migration failed. Inspect the local report and reviewed mapping; no private data is logged.'); process.exitCode = 1; });
