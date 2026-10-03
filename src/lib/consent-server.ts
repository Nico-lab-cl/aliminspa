import type { NextRequest } from 'next/server'
import { CONSENT_COOKIE, POLITICA_VERSION, parsearConsentimiento } from '@/lib/consent'

/**
 * ¿El visitante aceptó cookies de marketing? Sin eso no se le manda nada a la
 * API de Conversiones de Meta: el Pixel del navegador tampoco se cargó, y
 * mandar el evento solo por el servidor saltaría la decisión del visitante.
 */
export function aceptoMarketing(request: NextRequest): boolean {
    return parsearConsentimiento(request.cookies.get(CONSENT_COOKIE)?.value)?.marketing === true
}

/**
 * Columnas de consentimiento para guardar junto al lead o la reserva.
 *
 * No rechaza el envío si faltan: un formulario viejo en caché durante un deploy
 * no debe perder el lead. Se guarda lo que llegó (null = no informado), que es
 * justamente lo que hay que poder mostrar si la Agencia pregunta.
 */
export function columnasConsentimiento(body: Record<string, unknown>, request: NextRequest) {
    const contacto = typeof body.consentimiento_contacto === 'boolean' ? body.consentimiento_contacto : null
    const marketing = typeof body.consentimiento_marketing === 'boolean' ? body.consentimiento_marketing : null
    const origen =
        (typeof body.consentimiento_origen === 'string' && body.consentimiento_origen.slice(0, 500)) ||
        request.headers.get('referer')?.slice(0, 500) ||
        null

    return {
        consentimiento_contacto: contacto,
        consentimiento_marketing: marketing,
        consentimiento_at: contacto !== null || marketing !== null ? new Date() : null,
        politica_version:
            typeof body.politica_version === 'string' ? body.politica_version.slice(0, 20) : contacto ? POLITICA_VERSION : null,
        consentimiento_origen: origen,
    }
}

/** IP del visitante según el proxy; solo para limitar abusos, no se guarda. */
export function ipDe(request: NextRequest): string {
    return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'desconocida'
}
