import { Suspense } from 'react'
import type { Metadata } from 'next'
import { SITE } from '@/lib/constants'
import { UTM_GOOGLE_BUSQUEDA } from '@/lib/landing-variante'
import VentaTerrenosClient from '../../venta-de-terrenos-litoral-central/VentaTerrenosClient'

/* Google Ads, grupo "Comunas Vecinas" (terrenos en el quisco, punta de tralca,
   sitios el quisco). No vendemos dentro de El Quisco: el H1 lo dice de frente y
   ofrece El Tabo, la comuna vecina. Es /venta-de-terrenos-litoral-central con ese
   H1; noindex y canonical a la página pública. */

export const metadata: Metadata = {
    title: { absolute: 'Terrenos cerca de El Quisco: El Tabo, la Comuna Vecina | Alimin' },
    description:
        '¿Buscas terreno en El Quisco? Mira El Tabo, la comuna vecina: lotes urbanizados con rol propio, agua y luz, y financiamiento directo sin banco.',
    robots: { index: false, follow: false },
    alternates: { canonical: `${SITE.url}/venta-de-terrenos-litoral-central` },
}

export default function GoogleTerrenosCercaDeElQuiscoPage() {
    return (
        <Suspense>
            <VentaTerrenosClient
                variante={{
                    h1: { texto: '¿Buscas terreno en El Quisco?', destacado: 'Mira El Tabo, la comuna vecina' },
                    sufijoLead: ' - El Quisco - Google',
                    utm: UTM_GOOGLE_BUSQUEDA,
                }}
            />
        </Suspense>
    )
}
