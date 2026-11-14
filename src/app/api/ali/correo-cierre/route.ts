import { timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { aliHabilitada } from '@/lib/ali/motor'
import { escribirCorreoCierre, validarPedido } from '@/lib/ali/correo-cierre'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Escribe un correo de "Después de la visita" con la IA de Cierre. Lo llama
 * solo el CRM web (lib/correo_cierre_ia.ts), con x-ia-secret = IA_SECRET.
 * Devuelve { asunto, preheader, titulo, parrafos }; no envía nada.
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
    const pedido = validarPedido(json)
    if (!pedido) return NextResponse.json({ error: 'El pedido no calza con el formato' }, { status: 400 })

    try {
        const correo = await escribirCorreoCierre(pedido)
        if (!correo) return NextResponse.json({ error: 'La IA no devolvió un correo válido' }, { status: 502 })
        return NextResponse.json(correo)
    } catch (error) {
        console.error(`[ali:correo] No se pudo escribir el correo de ${pedido.leadId}:`, error)
        return NextResponse.json({ error: 'No se pudo escribir el correo' }, { status: 502 })
    }
}
