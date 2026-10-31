'use client';
import { auth } from '@/firebase';

async function authenticatedPost(path: string, action: string, values: Record<string, unknown>) {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('Vui lòng đăng nhập.');
    const response = await fetch(path, {
      method: 'POST', cache: 'no-store',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...values }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Không thể xử lý yêu cầu.');
    return result;
  } catch (error) {
    throw error instanceof Error ? error : new Error('Không thể xử lý yêu cầu.');
  }
}
export function accessApi(action: string, values: Record<string, unknown> = {}) {
  return authenticatedPost('/api/access', action, values);
}
export function customerAccessApi(action: string, values: Record<string, unknown> = {}) {
  return authenticatedPost('/api/customer-access', action, values);
}
export function operationsApi(action: string, values: Record<string, unknown> = {}) {
  return authenticatedPost('/api/operations', action, values);
}
