"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/firebase/provider";
import { useAuth as useAuthContext } from "@/context/auth-context";
import UserNav from "./user-nav";
import NotificationBell from "./notification-bell";
import DistrictNav from "./district-nav";
import {
  Menu,
  X,
  Heart,
  Home,
  Info,
  Building2,
  LogIn,
  UserPlus,
  CalendarDays,
  BookOpen,
  Building,
  Handshake,
  CircleHelp,
  MapPin,
  MoonStar,
  Clock,
  Phone,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { SITE, SITE_PATHS } from "@/lib/site";
import { SHORT_TERM_PUBLIC_ACCESS } from "@/lib/constants";

const COLLABORATOR_GUIDE_URL = "/huong-dan-cong-viec";

function isHeroOverlayPath(pathname: string) {
  return pathname === "/";
}

export default function Header() {
  const pathname = usePathname();
  const { user } = useUser();
  const { userData } = useAuthContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userRole = (userData?.role || "user").toLowerCase();

  const canSeeCollaboratorGuide =
    userRole === "collaborator" || userRole === "admin";
  const isLandlord = userRole === "landlord";
  const canRegisterAsPartner =
    !isLandlord && userRole !== "admin" && userRole !== "collaborator";

  const overlay =
    isHeroOverlayPath(pathname) && !scrolled && !isMobileMenuOpen;

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => {
      setScrolled((prev) => {
        const next = window.scrollY > 16;
        return prev === next ? prev : next;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const iconBtn = overlay
    ? "p-2 rounded-lg text-white/90 transition-colors hover:bg-white/10 hover:text-white"
    : "p-2 rounded-lg text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900";
  const welcomeText =
    "Welcome to Hanoi Residences — Không gian sống lý tưởng cho mọi ngân sách";
  const telHref = `tel:${SITE.telephone}`;

  return (
    <div className="w-full">
      <header className="sticky top-0 z-[170] w-full bg-transparent font-sans">
        <div className="overflow-x-hidden border-b border-orange-700/30 bg-[#e07a2f] text-[11px] text-white lg:text-xs [@media(display-mode:standalone)]:pt-[env(safe-area-inset-top)]">
          <div className="container mx-auto flex h-8 items-center justify-between gap-3 overflow-x-hidden px-4 md:px-6 lg:h-9">
            <p className="flex min-w-0 items-center gap-3">
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {SITE.streetAddress}, {SITE.addressLocality}
                </span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {SITE.openingHours.opens}–{SITE.openingHours.closes}
              </span>
              <span className="hidden w-36 shrink-0 overflow-hidden lg:inline-block xl:w-44">
                <span className="flex w-max animate-marquee whitespace-nowrap will-change-transform">
                  <span className="pr-10">{welcomeText}</span>
                  <span className="pr-10" aria-hidden>
                    {welcomeText}
                  </span>
                </span>
              </span>
            </p>
            <a
              href={telHref}
              className="inline-flex shrink-0 items-center gap-1.5 font-semibold hover:underline"
            >
              <Phone className="h-3.5 w-3.5" />
              {SITE.telephoneDisplay}
            </a>
          </div>
        </div>

        <div
          className={cn(
            overlay
              ? "border-b border-white/10 bg-transparent"
              : "border-b border-gray-100 bg-white/95 shadow-sm",
          )}
        >
        <div className="container relative z-40 mx-auto flex h-16 items-center justify-between px-4 md:h-20 md:px-6">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2"
            onClick={() => setIsMobileMenuOpen(false)}
          >
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
            <span
              className={cn(
                "font-headline truncate text-lg font-bold tracking-tight md:text-2xl",
                overlay ? "text-white" : "text-gray-900",
              )}
            >
              Hanoi Residences
            </span>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex xl:gap-7">
            <NavLink href="/" label="Trang chủ" light={overlay} />
            <NavLink href={SITE_PATHS.search} label="Căn hộ" light={overlay} />
            {SHORT_TERM_PUBLIC_ACCESS ? (
              <NavLink
                href="/can-ho-ngan-han"
                label="Ngắn hạn"
                light={overlay}
              />
            ) : null}
            <DistrictNav tone={overlay ? "light" : "dark"} />
            <NavLink href={SITE_PATHS.about} label="Giới thiệu" light={overlay} />
            <NavLink href={SITE_PATHS.faq} label="FAQ" light={overlay} />

            {canRegisterAsPartner && (
              <NavLink
                href={SITE_PATHS.partnerRegister}
                label="Hợp tác"
                light={overlay}
              />
            )}

            {user && isLandlord && (
              <NavLink
                href="/profile/apartments"
                label="Quản lý phòng"
                light={overlay}
              />
            )}

            {user && !isLandlord && (
              <NavLink
                href="/profile/bookings"
                label={
                  canSeeCollaboratorGuide ? "Lịch dẫn khách" : "Lịch xem phòng"
                }
                light={overlay}
              />
            )}

            {user && canSeeCollaboratorGuide && (
              <NavLink
                href={COLLABORATOR_GUIDE_URL}
                label="Hướng dẫn CTV"
                light={overlay}
              />
            )}
          </nav>

          <div
            className={cn(
              "hidden items-center gap-2 pl-6 lg:flex",
              overlay ? "border-l border-white/20" : "border-l border-gray-100",
            )}
          >
            <Link
              href="/favorites"
              aria-label="Yêu thích"
              className={cn(iconBtn, overlay ? "hover:text-red-300" : "hover:text-red-500")}
            >
              <Heart className="h-5 w-5" />
            </Link>
            {user ? (
              <>
                <NotificationBell
                  userId={user.uid}
                  triggerClassName={iconBtn}
                />
                <UserNav />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={cn(
                    "px-3 py-2 text-sm font-semibold transition-colors",
                    overlay
                      ? "text-white/90 hover:text-[#cda533]"
                      : "text-gray-600 hover:text-[#cda533]",
                  )}
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/signup"
                  className={cn(
                    "rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-all",
                    overlay
                      ? "bg-primary text-white hover:bg-[#b88e22]"
                      : "bg-[#1a1a1a] text-white hover:bg-primary",
                  )}
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 lg:hidden">
            <Link
              href="/favorites"
              aria-label="Yêu thích"
              className={cn(iconBtn, overlay ? "hover:text-red-300" : "hover:text-red-500")}
            >
              <Heart className="h-5 w-5" />
            </Link>
            {user && (
              <NotificationBell userId={user.uid} triggerClassName={iconBtn} />
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Đóng menu" : "Mở menu di động"}
              className={iconBtn}
            >
              {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>
        </div>
      </header>

      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-[160] bg-white lg:hidden">
          <div className="flex h-dvh flex-col pt-24 md:pt-28 lg:pt-[7.25rem]">
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-8">
              <MobileNavLink
                href="/"
                icon={Home}
                label="Trang chủ"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <MobileNavLink
                href={SITE_PATHS.search}
                icon={Building2}
                label="Tìm căn hộ"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              {SHORT_TERM_PUBLIC_ACCESS ? (
                <MobileNavLink
                  href="/can-ho-ngan-han"
                  icon={MoonStar}
                  label="Căn hộ ngắn hạn"
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              ) : null}
              <DistrictNav
                variant="mobile"
                onNavigate={() => setIsMobileMenuOpen(false)}
              />
              <MobileNavLink
                href={SITE_PATHS.about}
                icon={Info}
                label="Giới thiệu"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <MobileNavLink
                href={SITE_PATHS.faq}
                icon={CircleHelp}
                label="Câu hỏi thường gặp"
                onClick={() => setIsMobileMenuOpen(false)}
              />

              {canRegisterAsPartner && (
                <MobileNavLink
                  href={SITE_PATHS.partnerRegister}
                  icon={Handshake}
                  label="Hợp tác ký gửi"
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              )}

              {user && isLandlord && (
                <MobileNavLink
                  href="/profile/apartments"
                  icon={Building}
                  label="Quản lý phòng trống"
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              )}

              {user && !isLandlord && (
                <MobileNavLink
                  href="/profile/bookings"
                  icon={CalendarDays}
                  label={
                    canSeeCollaboratorGuide
                      ? "Quản lý lịch dẫn khách"
                      : "Quản lý lịch hẹn"
                  }
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              )}

              {user && canSeeCollaboratorGuide && (
                <MobileNavLink
                  href={COLLABORATOR_GUIDE_URL}
                  icon={BookOpen}
                  label="Hướng dẫn CTV"
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              )}

              <MobileNavLink
                href="/favorites"
                icon={Heart}
                label="Yêu thích"
                onClick={() => setIsMobileMenuOpen(false)}
              />

              <div className="my-2 h-px bg-gray-100" />

              {!user ? (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-gray-50 py-3 text-sm font-bold text-gray-700"
                  >
                    <LogIn className="h-4 w-4" /> Đăng nhập
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#cda533] py-3 text-sm font-bold text-white shadow-md"
                  >
                    <UserPlus className="h-4 w-4" /> Đăng ký
                  </Link>
                </div>
              ) : (
                <div className="rounded-xl bg-gray-50 p-3 text-center">
                  <p className="mb-1 text-xs text-gray-500">Xin chào,</p>
                  <p className="font-bold text-gray-900">
                    {user.displayName || "Thành viên"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const NavLink = ({
  href,
  label,
  light,
  className,
}: {
  href: string;
  label: string;
  light?: boolean;
  className?: string;
}) => (
  <Link
    href={href}
    className={cn(
      "text-sm font-semibold transition-colors",
      light
        ? "text-white/90 hover:text-[#cda533]"
        : "text-gray-600 hover:text-[#cda533]",
      className,
    )}
  >
    {label}
  </Link>
);

const MobileNavLink = ({
  href,
  icon: Icon,
  label,
  onClick,
}: {
  href: string;
  icon: any;
  label: string;
  onClick: () => void;
}) => (
  <Link
    href={href}
    onClick={onClick}
    className="flex items-center gap-4 rounded-xl p-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
  >
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#cda533]/10 text-[#cda533]">
      <Icon size={20} />
    </div>
    <span className="text-base">{label}</span>
  </Link>
);
