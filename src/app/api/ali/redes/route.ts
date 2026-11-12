import { timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { aliHabilitada } from '@/lib/ali/motor'
import { conversarRedes, validarEntrada } from '@/lib/ali/redes'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Ali para Instagram y Facebook. Lo llama solo el CRM móvil, con
 * x-ia-secret = IA_SECRET. Sin IA_SECRET el endpoint queda cerrado.
 * Devuelve { burbujas, contacto, derivacion, visita }; no escribe en el CRM.
 */
function autorizado(request: NextRequest) {
    const esperado = process.env.IA_SECRET
    const recibido = request.headers.get('x-ia-secret')
    if (!esperado || !recibido) return false
    const a = Buffer.from(esperado)
    const b = Buffer.from(recibido)
    return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(request: NextRequest) {
    if (!autorizado(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    if (!aliHabilitada()) return NextResponse.json({ error: 'Ali está apagada' }, { status: 503 })

    let json: unknown
    try {
        json = await request.json()
    } catch {
        return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }
    const entrada = validarEntrada(json)
    if (!entrada) return NextResponse.json({ error: 'La conversación no calza con el formato' }, { status: 400 })

    try {
        return NextResponse.json(await conversarRedes(entrada, request))
    } catch (error) {
        console.error(`[ali:${entrada.canal}] No se pudo responder ${entrada.conversacionId}:`, error)
        return NextResponse.json({ error: 'Ali no pudo responder' }, { status: 502 })
    }
}
