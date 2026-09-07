export type SharePayload = {
  title: string;
  text?: string;
  url: string;
};

export type SystemShareResult =
  | "shared"
  | "cancelled"
  | "unavailable"
  | "failed";

export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    nav.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches
  );
}

export function isMobileUserAgent(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

export function canUseWebShare(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

/** PWA / mobile: native share sheet. Desktop keeps the in-app modal. */
export function shouldUseSystemShare(): boolean {
  return canUseWebShare() && (isStandalonePwa() || isMobileUserAgent());
}

export function getPageShareUrl(): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}${window.location.pathname}${window.location.search}`;
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name: string }).name === "AbortError"
  );
}

function shareCandidates(payload: SharePayload): ShareData[] {
  const title = payload.title.trim();
  const url = payload.url.trim();
  const text = (payload.text ?? payload.title).trim();
  return [
    { title, text, url },
    { title, url },
    { text: url ? `${text}\n${url}` : text },
    { url },
  ].filter((data) => Object.values(data).some(Boolean));
}

export async function shareViaSystem(
  payload: SharePayload,
): Promise<SystemShareResult> {
  if (!canUseWebShare()) return "unavailable";

  let sawError = false;
  for (const data of shareCandidates(payload)) {
    try {
      if (navigator.canShare && !navigator.canShare(data)) continue;
      await navigator.share(data);
      return "shared";
    } catch (error) {
      if (isAbortError(error)) return "cancelled";
      sawError = true;
    }
  }

  return sawError ? "failed" : "unavailable";
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined" || !text) return false;

  try {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // iOS standalone often rejects the Clipboard API.
  }

  return copyWithExecCommand(text);
}

function copyWithExecCommand(text: string): boolean {
  const el = document.createElement("textarea");
  el.value = text;
  el.setAttribute("readonly", "");
  el.setAttribute("contenteditable", "true");
  el.style.position = "fixed";
  el.style.top = "0";
  el.style.left = "0";
  el.style.width = "1px";
  el.style.height = "1px";
  el.style.padding = "0";
  el.style.border = "none";
  el.style.outline = "none";
  el.style.boxShadow = "none";
  el.style.background = "transparent";
  el.style.opacity = "0";
  document.body.appendChild(el);

  const isiOS = /ipad|iphone|ipod/i.test(navigator.userAgent);
  if (isiOS) {
    const range = document.createRange();
    range.selectNodeContents(el);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);
    el.setSelectionRange(0, text.length);
  } else {
    el.focus();
    el.select();
  }

  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(el);
  return ok;
}

/** window.open is ignored in many standalone PWAs. */
export function openExternalUrl(url: string): boolean {
  if (typeof window === "undefined" || !url) return false;

  const isHttp = /^https?:/i.test(url);

  if (!isHttp) {
    try {
      window.location.assign(url);
      return true;
    } catch {
      return false;
    }
  }

  try {
    const popup = window.open(url, "_blank", "noopener,noreferrer");
    if (popup) return true;
  } catch {
    // ignored
  }

  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    return true;
  } catch {
    try {
      window.location.assign(url);
      return true;
    } catch {
      return false;
    }
  }
}
