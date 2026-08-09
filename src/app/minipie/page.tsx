import { Suspense } from 'react'
import type { Metadata } from 'next'
import { SITE } from '@/lib/constants'
import MiniPieClient from './MiniPieClient'

export const metadata: Metadata = {
    title: 'Terrenos en Lomas del Mar, El Tabo — Financiamiento Directo sin Banco',
    description: 'Terrenos urbanizados con rol propio en Lomas del Mar, El Tabo (Litoral Central). Financiamiento directo Alimin: sin banco, sin aval y sin importar tu DICOM. Pie desde $5.500.000 y cuotas mensuales fijas.',
    alternates: {
        canonical: `${SITE.url}/minipie`,
    },
}

export default function MiniPiePage() {
    return (
        <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0e1a24', color: '#ffffff' }}>Cargando...</div>}>
            <MiniPieClient />
        </Suspense>
    )
}
