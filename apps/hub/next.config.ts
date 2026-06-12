import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["johannes-fahland.com"],
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return [
      {
        source: "/wizzard-punkterechner",
        destination: "/wizard",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
