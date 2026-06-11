import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["turnier.johannes-fahland.com"],
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
