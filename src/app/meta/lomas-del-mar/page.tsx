import { Suspense } from 'react'
import type { Metadata } from 'next'
import { SITE } from '@/lib/constants'
import LomasDelMarMetaClient from './LomasDelMarMetaClient'

/* Landing de Lomas del Mar para campañas de Meta Ads.
   Va con noindex porque es una copia de /proyectos/lomas-del-mar: si Google la
   indexara, competiría con la página real como contenido duplicado. No lleva
   breadcrumb porque no es una página del sitio público; el canonical apunta a
   la página real, que es la que debe posicionar. */

export const metadata: Metadata = {
    title: 'Lomas del Mar | Terrenos en El Tabo con Financiamiento Directo',
    description:
        'Terrenos urbanizados con rol propio en Lomas del Mar, El Tabo. Financiamiento directo Alimin: sin banco, sin aval y sin importar tu DICOM.',
    robots: { index: false, follow: false },
    alternates: { canonical: `${SITE.url}/proyectos/lomas-del-mar` },
}

export default function LomasDelMarMetaPage() {
    return (
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
            <LomasDelMarMetaClient />
        </Suspense>
    )
}
