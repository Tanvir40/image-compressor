import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Important for stability on Vercel + Node environments
  experimental: {
    // helps avoid some edge/WASM issues in newer Next versions
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },

  // Prevent issues with sharp / native modules during build
  images: {
    unoptimized: true,
  },

  // Better build output handling for deployment
  output: "standalone",
};

export default nextConfig;