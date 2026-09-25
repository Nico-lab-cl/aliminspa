import type { Metadata } from 'next'
import { SITE } from '@/lib/constants'
import { BreadcrumbSchema } from '@/components/seo/JsonLd'
import { contarDisponibles } from '@/lib/disponibilidad'
import ElegirProyecto, { type ProyectoTarjeta } from './ElegirProyecto'

/*
 * /reunion ya no es el calendario: es dónde se elige proyecto.
 *
 * Cada proyecto tiene su propio mapa con los lotes pintados, y ahí adentro
 * están la agenda, el formulario y la confirmación. Meter un calendario acá
 * era pedirle al visitante que agendara antes de saber a cuál terreno va.
 * El calendario sigue existiendo en Libertad y Alegría, que no tiene mapa.
 */

export const metadata: Metadata = {
    title: 'Agenda tu Visita | Terrenos en El Tabo',
    description:
        'Elige el proyecto que quieres conocer y agenda tu visita en El Tabo: Lomas del Mar o Arena y Sol. Un asesor te recorre el loteo y te muestra los lotes disponibles.',
    alternates: { canonical: `${SITE.url}/reunion` },
    openGraph: {
        title: 'Agenda tu visita | Alimin Inmobiliaria',
        description:
            'Elige entre Lomas del Mar y Arena y Sol, mira los lotes disponibles en el mapa y agenda tu visita en El Tabo.',
        url: `${SITE.url}/reunion`,
        type: 'website',
    },
}

export default async function ReunionPage() {
    /* El contador de Lomas del Mar sale del plano. El de Arena y Sol todavía se
       está verificando contra el plano oficial, así que ahí se muestra el
       estado de venta y no una cifra. */
    const disponiblesLomas = await contarDisponibles('lomas3d/plano-lotes.json')

    const proyectos: ProyectoTarjeta[] = [
        {
            id: 'lomas-del-mar',
            nombre: 'Lomas del Mar',
            href: '/agendar-visita',
            imagen: '/assets/venta-terrenos/gallery/g10.webp',
            distancia: '📍 10 min de la playa',
            linea: 'Terrenos urbanizados con rol propio, agua certificada y luz.',
            superficie: '200 y 390 m²',
            pie: 'desde $5.500.000',
            disponibilidad: disponiblesLomas ? `${disponiblesLomas} lotes disponibles` : null,
            cta: 'Quiero visitar Lomas del Mar →',
            crmName: 'Agendar - Elegir Lomas del Mar',
        },
        {
            id: 'arena-y-sol',
            nombre: 'Arena y Sol',
            href: '/agendar-visita-arenas',
            imagen: '/assets/venta-terrenos/gallery/g01.webp',
            distancia: '📍 8 min de la playa',
            linea: 'Loteo cerrado con portón automático, listo para construir.',
            superficie: '200 m²',
            pie: '$20.000.000',
            disponibilidad: 'Últimos terrenos',
            cta: 'Quiero visitar Arena y Sol →',
            crmName: 'Agendar - Elegir Arena y Sol',
        },
    ]

    return (
        <>
            <BreadcrumbSchema
                items={[
                    { name: 'Inicio', url: SITE.url },
                    { name: 'Agenda tu Visita', url: `${SITE.url}/reunion` },
                ]}
            />

            <ElegirProyecto proyectos={proyectos} />
        </>
    )
}
