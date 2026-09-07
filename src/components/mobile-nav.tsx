"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  Heart,
  Home,
  Loader2,
  Search,
  User,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/firebase/provider";
import { useNavProgress } from "@/components/navigation-progress";
import { ADMIN_PATH } from "@/lib/constants";
import { SITE_PATHS } from "@/lib/site";
import { districtFromPathname } from "@/lib/districts";
import { useEffect, useRef, useState } from "react";

type NavId = "home" | "schedule" | "search" | "favorites" | "account";

type NavItem = {
  id: NavId;
  href: string;
  loggedInHref?: string;
  guestHref?: string;
  label: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { id: "home", href: SITE_PATHS.home, label: "Trang chủ", icon: Home },
  {
    id: "schedule",
    href: "/profile/bookings",
    guestHref: "/login?redirect=/profile/bookings",
    label: "Lịch dẫn",
    icon: CalendarDays,
  },
  { id: "search", href: SITE_PATHS.search, label: "Tìm kiếm", icon: Search },
  { id: "favorites", href: "/favorites", label: "Yêu thích", icon: Heart },
  {
    id: "account",
    href: "/login",
    loggedInHref: "/profile",
    label: "Tài khoản",
    icon: User,
  },
];

function isNavActive(id: NavId, pathname: string): boolean {
  switch (id) {
    case "home":
      return pathname === "/";
    case "schedule":
      return pathname.startsWith("/profile/bookings");
    case "search":
      return (
        pathname === SITE_PATHS.search ||
        pathname.startsWith(`${SITE_PATHS.search}/`) ||
        pathname === "/apartments" ||
        pathname.startsWith("/apartments/") ||
        pathname.startsWith("/can-ho-ngan-han") ||
        Boolean(districtFromPathname(pathname))
      );
    case "favorites":
      return pathname === "/favorites" || pathname.startsWith("/favorites/");
    case "account":
      return (
        pathname === "/login" ||
        pathname === "/signup" ||
        (pathname.startsWith("/profile") &&
          !pathname.startsWith("/profile/bookings"))
      );
  }
}

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { start, pendingPath } = useNavProgress();
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    [
      SITE_PATHS.home,
      SITE_PATHS.search,
      "/favorites",
      "/profile",
      "/profile/bookings",
      "/login",
    ].forEach((href) => {
      try {
        router.prefetch(href);
      } catch {
        /* prefetch is best-effort */
      }
    });
  }, [router]);

  const isApartmentDetails = /^\/(apartments|can-ho-ngan-han)\/[^/]+/.test(
    pathname,
  );

  useEffect(() => {
    if (!isApartmentDetails) {
      setHidden(false);
      document.body.removeAttribute("data-listing-page");
      document.body.removeAttribute("data-listing-nav-hidden");
      return;
    }

    document.body.setAttribute("data-listing-page", "true");
    lastScrollY.current = window.scrollY;

    const onScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY.current;

      if (currentY < 24) {
        setHidden(false);
      } else if (delta > 8) {
        setHidden(true);
      } else if (delta < -8) {
        setHidden(false);
      }

      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.body.removeAttribute("data-listing-page");
      document.body.removeAttribute("data-listing-nav-hidden");
    };
  }, [isApartmentDetails]);

  useEffect(() => {
    if (!isApartmentDetails) return;
    document.body.setAttribute(
      "data-listing-nav-hidden",
      hidden ? "true" : "false",
    );
  }, [hidden, isApartmentDetails]);

  if (pathname.startsWith(`/${ADMIN_PATH}`)) return null;

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[65] overflow-x-hidden border-t border-gray-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 md:hidden pb-[var(--safe-bottom)]",
        "transition-transform duration-300 ease-ios-out will-change-transform",
        hidden && "translate-y-full",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-lg items-stretch px-1">
        {navItems.map((item) => {
          const targetHref =
            user && item.loggedInHref
              ? item.loggedInHref
              : !user && item.guestHref
                ? item.guestHref
                : item.href;

          const label =
            item.id === "account" && !isUserLoading
              ? user
                ? "Tài khoản"
                : "Đăng nhập"
              : item.label;

          const isActive = isNavActive(item.id, pathname);
          const isPending = Boolean(
            pendingPath && isNavActive(item.id, pendingPath),
          );

          return (
            <Link
              key={item.id}
              href={targetHref}
              prefetch
              aria-current={isActive ? "page" : undefined}
              aria-busy={isPending || undefined}
              aria-label={label}
              onPointerDown={(event) => {
                if (event.pointerType === "touch" || event.pointerType === "pen") {
                  start(targetHref);
                }
              }}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-0.5",
                "text-[10px] font-semibold leading-none tracking-tight",
                "transition-colors duration-200",
                isActive || isPending ? "text-[#cda533]" : "text-gray-400",
              )}
            >
              {isPending ? (
                <Loader2 className="h-[22px] w-[22px] animate-spin" aria-hidden />
              ) : (
                <item.icon
                  className="h-[22px] w-[22px]"
                  strokeWidth={isActive ? 2.25 : 1.85}
                  fill={
                    item.id === "favorites" && isActive ? "currentColor" : "none"
                  }
                />
              )}
              <span className="max-w-full truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
