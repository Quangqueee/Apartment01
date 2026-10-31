'use client';
import CustomerAccessManager from '@/components/customer-access-manager';
import DirectorAccountDirectory from '@/components/director-account-directory';
import BookingAssignmentManager from '@/components/booking-assignment-manager';
import DirectorActivity from '@/components/director-activity';
import DirectorDashboard from '@/components/director-dashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { accessApi } from '@/lib/access-client';
import { useDirectorResource } from '@/hooks/use-director-resource';
import { SHARE_LABELS, SHARE_KINDS, type ShareKind } from '@/lib/sharing-policy';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ADMIN_PATH } from '@/lib/constants';

type Account = { uid: string; label: string; role: string; email?: string };
type ShareRequest = { id: string; ownerAdminId: string; kind: ShareKind; proposedRecipients: string[];
  approvedRecipients?: string[]; status: string; note: string; reviewedBy?: string };
type Grant = { id: string; ownerAdminId: string; kind: ShareKind; recipientUid: string; active: boolean };
const emptyAccounts: Account[] = [], emptyRequests: ShareRequest[] = [], emptyGrants: Grant[] = [];
const selectClass = 'w-full rounded-md border p-2 text-base bg-white';
const roleLabels: Record<string, string> = { user: 'Khách hàng', collaborator: 'CTV', landlord: 'Chủ nhà', admin: 'Admin', director: 'Giám đốc' };
const collectionLabels: Record<string, string> = { users: 'Khách hàng / CTV', user_bookings: 'Lịch của khách hàng', ctv_bookings: 'Lịch của CTV', guest_consultations: 'Lịch tư vấn khách vãng lai', apartments: 'Căn hộ', short_term_apartments: 'Căn hộ ngắn hạn' };
function AccountPicker({ accounts, selected, onChange }: {
  accounts: Account[]; selected: string[]; onChange: (values: string[]) => void;
}) {
  const [search, setSearch] = useState('');
  const visible = accounts.filter(a => `${a.label} ${a.email || ''} ${a.uid}`.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi')));
  return <div className="space-y-2">
    <Input aria-label="Tìm tài khoản nhận quyền" placeholder="Tìm tên hoặc email người nhận quyền" value={search} onChange={e => setSearch(e.target.value)} className="text-base" />
    <div className="max-h-48 overflow-y-auto rounded border p-2 space-y-2">
      {visible.map(a =>
        <label className="flex gap-2 items-start text-sm" key={a.uid}>
          <input type="checkbox" className="mt-1" disabled={!selected.includes(a.uid) && selected.length >= 50} checked={selected.includes(a.uid)} onChange={e => onChange(e.target.checked ? [...selected, a.uid] : selected.filter(uid => uid !== a.uid))} />
          <span className="min-w-0 break-words">{a.label} · {roleLabels[a.role] || 'Chưa xác định'}<span className="block text-xs text-muted-foreground break-all">{a.email || 'Chưa có email'}</span></span>
        </label>)}
      {!visible.length && <p>Không có tài khoản phù hợp.</p>}
    </div>
    <p className="text-sm">{visible.length}/{accounts.length} hồ sơ phù hợp · đã chọn {selected.length} người nhận. Mỗi phạm vi tối đa 50 người; đây là giới hạn chọn, không phải tổng số tài khoản.</p>
  </div>;
}
function ReviewCard({ item, accounts, run, busy }: { item: ShareRequest; accounts: Account[];
  run: (action: string, values: Record<string, unknown>) => Promise<void>; busy: boolean }) {
  const eligibleAccounts = item.kind === 'bookings' ? accounts.filter(a => a.role === 'admin') : accounts;
  const [selected, setSelected] = useState(item.proposedRecipients.filter(uid => eligibleAccounts.some(a => a.uid === uid)));
  const owner = accounts.find(a => a.uid === item.ownerAdminId);
  return <Card><CardContent className="p-4 space-y-3">
    <p className="font-medium break-all">{owner?.label || item.ownerAdminId} · {SHARE_LABELS[item.kind]}</p>
    <p className="text-sm">Phạm vi: toàn bộ danh sách thuộc Admin này.</p>
    <p className="whitespace-pre-wrap break-words">{item.note}</p>
    <p className="text-sm">Đề nghị: {item.proposedRecipients.map(uid => accounts.find(a => a.uid === uid)?.label || uid).join(', ')}</p>
    <AccountPicker accounts={eligibleAccounts} selected={selected} onChange={setSelected} />
    <div className="flex flex-wrap gap-2">
      <Button disabled={busy} onClick={() => run('review', { id: item.id, decision: 'approved', recipients: selected })}>Duyệt danh sách đã chọn</Button>
      <Button variant="outline" disabled={busy} onClick={() => run('review', { id: item.id, decision: 'rejected', recipients: [] })}>Từ chối</Button>
    </div>
    <p className="text-xs text-muted-foreground">Duyệt sẽ thay thế danh sách đang được cấp cho phạm vi này.</p>
  </CardContent></Card>;
}

export default function AccessManagement() {
  const { user, userData, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const director = userData?.role === 'director';
  const { data, loading, error, reload: load } = useDirectorResource<{ accounts: Account[]; requests: ShareRequest[]; grants: Grant[]; legacyAdminAccess: string[] }>('overview');
  const accounts = data?.accounts || emptyAccounts, requests = data?.requests || emptyRequests, grants = data?.grants || emptyGrants;
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('dashboard');
  const [bookingKeys, setBookingKeys] = useState<string[] | null>(null);
  const [kind, setKind] = useState<ShareKind>('bookings');
  const [recipients, setRecipients] = useState<string[]>([]);
  const recipientDraft = useRef({ scope: '', dirty: false });
  const [owner, setOwner] = useState('');
  const [targetUid, setTargetUid] = useState('');
  const [targetRole, setTargetRole] = useState('admin');
  const [assignCollection, setAssignCollection] = useState('users');
  const [unassigned, setUnassigned] = useState<{ id: string; label: string }[]>([]);
  const [assignId, setAssignId] = useState('');
  const [assignOwner, setAssignOwner] = useState('');
  const summary = { legacyAdmins: data?.legacyAdminAccess || [] };
  const label = (uid: string) => accounts.find(a => a.uid === uid)?.label || uid;
  useEffect(() => {
    setUnassigned([]); setAssignId(''); setAssignOwner(''); setTargetUid(''); setOwner(''); setRecipients([]);
    recipientDraft.current = { scope: '', dirty: false };
  }, [user?.uid, userData?.role]);
  useEffect(() => {
    const scope = `${owner}/${kind}`;
    if (recipientDraft.current.scope !== scope) recipientDraft.current = { scope, dirty: false };
    if (director && !recipientDraft.current.dirty) setRecipients(grants.filter(g => g.active && g.ownerAdminId === owner && g.kind === kind).map(g => g.recipientUid));
  }, [director, owner, kind, grants]);
  const run = async (action: string, values: Record<string, unknown>) => {
    setBusy(true);
    try { await accessApi(action, values); if (action === 'grant') recipientDraft.current.dirty = false; toast({ title: 'Đã xử lý yêu cầu' }); await load(); }
    catch (e) { toast({ variant: 'destructive', title: e instanceof Error ? e.message : 'Không thể xử lý' }); }
    finally { setBusy(false); }
  };
  const fetchUnassigned = async () => {
    setBusy(true); setUnassigned([]); setAssignId('');
    try { const result = await accessApi('unassigned', { collection: assignCollection }); setUnassigned(result.rows); }
    catch (e) { toast({ variant: 'destructive', title: e instanceof Error ? e.message : 'Không thể tải' }); }
    finally { setBusy(false); }
  };
  if (authLoading || loading) return <p role="status">Đang tải…</p>;
  if (!director) return <p role="alert">Không có quyền truy cập.</p>;
  return <div className="space-y-6 overflow-x-hidden">
    <div className="space-y-1"><h1 className="text-2xl font-bold">Điều hành của Giám đốc</h1><p className="text-sm text-muted-foreground">Quản lý khách hàng, giao việc và theo dõi lịch dẫn trên cùng một khu vực.</p></div>
    <Tabs value={tab} onValueChange={setTab} className="space-y-5">
      <TabsList className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 w-full h-auto gap-1">
        <TabsTrigger value="dashboard" className="py-2 whitespace-normal">Tổng quan vận hành</TabsTrigger>
        <TabsTrigger value="settings" className="py-2 whitespace-normal">Phân công dẫn khách</TabsTrigger>
        <TabsTrigger value="customers" className="py-2 whitespace-normal">Khách hàng tập trung</TabsTrigger>
        <TabsTrigger value="accounts" className="py-2 whitespace-normal">Admin, CTV & tài khoản</TabsTrigger>
        <TabsTrigger value="administration" className="py-2 whitespace-normal">Phân công & vai trò</TabsTrigger>
        <TabsTrigger value="history" className="py-2 whitespace-normal">Lịch sử thao tác</TabsTrigger>
      </TabsList>
      <TabsContent value="dashboard"><DirectorDashboard navigate={setTab} /></TabsContent>
      <TabsContent value="customers"><CustomerAccessManager accounts={accounts} openBookings={keys => { setBookingKeys(keys.length ? keys : null); setTab('settings'); }} /></TabsContent>
      <TabsContent value="accounts"><DirectorAccountDirectory /></TabsContent>
      <TabsContent value="history"><DirectorActivity accounts={accounts} /></TabsContent>
      <TabsContent value="settings" className="space-y-5">
    <BookingAssignmentManager customerBookingKeys={bookingKeys} clearCustomer={() => setBookingKeys(null)} />
    <details className="rounded-lg border p-4"><summary className="font-semibold cursor-pointer">Quyền xem của Admin cũ</summary>
    <Card><CardContent className="p-4 space-y-3"><h2 className="font-semibold">Admin cũ xem lịch và CTV trong danh sách thông thường</h2>
      <p className="text-sm">Admin cũ vẫn xem các lịch cũ đã chốt và danh sách CTV. Lịch mới theo phạm vi quản lý, phân công hoặc quyền xem riêng. CTV là đối tác ngoài cung cấp nguồn khách; Admin nội bộ nhận việc dẫn khách.</p>
      {summary.legacyAdmins.length ? <p className="text-sm">Admin hiện có quyền: {summary.legacyAdmins.map(label).join(', ')}.</p> : <p role="status" className="text-sm text-amber-700">Chưa áp dụng snapshot Admin cũ. Sau khi áp dụng, quyền xem được cập nhật tự động.</p>}
      <div className="flex flex-wrap gap-2"><Button variant="outline" asChild><a href={`/${ADMIN_PATH}/bookings`}>Mở danh sách lịch</a></Button><Button variant="outline" asChild><a href={`/${ADMIN_PATH}/users`}>Mở danh sách khách hàng & CTV</a></Button></div>
    </CardContent></Card>
    </details>
    <details className="rounded-lg border p-4 space-y-4"><summary className="cursor-pointer font-semibold">Quyền xem bổ sung và lịch sử duyệt</summary><p className="text-sm text-muted-foreground mt-3">Cấp quyền đọc danh sách không phải phân công dẫn khách. Riêng lịch xem nhà chỉ chọn tài khoản Admin nội bộ; không cấp lịch cho CTV.</p>
    {error && <div role="alert"><p>{error}</p><Button variant="outline" onClick={load}>Thử lại</Button></div>}
    <Card><CardContent className="p-4 space-y-3">
      <h2 className="font-semibold">Chia sẻ danh sách của một Admin</h2>
      {director && <select aria-label="Admin sở hữu" className={selectClass} value={owner} onChange={e => setOwner(e.target.value)}>
        <option value="">Bước 1 · Chọn Admin quản lý dữ liệu</option>{accounts.filter(a => ['admin', 'director'].includes(a.role)).map(a => <option value={a.uid} key={a.uid}>{a.label} · {a.email || roleLabels[a.role]}</option>)}
      </select>}
      <select aria-label="Loại dữ liệu" className={selectClass} value={kind} onChange={e => setKind(e.target.value as ShareKind)}>
        {SHARE_KINDS.filter(k => k !== 'customers').map(k => <option key={k} value={k}>{SHARE_LABELS[k]}</option>)}
      </select>
      <p className="text-sm">{owner ? `Chia sẻ ${SHARE_LABELS[kind].toLocaleLowerCase('vi')} do ${label(owner)} quản lý. Chỉ cấp quyền xem.` : 'Chọn Admin quản lý và loại danh sách trước, rồi chọn người nhận quyền bên dưới.'}</p>
      <h3 className="text-sm font-medium">Bước 2 · Chọn tài khoản nhận quyền</h3>
      <AccountPicker accounts={kind === 'bookings' ? accounts.filter(a => a.role === 'admin') : accounts} selected={recipients} onChange={values => { recipientDraft.current.dirty = true; setRecipients(values); }} />
      <Button disabled={busy || !owner} onClick={() => run('grant', { ownerAdminId: owner, kind, recipients })}>
        {busy ? 'Đang xử lý…' : `Lưu quyền xem cho ${recipients.length} tài khoản`}
      </Button>
      {director && <p className="text-sm">Bỏ chọn tài khoản để thu hồi. Danh sách trống thu hồi toàn bộ phạm vi.</p>}
    </CardContent></Card>
    {director && <section className="space-y-3"><h2 className="text-lg font-semibold">Đề nghị chờ duyệt</h2>
      {!requests.some(r => r.status === 'pending') && <p>Không có đề nghị chờ duyệt.</p>}
      {requests.filter(r => r.status === 'pending' && r.kind !== 'customers').map(r => <ReviewCard key={r.id} item={r} accounts={accounts} run={run} busy={busy} />)}
    </section>}
    <section className="space-y-2"><h2 className="text-lg font-semibold">Trạng thái đề nghị</h2>
      {!requests.length && <p>Chưa có đề nghị.</p>}
      {requests.map(r => <Card key={r.id}><CardContent className="p-4 text-sm space-y-1 break-words">
        <p>{label(r.ownerAdminId)} · {SHARE_LABELS[r.kind]} · {({ pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối' })[r.status] || r.status}</p>
        <p>Đề nghị: {r.proposedRecipients.map(label).join(', ')}</p>
        {r.status === 'approved' && <p>Đã duyệt: {(r.approvedRecipients || []).map(label).join(', ') || 'Không có'}</p>}
        {r.reviewedBy && <p>Người xử lý: {label(r.reviewedBy)}</p>}
      </CardContent></Card>)}
    </section>
    <section className="space-y-2"><h2 className="text-lg font-semibold">Quyền xem đang có hiệu lực</h2>
      {!grants.some(g => g.active) && <p>Chưa cấp quyền xem.</p>}
      {[...new Set(grants.filter(g => g.active && g.kind !== 'customers').map(g => `${g.ownerAdminId}~${g.kind}`))].map(scope => {
        const group = grants.filter(g => g.active && `${g.ownerAdminId}~${g.kind}` === scope);
        return <Card key={scope}><CardContent className="p-3 space-y-1"><p className="font-medium">{label(group[0].ownerAdminId)} · {SHARE_LABELS[group[0].kind]}</p><p className="text-sm break-words">{group.length} người nhận: {group.map(g => label(g.recipientUid)).join(', ')}</p></CardContent></Card>;
      })}
    </section>
    </details>
      </TabsContent>
      <TabsContent value="administration" className="space-y-5">
      <Card><CardContent className="p-4 space-y-3"><h2 className="font-semibold">Phân công dữ liệu chưa rõ chủ sở hữu</h2>
        <select aria-label="Collection phân công" value={assignCollection} className={selectClass} onChange={e => { setAssignCollection(e.target.value); setUnassigned([]); setAssignId(''); }}>
          {Object.entries(collectionLabels).map(([c, title]) => <option key={c} value={c}>{title}</option>)}
        </select>
        <Button variant="outline" disabled={busy} onClick={fetchUnassigned}>Tải bản ghi chưa phân công</Button>
        {!unassigned.length && <p className="text-sm">Chưa tải hoặc không có bản ghi cần phân công.</p>}
        <select aria-label="Bản ghi phân công" className={selectClass} value={assignId} onChange={e => setAssignId(e.target.value)}><option value="">Chọn bản ghi</option>{unassigned.map(r => <option key={r.id} value={r.id}>{r.label} ({r.id})</option>)}</select>
        <select aria-label="Admin nhận quản lý" value={assignOwner} onChange={e => setAssignOwner(e.target.value)} className={selectClass}><option value="">Chọn Admin nhận quản lý</option>{accounts.filter(a => a.role === 'admin').map(a => <option value={a.uid} key={a.uid}>{a.label} · {a.email}</option>)}</select>
        <Button disabled={busy || !assignId || !assignOwner} onClick={async () => { await run('assign', { collection: assignCollection, id: assignId, ownerAdminId: assignOwner }); await fetchUnassigned(); }}>Phân công quản lý</Button>
      </CardContent></Card>
      <Card><CardContent className="p-4 space-y-3"><h2 className="font-semibold">Thay đổi vai trò tài khoản</h2>
        <select aria-label="Tài khoản đổi vai trò" className={selectClass} value={targetUid} onChange={e => setTargetUid(e.target.value)}><option value="">Chọn tài khoản</option>{accounts.map(a => <option key={a.uid} value={a.uid}>{a.label} · {a.email || a.role}</option>)}</select>
        <select aria-label="Vai trò mới" className={selectClass} value={targetRole} onChange={e => setTargetRole(e.target.value)}>{Object.entries(roleLabels).map(([r, title]) => <option key={r} value={r}>{title}</option>)}</select>
        <Button disabled={busy || !targetUid} onClick={() => { if (window.confirm(`Đổi vai trò ${label(targetUid)} (${targetUid}) thành ${targetRole}?`)) void run('role', { uid: targetUid, role: targetRole }); }}>Cập nhật vai trò</Button>
        <p className="text-sm">Không thể thay đổi vai trò của chính mình. Mọi thay đổi được ghi lịch sử.</p>
      </CardContent></Card>
      </TabsContent>
    </Tabs>
  </div>;
}
