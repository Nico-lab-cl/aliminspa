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
      // Enlaces cortos de los brochures para que los asesores los peguen a
      // mano. Van a la página (que mide en Clarity) y no al PDF directo.
      { source: '/lomas.pdf', destination: '/brochure/lomas-del-mar', permanent: false },
      { source: '/lomas', destination: '/brochure/lomas-del-mar', permanent: false },
      { source: '/arena-y-sol.pdf', destination: '/brochure/arena-y-sol', permanent: false },
      { source: '/arenaysol', destination: '/brochure/arena-y-sol', permanent: false },
    ];
  },
};

export default nextConfig;
