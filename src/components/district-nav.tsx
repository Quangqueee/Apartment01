"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import { DISTRICT_LANDINGS } from "@/lib/districts";
import { cn } from "@/lib/utils";

export default function DistrictNav({
  onNavigate,
  variant = "desktop",
  tone = "dark",
}: {
  onNavigate?: () => void;
  variant?: "desktop" | "mobile";
  tone?: "light" | "dark";
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  if (variant === "mobile") {
    return (
      <div ref={wrapRef}>
        <button
          type="button"
          aria-expanded={open}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => setOpen((value) => !value)}
          className="flex w-full items-center gap-4 rounded-xl p-3 text-left font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#cda533]/10 text-[#cda533]">
            <MapPin size={20} />
          </div>
          <span className="flex-1 text-base">Khu vực</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-gray-400 transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
        {open ? (
          <div className="mb-1 ml-14 grid grid-cols-2 gap-1 pb-2">
            {DISTRICT_LANDINGS.map((item) => {
              const href = `/${item.slug}`;
              const active = pathname === href;
              return (
                <Link
                  key={item.slug}
                  href={href}
                  onClick={(event) => {
                    event.stopPropagation();
                    onNavigate?.();
                  }}
                  className={cn(
                    "rounded-lg px-2 py-2 text-sm",
                    active
                      ? "bg-[#cda533]/10 font-semibold text-[#cda533]"
                      : "text-gray-600 hover:bg-gray-50",
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex items-center gap-1.5 text-sm font-semibold transition-colors",
          open ||
            DISTRICT_LANDINGS.some((item) => pathname === `/${item.slug}`)
            ? tone === "light"
              ? "text-white"
              : "text-gray-900"
            : tone === "light"
              ? "text-white hover:text-white/80"
              : "text-gray-600 hover:text-gray-900",
        )}
      >
        Khu vực
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      <div
        role="menu"
        className={cn(
          "absolute left-1/2 top-full z-50 w-[min(92vw,560px)] -translate-x-1/2 pt-3",
          open ? "visible pointer-events-auto" : "invisible pointer-events-none",
        )}
      >
        <div
          className={cn(
            "overflow-x-hidden rounded-2xl border border-gray-100 bg-white p-3 shadow-xl shadow-black/10 transition-all",
            open ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0",
          )}
        >
        <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          Căn hộ theo quận
        </p>
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
          {DISTRICT_LANDINGS.map((item) => {
            const href = `/${item.slug}`;
            const active = pathname === href;
            return (
              <Link
                key={item.slug}
                href={href}
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onNavigate?.();
                }}
                className={cn(
                  "rounded-xl px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-[#cda533]/10 font-semibold text-[#cda533]"
                    : "text-gray-700 hover:bg-gray-50",
                )}
              >
                {item.name}
              </Link>
            );
          })}
        </div>
        </div>
      </div>
    </div>
  );
}
