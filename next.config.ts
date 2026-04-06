import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["johannes-fahland.com"],
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
