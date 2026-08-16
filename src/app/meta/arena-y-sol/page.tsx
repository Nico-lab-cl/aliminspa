import type { Metadata } from 'next'
import { SITE } from '@/lib/constants'
import ArenaYSolMetaClient from './ArenaYSolMetaClient'
import { FAQ_ARENA_Y_SOL } from './faq'

/* Landing de Arena y Sol para campañas de Meta Ads.
   Va con noindex porque es una copia de /proyectos/arena-y-sol: si Google la
   indexara, competiría con la página real como contenido duplicado. No lleva
   breadcrumb porque no es una página del sitio público; el canonical apunta a
   la página real, que es la que debe posicionar. */

export const metadata: Metadata = {
    title: 'Arena y Sol | Terrenos de 200 m² en El Tabo',
    description:
        'Terrenos 100% urbanizados de 200 m² en El Tabo, a 10 minutos de la playa. Rol propio, agua certificada, luz eléctrica y portón automático.',
    robots: { index: false, follow: false },
    alternates: { canonical: `${SITE.url}/proyectos/arena-y-sol` },
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

export default function ArenaYSolMetaPage() {
    return (
        <>
            <ArenaYSolFaqSchema />
            <ArenaYSolMetaClient />
        </>
    )
}
