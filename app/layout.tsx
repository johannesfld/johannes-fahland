import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { PWAInstaller } from "@/components/PWAInstaller";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: true,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0c0e" },
  ],
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "vibecode projekte",
  description: "Manage your projects efficiently",
  creator: "Johannes Fahland",
  authors: [{ name: "Johannes Fahland" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "vibecode projekte",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/apple-touch-icon.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

const themeInitScript = `
(function(){
  try {
    var t = localStorage.getItem('theme');
    var d = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = t === 'dark' || ((t === 'system' || !t) && d);
    if (t === 'light') dark = false;
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <meta name="theme-color" content="#fafaf9" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="h-dvh overflow-hidden">
        <ThemeProvider>
          <PWAInstaller />
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
