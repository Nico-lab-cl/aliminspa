import { Suspense } from 'react'
import type { Metadata } from 'next'
import { SITE } from '@/lib/constants'
import { BreadcrumbSchema } from '@/components/seo/JsonLd'
import LomasDelMarClient from './LomasDelMarClient'

/* Esta es la URL canónica del proyecto. La landing vive fuera del grupo (main)
   porque trae su propio nav, footer y WhatsApp flotante. /minipie renderiza
   este mismo componente y hace canonical hacia acá. */

export const metadata: Metadata = {
    title: 'Lomas del Mar | Terrenos en El Tabo con Financiamiento Directo',
    description:
        'Terrenos urbanizados con rol propio en Lomas del Mar, El Tabo (Litoral Central). Financiamiento directo Alimin: sin banco, sin aval y sin importar tu DICOM. Pie desde $5.500.000 y cuotas mensuales fijas.',
    alternates: { canonical: `${SITE.url}/proyectos/lomas-del-mar` },
}

export default function LomasDelMarPage() {
    return (
        <>
            <BreadcrumbSchema
                items={[
                    { name: 'Inicio', url: SITE.url },
                    { name: 'Proyectos', url: `${SITE.url}/proyectos` },
                    { name: 'Lomas del Mar', url: `${SITE.url}/proyectos/lomas-del-mar` },
                ]}
            />
            <Suspense
                fallback={
                    <div
                        style={{
                            minHeight: '100vh',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#0e1a24',
                            color: '#ffffff',
                        }}
                    >
                        Cargando...
                    </div>
                }
            >
                <LomasDelMarClient />
            </Suspense>
        </>
    )
}
