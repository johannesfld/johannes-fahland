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
      // Only the db package's own sources — NOT its hoisted node_modules,
      // which carry a full duplicate next + @prisma (~250 MB).
      "../../packages/db/src/**/*",
      "../../packages/db/prisma/**/*",
      "../../packages/db/scripts/**/*",
      "../../packages/db/package.json",
    ],
  },
  // KEEP THESE — they are architecture-independent CORRECTNESS guards, not x64 size hacks.
  // The file tracer follows the pnpm workspace symlinks node_modules/.pnpm/node_modules/{hub,turnier}
  // and recursively pulls the OTHER app's entire .next/standalone into this one
  // (standalone-in-standalone). Measured on the native build: even WITH these excludes
  // hub=751 MB / turnier=1.6 GB; removing them balloons both bundles further and risks
  // ENOSPC mid-rsync on the constrained Pi -> half-written, non-bootable bundle = broken site.
  // The @next/swc-* entries drop the ~100 MB build-time compiler that the standalone server never loads.
  outputFileTracingExcludes: {
    "/*": [
      "../../node_modules/.pnpm/node_modules/hub/**/*",
      "../../node_modules/.pnpm/node_modules/turnier/**/*",
      "../../apps/hub/.next/**/*",
      "../../apps/turnier/.next/**/*",
      "../../node_modules/@next/swc-*/**/*",
      "../../node_modules/.pnpm/@next+swc-*/**/*",
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
