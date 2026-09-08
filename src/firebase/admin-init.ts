import fs from "fs";
import path from "path";
import { cert, getApps, initializeApp, type App, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { firebaseConfig } from "./config";

const LOCAL_SERVICE_ACCOUNT_FILES = [
  "serviceAccountKey.json",
  "firebase-service-account.json",
];

function parseServiceAccount(raw: string, source: string): ServiceAccount {
  try {
    return JSON.parse(raw) as ServiceAccount;
  } catch {
    throw new Error(
      `File/credentials Admin SDK không phải JSON hợp lệ (${source}).`,
    );
  }
}

function readServiceAccount(): ServiceAccount | null {
  const jsonEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (jsonEnv) {
    return parseServiceAccount(jsonEnv, "FIREBASE_SERVICE_ACCOUNT_JSON");
  }

  const envPath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const candidates = [
    envPath,
    ...LOCAL_SERVICE_ACCOUNT_FILES.map((file) =>
      path.join(process.cwd(), file),
    ),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    if (!fs.existsSync(resolved)) continue;
    return parseServiceAccount(
      fs.readFileSync(resolved, "utf8"),
      resolved,
    );
  }

  return null;
}

/**
 * Firebase Admin SDK — CHỈ dùng trong server actions / API routes.
 * - Local: serviceAccountKey.json hoặc FIREBASE_SERVICE_ACCOUNT_PATH
 * - App Hosting: Application Default Credentials
 */
function createAdminApp(): App {
  const existing = getApps();
  if (existing.length) return existing[0];

  const serviceAccount = readServiceAccount();
  if (serviceAccount) {
    return initializeApp({
      credential: cert(serviceAccount),
      projectId: firebaseConfig.projectId,
    });
  }

  // ADC (Firebase App Hosting / Cloud Run)
  return initializeApp({ projectId: firebaseConfig.projectId });
}

const adminApp = createAdminApp();

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
