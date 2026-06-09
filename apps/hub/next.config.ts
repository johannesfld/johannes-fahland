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
  // Cross-app recursion guards: the tracer follows the pnpm workspace symlinks
  // node_modules/.pnpm/node_modules/{hub,turnier} and would otherwise pull the OTHER
  // app's entire build into this one (standalone-in-standalone). The @next/swc-* entries
  // drop the build-time compiler the standalone server never loads.
  //
  // NB: we deliberately do NOT exclude "../../apps/<app>/.next/**" here. That glob also
  // matches THIS app's own server runtime (e.g. .next/server/webpack-runtime.js, which
  // every page.js requires via ../webpack-runtime.js). On Linux the exclude stripped it
  // from the standalone -> the deployed app crashed at first request with
  // "Cannot find module '../webpack-runtime.js'" (MODULE_NOT_FOUND). The bundle is only
  // ~60 MB now, so there is no size reason to exclude it anyway.
  outputFileTracingExcludes: {
    "/*": [
      "../../node_modules/.pnpm/node_modules/hub/**/*",
      "../../node_modules/.pnpm/node_modules/turnier/**/*",
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
