import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This app lives in a sub-folder of a repo that has its own lockfile.
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
  images: {
    // AVIF first (smallest), WebP fallback; optimised variants cached for 30 days.
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [390, 640, 828, 1080, 1280, 1600, 1920, 2400],
  },
  // Metadata is computed instantly from catalogue data, so always render it in
  // <head> (no streamed metadata) for every crawler and link preview.
  htmlLimitedBots: /.*/,
  experimental: {
    // Inline the (small) stylesheet so it no longer blocks first paint.
    inlineCss: true,
  },
  async headers() {
    return [
      {
        // Source media (renders, posters, future GLB/KTX2 files). Not content-hashed yet,
        // so a week plus background revalidation rather than "immutable".
        source: "/media/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
    ];
  },
};

export default nextConfig;
