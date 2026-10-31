'use client';
import { useDirectorResource } from '@/hooks/use-director-resource';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
type Dashboard = { total: number; accounts: number; leads: number; newCustomers: number; unknownAge: number; unassigned: number; processing: number;
  todayBookings: number; unassignedBookings: number; baselineReady: boolean;
  admins: { uid: string; displayName: string; customers: number; processing: number; active: number; today: number; overdue: number }[] };
export default function DirectorDashboard({ navigate }: { navigate: (tab: string) => void }) {
  const { data, loading, error, refreshing, reload } = useDirectorResource<Dashboard>('dashboard');
  if (loading) return <p role="status">Đang tổng hợp vận hành…</p>;
  if (error || !data) return <div role="alert" className="space-y-3"><p>{error || 'Chưa có dữ liệu.'}</p><Button onClick={reload}>Thử lại</Button></div>;
  const metrics = [
    ['Tổng khách / nguồn khách', data.total, `${data.accounts} hồ sơ tài khoản và ${data.leads} nguồn khách chưa liên kết UID. Không gộp theo SĐT.`, 'customers'],
    ['Khách mới theo chính sách', data.newCustomers, 'Nguồn tạo sau mốc chuyển đổi, theo createTime của Firestore.', 'customers'],
    ['Khách chưa giao', data.unassigned, 'Chưa có Admin phụ trách công việc; có thể đã có Admin tạo/chủ quản lý.', 'customers'],
    ['Khách đang xử lý', data.processing, 'Đã giao, tiến độ mới tiếp nhận / đang xử lý / đã liên hệ.', 'customers'],
    ['Lịch hôm nay', data.todayBookings, 'Theo giờ Việt Nam (+07), không tính lịch hủy.', 'settings'],
    ['Lịch mở chưa giao', data.unassignedBookings, 'Chưa có người dẫn và chưa ở trạng thái đã dẫn hoặc hủy.', 'settings'],
  ] as const;
  return <div className="space-y-5 overflow-x-hidden"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">Tổng quan vận hành</h2><Button variant="outline" disabled={refreshing} onClick={reload}>{refreshing ? 'Đang cập nhật…' : 'Tải lại'}</Button></div>
    {(!data.baselineReady || !!data.unknownAge) && <p className="rounded-lg border p-3 text-sm">{data.unknownAge} nguồn khách chưa đủ căn cứ phân loại cũ/mới. Giữ quyền chủ quản lý đã xác minh; xem báo cáo migration trước khi mở quyền khách cũ.</p>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{metrics.map(([label, count, definition, tab]) => <Card key={label}><CardContent className="p-4 space-y-2"><p className="font-medium">{label}</p><p className="text-3xl font-bold">{count}</p><p className="text-xs text-muted-foreground">{definition}</p><Button variant="link" className="h-auto p-0" onClick={() => navigate(tab)}>Mở danh sách</Button></CardContent></Card>)}</div>
    <h3 className="font-semibold">Công việc theo Admin</h3><p className="text-sm text-muted-foreground">Số việc hiện đang giao, không phải đánh giá hiệu suất hay số hợp đồng thuê thành công.</p>
    {!data.admins.length && <p>Chưa có Admin nội bộ.</p>}
    <div className="grid gap-3 md:grid-cols-2">{data.admins.map(a => <Card key={a.uid}><CardContent className="p-4 space-y-2"><p className="font-medium break-words">{a.displayName}</p><p className="text-sm">{a.customers} khách được giao · {a.processing} đang xử lý</p><p className="text-sm">{a.active} lịch mở · {a.today} hôm nay · {a.overdue} quá ngày chưa đóng</p></CardContent></Card>)}</div>
  </div>;
}
