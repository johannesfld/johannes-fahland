"use client";

import { useEffect } from "react";

export function PWAInstaller() {
  useEffect(() => {
    // Register Service Worker for PWA
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          console.log("Service Worker registered:", registration);
        })
        .catch((error) => {
          console.log("Service Worker registration failed:", error);
        });
    }
  }, []);

  return null;
}
