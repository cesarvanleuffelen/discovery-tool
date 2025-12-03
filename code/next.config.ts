import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Add empty turbopack config to silence the warning
  turbopack: {},
  // Keep webpack config for transformers library compatibility
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Handle transformers library in server-side
      config.externals = [...(config.externals || []), 'canvas', 'jsdom'];
    }
    return config;
  },
};

export default nextConfig;
