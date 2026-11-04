import { Suspense } from 'react'
import type { Metadata } from 'next'
import { SITE } from '@/lib/constants'
import { UTM_GOOGLE_BUSQUEDA } from '@/lib/landing-variante'
import VentaTerrenosClient from '../../venta-de-terrenos-litoral-central/VentaTerrenosClient'

/* Google Ads, grupo "Litoral Central" (terrenos litoral central, … en la playa con
   luz y agua). Es /venta-de-terrenos-litoral-central con el H1 de la palabra clave;
   noindex y canonical a la página pública. */

export const metadata: Metadata = {
    title: { absolute: 'Terrenos en el Litoral Central con Luz y Agua | Alimin' },
    description:
        'Terrenos en el Litoral Central con luz, agua certificada y rol propio incluidos. Lotes urbanizados en El Tabo, financiamiento directo sin banco.',
    robots: { index: false, follow: false },
    // /venta-de-terrenos-litoral-central redirige (301) a la landing de terrenos baratos.
    alternates: { canonical: `${SITE.url}/terrenos-baratos-en-la-playa-litoral-central-chile` },
}

export default function GoogleTerrenosLitoralCentralPage() {
    return (
        <Suspense>
            <VentaTerrenosClient
                variante={{
                    h1: { texto: 'Terrenos en el Litoral Central', destacado: 'con luz y agua' },
                    sufijoLead: ' - Google',
                    utm: UTM_GOOGLE_BUSQUEDA,
                }}
            />
        </Suspense>
    )
}
