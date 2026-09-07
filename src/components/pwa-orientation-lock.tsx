"use client";

import { useEffect } from "react";
import { PWA_ORIENTATION } from "@/lib/pwa";
import { isMobileUserAgent, isStandalonePwa } from "@/lib/web-share";

/**
 * Manifest `orientation` locks Android Chrome PWAs. iOS ignores it.
 * Screen Orientation API covers Android after install; iOS still cannot lock.
 * Desktop (browser or installed PWA) is left alone.
 */
export function PwaOrientationLock() {
  useEffect(() => {
    if (!isStandalonePwa() || !isMobileUserAgent()) return;

    const orientation = window.screen?.orientation as
      | (ScreenOrientation & { lock?: (type: string) => Promise<void> })
      | undefined;
    if (!orientation || typeof orientation.lock !== "function") return;

    void orientation.lock(PWA_ORIENTATION).catch(() => {
      /* Unsupported browsers (including iOS) reject; ignore. */
    });
  }, []);

  return null;
}
