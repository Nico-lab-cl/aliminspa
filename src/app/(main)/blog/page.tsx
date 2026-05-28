import type { Metadata } from 'next'
import { SITE } from '@/lib/constants'
import { BreadcrumbSchema } from '@/components/seo/JsonLd'
import BlogClient from './BlogClient'

export const metadata: Metadata = {
    title: 'Blog Inmobiliario: Consejos, Guías y Aspectos Legales | Alimin Inmobiliaria',
    description: 'Aprende todo lo necesario para comprar parcelas y terrenos en El Tabo y el Litoral Central. Guías de Rol Propio, plusvalía, urbanización y consejos legales.',
    alternates: { canonical: `${SITE.url}/blog` },
    openGraph: {
        title: 'Blog Inmobiliario: Consejos, Guías y Aspectos Legales | Alimin Inmobiliaria',
        description: 'Aprende todo lo necesario para comprar parcelas y terrenos en El Tabo y el Litoral Central. Guías de Rol Propio, plusvalía, urbanización y consejos de expertos.',
        url: `${SITE.url}/blog`,
        siteName: SITE.name,
        type: 'website',
        images: [
            {
                url: `${SITE.url}/images/projects/lomas-del-mar-v2.jpg`,
                width: 1200,
                height: 630,
                alt: 'Alimin Inmobiliaria Blog',
            }
        ]
    }
}

export default function BlogPage() {
    return (
        <>
            <BreadcrumbSchema
                items={[
                    { name: 'Inicio', url: SITE.url },
                    { name: 'Blog', url: `${SITE.url}/blog` },
                ]}
            />
            <BlogClient />
        </>
    )
}
