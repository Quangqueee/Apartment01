'use client';
import { useState } from 'react';
import { useDirectorResource } from '@/hooks/use-director-resource';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { searchText, WORK_TIME_ZONE } from '@/lib/booking-workflow';
type Event = { id: string; actorUid: string; action: string; count: number; target: string[]; createdAt: { seconds: number } | null };
const labels: Record<string, string> = { 'booking-work-assign': 'Giao / đổi Admin dẫn khách', 'booking-work-unassign': 'Bỏ phân công lịch',
  'customer-work-assign': 'Giao / chuyển khách phụ trách', 'customer-view-grant': 'Cấp quyền xem khách', 'customer-view-revoke': 'Thu hồi quyền riêng',
  'customer-create': 'Thêm nguồn khách', 'customer-progress': 'Cập nhật tiến độ khách', 'customer-lead-legacy-baseline': 'Chốt nguồn khách cũ', 'customer-lead-legacy-rollback': 'Rollback nguồn khách cũ',
  'customer-view-add': 'Cấp quyền xem khách hàng', 'customer-view-remove': 'Thu hồi quyền xem riêng', 'role-change': 'Đổi vai trò tài khoản',
  'operator-role-change': 'Operator đổi vai trò', 'owner-assign': 'Phân công chủ quản lý', 'share-approved': 'Duyệt chia sẻ', 'share-rejected': 'Từ chối chia sẻ',
  'share-replaced': 'Cập nhật quyền xem danh sách', 'share-request': 'Tạo đề nghị', 'phone-update': 'Cập nhật liên hệ riêng tư',
  'customer-legacy-baseline': 'Chốt khách hàng cũ', 'legacy-admin-read-restore': 'Khôi phục quyền Admin cũ' };
export default function DirectorActivity({ accounts }: { accounts: { uid: string; label: string }[] }) {
  const { data, loading, refreshing, error, reload } = useDirectorResource<{ events: Event[] }>('history');
  const [search, setSearch] = useState('');
  const name = (uid: string) => accounts.find(a => a.uid === uid)?.label || uid || 'Chưa xác định';
  const visible = (data?.events || []).filter(e => searchText(`${labels[e.action] || e.action} ${name(e.actorUid)} ${e.target.join(' ')}`).includes(searchText(search)));
  if (loading) return <p role="status">Đang tải lịch sử…</p>;
  return <div className="space-y-4"><div className="space-y-1"><h2 className="text-xl font-semibold">Lịch sử phân công và quyền truy cập</h2><p className="text-sm text-muted-foreground">50 sự kiện gần nhất, chỉ Giám đốc xem. Lịch sử này ghi việc giao lịch, duyệt quyền và quản trị tài khoản; chưa thay thế nhật ký toàn bộ thao tác xử lý của Admin.</p></div>
    <div className="flex gap-2"><Input className="text-base" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm hành động, người thao tác hoặc mã bản ghi" aria-label="Tìm lịch sử phân công" /><Button variant="outline" disabled={refreshing} onClick={reload}>Tải lại</Button></div>
    {error && <p role="alert" className="text-red-600">{error}</p>}{!visible.length && <p className="py-8 text-center text-muted-foreground">Không có sự kiện phù hợp.</p>}
    {visible.map(e => <Card key={e.id}><CardContent className="p-4 space-y-1"><p className="font-medium">{labels[e.action] || e.action}</p><p className="text-sm">{name(e.actorUid)} · {e.count} đối tượng · {e.createdAt ? new Intl.DateTimeFormat('vi-VN', { timeZone: WORK_TIME_ZONE, dateStyle: 'short', timeStyle: 'short' }).format(new Date(e.createdAt.seconds * 1000)) : 'Chưa có thời gian'}</p><details className="text-xs text-muted-foreground"><summary className="cursor-pointer">Xem mã đối tượng</summary>{e.target.map(path => <p key={path} className="break-all">{path}</p>)}</details></CardContent></Card>)}
  </div>;
}
