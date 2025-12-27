'use client';
import { getApp, getApps, initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage'; // 1. Thêm import dịch vụ Storage
import { firebaseConfig } from './config';

let firebaseApp: FirebaseApp;
if (getApps().length === 0) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApp();
}

// Xuất trực tiếp các instance để sử dụng toàn project
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
// 2. Khởi tạo và xuất (export) biến storage để sửa lỗi build
export const storage = getStorage(firebaseApp);

export function initializeFirebase() { return getSdks(firebaseApp); }

export function getSdks(app: FirebaseApp) {
  return {
    firebaseApp: app,
    auth: getAuth(app),
    firestore: getFirestore(app),
    // 3. Cập nhật helper function để đồng bộ với các dịch vụ mới
    storage: getStorage(app)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
// Thêm dòng này vào src/firebase/index.ts
