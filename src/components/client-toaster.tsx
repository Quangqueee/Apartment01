"use client";

import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";

/** Client-only mount so Radix Toast Viewport is never in SSR HTML. */
export function ClientToaster() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <Toaster />;
}
