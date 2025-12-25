import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Explicitly acknowledge Turbopack (Next.js 16 requirement)
  turbopack: {},

  // Needed for browser-based inference (onnxruntime / wasm)
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    return config;
  },
};

export default nextConfig;
