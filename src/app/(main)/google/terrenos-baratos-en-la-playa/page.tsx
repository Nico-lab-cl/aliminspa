import type { Metadata } from 'next'
import { SITE } from '@/lib/constants'
import { UTM_GOOGLE_BUSQUEDA } from '@/lib/landing-variante'
import TerrenosBaratosLanding from '../../terrenos-baratos-en-la-playa-litoral-central-chile/TerrenosBaratosLanding'

/* Google Ads, grupo "Precio y Cuotas" (terrenos en la playa baratos, … 5.000 000,
   en cuotas). Es la landing de terrenos baratos con el H1 de la palabra clave;
   vive en (main) como la original para heredar navbar y footer. noindex y
   canonical a la página pública. */

export const metadata: Metadata = {
    title: { absolute: 'Terrenos Baratos en la Playa — Pie desde $5.500.000 | Alimin' },
    description:
        'Terrenos baratos en la playa del Litoral Central: pie desde $5.500.000 y cuotas fijas, sin banco. Lotes urbanizados en El Tabo desde $35.000.000.',
    robots: { index: false, follow: false },
    alternates: { canonical: `${SITE.url}/terrenos-baratos-en-la-playa-litoral-central-chile` },
}

export default function GoogleTerrenosBaratosPage() {
    return (
        <TerrenosBaratosLanding
            variante={{
                h1: { texto: 'Terrenos baratos en la playa:', destacado: 'pie desde $5.500.000' },
                sufijoLead: ' - Google',
                utm: UTM_GOOGLE_BUSQUEDA,
            }}
        />
    )
}
