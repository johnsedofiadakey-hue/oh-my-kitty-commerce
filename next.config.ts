import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  typedRoutes: true,
  reactStrictMode: true,
  // Produces a minimal self-contained server bundle (only the node_modules
  // actually needed at runtime) — this is what the Cloud Run Dockerfile
  // copies into the final image instead of the whole node_modules tree.
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/v0/b/**"
      }
    ]
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }
        ]
      },
      {
        // Next's default long-lived s-maxage on prerendered HTML pages is
        // meant for platforms (Vercel) that version-key their CDN cache per
        // deploy. Firebase Hosting's CDN doesn't — it caches by URL alone,
        // so a page's chunk-hash references can go stale across deploys and
        // 404 in visitors' browsers until the year-long cache expires.
        // Actual /_next/static/* assets are safe to cache forever since
        // their filenames are content-hashed; only override the page shell.
        source: "/((?!_next/static).*)",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }]
      }
    ];
  }
};

export default nextConfig;
