'use client';

// Barrel: re-export leaf SDK + UI helpers. Import SDK from ./app inside this package
// to avoid circular dependencies with provider/client-provider.
export {
  firebaseApp,
  auth,
  db,
  storage,
  initializeFirebase,
  getSdks,
} from './app';

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
