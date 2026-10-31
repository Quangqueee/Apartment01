'use client';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { customerAccessApi } from '@/lib/access-client';
import { useToast } from '@/hooks/use-toast';
import { useDirectorResource } from '@/hooks/use-director-resource';
import { assignmentPreview, bookingKey as key, bookingWhen, closedBooking, filterWorkBookings, workLoad, type WorkBooking } from '@/lib/booking-workflow';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

type Booking = WorkBooking;
type Admin = { uid: string; displayName: string; email: string };
const statuses: Record<string, string> = { pending: 'Chờ xử lý', approved: 'Đã duyệt lịch', contacted: 'Đã dẫn khách', failed: 'Hủy / từ chối' };
export default function BookingAssignmentManager({ customerBookingKeys = null, clearCustomer }: { customerBookingKeys?: string[] | null; clearCustomer?: () => void }) {
  const { user, userData } = useAuth(), { toast } = useToast();
  const { data, loading, refreshing, error, reload: load } = useDirectorResource<{ rows: Booking[]; admins: Admin[] }>('bookings');
  const bookings = data?.rows || [], admins = data?.admins || [];
  const [selected, setSelected] = useState<string[]>([]);
  const [adminUid, setAdminUid] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('unassigned');
  const [status, setStatus] = useState('open');
  const [day, setDay] = useState('all');
  const [source, setSource] = useState('all');
  const [adminFilter, setAdminFilter] = useState('');
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [preview, setPreview] = useState<{ target: string | null; label: string; plan: ReturnType<typeof assignmentPreview>; payload: { collection: string; id: string; expectedAdminUid: string | null; expectedVersion?: string }[] } | null>(null);
  const selectedAssignments = useRef<Record<string, string | null>>({});
  const selectedVersions = useRef<Record<string, string | undefined>>({});
  useEffect(() => {
    setSelected([]); selectedAssignments.current = {}; selectedVersions.current = {}; setAdminUid(''); setPreview(null);
  }, [user?.uid, userData?.role]);
  const visible = filterWorkBookings(customerBookingKeys ? bookings.filter(b => customerBookingKeys.includes(key(b))) : bookings, { search, assignment: filter, status, day, source, adminUid: adminFilter });
  const selectable = visible.filter(b => !closedBooking(b));
  const hiddenSelection = selected.filter(id => !visible.some(b => key(b) === id)).length;
  const selectedLoad = adminUid ? workLoad(bookings, adminUid) : null;
  const pages = Math.max(1, Math.ceil(visible.length / 25)), currentPage = Math.min(page, pages);
  const current = visible.slice((currentPage - 1) * 25, currentPage * 25);
  const allSelected = !!selectable.length && selectable.every(b => selected.includes(key(b)));
  const toggleAll = () => {
    if (allSelected) { for (const b of selectable) { delete selectedAssignments.current[key(b)]; delete selectedVersions.current[key(b)]; } setSelected(previous => previous.filter(id => !selectable.some(b => key(b) === id))); }
    else { for (const b of selectable) if (!selected.includes(key(b))) { selectedAssignments.current[key(b)] = b.assignedAdminId || null; selectedVersions.current[key(b)] = b.assignmentVersion; } setSelected(previous => [...new Set([...previous, ...selectable.map(key)])]); }
  };
  const prepare = (target: string | null) => {
    const plan = assignmentPreview(bookings, selected, target, bookings);
    if (!plan.changes.length) { toast({ title: 'Không có phân công cần thay đổi', description: 'Các lịch đã đóng, đã có đúng người phụ trách hoặc không còn tồn tại sẽ được bỏ qua.' }); return; }
    setPreview({ target, label: admins.find(a => a.uid === target)?.displayName || '', plan,
      payload: plan.changes.map(b => ({ collection: b.collection, id: b.id, expectedAdminUid: selectedAssignments.current[key(b)] ?? null, expectedVersion: selectedVersions.current[key(b)] })) });
  };
  const assign = async () => {
    if (!preview) return;
    const action = preview, completed: string[] = []; let changed = 0;
    setPreview(null); setBusy(true); setProgress({ completed: 0, total: action.payload.length });
    try {
      for (let i = 0; i < action.payload.length; i += 100) {
        const batch = action.payload.slice(i, i + 100);
        const result = await customerAccessApi('assign-bookings', { adminUid: action.target, bookings: batch });
        changed += result.updatedCount; completed.push(...batch.map(key)); setProgress({ completed: completed.length, total: action.payload.length });
      }
      toast({ title: action.target ? 'Đã phân công dẫn khách' : 'Đã bỏ phân công', description: `${changed} lịch đã thay đổi${action.target ? ` · ${action.label}` : ''}` }); setSelected([]); selectedAssignments.current = {}; selectedVersions.current = {};
    } catch (e) { setSelected([]); selectedAssignments.current = {}; selectedVersions.current = {}; toast({ variant: 'destructive', title: 'Chưa xử lý hết lịch', description: `${completed.length}/${action.payload.length} lịch đã xử lý. ${e instanceof Error ? e.message : 'Vui lòng thử lại.'} Chọn lại các lịch còn cần xử lý.` }); }
    finally { await load(); setBusy(false); }
  };
  if (userData?.role !== 'director') return null;
  if (loading) return <p role="status">Đang tải lịch cần phân công…</p>;
  return <div className="space-y-5 overflow-x-hidden">
    {!!customerBookingKeys && <div className="flex flex-wrap items-center gap-2 rounded-lg border p-3"><p className="text-sm">Đang lọc {customerBookingKeys.length} lịch liên kết với khách đã chọn.</p><Button size="sm" variant="outline" onClick={clearCustomer}>Xem tất cả khách</Button></div>}
    <div className="flex flex-wrap justify-between gap-3"><div className="space-y-1"><h2 className="text-xl font-semibold">Giám đốc phân công Admin dẫn khách</h2><p className="text-sm text-muted-foreground">CTV cung cấp nguồn khách; Admin nội bộ nhận việc dẫn khách. Mặc định chỉ chọn lịch đang mở, theo thứ tự ngày hẹn.</p></div><Button variant="outline" disabled={refreshing || busy} onClick={load}>{refreshing ? 'Đang cập nhật…' : 'Tải lại lịch'}</Button></div>
    <div className="grid gap-3 sm:grid-cols-3">{[['Toàn bộ lịch', bookings.length], ['Chưa phân công', bookings.filter(b => !b.assignedAdminId).length], ['Đã có Admin phụ trách', bookings.filter(b => !!b.assignedAdminId).length]].map(([title, count]) => <Card key={title}><CardContent className="p-4"><p className="text-sm text-muted-foreground">{title}</p><p className="text-2xl font-bold mt-1">{count}</p></CardContent></Card>)}</div>
    {error && <div role="alert" className="space-y-2"><p className="text-red-600">{error}</p><Button variant="outline" onClick={load}>Thử lại</Button></div>}
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="order-last lg:order-first"><CardContent className="p-4 space-y-4">
        <Input className="text-base" aria-label="Tìm lịch cần phân công" placeholder="Tên khách, SĐT, mã căn, CTV gửi khách, Admin phụ trách" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        <div className="flex flex-wrap gap-2">{[['unassigned', 'Chưa phân công'], ['assigned', 'Đã phân công'], ['all', 'Tất cả lịch']].map(([value, title]) => <Button key={value} size="sm" variant={filter === value ? 'default' : 'outline'} onClick={() => { setFilter(value); setPage(1); }}>{title}</Button>)}</div>
        <div className="grid gap-2 sm:grid-cols-2"><select aria-label="Lọc trạng thái lịch" className="rounded-md border p-2 text-base bg-white" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}><option value="open">Lịch đang mở</option><option value="all">Tất cả trạng thái</option>{Object.entries(statuses).map(([v, title]) => <option value={v} key={v}>{title}</option>)}</select><select aria-label="Lọc ngày hẹn" className="rounded-md border p-2 text-base bg-white" value={day} onChange={e => { setDay(e.target.value); setPage(1); }}><option value="all">Mọi ngày hẹn</option><option value="today">Hôm nay</option><option value="overdue">Đã quá ngày, chưa hoàn tất</option></select><select aria-label="Lọc nguồn khách" className="rounded-md border p-2 text-base bg-white" value={source} onChange={e => { setSource(e.target.value); setPage(1); }}><option value="all">Mọi nguồn khách</option><option value="ctv">CTV gửi khách</option><option value="user">Khách đăng ký web</option><option value="guest">Khách vãng lai</option><option value="external">Admin nhập lịch</option></select><select aria-label="Lọc Admin phụ trách" className="rounded-md border p-2 text-base bg-white" value={adminFilter} onChange={e => { setAdminFilter(e.target.value); setPage(1); }}><option value="">Mọi Admin phụ trách</option>{admins.map(a => <option key={a.uid} value={a.uid}>{a.displayName}</option>)}</select></div>
        <div className="flex flex-wrap gap-2 items-center"><Button size="sm" variant="outline" disabled={!selectable.length || busy || !!error} onClick={toggleAll}>{allSelected ? 'Bỏ chọn kết quả' : `Chọn tất cả ${selectable.length} lịch đang mở`}</Button><span className="text-sm">Đã chọn {selected.length}</span>{!!selected.length && <Button size="sm" variant="ghost" disabled={busy} onClick={() => { setSelected([]); selectedAssignments.current = {}; selectedVersions.current = {}; }}>Bỏ chọn hết</Button>}</div>
        {!!hiddenSelection && <p className="text-sm text-amber-700">Có {hiddenSelection} lịch đã chọn nằm ngoài bộ lọc hiện tại. Các lịch này vẫn xuất hiện trong bước xem trước.</p>}
        <p className="text-sm text-muted-foreground">Hiển thị {current.length ? (currentPage - 1) * 25 + 1 : 0}–{Math.min(currentPage * 25, visible.length)} / {visible.length} lịch.</p>
        {!current.length && <p className="py-8 text-center text-muted-foreground">Không có lịch phù hợp.</p>}
        {current.map(b => <label key={key(b)} className={`flex gap-3 items-start rounded-lg border p-3 ${closedBooking(b) ? 'opacity-70' : 'cursor-pointer'}`}><input type="checkbox" disabled={busy || closedBooking(b)} aria-label={`Chọn lịch ${b.name || b.clientName || b.id}`} className="mt-1 h-4 w-4 shrink-0" checked={selected.includes(key(b))} onChange={e => { const checked = e.target.checked; if (checked) { selectedAssignments.current[key(b)] = b.assignedAdminId || null; selectedVersions.current[key(b)] = b.assignmentVersion; } else { delete selectedAssignments.current[key(b)]; delete selectedVersions.current[key(b)]; } setSelected(previous => checked ? [...previous, key(b)] : previous.filter(id => id !== key(b))); }} />
          <div className="min-w-0 space-y-1"><p className="font-medium break-words">{b.name || b.clientName || 'Chưa có tên khách'} · căn {b.apartmentCode || 'Chưa có mã'}</p><p className="text-sm text-muted-foreground break-words">{bookingWhen(b)} · {b.phone || b.clientPhone || 'Chưa có SĐT'}</p><p className="text-xs text-muted-foreground">Nguồn: {b.type === 'ctv' ? `CTV ${b.ctvName || 'gửi khách'}` : b.type === 'guest' ? 'Khách vãng lai' : b.type === 'external' ? 'Admin nhập lịch' : 'Khách đăng ký trên web'}</p><div className="flex flex-wrap gap-2"><Badge variant="secondary">{statuses[b.status] || b.status}</Badge><Badge variant={b.assignedAdminId ? 'outline' : 'secondary'}>{b.assignedAdminName || 'Chưa giao Admin'}</Badge></div>{closedBooking(b) && <p className="text-xs text-muted-foreground">Lịch đã đóng · chỉ xem trong luồng phân công.</p>}</div>
        </label>)}
        {pages > 1 && <div className="flex items-center justify-between"><Button size="sm" variant="outline" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Trước</Button><span className="text-sm">{currentPage}/{pages}</span><Button size="sm" variant="outline" disabled={currentPage >= pages} onClick={() => setPage(currentPage + 1)}>Sau</Button></div>}
      </CardContent></Card>
      <Card className="h-fit order-first lg:order-last lg:sticky lg:top-20"><CardContent className="p-4 space-y-4"><h3 className="font-semibold">Admin nhận việc dẫn khách</h3><select aria-label="Admin nhận việc dẫn khách" className="w-full rounded-md border p-2 text-base bg-white" value={adminUid} disabled={busy} onChange={e => setAdminUid(e.target.value)}><option value="">Chọn Admin nội bộ</option>{[...admins].sort((a, b) => workLoad(bookings, a.uid).active - workLoad(bookings, b.uid).active).map(a => <option key={a.uid} value={a.uid}>{a.displayName || a.email} · {workLoad(bookings, a.uid).active} lịch đang mở</option>)}</select>{!admins.length && <p className="text-sm">Chưa có Admin nhận việc.</p>}{selectedLoad && <div className="rounded-md bg-muted/50 p-3 text-sm space-y-1"><p>Đang phụ trách: <strong>{selectedLoad.active}</strong> lịch mở</p><p>Hẹn hôm nay: {selectedLoad.today} · Quá ngày: {selectedLoad.overdue}</p></div>}<p className="text-sm">{selected.length} lịch đã chọn</p><Button className="w-full" disabled={busy || !selected.length || !adminUid || !!error} onClick={() => prepare(adminUid)}>{busy ? `Đang xử lý ${progress.completed}/${progress.total}…` : 'Xem trước giao / đổi người'}</Button><Button className="w-full" variant="outline" disabled={busy || !selected.length || !!error} onClick={() => prepare(null)}>Xem trước bỏ phân công</Button><p className="text-xs text-muted-foreground">Tải công việc là số lịch chưa hoàn tất/hủy; Giám đốc quyết định người nhận. CTV không nhận lịch chung. Không gửi thông báo phân quyền.</p></CardContent></Card>
    </div>
    {!!selected.length && <div className="sticky bottom-0 z-10 rounded-lg border bg-background p-3 flex justify-between items-center gap-2 lg:hidden"><span className="text-sm">Đã chọn {selected.length} lịch</span><Button disabled={busy || !adminUid || !!error} onClick={() => prepare(adminUid)}>Xem trước giao việc</Button></div>}
    <Dialog open={!!preview} onOpenChange={open => { if (!open) setPreview(null); }}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{preview?.target ? 'Xác nhận giao / đổi Admin' : 'Xác nhận bỏ phân công'}</DialogTitle><DialogDescription>Xem lại tác động trước khi lưu. Mỗi lô tối đa 100 lịch; lỗi một lô sẽ giữ nguyên các lịch trong lô đó.</DialogDescription></DialogHeader>
        {preview && <div className="space-y-3 text-sm">
          <p><strong>{preview.plan.changes.length} lịch</strong>{preview.target ? ` → ${preview.label}` : ' sẽ bỏ người phụ trách'}.</p>
          <p>Đổi từ người đang phụ trách: {preview.plan.reassigning} · Không đổi: {preview.plan.unchanged} · Đã đóng: {preview.plan.closed} · Không còn thấy: {preview.plan.missing}.</p>
          {!!preview.plan.conflicts && <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800">Có {preview.plan.conflicts} mốc giờ trùng với lịch của Admin hoặc trong nhóm đang giao. Kiểm tra khả năng dẫn khách trước khi xác nhận.</p>}
          {!!preview.target && !!preview.plan.duplicateContacts && <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800">Có {preview.plan.duplicateContacts} số liên hệ xuất hiện trong nhiều lịch đang mở. Kiểm tra nguồn khách để tránh giao trùng; hệ thống không tự gộp hoặc xóa lịch.</p>}
          <div className="max-h-48 overflow-y-auto space-y-2">{preview.plan.changes.map(b => <p key={key(b)} className="break-words">{b.name || b.clientName || 'Khách'} · căn {b.apartmentCode || 'N/A'} · {bookingWhen(b)} · {b.assignedAdminName || 'Chưa phân công'}</p>)}</div>
        </div>}
        <DialogFooter><Button variant="outline" onClick={() => setPreview(null)}>Quay lại</Button><Button onClick={assign}>{preview?.target ? 'Xác nhận giao việc' : 'Xác nhận bỏ phân công'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}
