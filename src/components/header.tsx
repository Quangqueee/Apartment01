"use client";

import Link from "next/link";
import FilterControls from "./filter-controls";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { SlidersHorizontal, Search } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "./ui/input";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function Header() {
  const isMobile = useIsMobile();
  const [filtersVisible, setFiltersVisible] = useState(!isMobile);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");

  useEffect(() => {
    // When switching between mobile and desktop, adjust filter visibility
    setFiltersVisible(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    // Sync search input with URL params on navigation
    setSearchQuery(searchParams.get("q") || "");
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchQuery) {
      params.set("q", searchQuery);
    } else {
      params.delete("q");
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex flex-col gap-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
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

           <div className="order-last w-full md:order-none md:w-auto md:flex-1 md:px-8 lg:px-16">
            <form onSubmit={handleSearch} className="relative w-full">
              <Input
                placeholder="Tìm kiếm theo tiêu đề, mã..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
              >
                <Search className="h-4 w-4" />
                <span className="sr-only">Tìm kiếm</span>
              </Button>
            </form>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className=""
              onClick={() => setFiltersVisible(!filtersVisible)}
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Bộ lọc
            </Button>
            <Link
              href="/admin"
              className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-primary md:block"
            >
              Admin
            </Link>
          </div>
        </div>
        <div
          className={cn(
            "transform-gpu transition-all duration-300 ease-in-out",
            !filtersVisible
              ? "max-h-0 opacity-0 invisible"
              : "max-h-[500px] opacity-100 visible"
          )}
        >
          <FilterControls
            onFilterSave={() => isMobile && setFiltersVisible(false)}
          />
        </div>
      </div>
    </header>
  );
}
