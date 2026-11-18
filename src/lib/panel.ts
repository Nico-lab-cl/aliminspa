import { timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Panel de tráfico (noviembre 2026).
 *
 * Desde el banner de la Ley 21.719 (3-oct-2026), Google Analytics solo ve a
 * quien acepta cookies de analítica, más o menos 1 de cada 4 visitas. Este
 * contador cuenta el 100% sin cookies, sin almacenamiento en el navegador y
 * sin guardar IP ni nada que identifique a la persona: solo suma visitas por
 * día, página, origen y tipo de dispositivo. Al no haber dato personal, no
 * depende del consentimiento.
 *
 * Los totales salen como CSV en /api/panel/*.csv (con clave), una hoja de
 * Google los descarga (scripts/panel-looker/actualizar-panel.gs) y Looker
 * Studio lee esa hoja. Así la base de datos no queda expuesta a Internet.
 */

/** Fecha de Chile como "2026-11-17". */
export function fechaChile(fecha = new Date()): string {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Santiago',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(fecha)
}

function hostDe(url: string | null | undefined): string {
    if (!url) return ''
    try {
        return new URL(url).hostname.replace(/^www\./, '').toLowerCase()
    } catch {
        return ''
    }
}

export function esDelSitio(host: string): boolean {
    return host === 'aliminspa.cl' || host.endsWith('.aliminspa.cl') || host === 'localhost' || host === '127.0.0.1'
}

type DatosOrigen = {
    utm_source?: string | null
    utm_medium?: string | null
    referrer?: string | null
    clicGoogle?: boolean
    clicMeta?: boolean
}

const REDES = /(^|\.)(facebook|fb|instagram|tiktok|youtube|linkedin|twitter|x|t)\.(com|co|me)$|^l\.instagram\.com$|^lm\.facebook\.com$/
const BUSCADORES = /(^|\.)(google|bing|yahoo|duckduckgo|ecosia|yandex|search\.brave)\.[a-z.]+$/
const ASISTENTES_IA = /(chatgpt\.com|openai\.com|perplexity\.ai|gemini\.google\.com|copilot\.microsoft\.com|claude\.ai)$/
const FUENTES_META = /^(facebook|fb|instagram|ig|meta|an|msg|messenger)$/

/**
 * Canal de la visita (o del lead), con nombres en castellano para el panel.
 * Lo pagado se reconoce por el utm_medium o por el id de clic; lo orgánico,
 * por el sitio de donde viene.
 */
export function origenDe(d: DatosOrigen): { origen: string; fuente: string } {
    const s = (d.utm_source || '').trim().toLowerCase()
    const m = (d.utm_medium || '').trim().toLowerCase()
    const host = hostDe(d.referrer)
    const pagado = /(cpc|ppc|cpm|paid|pago|pagado|retargeting|ads?$)/.test(m)
    const fuente = (s || host).slice(0, 80)

    if (d.clicGoogle || (pagado && s.includes('google'))) return { origen: 'Google Ads', fuente: fuente || 'google' }
    if (pagado && (FUENTES_META.test(s) || s.includes('facebook') || s.includes('instagram'))) return { origen: 'Meta Ads', fuente }
    if (pagado) return { origen: 'Otros anuncios', fuente }
    if (s.includes('chatgpt') || s.includes('perplexity') || ASISTENTES_IA.test(host)) return { origen: 'Asistentes de IA', fuente }
    if (m === 'email' || m === 'correo' || s.includes('mail')) return { origen: 'Email', fuente }
    if (s.includes('whatsapp') || host === 'wa.me' || host.endsWith('whatsapp.com')) return { origen: 'WhatsApp', fuente }
    if (BUSCADORES.test(host) || (m === 'organic' && /google|bing/.test(s))) return { origen: 'Buscadores (orgánico)', fuente }
    if (REDES.test(host) || FUENTES_META.test(s) || /instagram|facebook|tiktok|youtube|linkedin/.test(s) || d.clicMeta) {
        return { origen: 'Redes sociales (orgánico)', fuente: fuente || 'redes' }
    }
    if (s) return { origen: 'Otros con UTM', fuente }
    if (host && !esDelSitio(host)) return { origen: 'Referidos', fuente }
    return { origen: 'Directo', fuente: '' }
}

export function dispositivoDe(ua: string): string {
    if (/iPad|Tablet/i.test(ua)) return 'Tableta'
    if (/Mobi|Android|iPhone/i.test(ua)) return 'Celular'
    return 'Escritorio'
}

export const ES_BOT = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|whatsapp|monitor|curl|wget|python|axios|node-fetch/i

let tablaLista: Promise<unknown> | null = null

/** Crea la tabla si no existe (una vez por proceso). Mismo SQL que prisma/sql/2026-11-17-panel-visitas.sql. */
function asegurarTabla() {
    tablaLista ??= prisma
        .$executeRawUnsafe(
            `CREATE TABLE IF NOT EXISTS panel_visitas_diarias (
                fecha date NOT NULL,
                ruta text NOT NULL,
                origen text NOT NULL,
                fuente text NOT NULL DEFAULT '',
                medio text NOT NULL DEFAULT '',
                campana text NOT NULL DEFAULT '',
                dispositivo text NOT NULL,
                vistas integer NOT NULL DEFAULT 0,
                entradas integer NOT NULL DEFAULT 0,
                PRIMARY KEY (fecha, ruta, origen, fuente, medio, campana, dispositivo)
            )`
        )
        .catch((error) => {
            tablaLista = null
            throw error
        })
    return tablaLista
}

export type Visita = {
    fecha: string
    ruta: string
    origen: string
    fuente: string
    medio: string
    campana: string
    dispositivo: string
    entrada: boolean
}

export async function registrarVisita(v: Visita) {
    await asegurarTabla()
    const entradas = v.entrada ? 1 : 0
    await prisma.$executeRaw`
        INSERT INTO panel_visitas_diarias (fecha, ruta, origen, fuente, medio, campana, dispositivo, vistas, entradas)
        VALUES (${v.fecha}::date, ${v.ruta}, ${v.origen}, ${v.fuente}, ${v.medio}, ${v.campana}, ${v.dispositivo}, 1, ${entradas})
        ON CONFLICT (fecha, ruta, origen, fuente, medio, campana, dispositivo)
        DO UPDATE SET vistas = panel_visitas_diarias.vistas + 1,
                      entradas = panel_visitas_diarias.entradas + EXCLUDED.entradas`
}

export async function visitasDesde(desde: string) {
    await asegurarTabla()
    return prisma.$queryRaw<
        { fecha: Date; ruta: string; origen: string; fuente: string; medio: string; campana: string; dispositivo: string; vistas: number; entradas: number }[]
    >`SELECT fecha, ruta, origen, fuente, medio, campana, dispositivo, vistas, entradas
      FROM panel_visitas_diarias WHERE fecha >= ${desde}::date ORDER BY fecha, ruta`
}

/**
 * Las descargas del panel piden "Authorization: Bearer <PANEL_KEY>". Sin la
 * variable, las rutas responden 404 (igual que /api/google-ads/*).
 */
export function rechazoDelPanel(request: NextRequest): NextResponse | null {
    const clave = process.env.PANEL_KEY
    if (!clave) return new NextResponse('Not found', { status: 404 })
    const auth = request.headers.get('authorization') || ''
    const dada = Buffer.from(auth.startsWith('Bearer ') ? auth.slice(7).trim() : '')
    const esperada = Buffer.from(clave)
    if (dada.length === esperada.length && timingSafeEqual(dada, esperada)) return null
    return new NextResponse('Unauthorized', { status: 401 })
}

function celda(valor: unknown): string {
    const texto = valor === null || valor === undefined ? '' : String(valor)
    return /[",\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}

export function csv(encabezado: string[], filas: unknown[][]): NextResponse {
    const cuerpo = [encabezado.join(','), ...filas.map((f) => f.map(celda).join(','))].join('\n') + '\n'
    return new NextResponse(cuerpo, {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Cache-Control': 'no-store',
            'X-Robots-Tag': 'noindex',
        },
    })
}

/** "2026-11-17" de hace `dias` días, en hora de Chile. */
export function haceDias(dias: number): string {
    return fechaChile(new Date(Date.now() - dias * 24 * 60 * 60 * 1000))
}
