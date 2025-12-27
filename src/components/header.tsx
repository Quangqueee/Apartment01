"use client";
import Link from "next/link";
import { useUser } from "@/firebase/provider";
import UserNav from "./user-nav";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const { user } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[100] w-full border-b border-gray-100 bg-white/95 backdrop-blur-md">
      <div className="container mx-auto px-6 h-20 md:h-24 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <svg
            className="h-8 w-8 text-primary"
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
          <h1 className="font-headline text-2xl font-bold tracking-tight md:text-3xl">
            Hanoi Residences
          </h1>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-10">
          <Link
            href="/"
            className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-primary transition-colors"
          >
            Trang chủ
          </Link>
          <Link
            href="/apartments"
            className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-primary transition-colors"
          >
            Căn hộ
          </Link>
          <Link
            href="/about"
            className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-primary transition-colors"
          >
            Giới thiệu
          </Link>

          <div className="flex items-center gap-6 border-l border-gray-100 pl-8 ml-2">
            {user ? (
              <UserNav />
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-primary transition-colors italic"
                >
                  Đăng nhập
                </Link>
                {/* NÚT ĐĂNG KÝ THU HÚT */}
                <Link
                  href="/signup"
                  className="bg-gray-900 text-white px-8 py-3 rounded-xl text-[15px] font-black uppercase tracking-widest hover:bg-primary transition-all shadow-lg active:scale-95 italic"
                >
                  Đăng ký ngay
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-4">
          {user && <UserNav />}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-gray-600 bg-gray-50 rounded-xl"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </header>
  );
}
