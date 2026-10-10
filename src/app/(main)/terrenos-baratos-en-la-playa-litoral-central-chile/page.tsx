import type { Metadata } from 'next'
import { SITE } from '@/lib/constants'
import { FAQS } from './faqs'
import { TERRENOS } from './terrenos'
import TerrenosBaratosLanding from './TerrenosBaratosLanding'

// Landing SEO para "terrenos baratos en la playa litoral central chile".
//
// Investigación (Ubersuggest, Chile / es, agosto 2026):
//   · Volumen 30/mes · SEO difficulty 15 · CPC US$0,155 · intención Commercial.
//   · El SERP no tiene ni una landing de marca: es todo marketplace
//     (MercadoLibre #1, Portal Inmobiliario #3, Yapo #9, Trovit, Mitula,
//     Doomos). Todos muestran precio. Por eso esta página publica precios
//     reales en vez de esconderlos tras "consultar": sin precio no compite.
//   · Sobre los orgánicos hay un bloque de "Otras preguntas" (#4) y un AI
//     Overview (#5) → FAQPage con respuestas autocontenidas.
//   · Hay bloque de video (#8) e imágenes (#10, #18) → media con alt descriptivo.
//   · /venta-de-terrenos-litoral-central rankeaba #28 (tráfico 0) para esta
//     keyword. Esta URL exact-match la reemplaza; la otra se queda con
//     "venta / urbanizados / rol propio", que es donde sí tiene posiciones.
//
// Vive dentro del route group (main) a propósito: hereda Navbar, Footer y el
// widget de chat de Ali sin duplicar componentes.

const PAGE_URL = `${SITE.url}/terrenos-baratos-en-la-playa-litoral-central-chile`
const OG_IMAGE = `${SITE.url}/videos/terrenos-baratos/hero-desktop-poster.webp`

export const metadata: Metadata = {
    // `absolute` evita el template `%s | Alimin Inmobiliaria` del layout raíz:
    // con el sufijo el title se iba a 91 caracteres y Google lo cortaba justo
    // en el precio, que es el gancho de CTR de esta búsqueda. Así queda en 64.
    title: {
        absolute: 'Terrenos Baratos en la Playa Litoral Central Chile — $35.000.000',
    },
    description:
        'Terrenos baratos en la playa del Litoral Central, Chile. Lotes urbanizados en El Tabo desde $35.000.000, a 10 minutos de la playa. Pie desde $5.500.000, cuotas desde $500.000, sin banco y sin importar tu DICOM. Rol propio, agua y luz incluidas. Ve precios y disponibilidad.',
    keywords: [
        'terrenos baratos en la playa litoral central chile',
        'terrenos baratos litoral central',
        'terrenos baratos en la playa',
        'terrenos baratos en la playa chile',
        'sitios baratos en la playa litoral central',
        'terrenos baratos en el tabo',
        'venta de terrenos urbanizados en el litoral central baratos',
        'terrenos en la playa con luz y agua litoral central',
        'terrenos baratos en venta',
        'cuanto cuesta un terreno en el litoral central',
    ],
    alternates: { canonical: PAGE_URL },
    openGraph: {
        type: 'website',
        url: PAGE_URL,
        siteName: SITE.name,
        locale: 'es_CL',
        title: 'Terrenos Baratos en la Playa Litoral Central Chile — Desde $35.000.000',
        description:
            'Lotes urbanizados en El Tabo desde $35.000.000, a 10 minutos de la playa. Pie desde $5.500.000 y cuotas desde $500.000, sin banco. Rol propio, agua y luz incluidas.',
        images: [
            {
                url: OG_IMAGE,
                width: 1200,
                height: 630,
                alt: 'Terrenos baratos en la playa del Litoral Central, El Tabo, Chile',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Terrenos Baratos en la Playa Litoral Central Chile — Desde $35.000.000',
        description:
            'Lotes urbanizados en El Tabo desde $35.000.000, a 10 minutos de la playa. Sin banco y sin DICOM.',
        images: [OG_IMAGE],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-video-preview': -1,
            'max-snippet': -1,
        },
    },
    other: {
        'geo.region': 'CL-VS',
        'geo.placename': 'El Tabo',
        'geo.position': '-33.4542;-71.6667',
        ICBM: '-33.4542, -71.6667',
    },
}

function JsonLd() {
    const graph = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'RealEstateAgent',
                '@id': `${PAGE_URL}#business`,
                name: SITE.name,
                url: SITE.url,
                image: OG_IMAGE,
                email: SITE.email,
                telephone: SITE.phone,
                priceRange: '$$',
                areaServed: [
                    { '@type': 'Place', name: 'El Tabo' },
                    { '@type': 'Place', name: 'El Quisco' },
                    { '@type': 'Place', name: 'Algarrobo' },
                    { '@type': 'Place', name: 'Isla Negra' },
                    { '@type': 'Place', name: 'Cartagena' },
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
                name: 'Terrenos Baratos en la Playa Litoral Central Chile',
                inLanguage: 'es-CL',
                isPartOf: { '@id': `${SITE.url}#website` },
                about: { '@id': `${PAGE_URL}#business` },
                primaryImageOfPage: OG_IMAGE,
                description:
                    'Listado de terrenos baratos en la playa del Litoral Central de Chile, con precios publicados. Lotes urbanizados en El Tabo desde $35.000.000, con rol propio, agua certificada, luz y financiamiento directo sin banco.',
            },
            // ItemList con precio: es la pieza que nos pone a competir con los
            // listados de MercadoLibre y Portal Inmobiliario que hoy copan el SERP.
            {
                '@type': 'ItemList',
                '@id': `${PAGE_URL}#listado`,
                name: 'Terrenos baratos en la playa del Litoral Central',
                numberOfItems: TERRENOS.length,
                itemListOrder: 'https://schema.org/ItemListOrderAscending',
                itemListElement: TERRENOS.map((t, i) => ({
                    '@type': 'ListItem',
                    position: i + 1,
                    item: {
                        '@type': 'Product',
                        '@id': `${PAGE_URL}#${t.id}`,
                        name: `Terreno ${t.superficie} en ${t.proyecto}, El Tabo — Litoral Central`,
                        description: `Terreno urbanizado de ${t.superficie} en ${t.proyecto}, El Tabo, Litoral Central, a ${t.proyecto === 'Arena y Sol' ? 8 : 10} minutos de la playa. Incluye rol propio, agua certificada y luz. Pie de ${t.pie} y ${t.plazo.toLowerCase()} de ${t.cuota}, sin banco.`,
                        image: `${SITE.url}${t.imagen}`,
                        brand: { '@type': 'Brand', name: SITE.name },
                        category: 'Terrenos / Bienes Raíces',
                        offers: {
                            '@type': 'Offer',
                            priceCurrency: 'CLP',
                            price: String(t.contado),
                            availability: `https://schema.org/${t.disponibilidad}`,
                            url: PAGE_URL,
                            areaServed: 'El Tabo, Litoral Central, Chile',
                            seller: { '@id': `${PAGE_URL}#business` },
                        },
                    },
                })),
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
                    {
                        '@type': 'ListItem',
                        position: 2,
                        name: 'Venta de terrenos Litoral Central',
                        item: `${SITE.url}/venta-de-terrenos-litoral-central`,
                    },
                    {
                        '@type': 'ListItem',
                        position: 3,
                        name: 'Terrenos baratos en la playa Litoral Central Chile',
                        item: PAGE_URL,
                    },
                ],
            },
        ],
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
        />
    )
}

export default function TerrenosBaratosPage() {
    return (
        <>
            <JsonLd />
            <TerrenosBaratosLanding />
        </>
    )
}
