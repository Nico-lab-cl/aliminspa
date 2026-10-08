import type { Metadata } from 'next'
import { SITE } from '@/lib/constants'
import { UTM_GOOGLE_BUSQUEDA } from '@/lib/landing-variante'
import LomasDelMarClient from '../../proyectos/lomas-del-mar/LomasDelMarClient'

/* Google Ads, grupo "El Tabo" (terrenos en el tabo, … con facilidades, el tabito,
   isla negra). Es /proyectos/lomas-del-mar con el H1 de la palabra clave; noindex
   y canonical a la página pública para no competir con ella en orgánico. */

export const metadata: Metadata = {
    title: { absolute: 'Terrenos en El Tabo con Facilidades de Pago | Lomas del Mar' },
    description:
        'Terrenos en El Tabo con facilidades: pie desde $5.500.000 y cuotas fijas de $550.000. Financiamiento directo Alimin, sin banco, sin aval y sin importar tu DICOM.',
    robots: { index: false, follow: false },
    alternates: { canonical: `${SITE.url}/proyectos/lomas-del-mar` },
}

export default function GoogleTerrenosEnElTaboPage() {
    return (
        <LomasDelMarClient
            variante={{
                h1: { texto: 'TERRENOS EN EL TABO', destacado: 'CON FACILIDADES' },
                sufijoLead: ' - Google',
                utm: UTM_GOOGLE_BUSQUEDA,
            }}
        />
    )
}
