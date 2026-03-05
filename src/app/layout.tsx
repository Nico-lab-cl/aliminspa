import type { Metadata } from 'next'
import Script from 'next/script'
import '@/styles/globals.css'
import { SITE } from '@/lib/constants'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { RealEstateAgentSchema, LocalBusinessSchema } from '@/components/seo/JsonLd'

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} | Proyectos Inmobiliarios y Venta de Terrenos en El Tabo`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  keywords: [
    'proyectos inmobiliarios en el tabo',
    'venta de terrenos el tabo',
    'venta de terrenos en el tabo',
    'venta de terrenos litoral central',
    'terrenos con rol propio el tabo',
    'inmobiliaria el tabo',
    'terrenos urbanizados litoral central',
    'invertir en terrenos chile',
    'alimin inmobiliaria',
    'terrenos baratos el tabo',
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
    title: `${SITE.name} | Proyectos Inmobiliarios y Venta de Terrenos en El Tabo`,
    description: SITE.description,
    images: [
      {
        url: '/images/og-image.webp',
        width: 1200,
        height: 630,
        alt: 'Alimin Inmobiliaria - Terrenos en El Tabo, Litoral Central',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE.name} | Terrenos en El Tabo`,
    description: SITE.description,
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
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/images/logo-alimin.png" />
        <meta name="theme-color" content="#0B0F19" />
        <RealEstateAgentSchema />
        <LocalBusinessSchema />
      </head>
      <body>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${SITE.gtmId}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>

        {children}

        {/* Google Tag Manager */}
        <Script
          id="gtm"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${SITE.gtmId}');`,
          }}
        />
      </body>
    </html>
  )
}
