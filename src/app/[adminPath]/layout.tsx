"use client";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
// Thêm icon mới: BarChart3 (Doanh thu), ShieldCheck (Phân quyền), BedDouble (Phòng)
import {
  Home,
  LayoutGrid,
  LogOut,
  PlusCircle,
  Loader2,
  Users,
  Building2,
  BarChart3,
  ShieldCheck,
  BedDouble,
} from "lucide-react";
import Link from "next/link";
import { useUser, useAuth } from "@/firebase/provider";
import { useRouter, usePathname, notFound } from "next/navigation";
import { useEffect, use } from "react";
import { signOut } from "firebase/auth";
import { ADMIN_PATH } from "@/lib/constants";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="bg-white border-r border-gray-200">
        <SidebarHeader className="p-4 bg-white border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2 overflow-hidden">
            {/* Logo SVG */}
            <svg
              className="h-8 w-8 text-[#cda533] shrink-0"
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
            <span className="font-headline text-lg font-bold text-gray-900 truncate">
              Hanoi Residences
            </span>
          </Link>
        </SidebarHeader>

        <SidebarContent className="bg-white">
          <SidebarGroup>
            <SidebarGroupLabel>Quản lý chung</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {/* 1. DASHBOARD */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="Tổng quan"
                    isActive={pathname === `/${ADMIN_PATH}`}
                  >
                    <Link href={`/${ADMIN_PATH}`}>
                      <LayoutGrid />
                      <span>Tổng quan</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* 2. CĂN HỘ */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="Danh sách Căn hộ"
                    isActive={
                      pathname.includes("/apartments") &&
                      !pathname.includes("/new")
                    }
                  >
                    <Link href={`/${ADMIN_PATH}/apartments`}>
                      <Building2 />
                      <span>Danh sách Căn hộ</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* 3. KHÁCH HÀNG */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="Danh sách Khách hàng"
                    isActive={pathname.includes("/users")}
                  >
                    <Link href={`/${ADMIN_PATH}/users`}>
                      <Users />
                      <span>Danh sách Khách hàng</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Báo cáo & Quản trị</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {/* 4. QUẢN LÝ PHÒNG (Demo) */}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Quản lý Phòng trống">
                    <Link href="#" className="opacity-70 cursor-not-allowed">
                      <BedDouble />
                      <span>Quản lý Phòng (Soon)</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* 5. DOANH THU (Demo) */}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Doanh thu">
                    <Link href="#" className="opacity-70 cursor-not-allowed">
                      <BarChart3 />
                      <span>Doanh thu (Soon)</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* 6. PHÂN QUYỀN (Demo) */}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Phân quyền">
                    <Link href="#" className="opacity-70 cursor-not-allowed">
                      <ShieldCheck />
                      <span>Phân quyền (Soon)</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Tác vụ nhanh</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Thêm căn hộ">
                    <Link href={`/${ADMIN_PATH}/apartments/new`}>
                      <PlusCircle className="text-[#cda533]" />
                      <span className="font-bold text-[#cda533]">
                        Thêm căn hộ mới
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="bg-white border-t border-gray-100 p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/">
                  <Home /> <span>Về trang chủ</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogout}
                className="text-red-500 hover:bg-red-50"
              >
                <LogOut /> <span>Đăng xuất</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* QUAN TRỌNG: Nền trắng đặc cho nội dung chính */}
      <SidebarInset className="bg-gray-50 min-h-screen">
        <div className="p-4 md:p-8 w-full max-w-[1600px] mx-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ adminPath: string }>;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { adminPath } = use(params);

  if (adminPath !== ADMIN_PATH) notFound();

  useEffect(() => {
    if (!isUserLoading && !user) router.push("/login");
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user)
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );

  return <AdminLayoutContent>{children}</AdminLayoutContent>;
}
