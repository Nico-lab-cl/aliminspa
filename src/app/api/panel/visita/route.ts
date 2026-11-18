import { NextRequest, NextResponse } from 'next/server'
import { ipDe } from '@/lib/consent-server'
import { dentroDelLimite } from '@/lib/rate-limit'
import { ES_BOT, dispositivoDe, esDelSitio, fechaChile, origenDe, registrarVisita } from '@/lib/panel'

/**
 * Cuenta una página vista (la manda src/components/analytics/ContadorVisitas).
 * No guarda IP, ni cookies, ni identificadores: solo suma 1 al total del día
 * para esa página, origen y tipo de dispositivo. La IP se usa solo para el
 * tope de pedidos y no se guarda. Ver src/lib/panel.ts.
 */

const listo = () => new NextResponse(null, { status: 204 })

function texto(valor: unknown, largo: number): string {
    return typeof valor === 'string' ? valor.trim().slice(0, largo) : ''
}

export async function POST(request: NextRequest) {
    try {
        const origenPedido = request.headers.get('origin') || request.headers.get('referer') || ''
        let hostPedido = ''
        try {
            hostPedido = new URL(origenPedido).hostname
        } catch {
            // Sin origen válido: no viene del sitio.
        }
        if (!esDelSitio(hostPedido)) return new NextResponse(null, { status: 403 })
        if (!dentroDelLimite(`panel:${ipDe(request)}`, 120, 60 * 1000)) return new NextResponse(null, { status: 429 })

        const ua = request.headers.get('user-agent') || ''
        if (!ua || ES_BOT.test(ua)) return listo()

        const body = JSON.parse((await request.text()).slice(0, 4000) || '{}')

        let ruta = texto(body.ruta, 150).split(/[?#]/)[0] || '/'
        if (!ruta.startsWith('/')) return listo()
        if (ruta.length > 1) ruta = ruta.replace(/\/+$/, '')

        // Las páginas internas no se cuentan: no son tráfico del sitio.
        if (/^\/(api|_next|probar-ali|dev)(\/|$)/.test(ruta)) return listo()

        const referrer = texto(body.ref, 300)
        const { origen, fuente } = origenDe({
            utm_source: texto(body.utm_source, 80),
            utm_medium: texto(body.utm_medium, 80),
            referrer,
            clicGoogle: body.clicGoogle === true,
            clicMeta: body.clicMeta === true,
        })

        let hostRef = ''
        try {
            hostRef = referrer ? new URL(referrer).hostname : ''
        } catch {
            // Referrer roto: se trata como sin referrer.
        }
        // Una recarga o un enlace interno que no pasó por el router no es una entrada nueva.
        const entrada = body.entrada === true && !(hostRef && esDelSitio(hostRef))

        await registrarVisita({
            fecha: fechaChile(),
            ruta,
            origen: hostRef && esDelSitio(hostRef) && !body.utm_source ? 'Navegación interna' : origen,
            fuente,
            medio: texto(body.utm_medium, 40).toLowerCase(),
            campana: texto(body.utm_campaign, 100),
            dispositivo: dispositivoDe(ua),
            entrada,
        })
        return listo()
    } catch (error) {
        console.error('[panel] No se pudo contar la visita:', error)
        return listo()
    }
}
