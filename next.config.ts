import type { NextConfig } from "next";

/**
 * Next.js configuration for the AI Packaging Mockup Generator.
 *
 * `sharp` is a native (prebuilt-binary) dependency, so it must be marked as an
 * external package for the server components / route handler bundle. This is
 * required for the app to build & run correctly on Vercel serverless functions.
 */
const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp", "jimp"],
  eslint: {
    // We run linting as a separate CI step; do not block production builds on it.
    ignoreDuringBuilds: false,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
