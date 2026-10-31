const fs = require('node:fs');
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const args = process.argv.slice(2);
const value = key => args[args.indexOf(key) + 1];
async function main() {
  for (const key of ['--project', '--report', '--operator']) if (!args.includes(key)) throw new Error(`Required ${key}`);
  const report = JSON.parse(fs.readFileSync(value('--report'), 'utf8'));
  if (report.projectId !== value('--project') || report.mode !== 'apply') throw new Error('Wrong project or dry-run report');
  initializeApp({ projectId: value('--project'), credential: applicationDefault() });
  const db = getFirestore();
  for (const change of report.applied) {
    if (!/^(users|user_bookings|ctv_bookings|guest_consultations|apartments|short_term_apartments)\/[A-Za-z0-9_-]+$/.test(change.path)) throw new Error('Invalid report path');
    await db.runTransaction(async tx => {
      const ref = db.doc(change.path);
      const data = (await tx.get(ref)).data();
      if (!data?.ownerAdminId) return; // Safe to rerun.
      if (data.ownerAdminId !== change.ownerAdminId) throw new Error('Owner changed after migration; manual review required');
      if (!args.includes('--apply')) return;
      tx.update(ref, { ownerAdminId: FieldValue.delete() });
      tx.set(db.collection('accessAudit').doc(), { actorUid: value('--operator'), action: 'migration-rollback', target: ref.path,
        before: { ownerAdminId: change.ownerAdminId }, after: { ownerAdminId: null }, createdAt: FieldValue.serverTimestamp() });
    });
  }
  console.log(args.includes('--apply') ? 'Rollback completed' : 'Rollback dry run completed');
}
main().catch(() => { console.error('Rollback failed; inspect ownership changes before retrying.'); process.exitCode = 1; });
