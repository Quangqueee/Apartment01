"use client";

import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ADMIN_PATH } from "@/lib/constants";
import { PageLoading } from "@/components/page-loading";
import { cn } from "@/lib/utils";

type NavProgressContextValue = {
  pending: boolean;
  pendingPath: string | null;
  start: (href: string) => void;
};

const NavProgressContext = createContext<NavProgressContextValue>({
  pending: false,
  pendingPath: null,
  start: () => {},
});

export function useNavProgress() {
  return useContext(NavProgressContext);
}

function parseAppUrl(href: string): { pathname: string; search: string } | null {
  try {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return null;
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return { pathname: url.pathname, search: url.search };
  } catch {
    return null;
  }
}

function isModifiedClick(event: MouseEvent | PointerEvent) {
  return (
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.button !== 0
  );
}

function shouldHandleAnchor(
  anchor: HTMLAnchorElement,
  event: MouseEvent | PointerEvent,
) {
  if (event.defaultPrevented || isModifiedClick(event)) return false;
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;
  if (anchor.dataset.noNavProgress === "true") return false;
  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#")) return false;
  return true;
}

export function NavigationProgressProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [pendingSearch, setPendingSearch] = useState<string | null>(null);
  const [overlay, setOverlay] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const startedFromRef = useRef<string | null>(null);

  const stop = useCallback(() => {
    setPendingPath(null);
    setPendingSearch(null);
    setOverlay(false);
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const start = useCallback(
    (href: string) => {
      const dest = parseAppUrl(href);
      if (!dest) return;
      const currentPath = window.location.pathname;
      const currentSearch = window.location.search;
      if (dest.pathname === currentPath && dest.search === currentSearch) {
        return;
      }

      startedFromRef.current = `${currentPath}${currentSearch}`;
      setPendingPath(dest.pathname);
      setPendingSearch(dest.search);
      setOverlay(dest.pathname !== currentPath);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(stop, 12000);
    },
    [stop],
  );

  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let armedHref: string | null = null;

    const disarm = () => {
      armedHref = null;
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a");
      if (!anchor || !shouldHandleAnchor(anchor, event)) return;
      armedHref = anchor.href;
      startX = event.clientX;
      startY = event.clientY;
      start(anchor.href);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!armedHref) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (dx * dx + dy * dy > 144) {
        disarm();
        stop();
      }
    };

    const onPointerUp = () => {
      armedHref = null;
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("pointermove", onPointerMove, true);
    document.addEventListener("pointerup", onPointerUp, true);
    document.addEventListener("pointercancel", stop, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("pointermove", onPointerMove, true);
      document.removeEventListener("pointerup", onPointerUp, true);
      document.removeEventListener("pointercancel", stop, true);
    };
  }, [start, stop]);

  useEffect(() => () => stop(), [stop]);

  const value = useMemo(
    () => ({ pending: pendingPath !== null, pendingPath, start }),
    [pendingPath, start],
  );

  return (
    <NavProgressContext.Provider value={value}>
      {children}
      <Suspense fallback={null}>
        <NavigationUrlWatcher
          pendingPath={pendingPath}
          pendingSearch={pendingSearch}
          startedFrom={startedFromRef.current}
          onReached={stop}
        />
      </Suspense>
      <NavigationProgressChrome
        pending={pendingPath !== null}
        overlay={overlay}
      />
    </NavProgressContext.Provider>
  );
}

function NavigationUrlWatcher({
  pendingPath,
  pendingSearch,
  startedFrom,
  onReached,
}: {
  pendingPath: string | null;
  pendingSearch: string | null;
  startedFrom: string | null;
  onReached: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const normalizedSearch = search ? `?${search}` : "";

  useEffect(() => {
    if (!pendingPath) return;
    const current = `${pathname}${normalizedSearch}`;
    const dest = `${pendingPath}${pendingSearch ?? ""}`;
    const moved = Boolean(startedFrom && current !== startedFrom);
    if (current !== dest && !moved) return;

    // Keep the overlay through the first paint of loading.tsx / new page.
    const timer = window.setTimeout(onReached, 180);
    return () => window.clearTimeout(timer);
  }, [
    onReached,
    normalizedSearch,
    pathname,
    pendingPath,
    pendingSearch,
    startedFrom,
  ]);

  return null;
}

function NavigationProgressChrome({
  pending,
  overlay,
}: {
  pending: boolean;
  overlay: boolean;
}) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith(`/${ADMIN_PATH}`);

  return (
    <>
      <div
        className={cn(
          "pointer-events-none fixed left-0 right-0 z-[80] h-[2.5px] overflow-hidden transition-opacity duration-200",
          pending ? "opacity-100" : "opacity-0",
        )}
        style={{ top: "var(--safe-top)" }}
        aria-hidden
      >
        {pending ? <div className="nav-progress-bar h-full bg-[#cda533]" /> : null}
      </div>
      {pending && overlay ? (
        <div
          className={cn(
            "pointer-events-none fixed inset-x-0 z-[55] flex items-center justify-center overflow-x-hidden bg-[#FBF8F3]",
            isAdmin
              ? "inset-0"
              : "top-0 bottom-[calc(4rem+var(--safe-bottom))] md:bottom-0",
          )}
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <PageLoading className="min-h-0 py-0" />
        </div>
      ) : null}
    </>
  );
}
