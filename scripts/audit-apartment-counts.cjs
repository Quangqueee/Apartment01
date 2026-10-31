// Read-only audit of the three apartment count definitions. Never prints PII.
const fs = require('node:fs');
const { cert, initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

async function main() {
  const credentialPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json';
  const credential = JSON.parse(fs.readFileSync(credentialPath, 'utf8'));
  initializeApp({ credential: cert(credential) });
  const db = getFirestore();
  const col = db.collection('apartments');
  const [all, published, ordered] = await Promise.all([
    col.get(),
    col.where('submissionStatus', '==', 'published').get(),
    col.where('submissionStatus', '==', 'published').orderBy('createdAt', 'desc').get(),
  ]);
  const status = {};
  for (const snap of all.docs) {
    const value = snap.data().submissionStatus ?? '(missing)';
    status[value] = (status[value] || 0) + 1;
  }
  const orderedIds = new Set(ordered.docs.map(snap => snap.id));
  const missingFromListing = published.docs.filter(snap => !orderedIds.has(snap.id));
  console.log(JSON.stringify({ projectId: credential.project_id, all: all.size, bySubmissionStatus: status,
    published: published.size, publishedWithCreatedAt: ordered.size,
    missingFromListing: missingFromListing.map(snap => ({ id: snap.id,
      hasCreatedAt: snap.data().createdAt !== undefined,
      createdAtType: typeof snap.data().createdAt,
      hasUpdatedAt: snap.data().updatedAt !== undefined })) }, null, 2));
}
main().catch(error => { console.error('Audit failed:', error.message); process.exitCode = 1; });
