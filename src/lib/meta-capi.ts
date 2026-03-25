import crypto from 'crypto';

/**
 * Meta Conversions API (CAPI) Utility
 * 
 * Documentation: https://developers.facebook.com/docs/marketing-api/conversions-api
 */

export interface MetaUserData {
    em?: string; // email
    ph?: string; // phone
    fn?: string; // first name
    ln?: string; // last name
    ct?: string; // city
    st?: string; // state
    cy?: string; // country
    zp?: string; // zip
    sex?: string; // gender (f or m)
    external_id?: string;
    client_ip_address?: string;
    client_user_agent?: string;
    fbp?: string;
    fbc?: string;
}

export interface MetaCustomData {
    value?: number;
    currency?: string;
    content_name?: string;
    content_category?: string;
    content_ids?: string[];
    content_type?: string;
    contents?: any[];
    [key: string]: any;
}

/**
 * Hashes data using SHA256 according to Meta's requirements.
 */
function hash(data: string | undefined): string | null {
    if (!data || data.trim() === '') return null;
    const normalized = data.trim().toLowerCase();
    return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Sends an event to Meta Conversions API.
 */
export async function sendMetaEvent(
    eventName: string,
    userData: MetaUserData,
    customData: MetaCustomData = {},
    eventSourceUrl: string,
    eventId?: string
) {
    const pixelId = process.env.META_PIXEL_ID;
    const accessToken = process.env.META_ACCESS_TOKEN;
    const testCode = process.env.META_TEST_EVENT_CODE;

    if (!pixelId || !accessToken) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('Meta CAPI: Missing META_PIXEL_ID or META_ACCESS_TOKEN');
        }
        return null;
    }

    // Prepare User Data (Hashing sensitive fields)
    const normalizedUserData = {
        em: hash(userData.em),
        ph: hash(userData.ph),
        fn: hash(userData.fn),
        ln: hash(userData.ln),
        ct: hash(userData.ct),
        st: hash(userData.st),
        cy: hash(userData.cy),
        zp: hash(userData.zp),
        sex: hash(userData.sex),
        external_id: hash(userData.external_id), 
        // DO NOT HASH THESE (As per Meta docs and user instructions)
        client_ip_address: userData.client_ip_address,
        client_user_agent: userData.client_user_agent,
        fbp: userData.fbp,
        fbc: userData.fbc,
    };

    // Remove null values from user data
    const cleanUserData = Object.fromEntries(
        Object.entries(normalizedUserData).filter(([_, v]) => v != null)
    );

    const payload = {
        data: [
            {
                event_name: eventName,
                event_time: Math.floor(Date.now() / 1000),
                action_source: 'website',
                event_source_url: eventSourceUrl,
                event_id: eventId,
                user_data: cleanUserData,
                custom_data: {
                    ...customData,
                },
            },
        ],
        test_event_code: testCode,
    };

    try {
        const response = await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...payload,
                access_token: accessToken,
            }),
        });

        const result = await response.json();
        
        if (!response.ok) {
            console.error('Meta CAPI Error Response:', JSON.stringify(result, null, 2));
        }

        return result;
    } catch (error) {
        console.error('Meta CAPI Network Error:', error);
        return null;
    }
}
