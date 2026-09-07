import type { Metadata } from 'next'
import { SITE } from '@/lib/constants'
import { BreadcrumbSchema } from '@/components/seo/JsonLd'
import Agenda3D from '@/components/agenda3d/Agenda3D'

export const metadata: Metadata = {
    title: 'Elige tu Lote en el Mapa 3D | Lomas del Mar, El Tabo',
    description:
        'Recorre Lomas del Mar en 3D con imágenes de dron y elevación real, elige el lote que te gusta y agenda la visita con un asesor. Terrenos urbanizados en El Tabo, Litoral Central.',
    alternates: { canonical: `${SITE.url}/agendar-visita` },
    openGraph: {
        title: 'Elige tu lote desde el aire | Lomas del Mar',
        description:
            'Mapa 3D del loteo con dron, elevación real y agenda en vivo. Toca tu lote y reserva la visita.',
        url: `${SITE.url}/agendar-visita`,
        type: 'website',
    },
}

export default function AgendarVisitaPage() {
    return (
        <>
            <BreadcrumbSchema
                items={[
                    { name: 'Inicio', url: SITE.url },
                    { name: 'Lomas del Mar', url: `${SITE.url}/proyectos/lomas-del-mar` },
                    { name: 'Mapa 3D y agenda', url: `${SITE.url}/agendar-visita` },
                ]}
            />

            <Agenda3D />
        </>
    )
}
