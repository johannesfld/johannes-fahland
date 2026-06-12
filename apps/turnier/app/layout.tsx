import type { Metadata, Viewport } from "next";
import { fraunces, hankenGrotesk, splineSansMono } from "./fonts";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F0E1" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1F17" },
  ],
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export const metadata: Metadata = {
  title: "Turnierleitung",
  description: "Tischtennis-Turnierleitung — Reihum-Doppel, Standings, TV-View.",
  creator: "Johannes Fahland",
  authors: [{ name: "Johannes Fahland" }],
  manifest: "/turnier-manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Turnierleitung",
  },
  formatDetection: {
    telephone: false,
  },
};

const themeInitScript = `
(function(){
  try {
    var t = localStorage.getItem('theme');
    var sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = t === 'light' ? false : t === 'system' ? sysDark : true;
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
      data-tool="turnier"
      className={`${fraunces.variable} ${hankenGrotesk.variable} ${splineSansMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </head>
      <body className="h-dvh min-h-dvh overflow-hidden overscroll-none bg-[var(--vibe-bg-base)] text-[var(--vibe-fg-base)]">
        {children}
      </body>
    </html>
  );
}
