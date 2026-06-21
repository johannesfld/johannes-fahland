import type { Metadata, Viewport } from "next";
import { fraunces, hankenGrotesk, splineSansMono } from "./fonts";
import "./globals.css";
import { InstallPrompt, PWAInstaller } from "@pasch/ui";
import { AppShell } from "@/components/layout/AppShell";
import { FullscreenProvider } from "@/components/FullscreenContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { BackgroundProvider } from "@/components/BackgroundProvider";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  // Default passend zum Rosa-Hintergrund; BackgroundProvider aktualisiert die
  // theme-color zur Laufzeit auf die jeweils gewählte Tisch-Farbe.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FCE9F2" },
    { media: "(prefers-color-scheme: dark)", color: "#240E1C" },
  ],
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export const metadata: Metadata = {
  title: "Pasch",
  description: "Pasch — der digitale Spieleabend: Wizard, Kniffel, Schiffe, Rommé, Memory, Wordle und mehr.",
  creator: "Johannes Fahland",
  authors: [{ name: "Johannes Fahland" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pasch",
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
    var r = document.documentElement;
    var t = localStorage.getItem('theme');
    var sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = t === 'light' ? false : t === 'system' ? sysDark : true;
    r.classList.toggle('dark', dark);
    r.style.colorScheme = dark ? 'dark' : 'light';
    // Tisch-Hintergrund vor dem ersten Paint setzen (FOUC-Schutz). Default 'rosa';
    // 'filz' = Basiszustand der Tokens, braucht kein data-bg.
    var valid = {rosa:1,filz:1,mitternacht:1,aubergine:1,petrol:1,burgund:1,espresso:1,rosenholz:1,anthrazit:1};
    var bg = localStorage.getItem('pasch-bg');
    if (!bg || !valid[bg]) bg = 'rosa';
    if (bg === 'filz') r.removeAttribute('data-bg');
    else r.setAttribute('data-bg', bg);
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
      className={`${fraunces.variable} ${hankenGrotesk.variable} ${splineSansMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <link rel="apple-touch-icon" href="/brand/apple-touch-icon.png" />
        {/* iOS splash screens */}
        <link
          rel="apple-touch-startup-image"
          href="/brand/splash/splash-1320x2868.png"
          media="(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/brand/splash/splash-1206x2622.png"
          media="(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/brand/splash/splash-1290x2796.png"
          media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/brand/splash/splash-2048x2732.png"
          media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/brand/splash/splash-1640x2360.png"
          media="(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2)"
        />
      </head>
      <body className="h-dvh min-h-dvh overflow-hidden overscroll-none">
        <ThemeProvider>
          <BackgroundProvider>
            <PWAInstaller />
            <InstallPrompt appName="Pasch" />
            <FullscreenProvider>
              <AppShell>{children}</AppShell>
            </FullscreenProvider>
          </BackgroundProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
