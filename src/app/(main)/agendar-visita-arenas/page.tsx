import type { Metadata } from 'next'
import { SITE } from '@/lib/constants'
import { BreadcrumbSchema } from '@/components/seo/JsonLd'
import Agenda3D from '@/components/agenda3d/Agenda3D'
import { ARENA_Y_SOL } from '@/components/agenda3d/proyectos'

/*
 * Mapa del loteo y agenda de Arena y Sol.
 *
 * Vive en su propia ruta mientras convive con /agendar-visita, que es la de
 * Lomas del Mar. La idea es que más adelante las dos queden bajo una sola
 * dirección que elija el proyecto; hasta entonces son dos páginas que comparten
 * el mismo componente y solo cambian en la tabla de proyectos.
 */

export const metadata: Metadata = {
    title: 'Elige tu Lote en el Mapa | Arena y Sol, El Tabo',
    description:
        'Recorre Arena y Sol desde el aire, mira qué lotes siguen disponibles y agenda la visita con un asesor. Terrenos de 200 m² en El Tabo, Litoral Central.',
    alternates: { canonical: `${SITE.url}/agendar-visita-arenas` },
    openGraph: {
        title: 'Elige tu lote desde el aire | Arena y Sol',
        description:
            'Mapa del loteo desde el dron y agenda en vivo. Toca tu lote y reserva la visita.',
        url: `${SITE.url}/agendar-visita-arenas`,
        type: 'website',
    },
}

export default function AgendarVisitaArenaYSolPage() {
    return (
        <>
            <BreadcrumbSchema
                items={[
                    { name: 'Inicio', url: SITE.url },
                    { name: 'Arena y Sol', url: `${SITE.url}/proyectos/arena-y-sol` },
                    { name: 'Mapa del loteo y agenda', url: `${SITE.url}/agendar-visita-arenas` },
                ]}
            />

            <Agenda3D proyecto={ARENA_Y_SOL} />
        </>
    )
}
