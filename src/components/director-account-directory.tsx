'use client';
import { useState } from 'react';
import { useDirectorResource } from '@/hooks/use-director-resource';
import { searchText } from '@/lib/booking-workflow';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

type Account = { uid: string; displayName: string; email: string; role: string; ownerAdminId?: string; hasProfile: boolean; hasAuth: boolean; disabled: boolean };
type Directory = { accounts: Account[]; counts: { total: number; authentication: number; profiles: number; withoutProfile: number; withoutAuth: number; customers: number; collaborators: number; admins: number; unclassified: number } };
const roles: Record<string, string> = { user: 'Khách hàng', collaborator: 'CTV', admin: 'Admin', director: 'Giám đốc', landlord: 'Chủ nhà', unclassified: 'Chưa xác định vai trò' };
export default function DirectorAccountDirectory() {
  const { userData } = useAuth();
  const { data: directory, loading, refreshing, error, reload: load } = useDirectorResource<Directory>('accounts');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [ownerFilter, setOwnerFilter] = useState('');
  if (userData?.role !== 'director') return null;
  if (loading) return <p role="status">Đang đối chiếu tài khoản đăng nhập và hồ sơ…</p>;
  if (!directory) return <div role="alert" className="space-y-3"><p>{error}</p><Button onClick={load}>Thử lại</Button></div>;
  const needle = searchText(search);
  const visible = directory.accounts.filter(a => (!needle || searchText(`${a.displayName} ${a.email} ${a.uid}`).includes(needle))
    && (filter === 'all' || filter === 'missing' ? filter !== 'missing' || !a.hasProfile || !a.hasAuth || a.role === 'unclassified' : a.role === filter)
    && (!ownerFilter || (ownerFilter === 'unowned' ? !a.ownerAdminId : a.ownerAdminId === ownerFilter)))
    .sort((a, b) => a.displayName.localeCompare(b.displayName, 'vi'));
  const pages = Math.max(1, Math.ceil(visible.length / 25)), currentPage = Math.min(page, pages);
  const current = visible.slice((currentPage - 1) * 25, currentPage * 25);
  const { counts } = directory;
  return <div className="space-y-5 overflow-x-hidden">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {[[ 'Danh bạ đã đối chiếu', counts.total ], ['Khách hàng', counts.customers], ['CTV', counts.collaborators], ['Admin', counts.admins]].map(([label, count]) =>
        <Card key={label}><CardContent className="p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{count}</p></CardContent></Card>)}
    </div>
    <p className="text-sm text-muted-foreground">Đã đối chiếu {counts.authentication} tài khoản đăng nhập và {counts.profiles} hồ sơ dữ liệu. {counts.withoutProfile} tài khoản chưa có hồ sơ; {counts.withoutAuth} hồ sơ chưa có tài khoản đăng nhập tương ứng.</p>
    <Card><CardContent className="p-4 space-y-4">
      <div className="flex gap-2"><Input className="text-base min-w-0" aria-label="Tìm trong tất cả tài khoản" placeholder="Tìm tên, email hoặc mã tài khoản" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /><Button variant="outline" disabled={refreshing} onClick={load}>{refreshing ? 'Đang tải…' : 'Tải lại'}</Button></div>
      <select aria-label="Lọc CTV hoặc hồ sơ theo Admin quản lý" className="w-full rounded-md border p-2 text-base bg-background" value={ownerFilter} onChange={e => { setOwnerFilter(e.target.value); setPage(1); }}><option value="">Mọi Admin quản lý hồ sơ</option><option value="unowned">Chưa xác định Admin quản lý</option>{directory.accounts.filter(a => ['admin', 'director'].includes(a.role)).map(a => <option key={a.uid} value={a.uid}>{a.displayName}</option>)}</select>
      <div className="flex flex-wrap gap-2">{[['all', 'Tất cả'], ['user', 'Khách hàng'], ['collaborator', 'CTV'], ['admin', 'Admin'], ['director', 'Giám đốc'], ['landlord', 'Chủ nhà'], ['missing', 'Cần kiểm tra hồ sơ']].map(([value, label]) =>
        <Button key={value} size="sm" variant={filter === value ? 'default' : 'outline'} onClick={() => { setFilter(value); setPage(1); }}>{label}</Button>)}</div>
      <p className="text-sm">Hiển thị {current.length ? (currentPage - 1) * 25 + 1 : 0}–{Math.min(currentPage * 25, visible.length)} / {visible.length} kết quả · tổng {counts.total} tài khoản.</p>
      {!current.length && <p className="py-8 text-center text-muted-foreground">Không có tài khoản phù hợp.</p>}
      {current.map(a => <div key={a.uid} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0"><p className="font-medium break-words">{a.displayName}</p><p className="text-sm text-muted-foreground break-all">{a.email || 'Chưa có email'}</p>
          <details className="text-xs text-muted-foreground mt-1"><summary className="cursor-pointer">Mã tài khoản</summary><p className="break-all">{a.uid}</p></details></div>
        <div className="flex flex-wrap gap-2"><Badge variant="secondary">{roles[a.role] || a.role}</Badge>{!a.hasProfile && <Badge variant="outline">Chưa có hồ sơ</Badge>}{!a.hasAuth && <Badge variant="outline">Chỉ có hồ sơ</Badge>}{a.disabled && <Badge variant="destructive">Đã khóa đăng nhập</Badge>}</div>
      </div>)}
      {pages > 1 && <div className="flex items-center justify-between"><Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Trước</Button><span className="text-sm">Trang {currentPage}/{pages}</span><Button variant="outline" size="sm" disabled={currentPage >= pages} onClick={() => setPage(currentPage + 1)}>Sau</Button></div>}
    </CardContent></Card>
    <p className="text-sm text-muted-foreground">Giao khách và cấp quyền xem ở tab “Khách hàng tập trung”. Tài khoản chưa có hồ sơ hoặc vai trò xác định được liệt kê để kiểm tra; không tự suy đoán vai trò hay tạo hồ sơ thay cho người dùng. CTV là đối tác bên ngoài; lọc theo Admin quản lý chỉ dùng quan hệ đã lưu.</p>
  </div>;
}
