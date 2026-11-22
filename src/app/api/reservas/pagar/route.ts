import { NextRequest, NextResponse } from 'next/server'
import { columnasConsentimiento, ipDe } from '@/lib/consent-server'
import { dentroDelLimite } from '@/lib/rate-limit'
import { pagarEnlace } from '@/lib/reservas-enlace'
import { normalizarRut } from '@/lib/reservas'

export const dynamic = 'force-dynamic'

/** /pagar/<id>: la persona aceptó las condiciones y aprieta pagar (ver lib/reservas-enlace.ts). */
export async function POST(request: NextRequest) {
    if (!dentroDelLimite(`pagar:${ipDe(request)}`, 8, 10 * 60 * 1000)) {
        return NextResponse.json({ error: 'Demasiados intentos. Espera unos minutos.' }, { status: 429 })
    }
    let body: Record<string, unknown>
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'Datos inválidos.' }, { status: 400 })
    }
    const id = String(body.id || '').slice(0, 40)
    if (!id) return NextResponse.json({ error: 'Falta el enlace.' }, { status: 400 })
    if (body.acepta_condiciones !== true || body.consentimiento_contacto !== true) {
        return NextResponse.json({ error: 'Tienes que aceptar las condiciones de la reserva.' }, { status: 400 })
    }
    const rut = normalizarRut(body.rut)
    const nombre = String(body.nombre || '').trim().replace(/\s+/g, ' ').slice(0, 120)
    if (!rut) return NextResponse.json({ error: 'El RUT no es válido.' }, { status: 400 })
    if (nombre.split(' ').length < 2) return NextResponse.json({ error: 'Escribe tu nombre y apellido.' }, { status: 400 })
    try {
        const r = await pagarEnlace(id, columnasConsentimiento(body, request), { rut, nombre })
        if (r.ok) return NextResponse.json({ url: r.url, token: r.token })
        return NextResponse.json({ error: r.error }, { status: r.status })
    } catch (error) {
        console.error('[pagar] Error:', error)
        return NextResponse.json({ error: 'No pudimos iniciar el pago. Intenta de nuevo.' }, { status: 500 })
    }
}
