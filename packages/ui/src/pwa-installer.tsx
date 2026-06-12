"use client";

import { useEffect } from "react";

export function PWAInstaller() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let reloading = false;

    const reloadOnControllerChange = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", reloadOnControllerChange);

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        // Aktiviere wartende Worker direkt
        if (registration.waiting) {
          registration.waiting.postMessage("SKIP_WAITING");
        }
        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              // Neue Version verfügbar → sofort aktivieren
              installing.postMessage("SKIP_WAITING");
            }
          });
        });
        // Periodische Update-Prüfung (jede Stunde)
        const interval = setInterval(() => {
          registration.update().catch(() => {});
        }, 60 * 60 * 1000);
        // Bei sichtbarem Tab sofort prüfen
        const onVisible = () => {
          if (document.visibilityState === "visible") {
            registration.update().catch(() => {});
          }
        };
        document.addEventListener("visibilitychange", onVisible);
        return () => {
          clearInterval(interval);
          document.removeEventListener("visibilitychange", onVisible);
        };
      })
      .catch((error) => {
        console.warn("Service Worker registration failed:", error);
      });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", reloadOnControllerChange);
    };
  }, []);

  return null;
}
