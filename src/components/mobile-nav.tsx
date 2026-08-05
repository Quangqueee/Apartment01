"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/firebase/provider";
import { ADMIN_PATH } from "@/lib/constants";

const navItems = [
  { href: "/", label: "Khám phá", icon: Search },
  { href: "/favorites", label: "Yêu thích", icon: Heart },
  { href: "/login", loggedInHref: "/profile", label: "Tài khoản", icon: User },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();

  if (pathname.startsWith(`/${ADMIN_PATH}`)) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 md:hidden pb-safe">
      <div className="container mx-auto flex h-16 max-w-md items-center justify-around px-0">
        {navItems.map((item) => {
          const targetHref =
            user && item.loggedInHref ? item.loggedInHref : item.href;

          // FIX: Tránh hiện chớp chữ "Đăng nhập" khi auth đang trong trạng thái loading
          const label =
            item.label === "Tài khoản" && !isUserLoading
              ? user
                ? "Tài khoản"
                : "Đăng nhập"
              : item.label;

          let isActive = false;
          if (item.href === "/") {
            isActive = pathname === "/" || pathname.startsWith("/apartments");
          } else if (item.href === "/favorites") {
            isActive = pathname === "/favorites";
          } else if (item.label === "Tài khoản") {
            isActive = pathname.startsWith("/profile") || pathname === "/login";
          }

          return (
            <Link
              key={item.label}
              href={targetHref}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-[10px] font-black uppercase tracking-widest w-20 transition-all",
                isActive ? "text-[#cda533]" : "text-gray-400",
              )}
            >
              <item.icon
                className={cn(
                  "h-6 w-6 transition-transform",
                  isActive && "scale-110",
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
