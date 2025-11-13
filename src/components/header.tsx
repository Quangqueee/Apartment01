"use client";

import Link from "next/link";
import FilterControls from "./filter-controls";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "./ui/button";
import { SlidersHorizontal } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Header() {
  const [filtersVisible, setFiltersVisible] = useState(false);
  const isMobile = useIsMobile();

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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="md:hidden"
              onClick={() => setFiltersVisible(!filtersVisible)}
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Bộ lọc
            </Button>
            <Link
              href="/admin"
              className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-primary md:block"
            >
              Admin Dashboard
            </Link>
          </div>
        </div>
        <div
          className={cn(
            "transform-gpu transition-all duration-300 ease-in-out",
            isMobile && !filtersVisible ? "max-h-0 opacity-0 -translate-y-4 invisible" : "max-h-[500px] opacity-100 translate-y-0 visible"
          )}
        >
          <FilterControls onFilterSave={() => isMobile && setFiltersVisible(false)} />
        </div>
      </div>
    </header>
  );
}
