"use client";

import Link from "next/link";
import FilterControls from "./filter-controls";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function Header() {
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showFilters, setShowFilters] = useState(true);

  // A threshold after which the header starts hiding
  const HIDE_THRESHOLD = 100;

  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== "undefined") {
        const currentScrollY = window.scrollY;

        // Determine scroll direction
        if (currentScrollY > lastScrollY && currentScrollY > HIDE_THRESHOLD) {
          // Scrolling down and past the threshold
          setShowFilters(false);
        } else {
          // Scrolling up or at the top of the page
          setShowFilters(true);
        }
        
        // Remember current page location for the next move.
        // Only update if it's a significant change to avoid excessive re-renders.
        if (Math.abs(currentScrollY - lastScrollY) > 5) {
          setLastScrollY(currentScrollY);
        }
      }
    };
    
    window.addEventListener("scroll", controlNavbar, { passive: true });

    return () => {
      window.removeEventListener("scroll", controlNavbar);
    };
  }, [lastScrollY]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
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

            <h1 className="font-headline text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Hanoi Residences
            </h1>
          </Link>
          <Link
            href="/admin"
            className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-primary md:block"
          >
            Admin Dashboard
          </Link>
        </div>
        <div
          className={cn(
            "transform-gpu transition-all duration-300 ease-in-out",
            showFilters
              ? "visible h-auto translate-y-0 opacity-100"
              : "invisible h-0 -translate-y-4 opacity-0"
          )}
        >
          <FilterControls />
        </div>
      </div>
    </header>
  );
}
