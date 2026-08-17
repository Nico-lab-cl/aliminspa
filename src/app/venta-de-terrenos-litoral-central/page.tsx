import { Suspense } from 'react'
import type { Metadata } from 'next'
import { SITE } from '@/lib/constants'
import { FAQS } from './faqs'
import VentaTerrenosClient from './VentaTerrenosClient'

const PAGE_URL = `${SITE.url}/venta-de-terrenos-litoral-central`
const OG_IMAGE = `${SITE.url}/assets/venta-terrenos/hero-lomas-del-mar.webp`

export const metadata: Metadata = {
    title: 'Venta de Terrenos en el Litoral Central — El Tabo, Rol Propio y Sin Banco',
    description:
        'Venta de terrenos urbanizados en el Litoral Central (El Tabo, Región de Valparaíso). Rol propio inscrito, agua y luz certificadas, financiamiento directo sin banco y sin importar tu DICOM. A minutos de la playa. Cotiza gratis con Alimin Inmobiliaria.',
    keywords: [
        'venta de terrenos litoral central',
        'terrenos litoral central',
        'terrenos en venta el tabo',
        'comprar terreno el tabo',
        'terrenos sin banco',
        'terrenos sin dicom',
        'terrenos rol propio',
        'terreno playa litoral central',
    ],
    alternates: { canonical: PAGE_URL },
    openGraph: {
        type: 'website',
        url: PAGE_URL,
        siteName: 'Alimin Inmobiliaria',
        title: 'Venta de Terrenos en el Litoral Central — El Tabo | Alimin',
        description:
            'Terrenos urbanizados en El Tabo, Litoral Central. Rol propio, agua y luz certificadas, financiamiento directo sin banco ni DICOM. A minutos de la playa.',
        locale: 'es_CL',
        images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'Terrenos en venta en el Litoral Central, El Tabo' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Venta de Terrenos en el Litoral Central — El Tabo | Alimin',
        description:
            'Terrenos urbanizados en El Tabo, Litoral Central. Rol propio, sin banco y sin importar tu DICOM.',
        images: [OG_IMAGE],
    },
    robots: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } as any,
}

function JsonLd() {
    const graph = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'RealEstateAgent',
                '@id': `${PAGE_URL}#business`,
                name: 'Alimin Inmobiliaria',
                url: SITE.url,
                image: OG_IMAGE,
                email: 'bienesraices@aliminspa.cl',
                telephone: '+56956654833',
                priceRange: '$$',
                areaServed: [
                    { '@type': 'Place', name: 'El Tabo' },
                    { '@type': 'Place', name: 'El Quisco' },
                    { '@type': 'Place', name: 'Algarrobo' },
                    { '@type': 'Place', name: 'Isla Negra' },
                    { '@type': 'Place', name: 'Litoral Central' },
                ],
                address: {
                    '@type': 'PostalAddress',
                    addressLocality: 'El Tabo',
                    addressRegion: 'Región de Valparaíso',
                    addressCountry: 'CL',
                },
            },
            {
                '@type': 'WebPage',
                '@id': PAGE_URL,
                url: PAGE_URL,
                name: 'Venta de Terrenos en el Litoral Central',
                inLanguage: 'es-CL',
                isPartOf: { '@id': `${SITE.url}#website` },
                about: { '@id': `${PAGE_URL}#business` },
                primaryImageOfPage: OG_IMAGE,
                description:
                    'Venta de terrenos urbanizados en el Litoral Central (El Tabo). Rol propio, agua y luz certificadas, financiamiento directo sin banco ni DICOM.',
            },
            {
                '@type': 'Product',
                name: 'Terreno urbanizado Lomas del Mar, El Tabo (Litoral Central)',
                image: [
                    `${SITE.url}/assets/venta-terrenos/gallery/g10.webp`,
                    `${SITE.url}/assets/venta-terrenos/gallery/g11.webp`,
                    `${SITE.url}/assets/venta-terrenos/plano-lomas-del-mar.webp`,
                ],
                description:
                    'Terreno urbanizado de 200 a 390 m² en El Tabo, Litoral Central, con rol propio, agua y luz certificadas. Financiamiento directo sin banco ni DICOM.',
                brand: { '@type': 'Brand', name: 'Alimin Inmobiliaria' },
                category: 'Terrenos / Bienes Raíces',
                offers: {
                    '@type': 'Offer',
                    priceCurrency: 'CLP',
                    price: '29990000',
                    availability: 'https://schema.org/InStock',
                    url: PAGE_URL,
                    areaServed: 'El Tabo, Litoral Central, Chile',
                },
            },
            {
                '@type': 'Product',
                name: 'Terreno urbanizado Arena y Sol, El Tabo (Litoral Central)',
                image: [
                    `${SITE.url}/assets/venta-terrenos/gallery/g01.webp`,
                    `${SITE.url}/assets/venta-terrenos/gallery/g02.webp`,
                    `${SITE.url}/assets/venta-terrenos/plano-arena-y-sol-2026-08.webp`,
                ],
                description:
                    'Terreno urbanizado de 200 m² en El Tabo, Litoral Central, con rol propio, agua y luz certificadas. Últimos cupos, financiamiento directo sin banco.',
                brand: { '@type': 'Brand', name: 'Alimin Inmobiliaria' },
                category: 'Terrenos / Bienes Raíces',
                offers: {
                    '@type': 'Offer',
                    priceCurrency: 'CLP',
                    price: '42000000',
                    availability: 'https://schema.org/LimitedAvailability',
                    url: PAGE_URL,
                    areaServed: 'El Tabo, Litoral Central, Chile',
                },
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
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE.url },
                    { '@type': 'ListItem', position: 2, name: 'Venta de Terrenos Litoral Central', item: PAGE_URL },
                ],
            },
        ],
    }
    return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />
}

export default function VentaTerrenosPage() {
    return (
        <>
            <JsonLd />
            <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0e1a24', color: '#ffffff' }}>Cargando…</div>}>
                <VentaTerrenosClient />
            </Suspense>
        </>
    )
}
