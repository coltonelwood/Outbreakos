/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Don't let Next/webpack bundle+transform supabase-js in the server runtime —
  // that transform corrupts its response parsing (reads return empty even though
  // writes succeed). Using the raw node_modules build fixes it.
  experimental: {
    serverComponentsExternalPackages: [
      "@supabase/supabase-js",
      "@supabase/postgrest-js",
      "@supabase/realtime-js",
      "@supabase/storage-js",
      "@supabase/auth-js",
      "@supabase/functions-js",
      "@supabase/node-fetch",
    ],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "tile.openstreetmap.org" },
    ],
  },
};

module.exports = nextConfig;
