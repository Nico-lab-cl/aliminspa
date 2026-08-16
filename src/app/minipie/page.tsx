import { Suspense } from 'react'
import type { Metadata } from 'next'
import { SITE } from '@/lib/constants'
import LomasDelMarClient from '../proyectos/lomas-del-mar/LomasDelMarClient'

/* La URL /minipie sigue viva porque circula en flyers, bio de Instagram y
   campañas ya publicadas. Renderiza exactamente la misma landing que
   /proyectos/lomas-del-mar, que es la canónica: así Google consolida el
   posicionamiento en una sola URL en vez de repartirlo entre las dos. */

export const metadata: Metadata = {
    title: 'Terrenos en Lomas del Mar, El Tabo — Financiamiento Directo sin Banco',
    description:
        'Terrenos urbanizados con rol propio en Lomas del Mar, El Tabo (Litoral Central). Financiamiento directo Alimin: sin banco, sin aval y sin importar tu DICOM. Pie desde $5.500.000 y cuotas mensuales fijas.',
    alternates: { canonical: `${SITE.url}/proyectos/lomas-del-mar` },
}

export default function MiniPiePage() {
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
            <LomasDelMarClient />
        </Suspense>
    )
}
