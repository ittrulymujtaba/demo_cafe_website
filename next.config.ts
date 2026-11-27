import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Photo uploads go through a Server Action, which defaults to a 1MB body limit.
    // 10 MB photo cap plus room for multipart overhead.
    serverActions: { bodySizeLimit: "12mb" },
  },
  images: {
    // Photos come from Supabase Storage (added in the photo-upload step) and placeholder art for the demo.
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
