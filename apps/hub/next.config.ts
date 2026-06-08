import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../.."),
  outputFileTracingIncludes: {
    "/*": [
      "../../node_modules/better-sqlite3/**/*",
      "../../node_modules/@prisma/**/*",
      "../../node_modules/.prisma/**/*",
      "../../packages/db/**/*",
    ],
  },
  allowedDevOrigins: ["johannes-fahland.com"],
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
