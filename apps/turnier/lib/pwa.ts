"use client";

/**
 * PWA-/Plattform-Erkennung — zentral, damit Onboarding und InstallPrompt
 * dieselbe Logik teilen und die bekannten iOS-Fallen vermieden werden.
 */

export type Platform = "ios" | "android" | "desktop";

/** SSR-sicher: ist die App im Standalone-Modus (vom Homescreen gestartet)? */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  // iOS-spezifisch: navigator.standalone; sonst display-mode media query.
  const iosStandalone =
    "standalone" in window.navigator &&
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  const mql =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(display-mode: standalone)").matches;
  return Boolean(iosStandalone || mql);
}

/** Grobe Plattform-Erkennung für den richtigen Install-Flow. */
export function detectPlatform(): Platform {
  if (typeof window === "undefined") return "desktop";
  const ua = window.navigator.userAgent || "";
  const isIOS =
    /iphone|ipad|ipod/i.test(ua) ||
    // iPadOS gibt sich als Mac aus, hat aber Touch:
    (/macintosh/i.test(ua) && "ontouchend" in document);
  if (isIOS) return "ios";
  if (/android/i.test(ua)) return "android";
  return "desktop";
}

/** iOS Safari feuert KEIN beforeinstallprompt → kein programmatischer Install. */
export function supportsBeforeInstallPrompt(): boolean {
  return typeof window !== "undefined" && "onbeforeinstallprompt" in window;
}
