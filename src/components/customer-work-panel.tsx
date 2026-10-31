'use client';
import { useEffect, useRef, useState } from 'react';
import { useDirectorResource } from '@/hooks/use-director-resource';
import { operationsApi } from '@/lib/access-client';
import { type OperationCustomer, CUSTOMER_STATUS_LABELS } from '@/lib/customer-operations';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

/** Ordinary customer work only: no grant, director identity, audit or role controls. */
export default function CustomerWorkPanel() {
  const [page, setPage] = useState(1), [search, setSearch] = useState(''), [creating, setCreating] = useState(false);
  const [query, setQuery] = useState('');
  useEffect(() => { const timer = setTimeout(() => { setSearch(query); setPage(1); }, 300); return () => clearTimeout(timer); }, [query]);
  const [form, setForm] = useState({ displayName: '', phoneNumber: '', interests: '' });
  const { data, loading, error, reload } = useDirectorResource<{ rows: OperationCustomer[]; total: number; page: number; pageSize: number }>('customers', { page, filters: { search }, workOnly: true }, true);
  const { toast } = useToast(), active = useRef(false), [busy, setBusy] = useState(false);
  const update = async (c: OperationCustomer, status: string) => {
    if (active.current || status === 'untracked') return; active.current = true; setBusy(true);
    try { await operationsApi('work-update', { key: c.key, revision: c.revision, status }); await reload(); }
    catch (e) { toast({ variant: 'destructive', title: e instanceof Error ? e.message : 'Không thể cập nhật tiến độ' }); }
    finally { active.current = false; setBusy(false); }
  };
  const create = async (event: React.FormEvent) => {
    event.preventDefault(); if (active.current) return; active.current = true; setBusy(true);
    try { await operationsApi('create-customer', form); setCreating(false); setForm({ displayName: '', phoneNumber: '', interests: '' }); await reload(); toast({ title: 'Đã thêm khách hàng' }); }
    catch (e) { toast({ variant: 'destructive', title: e instanceof Error ? e.message : 'Không thể thêm khách' }); }
    finally { active.current = false; setBusy(false); }
  };
  return <details className="rounded-xl border bg-background p-4 overflow-x-hidden"><summary className="cursor-pointer font-semibold">Khách hàng cần xử lý {data ? `(${data.total})` : ''}</summary><div className="mt-4 space-y-4">
    <div className="flex flex-wrap gap-2"><Input className="text-base min-w-0 flex-1" aria-label="Tìm khách cần xử lý" placeholder="Tìm khách cần xử lý" value={query} onChange={e => setQuery(e.target.value)} /><Button variant="outline" disabled={busy} onClick={() => setCreating(true)}>Thêm khách hàng</Button><Button variant="outline" disabled={busy} onClick={reload}>Tải lại</Button></div>
    {loading && <p role="status">Đang tải…</p>}{error && <p role="alert">{error}</p>}{!loading && !error && !data?.rows.length && <p className="text-sm text-muted-foreground">Chưa có khách cần xử lý.</p>}
    {data?.rows.map(c => <Card key={c.key}><CardContent className="p-3 space-y-2"><p className="font-medium break-words">{c.displayName || 'Chưa có tên khách'} · {c.phoneNumber || 'Chưa có SĐT'}</p>{c.needs && <p className="text-sm break-words">Nhu cầu: {c.needs}</p>}{c.referralName && <p className="text-xs text-muted-foreground break-words">CTV giới thiệu: {c.referralName}</p>}<label className="block text-sm">Tiến độ<select aria-label={`Tiến độ ${c.displayName}`} className="mt-1 w-full rounded-md border p-2 text-base bg-background" value={c.status} disabled={busy || !c.canProcess} onChange={e => update(c, e.target.value)}>{Object.entries(CUSTOMER_STATUS_LABELS).map(([v, title]) => <option key={v} value={v} disabled={v === 'untracked'}>{title}</option>)}</select></label></CardContent></Card>)}
    {!!data && data.total > data.pageSize && <div className="flex items-center justify-between gap-2"><Button variant="outline" disabled={busy || data.page <= 1} onClick={() => setPage(data.page - 1)}>Trước</Button><span className="text-sm">Trang {data.page}/{Math.ceil(data.total / data.pageSize)}</span><Button variant="outline" disabled={busy || data.page * data.pageSize >= data.total} onClick={() => setPage(data.page + 1)}>Sau</Button></div>}
  </div><Dialog open={creating} onOpenChange={setCreating}><DialogContent><DialogHeader><DialogTitle>Thêm khách hàng</DialogTitle><DialogDescription>Lưu khách cần tư vấn, chưa cần tạo lịch xem nhà.</DialogDescription></DialogHeader><form onSubmit={create} className="space-y-3"><label className="block text-sm">Tên khách<Input className="text-base" required minLength={2} maxLength={100} value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} /></label><label className="block text-sm">Số điện thoại<Input type="tel" className="text-base" required maxLength={20} value={form.phoneNumber} onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value }))} /></label><label className="block text-sm">Nhu cầu<Input className="text-base" maxLength={2000} value={form.interests} onChange={e => setForm(f => ({ ...f, interests: e.target.value }))} /></label><Button type="submit" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu khách hàng'}</Button></form></DialogContent></Dialog>
  </details>;
}
