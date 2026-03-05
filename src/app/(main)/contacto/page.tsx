import type { Metadata } from 'next'
import { SITE } from '@/lib/constants'
import ContactForm from '@/components/sections/ContactForm'
import Newsletter from '@/components/sections/Newsletter'
import { BreadcrumbSchema } from '@/components/seo/JsonLd'

export const metadata: Metadata = {
    title: 'Contacto | Cotiza tu Terreno en El Tabo',
    description: 'Contáctanos para cotizar terrenos en El Tabo, Litoral Central. Completa el formulario y un asesor te contactará con las mejores opciones de inversión.',
    alternates: {
        canonical: `${SITE.url}/contacto`,
    },
}

export default function ContactoPage() {
    return (
        <>
            <BreadcrumbSchema
                items={[
                    { name: 'Inicio', url: SITE.url },
                    { name: 'Contacto', url: `${SITE.url}/contacto` },
                ]}
            />
            <div style={{ paddingTop: 'var(--navbar-height)' }}>
                <ContactForm />
                <Newsletter />
            </div>
        </>
    )
}
