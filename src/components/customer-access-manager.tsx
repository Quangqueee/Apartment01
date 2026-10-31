'use client';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useDirectorResource } from '@/hooks/use-director-resource';
import { operationsApi } from '@/lib/access-client';
import { CUSTOMER_STATUS_LABELS, type CustomerFilters, type OperationCustomer } from '@/lib/customer-operations';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

type Admin = { uid: string; displayName: string; email: string };
type Result = { rows: OperationCustomer[]; total: number; page: number; pageSize: number; admins: Admin[]; collaborators: { uid: string; displayName: string }[]; baselineReady: boolean };
type Preview = { jobId: string; total: number; legacy: number; reassigning: number; sample: string[]; operation: string; labels: string[] };
const selectClass = 'w-full min-w-0 rounded-md border bg-background p-2 text-base';
export default function CustomerAccessManager({ accounts = [], openBookings }: { accounts?: { uid: string; label: string }[]; openBookings?: (keys: string[]) => void }) {
  const { user, userData } = useAuth(), { toast } = useToast();
  const [filters, setFilters] = useState<CustomerFilters>({}), [page, setPage] = useState(1), [query, setQuery] = useState('');
  const { data, loading, refreshing, error, reload } = useDirectorResource<Result>('customers', { filters, page, pageSize: 25 });
  const rows = data?.rows || [], admins = data?.admins || [];
  const [selected, setSelected] = useState<string[]>([]), [all, setAll] = useState(false), [recipients, setRecipients] = useState<string[]>([]);
  const [excluded, setExcluded] = useState<string[]>([]);
  const [assignee, setAssignee] = useState(''), [busy, setBusy] = useState(false), [preview, setPreview] = useState<Preview | null>(null);
  const [detail, setDetail] = useState<OperationCustomer | null>(null), [detailError, setDetailError] = useState(''), [detailLoading, setDetailLoading] = useState(false);
  const [progress, setProgress] = useState({ processed: 0, total: 0 });
  const active = useRef(false), epoch = useRef(0);
  useEffect(() => { const timer = setTimeout(() => { setFilters(f => ({ ...f, search: query })); setPage(1); }, 300); return () => clearTimeout(timer); }, [query]);
  useEffect(() => { setSelected([]); setExcluded([]); setAll(false); setPreview(null); }, [JSON.stringify(filters), user?.uid, userData?.role]);
  useEffect(() => { epoch.current++; setDetail(null); setDetailError(''); return () => { epoch.current++; }; }, [user?.uid, userData?.role]);
  const changeFilter = (name: keyof CustomerFilters, value: string) => { setFilters(f => { const next = { ...f, [name]: value }; if (!value) delete next[name]; return next; }); setPage(1); };
  const label = (id: string) => admins.find(a => a.uid === id)?.displayName || accounts.find(a => a.uid === id)?.label || id;
  const count = all ? Math.max(0, (data?.total || 0) - excluded.length) : selected.length;
  const pageSelected = !!rows.length && rows.every(c => all ? !excluded.includes(c.key) : selected.includes(c.key));
  const formerReaders = [...new Set(rows.filter(c => all ? !excluded.includes(c.key) : selected.includes(c.key)).flatMap(c => c.adminReaders || []))].filter(id => !admins.some(a => a.uid === id));
  const togglePage = () => {
    if (all) setExcluded(previous => pageSelected ? [...new Set([...previous, ...rows.map(c => c.key)])] : previous.filter(key => !rows.some(c => c.key === key)));
    else setSelected(previous => pageSelected ? previous.filter(key => !rows.some(c => c.key === key)) : [...new Set([...previous, ...rows.map(c => c.key)])]);
  };
  const prepare = async (operation: 'assign' | 'grant' | 'revoke') => {
    if (active.current || !count) return; active.current = true; setBusy(true);
    try {
      const adminIds = operation === 'assign' ? assignee ? [assignee] : [] : operation === 'grant' ? recipients.filter(id => admins.some(a => a.uid === id)) : recipients;
      const result = await operationsApi('preview', { selection: all ? { mode: 'filter', filters, excludeKeys: excluded } : { mode: 'ids', keys: selected }, operation, adminIds });
      setPreview({ ...result, operation, labels: adminIds.map(label) });
    } catch (e) { toast({ variant: 'destructive', title: e instanceof Error ? e.message : 'Không thể chuẩn bị thao tác' }); }
    finally { active.current = false; setBusy(false); }
  };
  const apply = async () => {
    if (!preview || active.current) return; active.current = true; setBusy(true);
    const plan = preview; setPreview(null); let processed = 0, changed = 0;
    setProgress({ processed: 0, total: plan.total });
    try {
      while (processed < plan.total) {
        let result;
        try { result = await operationsApi('apply', { jobId: plan.jobId, offset: processed }); }
        catch { result = await operationsApi('apply', { jobId: plan.jobId, offset: processed }); }
        if (result.processed <= processed) throw new Error('Không thể tiếp tục lô. Tải lại dữ liệu.');
        processed = result.processed; changed = result.changed; setProgress({ processed, total: plan.total });
      }
      toast({ title: 'Đã hoàn tất', description: `${changed}/${processed} khách có thay đổi. Không gửi thông báo phân quyền.` });
    } catch (e) { toast({ variant: 'destructive', title: 'Chưa hoàn tất toàn bộ', description: `${processed}/${plan.total} khách đã xử lý. ${e instanceof Error ? e.message : 'Tải lại trước khi tiếp tục.'}` }); }
    finally { active.current = false; setBusy(false); setSelected([]); setAll(false); setExcluded([]); await reload(); }
  };
  const showDetail = async (key: string) => {
    const session = ++epoch.current; setDetail(null); setDetailError(''); setDetailLoading(true);
    try { const result = await operationsApi('detail', { key }); if (session === epoch.current) setDetail(result.customer); }
    catch (e) { if (session === epoch.current) setDetailError(e instanceof Error ? e.message : 'Không thể tải chi tiết'); }
    finally { if (session === epoch.current) setDetailLoading(false); }
  };
  if (userData?.role !== 'director') return <p role="alert">Không có quyền truy cập.</p>;
  return <div className="space-y-4 overflow-x-hidden">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-xl font-semibold">Khách hàng tập trung</h2><p className="text-sm text-muted-foreground">Giao việc và cấp quyền xem là hai thao tác riêng. Giữ nguyên người tạo, nguồn giới thiệu và phản hồi hiện tại.</p></div><Button variant="outline" disabled={busy || refreshing} onClick={reload}>Tải lại</Button></div>
    <Input type="search" className="text-base" aria-label="Tìm khách hàng" placeholder="Tên, điện thoại, email hoặc CTV giới thiệu" value={query} onChange={e => setQuery(e.target.value)} disabled={busy} />
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      <select aria-label="Lọc Admin phụ trách khách" className={selectClass} disabled={busy} value={filters.assignedAdminId || ''} onChange={e => changeFilter('assignedAdminId', e.target.value)}><option value="">Mọi Admin phụ trách</option>{admins.map(a => <option key={a.uid} value={a.uid}>{a.displayName}</option>)}</select>
      <select aria-label="Lọc CTV giới thiệu" className={selectClass} disabled={busy} value={filters.ctvId || ''} onChange={e => changeFilter('ctvId', e.target.value)}><option value="">Mọi CTV giới thiệu</option>{data?.collaborators.map(c => <option key={c.uid} value={c.uid}>{c.displayName}</option>)}</select>
      <select aria-label="Lọc khách cũ mới" className={selectClass} disabled={busy} value={filters.age || 'all'} onChange={e => changeFilter('age', e.target.value)}><option value="all">Khách cũ và mới</option><option value="legacy">Khách cũ · mọi Admin xem</option><option value="new">Khách mới</option><option value="unknown">Chưa xác định cũ/mới</option></select>
      <select aria-label="Lọc phân công khách" className={selectClass} disabled={busy} value={filters.assignment || 'all'} onChange={e => changeFilter('assignment', e.target.value)}><option value="all">Mọi phân công</option><option value="unassigned">Chưa giao Admin</option><option value="assigned">Đã giao Admin</option></select>
      <select aria-label="Lọc tiến độ khách" className={selectClass} disabled={busy} value={filters.status || 'all'} onChange={e => changeFilter('status', e.target.value)}><option value="all">Mọi tiến độ xử lý</option>{Object.entries(CUSTOMER_STATUS_LABELS).map(([v, title]) => <option key={v} value={v}>{title}</option>)}</select>
      <select aria-label="Lọc nguồn khách" className={selectClass} disabled={busy} value={filters.source || 'all'} onChange={e => changeFilter('source', e.target.value)}><option value="all">Mọi nguồn khách</option><option value="account">Tài khoản khách</option><option value="ctv">CTV chuyển khách</option><option value="guest">Khách vãng lai</option><option value="manual">Admin nhập</option></select>
      <label className="text-xs">Tạo từ ngày<Input type="date" className="text-base" disabled={busy} value={filters.createdFrom || ''} onChange={e => changeFilter('createdFrom', e.target.value)} /></label><label className="text-xs">Đến ngày<Input type="date" className="text-base" disabled={busy} value={filters.createdTo || ''} onChange={e => changeFilter('createdTo', e.target.value)} /></label>
    </div>
    {error && <div role="alert" className="rounded-lg border p-3"><p>{error}</p><Button variant="outline" onClick={reload}>Thử lại</Button></div>}
    {loading && <p role="status">Đang tải khách hàng…</p>}
    <div className="flex flex-wrap items-center gap-2"><Button variant="outline" disabled={busy || !rows.length || !!error} onClick={togglePage}>{pageSelected && !all ? 'Bỏ chọn trang' : 'Chọn trang hiện tại'}</Button><Button variant="outline" disabled={busy || !data?.total || !!error} onClick={() => { setAll(true); setSelected([]); setExcluded([]); }}>Chọn toàn bộ {data?.total || 0} kết quả</Button><span className="text-sm">Đã chọn {count}{all ? ' khách theo bộ lọc ở backend' : ' khách'}</span>{!!count && <Button variant="ghost" disabled={busy} onClick={() => { setSelected([]); setAll(false); setExcluded([]); }}>Bỏ chọn</Button>}</div>
    {!!count && <Card className="border-primary/40"><CardContent className="p-4 space-y-4"><h3 className="font-semibold">Thao tác với {count} khách đã chọn</h3><div className="grid gap-4 lg:grid-cols-2"><div className="space-y-2"><label className="text-sm font-medium" htmlFor="customer-assignee">Giao công việc cho một Admin</label><select id="customer-assignee" className={selectClass} value={assignee} disabled={busy} onChange={e => setAssignee(e.target.value)}><option value="">Bỏ phân công hiện tại</option>{admins.map(a => <option key={a.uid} value={a.uid}>{a.displayName}</option>)}</select><Button disabled={busy || !!error} onClick={() => prepare('assign')}>Xem trước {assignee ? 'giao / chuyển khách' : 'bỏ phân công'}</Button></div><div className="space-y-2"><p className="text-sm font-medium">Chỉ cấp quyền xem</p><Button size="sm" variant="outline" disabled={busy} onClick={() => setRecipients(recipients.length === Math.min(50, admins.length) ? [] : admins.slice(0, 50).map(a => a.uid))}>Chọn / bỏ chọn mọi Admin</Button><div className="max-h-40 overflow-y-auto space-y-2">{admins.map(a => <label key={a.uid} className="flex items-start gap-2 text-sm"><input type="checkbox" disabled={busy || !recipients.includes(a.uid) && recipients.length >= 50} checked={recipients.includes(a.uid)} onChange={e => { const checked = e.target.checked; setRecipients(r => checked ? [...r, a.uid] : r.filter(id => id !== a.uid)); }} /><span className="break-words">{a.displayName} · {a.email}</span></label>)}</div><div className="flex flex-wrap gap-2"><Button disabled={busy || !recipients.some(id => admins.some(a => a.uid === id)) || !!error} onClick={() => prepare('grant')}>Cấp quyền xem</Button><Button variant="outline" disabled={busy || !recipients.length || !!error} onClick={() => prepare('revoke')}>Thu hồi quyền riêng</Button></div>{!!formerReaders.length && <div className="space-y-2 border-t pt-2"><p className="text-xs text-muted-foreground">Quyền cũ trên các khách đã chọn trong trang: tài khoản dưới đây chỉ dùng để thu hồi.</p>{formerReaders.map(id => <label key={id} className="flex items-start gap-2 text-sm"><input type="checkbox" disabled={busy || !recipients.includes(id) && recipients.length >= 50} checked={recipients.includes(id)} onChange={e => { const checked = e.target.checked; setRecipients(r => checked ? [...r, id] : r.filter(uid => uid !== id)); }} /><span className="min-w-0 break-all">{label(id)} · Không còn là Admin</span></label>)}</div>}</div></div><p className="text-xs text-muted-foreground">Không cấp quyền sửa, xóa, xuất, chia sẻ tiếp hoặc xem số chủ nhà thật. Thu hồi quyền riêng vẫn giữ quyền khách cũ, chủ quản lý và người được giao việc.</p>{busy && <p role="status">Đang xử lý {progress.processed}/{progress.total}…</p>}</CardContent></Card>}
    {!loading && !error && !rows.length && <p className="py-8 text-center text-muted-foreground">Không có khách phù hợp.</p>}
    <div className="grid gap-3">{rows.map(c => <Card key={c.key}><CardContent className="p-4 flex items-start gap-3"><input type="checkbox" aria-label={`Chọn khách ${c.displayName || c.key}`} className="mt-1 h-4 w-4 shrink-0" disabled={busy} checked={all ? !excluded.includes(c.key) : selected.includes(c.key)} onChange={e => { const checked = e.target.checked; if (all) { setExcluded(previous => checked ? previous.filter(k => k !== c.key) : [...new Set([...previous, c.key])]); return; } setSelected(previous => checked ? [...new Set([...previous, c.key])] : previous.filter(k => k !== c.key)); }} /><div className="min-w-0 flex-1 space-y-2"><div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><p className="font-semibold break-words">{c.displayName || 'Chưa có tên khách'}</p><p className="text-sm text-muted-foreground break-all">{c.phoneNumber || 'Chưa có SĐT'} {c.email && `· ${c.email}`}</p></div><Button size="sm" variant="outline" disabled={busy} onClick={() => showDetail(c.key)}>Chi tiết</Button></div><div className="flex flex-wrap gap-2"><Badge variant="secondary">{c.legacy ? 'Khách cũ · mọi Admin xem' : c.age === 'new' ? 'Khách mới' : 'Chưa rõ cũ/mới'}</Badge><Badge variant="outline">{CUSTOMER_STATUS_LABELS[c.status]}</Badge><Badge variant="outline">{c.assignedAdminId ? `Phụ trách: ${label(c.assignedAdminId)}` : 'Chưa giao công việc'}</Badge></div><p className="text-xs text-muted-foreground break-words">Người tạo: {c.createdByAdminId ? label(c.createdByAdminId) : 'Chưa xác định'} · Chủ quản lý: {c.ownerAdminId ? label(c.ownerAdminId) : 'Chưa xác định'} · Nguồn: {c.referralName || ({ account: 'Tài khoản web', guest: 'Vãng lai', manual: 'Admin nhập', ctv: 'CTV' } as Record<string, string>)[c.source]}</p><p className="text-xs text-muted-foreground">Tạo: {c.createdAt ? new Date(c.createdAt).toLocaleDateString('vi-VN', { timeZone: 'Asia/Bangkok' }) : 'Chưa xác định'} · Cập nhật: {c.updatedAt ? new Date(c.updatedAt).toLocaleDateString('vi-VN', { timeZone: 'Asia/Bangkok' }) : 'Chưa cập nhật'}</p></div></CardContent></Card>)}</div>
    {!!data && <div className="flex flex-wrap items-center justify-between gap-2 text-sm"><span>{data.total} kết quả · Trang {data.page}/{Math.max(1, Math.ceil(data.total / data.pageSize))}</span><div className="flex gap-2"><Button variant="outline" disabled={busy || data.page <= 1} onClick={() => setPage(data.page - 1)}>Trước</Button><Button variant="outline" disabled={busy || data.page * data.pageSize >= data.total} onClick={() => setPage(data.page + 1)}>Sau</Button></div></div>}
    <Dialog open={!!preview} onOpenChange={open => { if (!open) setPreview(null); }}><DialogContent className="max-h-[85dvh] overflow-y-auto"><DialogHeader><DialogTitle>Xác nhận {preview?.operation === 'assign' ? 'phân công khách' : preview?.operation === 'grant' ? 'cấp quyền xem' : 'thu hồi quyền riêng'}</DialogTitle><DialogDescription>Backend đã chốt đúng các khách hiện có. Khách phát sinh sau bước này không được tự thêm vào lô.</DialogDescription></DialogHeader>{preview && <div className="space-y-3 text-sm"><p><strong>{preview.total} khách</strong> → {preview.labels.join(', ') || 'Bỏ người phụ trách'}.</p><p>Ví dụ: {preview.sample.join(', ')}.</p>{preview.operation === 'assign' && <p>{preview.reassigning} khách sẽ đổi/bỏ người phụ trách. Người tạo và CTV giới thiệu giữ nguyên. Lịch dẫn cần phân công riêng.</p>}{!!preview.legacy && <p>{preview.legacy} khách cũ giữ quyền xem mặc định cho mọi Admin; cấp quyền riêng được bỏ qua để tránh dư thừa.</p>}<p>Không gửi thông báo phân quyền. Nếu một lô lỗi, giao diện báo phần đã xử lý để kiểm tra trước khi tiếp tục.</p></div>}<DialogFooter><Button variant="outline" onClick={() => setPreview(null)}>Quay lại</Button><Button disabled={busy} onClick={apply}>Xác nhận thực hiện</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={!!detail || detailLoading || !!detailError} onOpenChange={open => { if (!open) { epoch.current++; setDetail(null); setDetailLoading(false); setDetailError(''); } }}><DialogContent><DialogHeader><DialogTitle>Chi tiết khách hàng</DialogTitle><DialogDescription>Hồ sơ và nguồn gốc được giữ độc lập với người đang nhận việc.</DialogDescription></DialogHeader>{detailLoading ? <p role="status">Đang tải…</p> : detailError ? <p role="alert">{detailError}</p> : detail && <div className="space-y-3 text-sm break-words"><p>{detail.displayName} · {detail.phoneNumber} · {detail.email}</p><p>Nhu cầu: {detail.needs || 'Chưa cập nhật'}.</p><p>Admin phụ trách: {detail.assignedAdminId ? label(detail.assignedAdminId) : 'Chưa giao'}.</p><p>Được cấp quyền riêng: {detail.adminReaders?.map(label).join(', ') || 'Chưa cấp'}.</p><label className="block space-y-2">Tiến độ xử lý<select className={selectClass} value={detail.status} onChange={async e => { const status = e.target.value; if (status === 'untracked') return; try { await operationsApi('work-update', { key: detail.key, revision: detail.revision, status }); await showDetail(detail.key); await reload(); } catch (error) { toast({ variant: 'destructive', title: error instanceof Error ? error.message : 'Không thể cập nhật' }); } }}>{Object.entries(CUSTOMER_STATUS_LABELS).map(([v, title]) => <option key={v} value={v} disabled={v === 'untracked'}>{title}</option>)}</select></label><Button variant="outline" onClick={() => { setDetail(null); openBookings?.(detail.bookingKeys); }}>Mở phân công lịch dẫn</Button></div>}</DialogContent></Dialog>
  </div>;
}
