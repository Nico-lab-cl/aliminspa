import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: false,
    formats: ['image/webp'],
  },
};

export default nextConfig;
