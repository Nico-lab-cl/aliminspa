/**
 * Reserva de Lomas del Mar desde aliminspa.cl/reservar/lomas-del-mar (21-11-2026).
 *
 * Lomas del Mar ya cobra reservas en aliminlomasdelmar.com, con su propia base
 * de lotes, su candado de 5 minutos, su Webpay y sus correos de n8n. Para que
 * Ali mande un enlace directo a un lote, esta página usa las MISMAS APIs
 * públicas de ese sitio:
 *   - GET  /api/lots          → lotes con etapa, estado y monto de la reserva;
 *   - POST /api/webpay/create → aparta el lote, crea la reserva y la
 *     transacción, y devuelve la url de Webpay.
 * La vuelta de Webpay, el comprobante, el acceso al portal y los correos siguen
 * siendo los de aliminlomasdelmar.com: acá no se duplica nada.
 */

const ORIGEN_LOMAS = (process.env.LOMAS_SITE_URL || 'https://aliminlomasdelmar.com').replace(/\/$/, '')

export interface LoteLomas {
    id: number
    etapa: number
    numero: string
    area: number | null
    reserva: number
    /** E1-22 */
    ref: string
    /** Etapa 1 · Lote 22 */
    etiqueta: string
}

interface LoteApi {
    id: number
    number: string | null
    stage: number | null
    area_m2: number | null
    reservation_amount_clp: number | null
    status: string
    reserved_until: string | null
}

/** Misma regla que el mapa de aliminlomasdelmar.com: "reserved" con el plazo vencido cuenta como libre. */
function libre(l: LoteApi, ahora: number) {
    if (l.status === 'available') return true
    if (l.status !== 'reserved') return false
    const hasta = l.reserved_until ? Date.parse(l.reserved_until) : NaN
    return Number.isFinite(hasta) && hasta < ahora
}

export const refLomas = (etapa: number, numero: string | number) => `E${etapa}-${numero}`
export const etiquetaLomas = (etapa: number, numero: string | number) => `Etapa ${etapa} · Lote ${numero}`

/** "E1-22", "etapa 1 lote 22", "1-22" → { etapa: 1, numero: "22" }; "22" solo → sin etapa. */
export function leerLoteLomas(texto: unknown): { etapa: number | null; numero: string } | null {
    const s = String(texto ?? '').toLowerCase()
    const conEtapa = s.match(/e(?:tapa)?\s*(\d)\D+(\d{1,3})/) || s.match(/^\s*(\d)\s*-\s*(\d{1,3})\s*$/)
    if (conEtapa) return { etapa: Number(conEtapa[1]), numero: String(Number(conEtapa[2])) }
    const solo = s.match(/(\d{1,3})/)
    return solo ? { etapa: null, numero: String(Number(solo[1])) } : null
}

/** Lotes que hoy se pueden reservar en aliminlomasdelmar.com (estado "available"). */
export async function lotesLibresLomas(): Promise<LoteLomas[]> {
    const res = await fetch(`${ORIGEN_LOMAS}/api/lots`, { cache: 'no-store', signal: AbortSignal.timeout(8000) })
    if (!res.ok) throw new Error(`Lomas /api/lots respondió ${res.status}`)
    const j = (await res.json()) as { data?: LoteApi[] }
    const ahora = Date.now()
    return (j.data || [])
        .filter(l => libre(l, ahora) && l.stage && l.number)
        .map(l => ({
            id: l.id,
            etapa: l.stage as number,
            numero: String(l.number),
            area: l.area_m2,
            reserva: l.reservation_amount_clp || 500_000,
            ref: refLomas(l.stage as number, l.number as string),
            etiqueta: etiquetaLomas(l.stage as number, l.number as string),
        }))
        .sort((a, b) => a.etapa - b.etapa || Number(a.numero) - Number(b.numero))
}

export const ENTREGA_ETAPA: Record<number, string> = {
    1: 'fines de 2027',
    2: 'fines de 2028 o verano de 2029',
    3: 'fines de 2030',
    4: 'fines de 2031',
}

/**
 * De lo que dijo la persona ("el 22", "etapa 1 lote 22") al lote libre exacto.
 * Si el número está libre en varias etapas, devuelve el error para que Ali
 * pregunte cuál.
 */
export function resolverLoteLomas(
    libres: LoteLomas[],
    texto: unknown
): { ok: true; lote: LoteLomas } | { ok: false; error: string; preguntaEtapa?: boolean } {
    const pedido = leerLoteLomas(texto)
    if (!pedido) return { ok: false, error: 'No dijo qué lote. Pregúntale cuál quiere (etapa y número).' }
    const candidatos = libres.filter(l => l.numero === pedido.numero && (pedido.etapa === null || l.etapa === pedido.etapa))
    if (!candidatos.length) {
        const porEtapa = [1, 2, 3, 4]
            .map(e => [e, libres.filter(l => l.etapa === e).map(l => l.numero)] as const)
            .filter(([, ns]) => ns.length)
            .map(([e, ns]) => `Etapa ${e}: ${ns.slice(0, 12).join(', ')}${ns.length > 12 ? '…' : ''}`)
        return {
            ok: false,
            error: `${pedido.etapa ? `El lote ${pedido.numero} de la etapa ${pedido.etapa}` : `El lote ${pedido.numero}`} no está libre. Ofrécele otro. Libres: ${porEtapa.join(' · ')}.`,
        }
    }
    if (candidatos.length > 1) {
        return {
            ok: false,
            preguntaEtapa: true,
            error: `El lote ${pedido.numero} está libre en ${candidatos.map(c => `la etapa ${c.etapa} (entrega aproximada a ${ENTREGA_ETAPA[c.etapa] || 'confirmar'})`).join(' y en ')}. Pregúntale de qué etapa lo quiere, en una frase, y después vuelve a llamar con la etapa.`,
        }
    }
    return { ok: true, lote: candidatos[0] }
}

/** Crea la reserva y la transacción en aliminlomasdelmar.com. */
export async function crearPagoLomas(datos: {
    lotId: number
    sessionId: string
    name: string
    email: string
    phone: string
    rut: string
    utm_source?: string | null
    utm_medium?: string | null
    utm_campaign?: string | null
}): Promise<{ ok: true; url: string; token: string } | { ok: false; error: string; status: number }> {
    const res = await fetch(`${ORIGEN_LOMAS}/api/webpay/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...datos,
            utm_source: datos.utm_source || undefined,
            utm_medium: datos.utm_medium || undefined,
            utm_campaign: datos.utm_campaign || undefined,
        }),
        signal: AbortSignal.timeout(20_000),
    })
    const j = (await res.json().catch(() => ({}))) as { ok?: boolean; url?: string; token?: string; error?: string }
    if (res.ok && j.ok && j.url && j.token) return { ok: true, url: j.url, token: j.token }
    return { ok: false, error: j.error || `http_${res.status}`, status: res.status }
}
