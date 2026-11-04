import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: false,
    formats: ['image/webp'],
  },
  async redirects() {
    return [
      // Las dos páginas competían por "venta de terrenos / terrenos baratos en
      // el litoral central" (canibalización, mapa SEO del 2-nov-2026). Queda la
      // de terrenos baratos; la autoridad de esta pasa con el 301.
      {
        source: '/venta-de-terrenos-litoral-central',
        destination: '/terrenos-baratos-en-la-playa-litoral-central-chile',
        statusCode: 301,
      },
    ];
  },
};

export default nextConfig;
