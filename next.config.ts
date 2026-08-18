import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  typedRoutes: true,
  reactStrictMode: true,
  // Produces a minimal self-contained server bundle (only the node_modules
  // actually needed at runtime) — this is what the Cloud Run Dockerfile
  // copies into the final image instead of the whole node_modules tree.
  output: "standalone"
};

export default nextConfig;
