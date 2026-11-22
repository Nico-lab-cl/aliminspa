import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { SITE } from '@/lib/constants'
import { aceptoMarketing, ipDe } from '@/lib/consent-server'
import { sendMetaEvent } from '@/lib/meta-capi'
import { pagoAprobado, webpayConfirmar } from '@/lib/transbank'
import { PROYECTOS_RESERVA, refLote } from '@/lib/reservas'
import { avisarConflicto, avisarReservaPagada } from '@/lib/reservas-avisos'

export const dynamic = 'force-dynamic'

/**
 * Vuelta desde Webpay. Transbank trae:
 *   - token_ws: pago terminado (aprobado o rechazado) → se confirma (commit).
 *   - TBK_TOKEN (sin token_ws): la persona anuló en Webpay.
 *   - ninguno: se acabó el tiempo en el formulario de Webpay.
 * Llega por GET en la API REST; se acepta también POST por si cambia.
 */
const base = () => (process.env.RESERVA_BASE_URL || SITE.url).replace(/\/$/, '')
const ir = (ruta: string) => NextResponse.redirect(`${base()}${ruta}`, { status: 303 })

async function leerParametros(request: NextRequest) {
    const q = request.nextUrl.searchParams
    let tokenWs = q.get('token_ws')
    let tbkToken = q.get('TBK_TOKEN')
    let sesion = q.get('TBK_ID_SESION')
    if (request.method === 'POST') {
        try {
            const f = await request.formData()
            tokenWs ||= (f.get('token_ws') as string | null) || null
            tbkToken ||= (f.get('TBK_TOKEN') as string | null) || null
            sesion ||= (f.get('TBK_ID_SESION') as string | null) || null
        } catch {
            /* sin cuerpo */
        }
    }
    return { tokenWs, tbkToken, sesion }
}

async function manejar(request: NextRequest) {
    const { tokenWs, tbkToken, sesion } = await leerParametros(request)

    if (!tokenWs) {
        // Anulada o expirada en Webpay: se libera el lote al tiro.
        const id = sesion || null
        const r = tbkToken
            ? await prisma.reservaWeb.findFirst({ where: { OR: [{ token: tbkToken }, ...(id ? [{ id }] : [])] } })
            : id
              ? await prisma.reservaWeb.findUnique({ where: { id } })
              : null
        if (r && r.estado === 'pendiente') {
            await prisma.reservaWeb.update({ where: { id: r.id }, data: { estado: 'anulada' } })
        }
        const p = r ? PROYECTOS_RESERVA[r.proyecto] : null
        // Vino del enlace con los datos que pidió Ali: vuelve a ese enlace.
        if (r && r.utm_campaign === 'reserva-datos-chat') return ir(`/pagar/${r.id}?cancelada=1`)
        return ir(r && p ? `/reservar/${r.proyecto}?lote=${refLote(p, r.lote)}&cancelada=1` : '/reservar/resultado?estado=anulada')
    }

    const reserva = await prisma.reservaWeb.findUnique({ where: { token: tokenWs } })
    if (!reserva) {
        console.error('[reservas] Volvió de Webpay un token desconocido')
        return ir('/reservar/resultado?estado=error')
    }
    // Recarga del navegador: ya se confirmó antes.
    if (reserva.estado === 'pagada') return ir(`/reservar/resultado?estado=ok&folio=${reserva.folio}`)
    if (reserva.estado !== 'pendiente' && reserva.estado !== 'anulada') {
        return ir(`/reservar/resultado?estado=error&folio=${reserva.folio}`)
    }

    let resultado
    try {
        resultado = await webpayConfirmar(tokenWs)
    } catch (error) {
        console.error('[reservas] Falló el commit de Webpay', reserva.folio, error)
        await prisma.reservaWeb.update({ where: { id: reserva.id }, data: { estado: 'fallida' } }).catch(() => {})
        return ir(`/reservar/resultado?estado=error&folio=${reserva.folio}`)
    }

    if (!pagoAprobado(resultado) || resultado.amount !== reserva.monto) {
        await prisma.reservaWeb.update({ where: { id: reserva.id }, data: { estado: 'fallida' } })
        return ir(`/reservar/resultado?estado=rechazada&folio=${reserva.folio}`)
    }

    const pago = {
        pagada_at: new Date(),
        codigo_autorizacion: resultado.authorization_code || null,
        tarjeta: resultado.card_detail?.card_number || null,
        tipo_pago: resultado.payment_type_code || null,
        cuotas_tarjeta: resultado.installments_number || null,
    }
    try {
        await prisma.reservaWeb.update({ where: { id: reserva.id }, data: { estado: 'pagada', ...pago } })
    } catch (error) {
        // El índice único: otra persona ya pagó este lote (su bloqueo venció
        // mientras esta pagaba). El cobro existe: postventa lo resuelve.
        console.error('[reservas] Lote ya pagado por otra persona', reserva.folio, error)
        const r = await prisma.reservaWeb.update({ where: { id: reserva.id }, data: { estado: 'conflicto', ...pago } })
        await avisarConflicto(r)
        return ir(`/reservar/resultado?estado=conflicto&folio=${reserva.folio}`)
    }

    await avisarReservaPagada(reserva.id)

    // Compra para Meta, solo con cookies de marketing (Ley 21.719).
    if (aceptoMarketing(request)) {
        const p = PROYECTOS_RESERVA[reserva.proyecto]
        const [fn, ...resto] = reserva.nombre.split(' ')
        await sendMetaEvent(
            'Purchase',
            {
                em: reserva.email,
                ph: reserva.celular,
                fn,
                ln: resto.join(' '),
                client_ip_address: ipDe(request),
                client_user_agent: request.headers.get('user-agent') || undefined,
                fbp: request.cookies.get('_fbp')?.value,
                fbc: request.cookies.get('_fbc')?.value,
            },
            {
                currency: 'CLP',
                value: reserva.monto,
                content_name: `Reserva ${p?.nombre || reserva.proyecto}`,
                content_ids: [p ? refLote(p, reserva.lote) : String(reserva.lote)],
            },
            `${base()}/reservar/${reserva.proyecto}`,
            `reserva-${reserva.folio}`
        ).catch(e => console.error('[reservas] CAPI Purchase', e))
    }

    return ir(`/reservar/resultado?estado=ok&folio=${reserva.folio}`)
}

export async function GET(request: NextRequest) {
    return manejar(request)
}

export async function POST(request: NextRequest) {
    return manejar(request)
}
