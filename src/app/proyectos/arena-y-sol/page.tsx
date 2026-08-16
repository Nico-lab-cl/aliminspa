import type { Metadata } from 'next'
import { SITE } from '@/lib/constants'
import { BreadcrumbSchema } from '@/components/seo/JsonLd'
import MetaTrackPageView from '@/components/analytics/MetaTrackPageView'
import ArenaYSolClient from './ArenaYSolClient'
import { FAQ_ARENA_Y_SOL } from './faq'

/* La landing vive fuera del grupo (main) a propósito: trae su propio header,
   footer y WhatsApp flotante, así que no debe heredar el Navbar global.
   La URL /proyectos/arena-y-sol no cambia. */

export const metadata: Metadata = {
    title: 'Arena y Sol | Terrenos Urbanizados de 200 m² en El Tabo',
    description:
        'Terrenos 100% urbanizados de 200 m² en Arena y Sol, El Tabo, a 10 minutos de la playa. Rol propio, agua certificada, luz eléctrica y portón automático. Financiamiento directo, sin bancos ni intereses.',
    alternates: { canonical: `${SITE.url}/proyectos/arena-y-sol` },
    openGraph: {
        type: 'website',
        locale: 'es_CL',
        url: `${SITE.url}/proyectos/arena-y-sol`,
        siteName: SITE.name,
        title: 'Arena y Sol | Terrenos Urbanizados de 200 m² en El Tabo',
        description:
            'Terrenos 100% urbanizados de 200 m² en El Tabo, a 10 minutos de la playa. Rol propio, agua certificada y luz eléctrica.',
        images: [
            {
                url: '/images/arena_y_sol/hero-desktop-new.webp',
                width: 1600,
                height: 900,
                alt: 'Vista aérea del loteo Arena y Sol en El Tabo',
            },
        ],
    },
}

function ArenaYSolFaqSchema() {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQ_ARENA_Y_SOL.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
    }
    return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
}

export default function ArenaYSolPage() {
    return (
        <>
            <MetaTrackPageView
                customData={{
                    content_name: 'Arena y Sol',
                    content_category: 'Real Estate',
                    content_type: 'product',
                }}
            />
            <BreadcrumbSchema
                items={[
                    { name: 'Inicio', url: SITE.url },
                    { name: 'Proyectos', url: `${SITE.url}/proyectos` },
                    { name: 'Arena y Sol', url: `${SITE.url}/proyectos/arena-y-sol` },
                ]}
            />
            <ArenaYSolFaqSchema />
            <ArenaYSolClient />
        </>
    )
}
