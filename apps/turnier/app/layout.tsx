import type { Metadata, Viewport } from "next";
import { InstallPrompt } from "@/components/ui/InstallPrompt";
import { Onboarding } from "@/components/ui/Onboarding";
import { PWAInstaller } from "@/components/ui/PWAInstaller";
import { grotesk, mono, serif } from "./fonts";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  // App ist bewusst Light-only – auch bei dunkler Systemeinstellung.
  themeColor: "#FBF7F0",
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export const metadata: Metadata = {
  title: "Turnier",
  description: "Turnierleitung für Tischtennis & mehr — Auslosung, Ergebnisse, Tabelle, TV-Ansicht.",
  creator: "Johannes Fahland",
  authors: [{ name: "Johannes Fahland" }],
  manifest: "/turnier-manifest.json",
  appleWebApp: {
    capable: true,
    // "default" = dunkler Statusleistentext. "black-translucent" zeichnet ihn
    // weiß – auf dem hellen Creme-Hintergrund wäre die Uhrzeit unsichtbar.
    statusBarStyle: "default",
    title: "Turnier",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/brand/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

/**
 * Light-only: entfernt eine ggf. aus einer früheren Version noch gesetzte
 * .dark-Klasse und fixiert das Farbschema, damit Formularelemente und
 * Scrollbalken auch bei dunkler Systemeinstellung hell gerendert werden.
 */
const themeInitScript = `
(function(){
  try {
    var r = document.documentElement;
    r.classList.remove('dark');
    r.style.colorScheme = 'light';
  } catch (e) {}
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      suppressHydrationWarning
      className={`${serif.variable} ${grotesk.variable} ${mono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/brand/apple-touch-icon.png" />
      </head>
      <body className="flex h-dvh min-h-dvh flex-col overflow-hidden overscroll-none bg-[var(--vibe-bg-base)] text-[var(--vibe-fg-base)]">
        <PWAInstaller />
        <InstallPrompt appName="Turnier" />
        <Onboarding />
        {children}
      </body>
    </html>
  );
}
