import type { Metadata } from 'next'
import { SITE } from '@/lib/constants'
import { BreadcrumbSchema } from '@/components/seo/JsonLd'
import BookingCalendar from '@/components/sections/BookingCalendar'

export const metadata: Metadata = {
    title: 'Agenda tu Visita | Terrenos en El Tabo',
    description: 'Agenda una visita guiada a nuestros proyectos inmobiliarios en El Tabo. Elige fecha y hora, y recibe confirmación en tu Google Calendar. Lomas del Mar, Arena y Sol, Libertad y Alegría.',
    alternates: { canonical: `${SITE.url}/reunion` },
}

export default function ReunionPage() {
    return (
        <>
            <BreadcrumbSchema
                items={[
                    { name: 'Inicio', url: SITE.url },
                    { name: 'Agenda tu Visita', url: `${SITE.url}/reunion` },
                ]}
            />

            <BookingCalendar />
        </>
    )
}
