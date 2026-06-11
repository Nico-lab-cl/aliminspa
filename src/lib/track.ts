/**
 * Client-side tracking utility for Meta Conversions API.
 * Calls the /api/track endpoint to trigger server-to-server events.
 */

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
