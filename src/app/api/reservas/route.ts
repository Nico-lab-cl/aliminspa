import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'node:crypto'
import { prisma } from '@/lib/prisma'
import { SITE } from '@/lib/constants'
import { columnasConsentimiento, ipDe } from '@/lib/consent-server'
import { dentroDelLimite } from '@/lib/rate-limit'
import { webpayCrear } from '@/lib/transbank'
import {
    CORREO_VALIDO,
    MINUTOS_BLOQUEO,
    PROYECTOS_RESERVA,
    lotesLibres,
    normalizarCelular,
    normalizarRut,
    numeroDeLote,
} from '@/lib/reservas'

export const dynamic = 'force-dynamic'

/**
 * Crea la reserva y la transacción de Webpay. El lote queda apartado
 * MINUTOS_BLOQUEO minutos; el candado de la base (pg_advisory_xact_lock por
 * proyecto y lote) hace que dos personas no puedan apartar el mismo lote a la
 * vez. Devuelve la url y el token: el navegador manda el formulario a Webpay.
 */
export async function POST(request: NextRequest) {
    if (!dentroDelLimite(`reserva:${ipDe(request)}`, 6, 10 * 60 * 1000)) {
        return NextResponse.json({ error: 'Demasiados intentos. Espera unos minutos.' }, { status: 429 })
    }

    let body: Record<string, unknown>
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'Datos inválidos.' }, { status: 400 })
    }

    const slug = String(body.proyecto || '')
    const proyecto = PROYECTOS_RESERVA[slug]
    if (!proyecto) return NextResponse.json({ error: 'Proyecto no disponible para reserva en línea.' }, { status: 400 })

    const lote = numeroDeLote(body.lote)
    const nombre = String(body.nombre || '').trim().replace(/\s+/g, ' ').slice(0, 120)
    const rut = normalizarRut(body.rut)
    const email = String(body.email || '').trim().toLowerCase()
    const celular = normalizarCelular(body.celular)

    if (!lote) return NextResponse.json({ error: 'Elige un lote.' }, { status: 400 })
    if (nombre.split(' ').length < 2) return NextResponse.json({ error: 'Escribe tu nombre y apellido.' }, { status: 400 })
    if (!rut) return NextResponse.json({ error: 'El RUT no es válido.' }, { status: 400 })
    if (!CORREO_VALIDO.test(email) || email.length > 120) return NextResponse.json({ error: 'El correo no es válido.' }, { status: 400 })
    if (!celular) return NextResponse.json({ error: 'El celular no es válido.' }, { status: 400 })
    if (body.acepta_condiciones !== true || body.consentimiento_contacto !== true) {
        return NextResponse.json({ error: 'Tienes que aceptar las condiciones de la reserva.' }, { status: 400 })
    }

    const libres = await lotesLibres(slug)
    if (!libres.some(l => l.n === lote)) {
        return NextResponse.json({ error: 'Ese lote ya no está disponible. Elige otro.', lotes: libres }, { status: 409 })
    }

    const ahora = new Date()
    const expira = new Date(ahora.getTime() + MINUTOS_BLOQUEO * 60 * 1000)
    // buy_order de Transbank: máximo 26 caracteres.
    const sufijo = randomBytes(4).toString('hex').toUpperCase()
    const buyOrder = `AYS${lote}-${Date.now().toString(36).toUpperCase()}${sufijo.slice(0, 3)}`.slice(0, 26)
    const folio = `RES-${sufijo}`
    const texto = (v: unknown, max = 120) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null)

    let reservaId: string
    try {
        reservaId = await prisma.$transaction(async tx => {
            // ::text porque Prisma no sabe leer la columna void que devuelve la función.
            await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`${slug}:${lote}`}))::text`
            const tomada = await tx.reservaWeb.findFirst({
                where: {
                    proyecto: slug,
                    lote,
                    OR: [{ estado: 'pagada' }, { estado: 'conflicto' }, { estado: 'pendiente', expira_en: { gt: ahora } }],
                },
            })
            if (tomada) {
                // La misma persona que vuelve a intentar: se anula su intento anterior.
                if (tomada.estado === 'pendiente' && tomada.email === email) {
                    await tx.reservaWeb.update({ where: { id: tomada.id }, data: { estado: 'anulada' } })
                } else {
                    throw new Error('lote_tomado')
                }
            }
            const r = await tx.reservaWeb.create({
                data: {
                    folio,
                    proyecto: slug,
                    lote,
                    nombre,
                    rut,
                    email,
                    celular,
                    monto: proyecto.monto,
                    buy_order: buyOrder,
                    expira_en: expira,
                    origen: texto(body.origen, 40) || 'web',
                    utm_source: texto(body.utm_source),
                    utm_medium: texto(body.utm_medium),
                    utm_campaign: texto(body.utm_campaign),
                    ...columnasConsentimiento(body, request),
                },
            })
            return r.id
        })
    } catch (error) {
        if (error instanceof Error && error.message === 'lote_tomado') {
            return NextResponse.json(
                { error: 'Alguien está pagando ese lote en este momento. Elige otro o intenta en unos minutos.' },
                { status: 409 }
            )
        }
        console.error('[reservas] No se pudo crear la reserva:', error)
        return NextResponse.json({ error: 'No pudimos iniciar la reserva. Intenta de nuevo.' }, { status: 500 })
    }

    try {
        const base = (process.env.RESERVA_BASE_URL || SITE.url).replace(/\/$/, '')
        const { token, url } = await webpayCrear({
            buyOrder,
            sessionId: reservaId,
            monto: proyecto.monto,
            returnUrl: `${base}/api/reservas/commit`,
        })
        await prisma.reservaWeb.update({ where: { id: reservaId }, data: { token } })
        return NextResponse.json({ url, token })
    } catch (error) {
        console.error('[reservas] Webpay no creó la transacción:', error)
        await prisma.reservaWeb.update({ where: { id: reservaId }, data: { estado: 'fallida' } }).catch(() => {})
        return NextResponse.json({ error: 'No pudimos conectar con Webpay. Intenta de nuevo.' }, { status: 502 })
    }
}
