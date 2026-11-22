import { randomBytes } from 'node:crypto'
import { prisma } from '@/lib/prisma'
import { SITE } from '@/lib/constants'
import { webpayCrear } from '@/lib/transbank'
import { MINUTOS_BLOQUEO, PROYECTOS_RESERVA, clp, lotesLibres, refLote } from '@/lib/reservas'
import { crearPagoLomas, lotesLibresLomas } from '@/lib/reservas-lomas'

/**
 * Pago de reserva con los datos que Ali pidió en el chat (22-11-2026, Nicolás:
 * "que la misma IA pida los datos, como con la visita").
 *
 * Ali guarda nombre, RUT, correo y celular en una fila de reservas_web con
 * estado "enlace" y manda aliminspa.cl/pagar/<id>. La persona abre el enlace,
 * marca que acepta las condiciones y va directo a Webpay: no escribe nada.
 *
 * El lote NO se aparta al mandar el enlace (un enlace que nadie paga no puede
 * bloquear un lote): se aparta al abrirlo y apretar pagar, con el mismo
 * candado de la reserva normal.
 *   - Arena y Sol: la fila pasa a "pendiente" y sigue el flujo de
 *     /api/reservas/commit (correos, CRM, grupo).
 *   - Lomas del Mar: el pago lo crea aliminlomasdelmar.com (crearPagoLomas) y
 *     la fila queda "lomas"; en `lote` se guarda el id del lote de esa base.
 */

const HORAS_VIGENCIA = 72
export const PROYECTO_LOMAS = 'lomas-del-mar'

export interface DatosPago {
    proyecto: string
    /** Arena y Sol: número del plano. Lomas del Mar: id del lote en aliminlomasdelmar.com. */
    lote: number
    nombre: string
    rut: string
    email: string
    celular: string
    monto: number
    origen: string
}

export async function prepararEnlacePago(d: DatosPago): Promise<string> {
    const sufijo = randomBytes(4).toString('hex').toUpperCase()
    const r = await prisma.reservaWeb.create({
        data: {
            folio: `RES-${sufijo}`,
            proyecto: d.proyecto,
            lote: d.lote,
            nombre: d.nombre,
            rut: d.rut,
            email: d.email,
            celular: d.celular,
            monto: d.monto,
            estado: 'enlace',
            buy_order: `ENL-${randomBytes(8).toString('hex')}`,
            expira_en: new Date(Date.now() + HORAS_VIGENCIA * 3600 * 1000),
            origen: d.origen,
            utm_source: 'ali',
            utm_medium: d.origen,
            utm_campaign: 'reserva-datos-chat',
        },
    })
    return new URL(`/pagar/${r.id}`, SITE.url).toString()
}

/** Lo que muestra /pagar/<id>. */
export async function leerEnlacePago(id: string) {
    const r = await prisma.reservaWeb.findUnique({ where: { id } }).catch(() => null)
    if (!r) return null
    let lote = String(r.lote)
    let proyecto = r.proyecto
    if (r.proyecto === PROYECTO_LOMAS) {
        proyecto = 'Lomas del Mar'
        const l = (await lotesLibresLomas().catch(() => [])).find(x => x.id === r.lote)
        lote = l ? `${l.etiqueta}${l.area ? ` (${Math.round(l.area)} m²)` : ''}` : `Lote ${r.lote}`
    } else {
        const p = PROYECTOS_RESERVA[r.proyecto]
        if (p) {
            proyecto = p.nombre
            lote = `Lote ${refLote(p, r.lote)}`
        }
    }
    return { r, proyecto, lote, monto: clp(r.monto), vencido: r.estado === 'enlace' && r.expira_en < new Date() }
}

type Consentimiento = {
    consentimiento_contacto: boolean | null
    consentimiento_marketing: boolean | null
    consentimiento_at: Date | null
    politica_version: string | null
    consentimiento_origen: string | null
}

/** La persona apretó pagar: aparta el lote y crea la transacción de Webpay. */
export async function pagarEnlace(
    id: string,
    consentimiento: Consentimiento
): Promise<{ ok: true; url: string; token: string } | { ok: false; error: string; status: number }> {
    const r = await prisma.reservaWeb.findUnique({ where: { id } })
    if (!r) return { ok: false, error: 'Este enlace no existe.', status: 404 }
    if (r.estado === 'pagada') return { ok: false, error: 'Esta reserva ya está pagada.', status: 409 }
    if (r.estado === 'enlace' && r.expira_en < new Date()) {
        return { ok: false, error: 'Este enlace venció. Escríbenos y te mandamos uno nuevo.', status: 410 }
    }
    if (r.estado !== 'enlace' && r.estado !== 'pendiente' && r.estado !== 'anulada' && r.estado !== 'fallida' && r.estado !== 'lomas') {
        return { ok: false, error: 'Este enlace ya no se puede usar. Escríbenos y te ayudamos.', status: 409 }
    }

    if (r.proyecto === PROYECTO_LOMAS) {
        const libres = await lotesLibresLomas().catch(() => null)
        if (!libres) return { ok: false, error: 'No pudimos revisar el lote. Intenta de nuevo.', status: 502 }
        if (!libres.some(l => l.id === r.lote)) {
            return { ok: false, error: 'Ese lote ya no está disponible. Escríbenos y te ofrecemos otro.', status: 409 }
        }
        const pago = await crearPagoLomas({
            lotId: r.lote,
            sessionId: `aliminspa-${randomBytes(8).toString('hex')}`,
            name: r.nombre,
            email: r.email,
            phone: r.celular,
            rut: r.rut,
            utm_source: r.utm_source,
            utm_medium: r.utm_medium,
            utm_campaign: r.utm_campaign,
        })
        if (!pago.ok) {
            if (pago.error === 'lot_reserved' || pago.error === 'lot_sold') {
                return { ok: false, error: 'Alguien está pagando ese lote en este momento. Intenta en unos minutos.', status: 409 }
            }
            console.error('[pagar] aliminlomasdelmar.com no creó el pago:', pago.status, pago.error)
            return { ok: false, error: 'No pudimos conectar con Webpay. Intenta de nuevo.', status: 502 }
        }
        await prisma.reservaWeb.update({ where: { id }, data: { estado: 'lomas', token: pago.token, ...consentimiento } })
        return { ok: true, url: pago.url, token: pago.token }
    }

    const p = PROYECTOS_RESERVA[r.proyecto]
    if (!p) return { ok: false, error: 'Proyecto no disponible.', status: 400 }
    if (!(await lotesLibres(r.proyecto)).some(l => l.n === r.lote)) {
        return { ok: false, error: 'Ese lote ya no está disponible. Escríbenos y te ofrecemos otro.', status: 409 }
    }
    const ahora = new Date()
    const buyOrder = `AYS${r.lote}-${Date.now().toString(36).toUpperCase()}${randomBytes(2).toString('hex').toUpperCase()}`.slice(0, 26)
    try {
        await prisma.$transaction(async tx => {
            await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`${r.proyecto}:${r.lote}`}))::text`
            const tomada = await tx.reservaWeb.findFirst({
                where: {
                    proyecto: r.proyecto,
                    lote: r.lote,
                    id: { not: id },
                    OR: [{ estado: 'pagada' }, { estado: 'conflicto' }, { estado: 'pendiente', expira_en: { gt: ahora } }],
                },
            })
            if (tomada) throw new Error('lote_tomado')
            await tx.reservaWeb.update({
                where: { id },
                data: {
                    estado: 'pendiente',
                    buy_order: buyOrder,
                    token: null,
                    expira_en: new Date(ahora.getTime() + MINUTOS_BLOQUEO * 60 * 1000),
                    ...consentimiento,
                },
            })
        })
    } catch (error) {
        if (error instanceof Error && error.message === 'lote_tomado') {
            return { ok: false, error: 'Alguien está pagando ese lote en este momento. Intenta en unos minutos.', status: 409 }
        }
        throw error
    }
    try {
        const base = (process.env.RESERVA_BASE_URL || SITE.url).replace(/\/$/, '')
        const { token, url } = await webpayCrear({ buyOrder, sessionId: id, monto: r.monto, returnUrl: `${base}/api/reservas/commit` })
        await prisma.reservaWeb.update({ where: { id }, data: { token } })
        return { ok: true, url, token }
    } catch (error) {
        console.error('[pagar] Webpay no creó la transacción:', error)
        await prisma.reservaWeb.update({ where: { id }, data: { estado: 'fallida' } }).catch(() => {})
        return { ok: false, error: 'No pudimos conectar con Webpay. Intenta de nuevo.', status: 502 }
    }
}
