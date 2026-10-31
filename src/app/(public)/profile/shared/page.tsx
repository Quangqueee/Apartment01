'use client';
import { watchQuery } from "@/lib/firestore-listener";
import { useEffect, useRef, useState } from 'react';
import { collection, query, where } from 'firebase/firestore';
import { useAuth } from '@/context/auth-context';
import { db } from '@/firebase';
import { accessApi } from '@/lib/access-client';
import { SHARE_LABELS, type ShareKind } from '@/lib/sharing-policy';
import Header from '@/components/header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ADMIN_PATH } from '@/lib/constants';

type Grant = { id: string; active: boolean; ownerAdminId: string; kind: ShareKind };
export default function Page() {
  const router = useRouter();
  const { user, userData, loading } = useAuth();
  const [grants, setGrants] = useState<Grant[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const generation = useRef(0);
  useEffect(() => {
    generation.current++; setRows([]); setGrants([]); setError(''); setBusy(false);
    if (!user || loading) return;
    if (userData?.role === 'admin' || userData?.role === 'director') {
      router.replace(`/${ADMIN_PATH}/${userData.role === 'director' ? 'access' : 'users'}`);
      return;
    }
    try {
      const q = query(collection(db, 'shareGrants'), where('recipientUid', '==', user.uid));
      return watchQuery(q, snap => {
        generation.current++; setRows([]); setBusy(false);
        setGrants(snap.docs.map(s => ({ ...s.data(), id: s.id } as Grant)).filter(g => g.active && g.kind !== 'bookings'));
      }, () => { generation.current++; setGrants([]); setRows([]); setBusy(false); setError('Không thể tải quyền truy cập.'); });
    } catch { setError('Không thể tải quyền truy cập.'); }
  }, [user?.uid, userData?.role, loading, router]);
  const open = async (g: Grant) => {
    const current = ++generation.current; setRows([]); setBusy(true); setError('');
    try { const result = await accessApi('shared', { ownerAdminId: g.ownerAdminId, kind: g.kind }); if (current === generation.current) setRows(result.rows); }
    catch (e) { if (current === generation.current) setError(e instanceof Error ? e.message : 'Không thể đọc dữ liệu.'); }
    finally { if (current === generation.current) setBusy(false); }
  };
  if (userData?.role === 'admin' || userData?.role === 'director') return null;
  return <><Header /><main className="mx-auto max-w-5xl p-4 space-y-4 overflow-x-hidden">
    <h1 className="text-2xl font-bold">Dữ liệu được chia sẻ</h1>
    {loading ? <p>Đang tải…</p> : !user ? <p>Vui lòng đăng nhập để xem dữ liệu.</p> : <>
      <p className="text-sm">Chỉ xem các danh sách được Giám đốc cấp quyền.</p>
      {error && <p role="alert">{error}</p>}
      {!grants.length && <p>Chưa có dữ liệu được cấp quyền.</p>}
      {grants.map(g => <Card key={g.id}><CardContent className="p-4 space-y-2 break-all"><p>{SHARE_LABELS[g.kind]} · Admin {g.ownerAdminId}</p><Button variant="outline" disabled={busy} onClick={() => open(g)}>Xem danh sách</Button></CardContent></Card>)}
      {busy && <p role="status">Đang tải dữ liệu…</p>}
      {!busy && grants.length > 0 && !rows.length && <p>Chọn danh sách để xem; danh sách có thể chưa có dữ liệu.</p>}
      {rows.map(row => <Card key={`${row.collection}/${row.id}`}><CardContent className="p-4 grid gap-2 sm:grid-cols-2">
        {Object.entries(row).filter(([key]) => !['collection', 'ownerAdminId'].includes(key)).map(([key, value]) => <p key={key} className="text-sm break-words"><span className="font-medium">{({ id: 'Mã bản ghi', displayName: 'Tên', email: 'Email', phoneNumber: 'Điện thoại', role: 'Vai trò', apartmentId: 'Mã căn', apartmentCode: 'Mã căn', clientName: 'Khách', clientPhone: 'Điện thoại khách', name: 'Tên', phone: 'Điện thoại', ctvName: 'CTV', dateTime: 'Thời gian', status: 'Trạng thái' } as Record<string, string>)[key] || key}: </span>{String(value)}</p>)}
      </CardContent></Card>)}
    </>}
  </main></>;
}
