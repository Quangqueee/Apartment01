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

export type CopyResult = "copied" | "shared" | "cancelled" | "failed";

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
  return (
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /ipad|iphone|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function canUseWebShare(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

export function prefersNativeShare(): boolean {
  return canUseWebShare() && (isIOS() || isStandalonePwa());
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

function copyHost(): HTMLElement {
  return (
    document.querySelector<HTMLElement>('[role="dialog"][data-state="open"]') ||
    document.querySelector<HTMLElement>('[role="dialog"]') ||
    document.body
  );
}

let persistentCopyField: HTMLTextAreaElement | null = null;

function styleCopyField(el: HTMLTextAreaElement): void {
  el.setAttribute("aria-hidden", "true");
  el.setAttribute("tabindex", "-1");
  el.setAttribute("readonly", "readonly");
  el.setAttribute("inputmode", "none");
  el.setAttribute("autocomplete", "off");
  el.setAttribute("autocorrect", "off");
  el.setAttribute("autocapitalize", "off");
  el.setAttribute("spellcheck", "false");
  el.removeAttribute("contenteditable");
  el.readOnly = true;
  el.inputMode = "none";
  el.style.position = "fixed";
  el.style.top = "0";
  el.style.left = "0";
  el.style.width = "1px";
  el.style.height = "1px";
  el.style.padding = "0";
  el.style.margin = "0";
  el.style.border = "none";
  el.style.outline = "none";
  el.style.boxShadow = "none";
  el.style.background = "transparent";
  el.style.opacity = "0.01";
  el.style.caretColor = "transparent";
  el.style.fontSize = "16px";
  el.style.zIndex = "2147483647";
}

/** Keep a field in the DOM before the tap — iOS PWA often ignores a textarea created mid-click. */
export function ensureCopyField(host?: ParentNode | null): HTMLTextAreaElement | null {
  if (typeof document === "undefined") return null;
  const parent = host || copyHost();
  if (!persistentCopyField || !persistentCopyField.isConnected) {
    persistentCopyField = document.createElement("textarea");
    styleCopyField(persistentCopyField);
  }
  if (persistentCopyField.parentNode !== parent) {
    parent.appendChild(persistentCopyField);
  }
  return persistentCopyField;
}

export function copyFromElement(
  el: HTMLTextAreaElement | null | undefined,
  text: string,
): boolean {
  if (!el || !text) return false;

  styleCopyField(el);
  el.value = text;

  try {
    el.focus({ preventScroll: true });
  } catch {
    el.focus();
  }
  el.select();
  if (typeof el.setSelectionRange === "function") {
    try {
      el.setSelectionRange(0, text.length);
    } catch {
      // ignored
    }
  }

  if (isIOS()) {
    const range = document.createRange();
    range.selectNodeContents(el);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);
    try {
      el.setSelectionRange(0, text.length);
    } catch {
      // ignored
    }
  }

  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }

  try {
    el.blur();
    window.getSelection()?.removeAllRanges();
  } catch {
    // ignored
  }

  return ok;
}

/**
 * Copy in the same user-gesture tick. Awaiting Clipboard API first
 * loses the gesture on iOS/Android standalone PWAs.
 */
export function copyTextNow(text: string): boolean {
  if (typeof window === "undefined" || !text) return false;
  return copyFromElement(ensureCopyField(), text);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (copyTextNow(text)) return true;

  try {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      window.focus();
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // iOS standalone / unfocused documents often reject Clipboard API.
  }

  return false;
}

function shareDataCandidates(
  text: string,
  options?: { title?: string; url?: string },
): ShareData[] {
  const title = options?.title?.trim() || "";
  const url = options?.url?.trim() || "";
  const body = text.trim();
  const clipped = body.length > 3500 ? `${body.slice(0, 3500)}…` : body;

  if (url && (body === url || !body)) {
    return [{ title, url }, { url }, { text: url }].filter((data) =>
      Object.values(data).some(Boolean),
    );
  }

  return [
    { ...(title ? { title } : {}), text: body },
    { text: body },
    { text: clipped },
    ...(url ? [{ title, text: body, url }, { url }] : []),
  ].filter((data) => Object.values(data).some(Boolean));
}

async function shareTextOrUrl(
  text: string,
  options?: { title?: string; url?: string },
): Promise<CopyResult> {
  if (!canUseWebShare()) return "failed";

  for (const data of shareDataCandidates(text, options)) {
    try {
      if (navigator.canShare && !navigator.canShare(data)) continue;
      await navigator.share(data);
      return "shared";
    } catch (error) {
      if (isAbortError(error)) return "cancelled";
    }
  }

  try {
    await navigator.share({ text: (options?.url || text).trim() });
    return "shared";
  } catch (error) {
    if (isAbortError(error)) return "cancelled";
    return "failed";
  }
}

function promptCopy(text: string): boolean {
  if (isMobileUserAgent() || isStandalonePwa()) return false;
  try {
    return window.prompt("Giữ để sao chép, rồi bấm OK:", text) !== null;
  } catch {
    return false;
  }
}

/**
 * iPhone / PWA: open the system share sheet first.
 * Clipboard APIs consume the tap; share after that is blocked and looks
 * like “browser not supported”.
 */
export async function copyOrShareText(
  text: string,
  options?: { title?: string; url?: string },
): Promise<CopyResult> {
  if (prefersNativeShare()) {
    const shared = await shareTextOrUrl(text, options);
    if (shared !== "failed") return shared;
    return promptCopy(text) ? "copied" : "failed";
  }

  if (copyTextNow(text)) return "copied";

  try {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return "copied";
    }
  } catch {
    // ignored
  }

  if (canUseWebShare()) {
    const shared = await shareTextOrUrl(text, options);
    if (shared !== "failed") return shared;
  }

  return promptCopy(text) ? "copied" : "failed";
}

function tryOpenNativeApp(schemeUrl: string): void {
  try {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.display = "none";
    iframe.src = schemeUrl;
    document.body.appendChild(iframe);
    window.setTimeout(() => iframe.remove(), 2500);
  } catch {
    // ignored
  }
}

/** Prefer a same-tick <a> click. window.open and location.assign fail in many PWAs. */
export function openExternalUrl(url: string): boolean {
  if (typeof window === "undefined" || !url) return false;

  if (!/^https?:/i.test(url)) {
    tryOpenNativeApp(url);
    return true;
  }

  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    copyHost().appendChild(anchor);
    anchor.click();
    anchor.remove();
    return true;
  } catch {
    // fall through
  }

  try {
    const popup = window.open(url, "_blank", "noopener,noreferrer");
    return Boolean(popup);
  } catch {
    return false;
  }
}

export function openZaloWithLink(url: string): boolean {
  const encoded = encodeURIComponent(url);
  if (isMobileUserAgent()) {
    tryOpenNativeApp(`zalo://share?url=${encoded}`);
  }
  return openExternalUrl(`https://zalo.me/share?url=${encoded}`);
}

export function openMessengerWithLink(url: string): boolean {
  const encoded = encodeURIComponent(url);
  try {
    if (isMobileUserAgent()) {
      window.open(`fb-messenger://share/?link=${encoded}`, "_blank");
    } else {
      window.open("https://www.messenger.com/", "_blank");
    }
    return true;
  } catch {
    return false;
  }
}
