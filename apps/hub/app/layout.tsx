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
    { media: "(prefers-color-scheme: light)", color: "#FCE2EF" },
    { media: "(prefers-color-scheme: dark)", color: "#3A1228" },
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
    // Frei gewählte Tisch-Farbe (Hex) vor dem ersten Paint in Surfaces übersetzen
    // (FOUC-Schutz). Spiegelt surfacesFor() aus BackgroundProvider. Default = Logo-Pink.
    var hex = localStorage.getItem('pasch-bg');
    if (!hex || !/^#?[0-9a-fA-F]{6}$/.test(hex)) hex = '#E44890';
    if (hex[0] !== '#') hex = '#' + hex;
    function hsl(x){
      var R=parseInt(x.slice(1,3),16)/255,G=parseInt(x.slice(3,5),16)/255,B=parseInt(x.slice(5,7),16)/255;
      var mx=Math.max(R,G,B),mn=Math.min(R,G,B),d=mx-mn,h=0;
      if(d!==0){ if(mx===R)h=((G-B)/d)%6; else if(mx===G)h=(B-R)/d+2; else h=(R-G)/d+4; h*=60; if(h<0)h+=360; }
      var l=(mx+mn)/2, s=d===0?0:d/(1-Math.abs(2*l-1));
      return {h:h,s:s*100,l:l*100};
    }
    function toHex(h,s,l){
      s/=100; l/=100;
      var c=(1-Math.abs(2*l-1))*s, xx=c*(1-Math.abs((h/60)%2-1)), m=l-c/2, R,G,B;
      if(h<60){R=c;G=xx;B=0;} else if(h<120){R=xx;G=c;B=0;} else if(h<180){R=0;G=c;B=xx;}
      else if(h<240){R=0;G=xx;B=c;} else if(h<300){R=xx;G=0;B=c;} else {R=c;G=0;B=xx;}
      function p(n){return Math.round((n+m)*255).toString(16).padStart(2,'0');}
      return '#'+p(R)+p(G)+p(B);
    }
    var c = hsl(hex);
    var sat = dark ? Math.min(60,Math.max(28,c.s)) : Math.min(48,Math.max(22,c.s));
    var L = dark ? {base:13,elevated:18,sunken:9,tinted:22,overlay:24}
                 : {base:93,elevated:97,sunken:88,tinted:90,overlay:99};
    r.style.setProperty('--vibe-bg-base', toHex(c.h,sat,L.base));
    r.style.setProperty('--vibe-bg-elevated', toHex(c.h,sat,L.elevated));
    r.style.setProperty('--vibe-bg-sunken', toHex(c.h,sat,L.sunken));
    r.style.setProperty('--vibe-bg-tinted', toHex(c.h,sat,L.tinted));
    r.style.setProperty('--vibe-bg-overlay', toHex(c.h,sat,L.overlay));
    r.style.setProperty('--background', toHex(c.h,sat,L.base));
    r.style.setProperty('--surface', toHex(c.h,sat,L.elevated));
    r.style.setProperty('--surface-muted', toHex(c.h,sat,L.sunken));
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
