import type { Metadata } from 'next'
import CookieBanner from '@/components/consent/CookieBanner'
import '@/styles/globals.css'
import { SITE } from '@/lib/constants'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { RealEstateAgentSchema, LocalBusinessSchema } from '@/components/seo/JsonLd'

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `Terrenos en Venta en El Tabo con Rol Propio | ${SITE.name}`,
    template: `%s | ${SITE.name}`,
  },
  description: 'Venta de terrenos urbanizados en El Tabo, Litoral Central. Lotes desde 200 m² con rol propio, agua y luz certificada. ¡Tu inversión segura frente al mar con Alimin!',
  keywords: [
    'venta de terrenos en el tabo',
    'terrenos en venta el tabo',
    'parcelas en el tabo con rol propio',
    'inmobiliaria el tabo',
    'proyectos inmobiliarios litoral central',
    'venta de terrenos urbanizados chile',
    'terrenos con vista al mar el tabo',
    'alimin inmobiliaria el tabo',
    'lomas del mar el tabo',
    'arena y sol el tabo',
  ],
  authors: [{ name: SITE.name }],
  creator: SITE.name,
  publisher: SITE.name,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    url: SITE.url,
    siteName: SITE.name,
    title: `Terrenos en Venta en El Tabo con Rol Propio | ${SITE.name}`,
    description: 'Venta de terrenos urbanizados en El Tabo, Litoral Central. Lotes desde 200 m² con rol propio, agua y luz certificada. ¡Tu inversión segura frente al mar con Alimin!',
    images: [
      {
        url: '/images/og-image.webp',
        width: 1200,
        height: 630,
        alt: 'Alimin Inmobiliaria - Terrenos en Venta en El Tabo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Terrenos en Venta en El Tabo | ${SITE.name}`,
    description: 'Venta de terrenos urbanizados en El Tabo, Litoral Central. Lotes con rol propio y servicios básicos.',
    images: ['/images/og-image.webp'],
  },
  alternates: {
    canonical: SITE.url,
    languages: {
      'es-CL': SITE.url,
    },
  },
  other: {
    'geo.region': 'CL-VS',
    'geo.placename': 'El Tabo',
    'geo.position': '-33.4542;-71.6667',
    'ICBM': '-33.4542, -71.6667',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es-CL">
      <head>
        <meta name="theme-color" content="#FFFFFF" />
        <RealEstateAgentSchema />
        <LocalBusinessSchema />
      </head>
      <body>
        {children}

        {/* Google Analytics, Tag Manager, Clarity, Meta Pixel y el rastreador
            del CRM ya no van en el <head>: los carga este banner solo si el
            visitante los acepta (Ley 21.719). Ver src/components/consent. */}
        <CookieBanner />
      </body>
    </html>
  )
}
