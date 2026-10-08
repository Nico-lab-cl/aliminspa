import { SITE } from '@/lib/constants'
import { marketingCargado } from '@/components/consent/trackers'

/**
 * Client-side tracking utility for Meta Conversions API.
 * Calls the /api/track endpoint to trigger server-to-server events.
 */

/**
 * Reads UTM parameters from the current URL on the client.
 * Used instead of next/navigation's useSearchParams(), which forces the whole
 * page into a Suspense fallback and prevents server-side rendering of content
 * (bad for SEO — crawlers see an empty page). Call this at submit time.
 */
export const getUtmParams = (defaults: Record<string, string> = {}) => {
    const empty = {
        utm_source: defaults.utm_source || null,
        utm_medium: defaults.utm_medium || null,
        utm_campaign: defaults.utm_campaign || null,
        utm_content: (defaults.utm_content as string) || null,
        utm_term: (defaults.utm_term as string) || null,
    }
    if (typeof window === 'undefined') return empty
    const p = new URLSearchParams(window.location.search)
    return {
        utm_source: p.get('utm_source') || empty.utm_source,
        utm_medium: p.get('utm_medium') || empty.utm_medium,
        utm_campaign: p.get('utm_campaign') || empty.utm_campaign,
        utm_content: p.get('utm_content') || empty.utm_content,
        utm_term: p.get('utm_term') || empty.utm_term,
    }
}

/**
 * Generates a unique ID for a single conversion, shared between the browser
 * Pixel (`fbq(..., { eventID })`) and the server CAPI call. Meta uses it to
 * collapse both copies into one event — without it every conversion is
 * counted once per emitter.
 */
export const newEventId = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID()
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

/** Celular chileno en formato E.164 (+569XXXXXXXX), que es lo que piden las conversiones avanzadas. */
const telefonoE164 = (telefono?: string | null): string | undefined => {
    const d = (telefono || '').replace(/\D/g, '')
    if (/^569\d{8}$/.test(d)) return `+${d}`
    if (/^9\d{8}$/.test(d)) return `+56${d}`
    return undefined
}

/**
 * Conversión "Enviar formulario de clientes potenciales" de Google Ads.
 * Se llama cuando el lead ya quedó guardado, igual que el Lead de Meta.
 *
 * - Solo sale si el visitante aceptó marketing (Ley 21.719); si no, no hace nada.
 * - `eventId` va como transaction_id: si la misma persona reenvía el formulario,
 *   Google no la cuenta dos veces.
 * - Email y teléfono alimentan las conversiones avanzadas; gtag los convierte a
 *   hash SHA-256 antes de enviarlos.
 */
export const trackGoogleAdsLead = (
    eventId?: string,
    user: { email?: string | null; telefono?: string | null } = {}
) => {
    if (typeof window === 'undefined' || !marketingCargado()) return
    const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag
    if (!gtag) return

    const email = user.email?.trim().toLowerCase() || undefined
    const phone_number = telefonoE164(user.telefono)
    if (email || phone_number) gtag('set', 'user_data', { email, phone_number })

    gtag('event', 'conversion', {
        send_to: `${SITE.googleAdsId}/${SITE.googleAdsLeadLabel}`,
        ...(eventId ? { transaction_id: eventId } : {}),
    })
}

export const trackMetaEvent = async (
    eventName: string,
    userData: any = {},
    customData: any = {},
    eventId?: string
) => {
    if (typeof window === 'undefined') return;

    // Helper to get cookies for Meta Pixel deduplication (fbp/fbc)
    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return undefined;
    };

    const fbp = getCookie('_fbp');
    const fbc = getCookie('_fbc');

    try {
        const response = await fetch('/api/track', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                eventName,
                userData: {
                    ...userData,
                    fbp,
                    fbc,
                },
                customData: {
                    ...customData,
                    client_source: 'next_client_wrapper',
                },
                eventId,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.warn(`Meta CAPI [${eventName}] error:`, error);
        }
    } catch (error) {
        console.error(`Meta CAPI [${eventName}] network error:`, error);
    }
};
