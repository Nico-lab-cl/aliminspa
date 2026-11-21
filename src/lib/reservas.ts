import { prisma } from '@/lib/prisma'
import { SITE } from '@/lib/constants'
import planoArena from '../../public/arenaysol3d/plano-lotes.json'

/**
 * Reserva pagada con Webpay desde aliminspa.cl/reservar/<proyecto>.
 *
 * Hoy solo Arena y Sol (21-11-2026). Lomas del Mar ya reserva en
 * aliminlomasdelmar.com, con su propia base de lotes y sus correos de n8n.
 *
 * Qué lote está libre sale del plano de la agenda (public/arenaysol3d/
 * plano-lotes.json, el mismo que muestra el mapa y lee Ali), menos los lotes
 * con una reserva pagada o en pago en reservas_web. Cuando postventa marca un
 * lote como vendido en el plano, la reserva de acá deja de importar.
 */

export interface LotePlano {
    n: number | null
    sold: boolean
    tipo?: string | null
}

export interface ProyectoReserva {
    slug: string
    nombre: string
    /** Como en el plano de ventas: P45. */
    prefijo: string
    monto: number
    /** Para el correo y la página. Datos confirmados por Nico el 22-10-2026. */
    resumen: string
    lotes: LotePlano[]
}

export const PROYECTOS_RESERVA: Record<string, ProyectoReserva> = {
    'arena-y-sol': {
        slug: 'arena-y-sol',
        nombre: 'Arena y Sol',
        prefijo: 'P',
        // 21-11-2026: lo mismo que Lomas del Mar.
        monto: 550_000,
        resumen: 'Terrenos de 200 m² en El Tabo · $39.000.000 al contado, o pie de $20.000.000 + 44 cuotas de $500.000',
        lotes: (planoArena as { lotes: LotePlano[] }).lotes,
    },
}

/** Minutos que el lote queda apartado mientras la persona paga en Webpay. */
export const MINUTOS_BLOQUEO = 15

export const clp = (n: number) => '$' + n.toLocaleString('es-CL')

export function refLote(p: ProyectoReserva, n: number) {
    return `${p.prefijo}${n}`
}

/** "P45", "p-45", "lote 45", "45" → 45. */
export function numeroDeLote(texto: unknown): number | null {
    const m = String(texto ?? '').match(/(\d{1,3})/)
    if (!m) return null
    const n = Number(m[1])
    return Number.isInteger(n) && n > 0 ? n : null
}

/** Lotes que el plano muestra como libres (sin vendidos ni equipamiento). */
function libresDelPlano(p: ProyectoReserva): number[] {
    return p.lotes
        .filter(l => (l.tipo ?? 'lote') === 'lote' && !l.sold && l.n !== null)
        .map(l => l.n as number)
        .sort((a, b) => a - b)
}

/** Lotes con una reserva pagada, o en pago y todavía dentro de su plazo. */
export async function lotesTomados(slug: string): Promise<Set<number>> {
    try {
        const filas = await prisma.reservaWeb.findMany({
            where: {
                proyecto: slug,
                OR: [{ estado: 'pagada' }, { estado: 'conflicto' }, { estado: 'pendiente', expira_en: { gt: new Date() } }],
            },
            select: { lote: true },
        })
        return new Set(filas.map(f => f.lote))
    } catch (error) {
        // Sin la tabla (SQL todavía no corrido) no hay reservas: el plano manda.
        console.error('[reservas] No se pudieron leer las reservas:', error)
        return new Set()
    }
}

export async function lotesLibres(slug: string) {
    const p = PROYECTOS_RESERVA[slug]
    if (!p) return []
    const tomados = await lotesTomados(slug)
    return libresDelPlano(p)
        .filter(n => !tomados.has(n))
        .map(n => ({ n, ref: refLote(p, n) }))
}

/** Enlace que manda Ali. `origen` queda en la reserva y en el CRM. */
export function enlaceReserva(slug: string, lote: number | null, origen?: string) {
    const p = PROYECTOS_RESERVA[slug]
    const url = new URL(`/reservar/${slug}`, SITE.url)
    if (p && lote) url.searchParams.set('lote', refLote(p, lote))
    if (origen) url.searchParams.set('origen', origen)
    return url.toString()
}

/* ── Validaciones ───────────────────────────────────────────────── */

/** RUT chileno con dígito verificador válido → "12.345.678-5". */
export function normalizarRut(valor: unknown): string | null {
    const limpio = String(valor ?? '').replace(/[^0-9kK]/g, '').toUpperCase()
    if (limpio.length < 8 || limpio.length > 9) return null
    const cuerpo = limpio.slice(0, -1)
    const dv = limpio.slice(-1)
    let suma = 0
    let factor = 2
    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += Number(cuerpo[i]) * factor
        factor = factor === 7 ? 2 : factor + 1
    }
    const resto = 11 - (suma % 11)
    const esperado = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto)
    if (dv !== esperado) return null
    return `${Number(cuerpo).toLocaleString('es-CL')}-${dv}`
}

/** Celular chileno a +569XXXXXXXX. */
export function normalizarCelular(valor: unknown): string | null {
    const d = String(valor ?? '').replace(/\D/g, '')
    if (/^9\d{8}$/.test(d)) return `+56${d}`
    if (/^569\d{8}$/.test(d)) return `+${d}`
    if (/^\d{8}$/.test(d)) return `+569${d}`
    return null
}

export const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
