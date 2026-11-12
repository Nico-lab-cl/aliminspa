import { timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { respuestaPublica } from '@/lib/ali/redes'

export const dynamic = 'force-dynamic'

/**
 * Texto con los precios reales para la respuesta pública bajo un comentario
 * de Instagram/Facebook. Lo pide el CRM móvil cuando manda el brochure
 * automático (x-ia-secret = IA_SECRET). Sale de PROJECTS en constants.ts.
 * GET ?texto=<publicación + comentario> → { publica }
 */
function autorizado(request: NextRequest) {
    const esperado = process.env.IA_SECRET
    const recibido = request.headers.get('x-ia-secret')
    if (!esperado || !recibido) return false
    const a = Buffer.from(esperado)
    const b = Buffer.from(recibido)
    return a.length === b.length && timingSafeEqual(a, b)
}

export async function GET(request: NextRequest) {
    if (!autorizado(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const texto = (new URL(request.url).searchParams.get('texto') || '').slice(0, 2000)
    return NextResponse.json({ publica: respuestaPublica(texto) })
}
