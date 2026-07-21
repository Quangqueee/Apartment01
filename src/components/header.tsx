"use client";

import Link from "next/link";
import { useUser } from "@/firebase/provider";
import UserNav from "./user-nav";
import {
  Menu,
  X,
  Heart,
  Home,
  Info,
  Building2,
  LogIn,
  UserPlus,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function Header() {
  const { user } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Tắt scroll body khi menu mở
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isMobileMenuOpen]);

  return (
    <header className="sticky top-0 z-[100] w-full border-b border-gray-100 bg-white shadow-sm font-sans">
      <div className="container mx-auto px-4 md:px-6 h-20 md:h-24 flex items-center justify-between relative bg-white z-[101]">
        {/* LOGO */}
        <Link
          href="/"
          className="flex items-center gap-2"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <svg
            className="h-8 w-8 text-[#cda533]"
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
          <h1 className="font-headline text-xl md:text-3xl font-bold tracking-tight text-gray-900">
            Hanoi Residences
          </h1>
        </Link>

        {/* DESKTOP NAV */}
        <nav className="hidden md:flex items-center gap-8">
          <NavLink href="/" label="Trang chủ" />
          <NavLink href="/#apartments-list" label="Căn hộ" />
          {/* SỬA: Đường dẫn trỏ về ID #about */}
          <NavLink href="/#about" label="Giới thiệu" />

          {user && (
            <Link
              href="/favorites"
              className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-red-500 transition-colors"
            >
              <Heart className="h-4 w-4" /> Yêu thích
            </Link>
          )}

          <div className="flex items-center gap-6 border-l border-gray-100 pl-8 ml-2">
            {user ? (
              <UserNav />
            ) : (
              <>
                <NavLink href="/login" label="Đăng nhập" className="italic" />
                <Link
                  href="/signup"
                  className="bg-[#1a1a1a] text-white px-6 py-2.5 rounded-lg text-[13px] font-bold uppercase tracking-wider hover:bg-[#cda533] transition-all shadow-md active:scale-95"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* MOBILE MENU BUTTON */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* MOBILE DROPDOWN MENU */}
      <div
        className={cn(
          "md:hidden absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-xl overflow-hidden transition-all duration-300 ease-in-out z-[90]",
          isMobileMenuOpen
            ? "max-h-[calc(100vh-80px)] opacity-100"
            : "max-h-0 opacity-0"
        )}
      >
        <div className="flex flex-col p-4 gap-2">
          <MobileNavLink
            href="/"
            icon={Home}
            label="Trang chủ"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <MobileNavLink
            href="/#apartments-list"
            icon={Building2}
            label="Danh sách Căn hộ"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* SỬA: Đường dẫn mobile cũng trỏ về #about */}
          <MobileNavLink
            href="/#about"
            icon={Info}
            label="Về chúng tôi"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <div className="h-px bg-gray-100 my-2" />

          {!user ? (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-50 text-gray-700 font-bold text-sm"
              >
                <LogIn className="h-4 w-4" /> Đăng nhập
              </Link>
              <Link
                href="/signup"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#cda533] text-white font-bold text-sm shadow-md"
              >
                <UserPlus className="h-4 w-4" /> Đăng ký
              </Link>
            </div>
          ) : (
            <div className="p-2 bg-gray-50 rounded-xl text-center">
              <p className="text-xs text-gray-500 mb-1">Xin chào,</p>
              <p className="font-bold text-gray-900">
                {user.displayName || "Thành viên"}
              </p>
            </div>
          )}
        </div>
        <div
          className="h-screen bg-black/20 backdrop-blur-[2px]"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      </div>
    </header>
  );
}

// Helper Components
const NavLink = ({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className?: string;
}) => (
  <Link
    href={href}
    className={cn(
      "text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-[#cda533] transition-colors",
      className
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
    className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 text-gray-700 font-medium transition-colors"
  >
    <div className="h-10 w-10 rounded-full bg-[#cda533]/10 flex items-center justify-center text-[#cda533]">
      <Icon size={20} />
    </div>
    <span className="text-base">{label}</span>
  </Link>
);
