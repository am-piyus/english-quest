import type { NextConfig } from "next";
import path from "path";

// On GitHub Pages the site is served from a sub-path (/english-quest). The CI
// workflow sets PAGES_BASE_PATH; locally and on Vercel it's empty (root).
const basePath = process.env.PAGES_BASE_PATH || "";

const nextConfig: NextConfig = {
  // Static HTML export — runs on GitHub Pages (and any static host / Vercel).
  output: "export",
  // The default image optimizer needs a server; static export can't use it.
  images: { unoptimized: true },
  // Serve each route as /route/index.html so static hosts resolve deep links.
  trailingSlash: true,
  basePath: basePath || undefined,
  // Expose the base path to the client so generated share links derive from it
  // (Next base path) rather than a hardcoded origin (see lib/shareLink.ts).
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  // Pin the workspace root so a stray lockfile higher up can't misdirect Next.
  turbopack: { root: path.join(__dirname) },
};

export default nextConfig;
