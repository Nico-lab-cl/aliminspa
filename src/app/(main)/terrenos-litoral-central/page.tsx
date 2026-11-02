import type { Metadata } from 'next'
import { SITE } from '@/lib/constants'
import { FAQS, COMUNAS } from './contenido'
import TerrenosLitoralCentral from './TerrenosLitoralCentral'

// Pillar page "Terrenos en la playa del Litoral Central".
//
// Investigación (Ubersuggest, Chile / es, noviembre 2026):
//   · terrenos en la playa 880/mes SD 10 · terrenos litoral central 320 SD 18
//     · venta terrenos litoral central 210 SD 14.
//   · El AI Overview de "terrenos en la playa litoral central" ya cita a
//     Alimin → respuesta con precio en el primer párrafo + FAQPage.
//   · Hijas del cluster: terrenos baratos en la playa (ya existe), El Tabo,
//     Las Cruces y las páginas "terrenos cerca de" Algarrobo, El Quisco,
//     Punta de Tralca y Cartagena. Cada una enlaza de vuelta a esta.

const PAGE_URL = `${SITE.url}/terrenos-litoral-central`
const OG_IMAGE = `${SITE.url}/assets/venta-terrenos/gallery/g10.webp`

export const metadata: Metadata = {
    title: {
        absolute: 'Terrenos en la Playa del Litoral Central: Guía por Comuna y Precios',
    },
    description:
        'Guía de terrenos en la playa del Litoral Central: comunas de Algarrobo a Santo Domingo, cuánto cuesta un terreno, qué revisar antes de comprar y cómo pagar sin banco. Terrenos en El Tabo desde $35.000.000 con rol propio, agua y luz.',
    keywords: [
        'terrenos en la playa',
        'terrenos litoral central',
        'terrenos en la playa litoral central',
        'venta terrenos litoral central',
        'terrenos en venta litoral central',
        'sitios en venta litoral central',
        'terrenos en el litoral central',
    ],
    alternates: { canonical: PAGE_URL },
    openGraph: {
        type: 'article',
        url: PAGE_URL,
        siteName: SITE.name,
        locale: 'es_CL',
        title: 'Terrenos en la Playa del Litoral Central: Guía por Comuna y Precios',
        description:
            'Comunas, precios, qué revisar y cómo pagar sin banco. Terrenos en El Tabo desde $35.000.000 con rol propio, agua y luz.',
        images: [{ url: OG_IMAGE, alt: 'Terrenos en la playa del Litoral Central, El Tabo' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Terrenos en la Playa del Litoral Central: Guía por Comuna y Precios',
        description: 'Comunas, precios y cómo pagar sin banco. Terrenos en El Tabo desde $35.000.000.',
        images: [OG_IMAGE],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    other: {
        'geo.region': 'CL-VS',
        'geo.placename': 'El Tabo',
    },
}

function JsonLd() {
    const graph = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'Article',
                '@id': `${PAGE_URL}#articulo`,
                headline: 'Terrenos en la playa del Litoral Central: guía por comuna y precios',
                description:
                    'Comunas del Litoral Central, cuánto cuesta un terreno en la playa, qué revisar antes de comprar y cómo pagarlo sin banco.',
                image: OG_IMAGE,
                inLanguage: 'es-CL',
                datePublished: '2026-11-02',
                dateModified: '2026-11-02',
                mainEntityOfPage: PAGE_URL,
                author: { '@type': 'Organization', name: SITE.name, url: SITE.url },
                publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url },
                about: COMUNAS.map((c) => ({ '@type': 'Place', name: c.nombre })),
            },
            {
                '@type': 'FAQPage',
                '@id': `${PAGE_URL}#faq`,
                mainEntity: FAQS.map((f) => ({
                    '@type': 'Question',
                    name: f.q,
                    acceptedAnswer: { '@type': 'Answer', text: f.a },
                })),
            },
            {
                '@type': 'BreadcrumbList',
                '@id': `${PAGE_URL}#breadcrumb`,
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE.url },
                    { '@type': 'ListItem', position: 2, name: 'Terrenos en el Litoral Central', item: PAGE_URL },
                ],
            },
        ],
    }

    return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
}

export default function TerrenosLitoralCentralPage() {
    return (
        <>
            <JsonLd />
            <TerrenosLitoralCentral />
        </>
    )
}
