import { Suspense } from 'react'
import type { Metadata } from 'next'
import { SITE } from '@/lib/constants'
import { BreadcrumbSchema } from '@/components/seo/JsonLd'
import CyberPageClient from './CyberPageClient'

export const metadata: Metadata = {
    title: 'Cyber Monday: Terrenos con Facilidades en El Tabo | Alimin Inmobiliaria',
    description: 'Aprovecha nuestra promoción Cyber: Terrenos con Rol Propio en El Tabo. Pago del pie en 3 cuotas sin interés y asesoría legal 100% gratuita. ¡Reserva hoy!',
    alternates: { canonical: `${SITE.url}/cyber` },
}

export default function CyberPage() {
    return (
        <>
            <BreadcrumbSchema
                items={[
                    { name: 'Inicio', url: SITE.url },
                    { name: 'Cyber Monday', url: `${SITE.url}/cyber` },
                ]}
            />
            <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a1824', color: '#ffffff' }}>Cargando...</div>}>
                <CyberPageClient />
            </Suspense>
        </>
    )
}

