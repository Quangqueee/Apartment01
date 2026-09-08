"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BedDouble,
  Building2,
  CalendarCheck,
  CalendarClock,
  CheckSquare,
  Home,
  LayoutGrid,
  LogOut,
  PlusCircle,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth as useFirebaseAuth } from "@/firebase/provider";
import { useToast } from "@/hooks/use-toast";
import { ADMIN_PATH } from "@/lib/constants";
import { cn, normalizeSearchText } from "@/lib/utils";

const NAV_BUTTON_CLASS =
  "h-auto min-h-10 rounded-[6px] p-2.5 text-sm text-[#2e3033] hover:bg-[#f2f2f3] data-[active=true]:bg-[#f2f2f3] data-[active=true]:font-medium [&>svg]:size-5 group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:!p-2.5";

type NavItemConfig = {
  href: string;
  label: string;
  tooltip: string;
  icon: LucideIcon;
  isActive?: (pathname: string) => boolean;
  disabled?: boolean;
  accent?: boolean;
};

const MAIN_ITEMS: NavItemConfig[] = [
  {
    href: `/${ADMIN_PATH}`,
    label: "Tổng quan",
    tooltip: "Tổng quan",
    icon: LayoutGrid,
    isActive: (pathname) => pathname === `/${ADMIN_PATH}`,
  },
  {
    href: `/${ADMIN_PATH}/apartments`,
    label: "Danh sách Căn hộ",
    tooltip: "Danh sách Căn hộ",
    icon: Building2,
    isActive: (pathname) =>
      pathname.includes("/apartments") && !pathname.includes("/new"),
  },
  {
    href: `/${ADMIN_PATH}/users`,
    label: "Danh sách Khách hàng",
    tooltip: "Danh sách Khách hàng",
    icon: Users,
    isActive: (pathname) => pathname.includes("/users"),
  },
  {
    href: `/${ADMIN_PATH}/bookings`,
    label: "Quản lý lịch hẹn",
    tooltip: "Quản lý lịch hẹn",
    icon: CalendarCheck,
    isActive: (pathname) =>
      pathname.includes("/bookings") && !pathname.includes("/stay-bookings"),
  },
  {
    href: `/${ADMIN_PATH}/short-term`,
    label: "Căn hộ ngắn hạn",
    tooltip: "Căn hộ ngắn hạn",
    icon: BedDouble,
    isActive: (pathname) => pathname.includes("/short-term"),
  },
  {
    href: `/${ADMIN_PATH}/stay-bookings`,
    label: "Đặt phòng ngắn hạn",
    tooltip: "Đặt phòng ngắn hạn",
    icon: CalendarClock,
    isActive: (pathname) => pathname.includes("/stay-bookings"),
  },
  {
    href: `/${ADMIN_PATH}/submissions`,
    label: "Duyệt tin đăng",
    tooltip: "Duyệt tin đăng",
    icon: CheckSquare,
    isActive: (pathname) => pathname.includes("/submissions"),
  },
  {
    href: `/${ADMIN_PATH}/partners`,
    label: "Quản lý Đối tác",
    tooltip: "Quản lý Đối tác",
    icon: UserCheck,
    isActive: (pathname) => pathname.includes("/partners"),
  },
];

const REPORT_ITEMS: NavItemConfig[] = [
  {
    href: "#",
    label: "Quản lý Phòng (Soon)",
    tooltip: "Quản lý Phòng trống",
    icon: BedDouble,
    disabled: true,
  },
  {
    href: "#",
    label: "Doanh thu (Soon)",
    tooltip: "Doanh thu",
    icon: BarChart3,
    disabled: true,
  },
  {
    href: "#",
    label: "Phân quyền (Soon)",
    tooltip: "Phân quyền",
    icon: ShieldCheck,
    disabled: true,
  },
];

const QUICK_ITEMS: NavItemConfig[] = [
  {
    href: `/${ADMIN_PATH}/apartments/new`,
    label: "Thêm căn hộ mới",
    tooltip: "Thêm căn hộ",
    icon: PlusCircle,
    accent: true,
  },
];

function matchesNavQuery(label: string, query: string) {
  if (!query.trim()) return true;
  return normalizeSearchText(label).includes(normalizeSearchText(query));
}

function BrandMark() {
  return (
    <svg
      className="h-8 w-8 shrink-0 text-[#cda533]"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
        <path
          d="M12 2L2 7V21H22V7L12 2Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 12L2 7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 12L22 7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 12V21"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16 17H8V14H16V17Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
    </svg>
  );
}

function NavItem({
  item,
  pathname,
}: {
  item: NavItemConfig;
  pathname: string;
}) {
  const Icon = item.icon;
  const isActive = item.isActive?.(pathname) ?? false;

  if (item.disabled) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={item.tooltip}
          className={cn(NAV_BUTTON_CLASS, "cursor-not-allowed opacity-50")}
          aria-disabled
        >
          <Icon />
          <span>{item.label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        tooltip={item.tooltip}
        isActive={isActive}
        className={cn(
          NAV_BUTTON_CLASS,
          item.accent && "text-[#cda533] hover:text-[#cda533]",
        )}
      >
        <Link href={item.href}>
          <Icon className={item.accent ? "text-[#cda533]" : undefined} />
          <span className={item.accent ? "font-semibold text-[#cda533]" : undefined}>
            {item.label}
          </span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function NavSection({
  title,
  items,
  pathname,
  bordered,
}: {
  title: string;
  items: NavItemConfig[];
  pathname: string;
  bordered?: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <SidebarGroup
      className={cn(
        "p-0",
        bordered && "border-t border-gray-200 pt-2",
      )}
    >
      <SidebarGroupLabel className="h-auto px-3 py-1.5 text-xs font-normal uppercase tracking-wide text-[#b9bbc1]">
        {title}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="gap-2">
          {items.map((item) => (
            <NavItem key={item.label} item={item} pathname={pathname} />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AdminSidebar() {
  const auth = useFirebaseAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { state, setOpen } = useSidebar();
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const collapsed = state === "collapsed";

  const mainItems = useMemo(
    () => MAIN_ITEMS.filter((item) => matchesNavQuery(item.label, query)),
    [query],
  );
  const reportItems = useMemo(
    () => REPORT_ITEMS.filter((item) => matchesNavQuery(item.label, query)),
    [query],
  );
  const quickItems = useMemo(
    () => QUICK_ITEMS.filter((item) => matchesNavQuery(item.label, query)),
    [query],
  );
  const hasResults =
    mainItems.length + reportItems.length + quickItems.length > 0;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch {
      toast({
        title: "Đăng xuất thất bại",
        description: "Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  const handleSearchFocus = () => {
    if (!collapsed) return;
    setOpen(true);
    requestAnimationFrame(() => searchRef.current?.focus());
  };

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-x-hidden border-r border-gray-200 bg-white [&_[data-sidebar=sidebar]]:bg-white"
    >
      <SidebarHeader className="gap-4 p-4 pb-2">
        <Link
          href={`/${ADMIN_PATH}`}
          className="flex items-center gap-3 overflow-hidden py-1"
        >
          <BrandMark />
          <span className="truncate text-[15px] font-bold leading-tight text-[#2e3033] group-data-[collapsible=icon]:hidden">
            Hanoi Residences
          </span>
        </Link>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#b9bbc1] group-data-[collapsible=icon]:left-1/2 group-data-[collapsible=icon]:size-6 group-data-[collapsible=icon]:-translate-x-1/2" />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={handleSearchFocus}
            onClick={handleSearchFocus}
            placeholder="Tìm menu"
            className="h-10 w-full rounded-[6px] bg-[#f2f2f3] px-3 pl-10 text-base text-[#2e3033] outline-none placeholder:text-[13px] placeholder:text-[#b9bbc1] group-data-[collapsible=icon]:h-12 group-data-[collapsible=icon]:cursor-pointer group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:pl-0 group-data-[collapsible=icon]:text-transparent group-data-[collapsible=icon]:placeholder:text-transparent"
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-6 overflow-x-hidden px-4 py-2">
        <NavSection title="Quản lý chung" items={mainItems} pathname={pathname} />
        <NavSection
          title="Báo cáo & Quản trị"
          items={reportItems}
          pathname={pathname}
          bordered
        />
        <NavSection
          title="Tác vụ nhanh"
          items={quickItems}
          pathname={pathname}
          bordered
        />
        {!hasResults && (
          <p className="px-3 text-sm text-[#b9bbc1] group-data-[collapsible=icon]:hidden">
            Không tìm thấy
          </p>
        )}
      </SidebarContent>

      <SidebarFooter className="gap-1 border-t border-gray-100 p-4">
        <SidebarMenu className="gap-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Về trang chủ"
              className={NAV_BUTTON_CLASS}
            >
              <Link href="/">
                <Home />
                <span>Về trang chủ</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Đăng xuất"
              onClick={handleLogout}
              className={cn(
                NAV_BUTTON_CLASS,
                "text-red-500 hover:bg-red-50 hover:text-red-600",
              )}
            >
              <LogOut />
              <span>Đăng xuất</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
