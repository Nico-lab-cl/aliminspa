import { Suspense } from 'react'
import type { Metadata } from 'next'
import { SITE } from '@/lib/constants'
import MiniPieClient from './MiniPieClient'

export const metadata: Metadata = {
    title: 'Promoción Mini Pie: Terrenos con Rol Propio en El Tabo | Alimin Inmobiliaria',
    description: 'Vuelve la promoción Mini Pie de Alimin Inmobiliaria. Obtén tu terreno en Lomas del Mar, El Tabo (Litoral Central) con el pie más accesible del mercado, sin bancos ni intereses. ¡Cupos limitados!',
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
