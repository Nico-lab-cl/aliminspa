import type { ReservaWeb } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { PROYECTOS_RESERVA, clp, refLote } from '@/lib/reservas'

/**
 * Lo que pasa cuando una reserva queda pagada (una sola vez por reserva):
 *
 *   1. Correo al cliente desde la casilla de postventa de Arena y Sol.
 *   2. Correo a postventa con todos los datos para el contrato.
 *   3. Aviso al CRM: deja el lead en RESERVA_PAGADA, le asigna un asesor de la
 *      rueda si no tiene uno, avisa por push y publica la reserva en el grupo
 *      de leads.
 *
 * Los correos salen por el mismo webhook de n8n que usa el portal de pagos
 * (pagos-alimin/src/lib/emailWebhook.ts): un Switch por "buzon" manda desde
 * el Gmail que corresponde. Arena y Sol sale por "cindy"
 * (postventa@lomasdelmar.cl). El sitio nunca ve credenciales de Google.
 * Variables: N8N_EMAIL_WEBHOOK_URL, N8N_EMAIL_WEBHOOK_AUTH_HEADER,
 * N8N_EMAIL_WEBHOOK_AUTH_VALUE (las mismas del portal de pagos) y
 * RESERVA_AVISO_CORREO (a quién le llega el aviso interno).
 *
 * Ningún paso lanza: si uno falla, los otros salen igual y queda en el log.
 */

const BUZON_POR_PROYECTO: Record<string, string> = { 'arena-y-sol': 'cindy' }
const AVISO_POSTVENTA = () => process.env.RESERVA_AVISO_CORREO || 'postventa@lomasdelmar.cl'
const PORTAL_PAGOS = 'pagos.aliminspa.cl'

const escapar = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

async function enviarCorreo(r: ReservaWeb, a: { to: string; subject: string; html: string; texto: string; tipo: string }) {
    const url = process.env.N8N_EMAIL_WEBHOOK_URL
    const header = process.env.N8N_EMAIL_WEBHOOK_AUTH_HEADER
    const valor = process.env.N8N_EMAIL_WEBHOOK_AUTH_VALUE
    if (!url || !header || !valor) {
        console.error('[reservas] Falta N8N_EMAIL_WEBHOOK_*: no salió el correo', a.tipo, r.folio)
        return false
    }
    const p = PROYECTOS_RESERVA[r.proyecto]
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', [header]: valor },
            body: JSON.stringify({
                buzon: BUZON_POR_PROYECTO[r.proyecto] || 'cindy',
                modo: 'REAL',
                to: a.to,
                subject: a.subject,
                html: a.html,
                texto: a.texto,
                proyecto_slug: r.proyecto,
                proyecto_nombre: p?.nombre || r.proyecto,
                cliente_nombre: r.nombre,
                cliente_rut: r.rut,
                cliente_lote: p ? refLote(p, r.lote) : String(r.lote),
                cliente_etapa: '',
                reserva_id: r.id,
                mensaje_id: `${r.folio}-${a.tipo}`,
                tanda_id: `reserva-web-${r.folio}`,
                indice: 1,
                total: 1,
                enviado_por: 'aliminspa.cl (reserva web)',
                adjuntos: [],
                cantidad_adjuntos: 0,
            }),
            signal: AbortSignal.timeout(20_000),
        })
        if (!res.ok) {
            console.error('[reservas] n8n rechazó el correo', a.tipo, r.folio, res.status, await res.text().catch(() => ''))
            return false
        }
        return true
    } catch (error) {
        console.error('[reservas] No salió el correo', a.tipo, r.folio, error)
        return false
    }
}

function correoCliente(r: ReservaWeb) {
    const p = PROYECTOS_RESERVA[r.proyecto]
    const lote = p ? refLote(p, r.lote) : String(r.lote)
    const proyecto = p?.nombre || r.proyecto
    const nombre = r.nombre.split(' ')[0]
    const pasos = [
        'Un asesor de Alimin te va a contactar para acompañarte en los próximos pasos.',
        'Tienes 10 días corridos para pagar el pie y firmar la promesa de compraventa. Al firmar la promesa se pagan además $350.000 de gastos operacionales.',
        `Te vamos a crear un acceso a nuestro portal de pagos (${PORTAL_PAGOS}), donde vas a ver tu terreno, tus pagos, tus documentos y los avances del proyecto.`,
        'Puedes visitar el proyecto cuando quieras: coordínalo con tu asesor.',
        'Recuerda que la reserva no se devuelve si decides no seguir, como indica el contrato de reserva.',
    ]
    const datos: [string, string][] = [
        ['Proyecto', proyecto],
        ['Lote', lote],
        ['Monto pagado', clp(r.monto)],
        ['Folio', r.folio],
        ['Código de autorización', r.codigo_autorizacion || '—'],
    ]
    const html = `
<div style="font-family:Arial,Helvetica,sans-serif;color:#1f2933;max-width:560px;margin:0 auto;padding:24px">
  <h1 style="font-size:22px;margin:0 0 8px">¡Reserva confirmada, ${escapar(nombre)}! 🎉</h1>
  <p style="margin:0 0 16px">Recibimos el pago de la reserva de tu terreno en <b>${escapar(proyecto)}</b>.</p>
  <table style="width:100%;border-collapse:collapse;border:1.5px solid #76d845;border-radius:10px;margin:0 0 20px">
    ${datos
        .map(
            ([k, v]) =>
                `<tr><td style="padding:8px 12px;color:#52606d">${k}</td><td style="padding:8px 12px;font-weight:bold">${escapar(v)}</td></tr>`
        )
        .join('')}
  </table>
  <h2 style="font-size:17px;margin:0 0 8px">Qué sigue</h2>
  <ul style="padding-left:18px;margin:0 0 20px">${pasos.map(t => `<li style="margin:0 0 8px">${escapar(t)}</li>`).join('')}</ul>
  <p style="margin:0;color:#52606d;font-size:13px">Alimin SpA · aliminspa.cl</p>
</div>`
    const texto = [
        `¡Reserva confirmada, ${nombre}!`,
        `Recibimos el pago de la reserva de tu terreno en ${proyecto}.`,
        '',
        ...datos.map(([k, v]) => `${k}: ${v}`),
        '',
        'Qué sigue:',
        ...pasos.map(t => `- ${t}`),
        '',
        'Alimin SpA · aliminspa.cl',
    ].join('\n')
    return { to: r.email, subject: `Reserva confirmada · ${proyecto} · Lote ${lote}`, html, texto, tipo: 'cliente' }
}

function correoPostventa(r: ReservaWeb) {
    const p = PROYECTOS_RESERVA[r.proyecto]
    const lote = p ? refLote(p, r.lote) : String(r.lote)
    const proyecto = p?.nombre || r.proyecto
    const filas: [string, string][] = [
        ['Proyecto', proyecto],
        ['Lote', lote],
        ['Monto', clp(r.monto)],
        ['Folio', r.folio],
        ['Orden de compra', r.buy_order],
        ['Autorización', r.codigo_autorizacion || '—'],
        ['Tarjeta', r.tarjeta ? `**** ${r.tarjeta}` : '—'],
        ['Tipo de pago', `${r.tipo_pago || '—'}${r.cuotas_tarjeta ? ` (${r.cuotas_tarjeta} cuotas)` : ''}`],
        ['Pagada', r.pagada_at ? r.pagada_at.toLocaleString('es-CL', { timeZone: 'America/Santiago' }) : '—'],
        ['Cliente', r.nombre],
        ['RUT', r.rut],
        ['Correo', r.email],
        ['Celular', r.celular],
        ['Origen', r.origen || 'web'],
    ]
    const html = `
<div style="font-family:Arial,Helvetica,sans-serif;color:#1f2933;max-width:600px">
  <h1 style="font-size:20px">🎉 Nueva reserva pagada · ${escapar(proyecto)} · ${escapar(lote)}</h1>
  <p>Pagada con Webpay en aliminspa.cl. Falta: contrato de reserva, promesa (10 días corridos para pie y promesa) y acceso al portal de pagos. El lote hay que marcarlo como vendido en el plano.</p>
  <table style="border-collapse:collapse">${filas
      .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#52606d">${k}</td><td style="padding:4px 0"><b>${escapar(v)}</b></td></tr>`)
      .join('')}</table>
</div>`
    const texto = [`Nueva reserva pagada · ${proyecto} · ${lote}`, '', ...filas.map(([k, v]) => `${k}: ${v}`)].join('\n')
    return { to: AVISO_POSTVENTA(), subject: `🎉 Reserva pagada · ${proyecto} · ${lote} · ${r.nombre}`, html, texto, tipo: 'postventa' }
}

async function avisarAlCrm(r: ReservaWeb): Promise<string | null> {
    const clave = process.env.CRM_API_KEY
    const base = new URL(process.env.CRM_WEBHOOK_URL || 'https://crm.aliminlomasdelmar.com/api/leads').origin
    if (!clave) {
        console.error('[reservas] Falta CRM_API_KEY: el CRM no se enteró de la reserva', r.folio)
        return null
    }
    const p = PROYECTOS_RESERVA[r.proyecto]
    try {
        const res = await fetch(`${base}/api/reservas/web`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-crm-api-key': clave },
            body: JSON.stringify({
                proyecto: p?.nombre || r.proyecto,
                lote: p ? refLote(p, r.lote) : String(r.lote),
                nombre: r.nombre,
                email: r.email,
                celular: r.celular,
                rut: r.rut,
                monto: r.monto,
                folio: r.folio,
                origen: r.origen || 'web',
            }),
            signal: AbortSignal.timeout(15_000),
        })
        if (!res.ok) {
            console.error('[reservas] El CRM rechazó la reserva', r.folio, res.status, await res.text().catch(() => ''))
            return null
        }
        const j = (await res.json().catch(() => null)) as { leadId?: string } | null
        return j?.leadId || null
    } catch (error) {
        console.error('[reservas] No se pudo avisar al CRM', r.folio, error)
        return null
    }
}

/**
 * Manda los avisos de una reserva pagada. El "reclamo" de avisos_at es atómico:
 * si Transbank vuelve dos veces (recarga del navegador), los avisos salen una vez.
 */
export async function avisarReservaPagada(reservaId: string) {
    const reclamo = await prisma.reservaWeb.updateMany({
        where: { id: reservaId, estado: 'pagada', avisos_at: null },
        data: { avisos_at: new Date() },
    })
    if (!reclamo.count) return
    const r = await prisma.reservaWeb.findUnique({ where: { id: reservaId } })
    if (!r) return

    const [, , leadId] = await Promise.all([
        enviarCorreo(r, correoCliente(r)),
        enviarCorreo(r, correoPostventa(r)),
        avisarAlCrm(r),
    ])
    if (leadId) await prisma.reservaWeb.update({ where: { id: r.id }, data: { crm_lead_id: leadId } }).catch(() => {})
}

/** Dos pagos del mismo lote (el bloqueo venció mientras la persona pagaba): postventa devuelve uno. */
export async function avisarConflicto(r: ReservaWeb) {
    const p = PROYECTOS_RESERVA[r.proyecto]
    const lote = p ? refLote(p, r.lote) : String(r.lote)
    const texto = `El lote ${lote} de ${p?.nombre || r.proyecto} ya tenía una reserva pagada y entró un segundo pago (folio ${r.folio}, ${r.nombre}, ${r.email}, ${r.celular}). Hay que contactar a esta persona para ofrecerle otro lote o devolverle el pago.`
    await enviarCorreo(r, {
        to: AVISO_POSTVENTA(),
        subject: `⚠️ Pago duplicado de reserva · ${lote} · ${r.nombre}`,
        html: `<p style="font-family:Arial,sans-serif">${escapar(texto)}</p>`,
        texto,
        tipo: 'conflicto',
    })
}
