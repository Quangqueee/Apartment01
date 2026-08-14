"use client";

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Loader2 } from "lucide-react";
import { useAuth as useAuthContext } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import NotificationBell from "@/components/notification-bell";
import { AdminSidebar } from "@/components/admin-sidebar";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { user: authUser } = useAuthContext();

  return (
    <SidebarProvider>
      <AdminSidebar />

      <SidebarInset className="min-h-screen overflow-x-hidden bg-gray-50">
        <div className="w-full">
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 overflow-x-hidden border-b border-gray-200 bg-white px-4 shadow-sm md:hidden">
            <SidebarTrigger className="h-10 w-10 rounded-md border border-gray-200 bg-gray-50 text-gray-700 transition-all hover:bg-gray-100 active:scale-95" />
            <span className="flex-1 font-headline text-lg font-bold text-[#cda533]">
              Hanoi Residences
            </span>
            <NotificationBell userId={authUser?.uid} />
          </header>

          <header className="sticky top-0 z-20 hidden h-16 items-center justify-between overflow-x-hidden border-b border-gray-200 bg-white px-6 shadow-sm md:flex">
            <SidebarTrigger className="h-9 w-9 rounded-md text-gray-600 hover:bg-[#f2f2f3]" />
            <NotificationBell userId={authUser?.uid} />
          </header>
        </div>

        <div className="mx-auto w-full max-w-[1920px] overflow-x-hidden p-4 md:p-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userData, loading } = useAuthContext();
  const router = useRouter();
  const userRole = (userData?.role || "").toLowerCase();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user && userRole !== "admin") {
      router.replace("/");
    }
  }, [loading, user, userRole, router]);

  if (loading || !user || (userData && userRole !== "admin")) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <AdminLayoutContent>{children}</AdminLayoutContent>;
}
