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
