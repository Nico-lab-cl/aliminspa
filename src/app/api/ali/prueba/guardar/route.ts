import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Guarda en el CRM web la conversación de prueba de /probar-ali con el
 * feedback del asesor (👍/👎, qué debió decir y un comentario general). El
 * navegador manda la conversación completa cada vez que cambia y el CRM la
 * guarda encima; se revisa en marketing.aliminspa.cl/agentes-ia/pruebas.
 *
 * El navegador no conoce IA_SECRET: por eso pasa por acá. Solo reenvía; quien
 * valida el formato es el CRM (lib/ia_pruebas.ts).
 */

const LIMITE_POR_HORA = 300
const usos = new Map<string, number[]>()

function dentroDelLimite(ip: string) {
    const ahora = Date.now()
    const recientes = (usos.get(ip) || []).filter(t => ahora - t < 3_600_000)
    if (recientes.length >= LIMITE_POR_HORA) return false
    recientes.push(ahora)
    usos.set(ip, recientes)
    if (usos.size > 5000) usos.forEach((v, k) => !v.some(t => ahora - t < 3_600_000) && usos.delete(k))
    return true
}

export async function POST(request: NextRequest) {
    const secreto = process.env.IA_SECRET
    if (!secreto) return NextResponse.json({ error: 'El guardado de pruebas no está configurado.' }, { status: 503 })
    const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'sin-ip'
    if (!dentroDelLimite(ip)) return NextResponse.json({ error: 'Demasiados guardados. Intenta más tarde.' }, { status: 429 })

    const cuerpo = await request.text()
    if (cuerpo.length > 300_000) return NextResponse.json({ error: 'La conversación es demasiado larga.' }, { status: 413 })

    const url = (process.env.CRM_WEB_URL || 'https://marketing.aliminspa.cl').replace(/\/+$/, '')
    try {
        const res = await fetch(`${url}/api/webhooks/ia/pruebas`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-ia-secret': secreto },
            body: cuerpo,
            cache: 'no-store',
            signal: AbortSignal.timeout(8000),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
            console.error(`[ali:prueba] El CRM no guardó la prueba (${res.status}):`, data.error)
            return NextResponse.json({ error: data.error || 'No se pudo guardar.' }, { status: res.status === 400 ? 400 : 502 })
        }
        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error('[ali:prueba] No se pudo guardar la prueba en el CRM:', error)
        return NextResponse.json({ error: 'No se pudo guardar.' }, { status: 502 })
    }
}
