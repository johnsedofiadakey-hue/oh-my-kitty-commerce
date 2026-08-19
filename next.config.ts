import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  typedRoutes: true,
  reactStrictMode: true,
  // Produces a minimal self-contained server bundle (only the node_modules
  // actually needed at runtime) — this is what the Cloud Run Dockerfile
  // copies into the final image instead of the whole node_modules tree.
  output: "standalone",
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
      }
    ];
  }
};

export default nextConfig;
