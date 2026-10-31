const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const load = require('./load-typescript.cjs');
function render(file, role, resource, props = {}) {
  const auth = { user: { uid: role }, userData: { role }, loading: false };
  const mocks = {
    '@/context/auth-context': { useAuth: () => auth },
    '@/firebase/provider': { useAuth: () => null },
    '@/lib/access-client': { operationsApi: async () => { throw new Error('No API calls during static render'); } },
    '@/hooks/use-director-resource': { useDirectorResource: () => ({ data: null, loading: false, refreshing: false, reload() {}, error: '', ...resource }) },
    '@/hooks/use-toast': { useToast: () => ({ toast() {} }) },
    'next/navigation': { usePathname: () => '/management/users', useRouter: () => ({ push() {} }) },
    'next/link': { __esModule: true, default: ({ children, ...p }) => React.createElement('a', p, children) },
  };
  const passthrough = ({ children }) => React.createElement('div', null, children);
  mocks['@/components/ui/sidebar'] = Object.fromEntries(['Sidebar', 'SidebarContent', 'SidebarFooter', 'SidebarGroup', 'SidebarGroupContent', 'SidebarGroupLabel', 'SidebarHeader', 'SidebarMenu', 'SidebarMenuButton', 'SidebarMenuItem', 'SidebarRail'].map(key => [key, passthrough]));
  mocks['@/components/ui/sidebar'].useSidebar = () => ({ state: 'expanded', setOpen() {} });
  const exported = load(file, mocks);
  return renderToStaticMarkup(React.createElement(exported.default || exported.AdminSidebar, props));
}
test('admin sidebar renders familiar operations without director, access, shared-data or audit menus', () => {
  const admin = render('src/components/admin-sidebar.tsx', 'admin');
  assert.match(admin, /Danh sách Khách hàng/); assert.match(admin, /Quản lý lịch hẹn/);
  for (const label of ['Điều hành', 'Quyền xem dữ liệu', 'Dữ liệu được chia sẻ', 'Giám đốc', 'Lịch sử thao tác']) assert.ok(!admin.includes(label), label);
  const director = render('src/components/admin-sidebar.tsx', 'director'); assert.match(director, /Điều hành/);
});
test('director customer UI denies other roles even when a resource cache is incorrectly populated', () => {
  for (const role of ['admin', 'collaborator', 'user']) {
    const html = render('src/components/customer-access-manager.tsx', role, { data: { rows: [{ displayName: 'SHOULD_NOT_RENDER' }] } });
    assert.match(html, /Không có quyền truy cập/); assert.ok(!html.includes('SHOULD_NOT_RENDER')); assert.ok(!html.includes('Cấp quyền xem'));
  }
});
test('director dashboard displays loading, retryable error and zero real counts without invented statistics', () => {
  assert.match(render('src/components/director-dashboard.tsx', 'director', { loading: true }), /role="status"/);
  const error = render('src/components/director-dashboard.tsx', 'director', { error: 'Không thể tải' });
  assert.match(error, /role="alert"/); assert.match(error, /Thử lại/);
  const data = { total: 0, accounts: 0, leads: 0, newCustomers: 0, unknownAge: 0, unassigned: 0, processing: 0, todayBookings: 0, unassignedBookings: 0, baselineReady: true, admins: [] };
  const html = render('src/components/director-dashboard.tsx', 'director', { data });
  assert.match(html, /Chưa có Admin nội bộ/); assert.match(html, /0 hồ sơ tài khoản và 0 nguồn khách/);
});
test('empty/error customer list has explicit states and the server-wide selection cannot execute without results', () => {
  const html = render('src/components/customer-access-manager.tsx', 'director', { data: { rows: [], admins: [], collaborators: [], total: 0, page: 1, pageSize: 25, baselineReady: true } });
  assert.match(html, /Không có khách phù hợp/); assert.match(html, /disabled=""[^>]*>Chọn toàn bộ 0 kết quả/);
  const error = render('src/components/customer-access-manager.tsx', 'director', { error: 'Lỗi kết nối' });
  assert.match(error, /role="alert"/); assert.match(error, /Thử lại/);
});
