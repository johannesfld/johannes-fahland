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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBF7F0" },
    { media: "(prefers-color-scheme: dark)", color: "#26211D" },
  ],
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
    statusBarStyle: "black-translucent",
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

const themeInitScript = `
(function(){
  try {
    var t = localStorage.getItem('theme');
    var sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = t === 'light' ? false : t === 'system' ? sysDark : t === 'dark' ? true : sysDark;
    var r = document.documentElement;
    r.classList.toggle('dark', dark);
    r.style.colorScheme = dark ? 'dark' : 'light';
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
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
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
