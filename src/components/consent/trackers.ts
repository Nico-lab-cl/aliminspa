import { SITE } from '@/lib/constants'
import type { CookieConsent } from '@/lib/consent'

/**
 * Carga de los scripts de terceros, según lo que aceptó el visitante.
 *
 * - Analítica: Google Analytics 4, Google Tag Manager y Microsoft Clarity.
 * - Marketing: Meta Pixel, la etiqueta de Google Ads y el rastreador del CRM
 *   (public/crm-tracker.js).
 *
 * Antes se cargaban todos en el <head> apenas entraba alguien. La Ley 21.719
 * exige consentimiento previo, específico e informado para medir y perfilar,
 * así que ahora no se inyecta nada hasta que el visitante decide.
 */

const GA_ID = 'G-XRX761CCKM'

type W = Window & {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    fbq?: ((...args: unknown[]) => void) & { callMethod?: unknown; queue?: unknown[]; loaded?: boolean }
    _fbq?: unknown
    clarity?: ((...args: unknown[]) => void) & { q?: unknown[] }
}

const cargados = { analitica: false, marketing: false }
let gtagListo = false

function inyectar(src: string, id: string) {
    if (document.getElementById(id)) return
    const s = document.createElement('script')
    s.id = id
    s.async = true
    s.src = src
    document.head.appendChild(s)
}

/** Modo de consentimiento de Google: GTM y GA respetan lo que se marcó. */
function gtagConsent(modo: 'default' | 'update', c: CookieConsent) {
    const w = window as W
    w.dataLayer = w.dataLayer || []
    w.gtag = w.gtag || function gtag() {
        // gtag necesita el objeto arguments tal cual, no un array.
        // eslint-disable-next-line prefer-rest-params
        w.dataLayer!.push(arguments)
    }
    w.gtag('consent', modo, {
        analytics_storage: c.analitica ? 'granted' : 'denied',
        ad_storage: c.marketing ? 'granted' : 'denied',
        ad_user_data: c.marketing ? 'granted' : 'denied',
        ad_personalization: c.marketing ? 'granted' : 'denied',
    })
}

/**
 * GA4 y Google Ads comparten gtag: el consentimiento por defecto y el 'js' van
 * una sola vez, aunque se acepte primero una categoría y después la otra.
 */
function prepararGtag(c: CookieConsent) {
    if (gtagListo) return
    gtagListo = true
    gtagConsent('default', c)
    ;(window as W).gtag!('js', new Date())
}

function cargarAnalitica(c: CookieConsent) {
    if (cargados.analitica) return
    cargados.analitica = true
    const w = window as W

    prepararGtag(c)
    w.gtag!('config', GA_ID)
    inyectar(`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`, 'ga4')

    w.dataLayer!.push({ 'gtm.start': Date.now(), event: 'gtm.js' })
    inyectar(`https://www.googletagmanager.com/gtm.js?id=${SITE.gtmId}`, 'gtm')

    w.clarity = w.clarity || Object.assign(
        function clarity(...args: unknown[]) {
            ;(w.clarity!.q = w.clarity!.q || []).push(args)
        },
        { q: [] as unknown[] }
    )
    inyectar(`https://www.clarity.ms/tag/${SITE.clarityId}`, 'ms-clarity')
}

function cargarMarketing(c: CookieConsent) {
    if (cargados.marketing) return
    cargados.marketing = true
    const w = window as W

    // Google Ads: mide los leads de la campaña de Búsqueda (ver trackGoogleAdsLead).
    prepararGtag(c)
    w.gtag!('config', SITE.googleAdsId, { allow_enhanced_conversions: true })
    inyectar(`https://www.googletagmanager.com/gtag/js?id=${SITE.googleAdsId}`, 'google-ads')

    // Snippet oficial del Pixel, sin el <script> en línea.
    if (!w.fbq) {
        const n = function fbq(...args: unknown[]) {
            if (n.callMethod) (n.callMethod as (...a: unknown[]) => void)(...args)
            else n.queue!.push(args)
        } as NonNullable<W['fbq']>
        n.queue = []
        n.loaded = true
        ;(n as unknown as { version: string }).version = '2.0'
        ;(n as unknown as { push: unknown }).push = n
        w.fbq = n
        if (!w._fbq) w._fbq = n
    }
    inyectar('https://connect.facebook.net/en_US/fbevents.js', 'fb-pixel')
    w.fbq!('init', SITE.pixelId)
    w.fbq!('track', 'PageView')

    inyectar('/crm-tracker.js', 'crm-activity-tracker')
}

/** Carga lo aceptado. Es idempotente: se puede llamar en cada cambio. */
export function aplicarConsentimiento(c: CookieConsent) {
    if (c.analitica) cargarAnalitica(c)
    if (gtagListo) gtagConsent('update', c)
    if (c.marketing) cargarMarketing(c)
}

/** ¿El visitante aceptó marketing en esta página? Sin eso no se mide ninguna conversión de anuncios. */
export function marketingCargado(): boolean {
    return cargados.marketing
}

/** ¿Hay que recargar para sacar algo que ya estaba cargado y ahora se rechazó? */
export function requiereRecarga(c: CookieConsent): boolean {
    return (cargados.analitica && !c.analitica) || (cargados.marketing && !c.marketing)
}

/**
 * Borra lo que dejaron los scripts rechazados. Un script ya cargado no se puede
 * descargar, así que después de esto se recarga la página.
 */
export function limpiarRastros(c: CookieConsent) {
    const borrar = (nombre: string) => {
        const dominios = ['', `; domain=${location.hostname}`, `; domain=.${location.hostname.replace(/^www\./, '')}`]
        for (const d of dominios) document.cookie = `${nombre}=; Max-Age=0; path=/${d}`
    }
    const nombres = document.cookie.split(';').map((p) => p.split('=')[0].trim())

    if (!c.analitica) {
        nombres.filter((n) => /^(_ga|_gid|_gat|_clck|_clsk|CLID|MUID)/.test(n)).forEach(borrar)
    }
    if (!c.marketing) {
        nombres.filter((n) => /^(_fbp|_fbc|fr|_gcl_au|_gcl_aw|_gcl_dc|_gcl_gs)$/.test(n)).forEach(borrar)
        try {
            localStorage.removeItem('crm_lead_id')
            localStorage.removeItem('crm_anonymous_id')
        } catch {
            // Modo privado o almacenamiento bloqueado: no hay nada que borrar.
        }
    }
}
