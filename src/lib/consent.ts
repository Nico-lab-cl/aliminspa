/**
 * Consentimiento de la Ley 21.719 (vigente desde el 1 de diciembre de 2026).
 *
 * Dos consentimientos distintos viven acá:
 *
 * - Cookies: qué scripts de terceros puede cargar el navegador. Se guarda en
 *   la cookie `alimin_consent` para que el servidor también la lea (la API de
 *   Conversiones de Meta solo se llama si el visitante aceptó marketing).
 * - Formularios: si la persona aceptó la política y que la contacten, y si
 *   quiere recibir publicidad. Viaja en el body y queda en la base de datos
 *   como prueba (la carga de probar el consentimiento es de la empresa).
 *
 * Este archivo no usa APIs del navegador ni de Next, así que sirve en los dos lados.
 */

/** Fecha de la versión vigente de /politica-de-privacidad. Cambiarla al editar la política. */
export const POLITICA_VERSION = '2026-10-03'

export const CONSENT_COOKIE = 'alimin_consent'

/** Sube si cambian las categorías: obliga a volver a preguntar a todos. */
const CONSENT_COOKIE_VERSION = '1'

/** Seis meses, para no preguntar en cada visita ni dar el sí por eterno. */
export const CONSENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 182

export interface CookieConsent {
    analitica: boolean
    marketing: boolean
}

/** Formato `1.10`: versión, punto, analítica y marketing como 1/0. */
export function serializarConsentimiento(c: CookieConsent): string {
    return `${CONSENT_COOKIE_VERSION}.${c.analitica ? 1 : 0}${c.marketing ? 1 : 0}`
}

/** Devuelve null si no hay decisión o si es de una versión anterior. */
export function parsearConsentimiento(raw: string | undefined | null): CookieConsent | null {
    if (!raw) return null
    const [version, flags] = decodeURIComponent(raw).split('.')
    if (version !== CONSENT_COOKIE_VERSION || !flags || flags.length !== 2) return null
    return { analitica: flags[0] === '1', marketing: flags[1] === '1' }
}

/** Lo que cada formulario manda a /api/leads, /api/bookings y /api/newsletter. */
export interface ConsentimientoFormulario {
    consentimiento_contacto: boolean
    consentimiento_marketing: boolean
    politica_version: string
    consentimiento_origen?: string
}
