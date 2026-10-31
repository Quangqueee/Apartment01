'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { accessApi, customerAccessApi, operationsApi } from '@/lib/access-client';
import { createRefreshQueue } from '@/lib/refresh-queue';
import { watchDoc } from '@/lib/firestore-listener';
import { doc } from 'firebase/firestore';
import { db } from '@/firebase';

type Action = 'overview' | 'history' | 'bookings' | 'manage' | 'accounts' | 'dashboard' | 'customers';
export function useDirectorResource<T>(action: Action, values: Record<string, unknown> = {}, allowStaff = false) {
  const { user, userData, loading: authLoading } = useAuth();
  const parameters = JSON.stringify(values);
  const identity = `${user?.uid || ''}:${userData?.role || ''}:${action}:${parameters}`;
  const enabled = !authLoading && !!user && (userData?.role === 'director' || allowStaff && action === 'customers' && userData?.role === 'admin');
  const [state, setState] = useState({ identity: '', data: null as T | null, loading: true, refreshing: false, error: '', updatedAt: 0 });
  const active = useRef<{ identity: string; queue: ReturnType<typeof createRefreshQueue<T>> } | null>(null);
  const reload = useCallback(() => active.current?.identity === identity ? active.current.queue.request() : Promise.resolve(), [identity]);
  useEffect(() => {
    setState({ identity, data: null, loading: enabled, refreshing: false, error: '', updatedAt: 0 });
    if (!enabled) return;
    const queue = createRefreshQueue<T>(() => ['dashboard', 'customers'].includes(action) ? operationsApi(action, JSON.parse(parameters)) : ['overview', 'history'].includes(action) ? accessApi(action) : customerAccessApi(action), {
      data: data => setState(previous => ({ ...previous, data, loading: false, error: '', updatedAt: Date.now() })),
      error: error => setState(previous => ({ ...previous, data: null, loading: false, error: error instanceof Error ? error.message : 'Không thể tải dữ liệu.' })),
      busy: refreshing => setState(previous => ({ ...previous, refreshing })),
    });
    active.current = { identity, queue }; void queue.request();
    const unsubscribe = watchDoc(doc(db, 'customerAccessState', 'records'), () => { void queue.request(true); }, error => queue.fail(error));
    const refreshVisible = () => { if (document.visibilityState === 'visible') void queue.request(); };
    const timer = setInterval(refreshVisible, 60000);
    window.addEventListener('focus', refreshVisible);
    return () => { queue.dispose(); unsubscribe(); clearInterval(timer); window.removeEventListener('focus', refreshVisible); if (active.current?.queue === queue) active.current = null; };
  }, [identity, enabled, action, parameters]);
  return { ...(state.identity === identity && enabled ? state : { data: null, loading: enabled, refreshing: false, error: '', updatedAt: 0 }), reload };
}
