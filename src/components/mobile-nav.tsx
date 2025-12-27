"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/firebase/provider";

const navItems = [
  { href: "/", label: "Khám phá", icon: Search },
  { href: "/favorites", label: "Yêu thích", icon: Heart },
  { href: "/login", loggedInHref: "/profile", label: "Tài khoản", icon: User },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();

  if (pathname.startsWith("/admin")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 md:hidden">
      <div className="container mx-auto flex h-16 max-w-md items-center justify-around px-0">
        {navItems.map((item) => {
          const href =
            user && item.loggedInHref ? item.loggedInHref : item.href;
          const label =
            item.label === "Tài khoản" && !user && !isUserLoading
              ? "Đăng nhập"
              : item.label;

          // FIX: Logic Active Tab chính xác để không bị sáng nhầm nút Khám phá
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.label}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-[10px] font-black uppercase tracking-widest w-20 transition-all",
                isActive ? "text-primary" : "text-gray-400"
              )}
            >
              <item.icon
                className={cn("h-6 w-6", isActive && "fill-primary/10")}
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
