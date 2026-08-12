/**
 * Outbound webhook to push new leads to the CRM in real time,
 * instead of relying solely on the CRM's own polling sync.
 */

const CRM_WEBHOOK_URL = process.env.CRM_WEBHOOK_URL || 'https://crm.aliminlomasdelmar.com/api/leads'
const CRM_API_KEY = process.env.CRM_API_KEY
const CRM_WEBHOOK_TIMEOUT_MS = 5000

interface CrmLeadPayload {
    firstName: string
    lastName: string
    phone: string
    email: string
    city: string
    interests?: string | null
    source: string
    utm_source?: string | null
    utm_medium?: string | null
    utm_campaign?: string | null
    utm_content?: string | null
    utm_term?: string | null
}

interface CrmNewsletterPayload {
    email: string
    source: 'Newsletter'
}

async function postToCrm(payload: CrmLeadPayload | CrmNewsletterPayload) {
    if (!CRM_API_KEY) {
        console.error('CRM webhook skipped: missing CRM_API_KEY environment variable.')
        return
    }

    try {
        const response = await fetch(CRM_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-crm-api-key': CRM_API_KEY,
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(CRM_WEBHOOK_TIMEOUT_MS),
        })

        if (!response.ok) {
            const text = await response.text().catch(() => '')
            console.error('CRM webhook error response:', response.status, text)
        }
    } catch (error) {
        console.error('CRM webhook network/timeout error:', error)
    }
}

/** Best-effort push of a `leads` row to the CRM. Never throws. */
export function forwardLeadToCrm(data: {
    nombre: string
    email: string
    celular: string
    ciudad: string
    proyecto?: string | null
    utm_source?: string | null
    utm_medium?: string | null
    utm_campaign?: string | null
    utm_content?: string | null
    utm_term?: string | null
}) {
    // El CRM concatena firstName + lastName para mostrar el nombre completo, así
    // que sin lastName la ficha del asesor termina en un "null" pegado al nombre.
    const partesNombre = data.nombre.trim().split(/\s+/)

    return postToCrm({
        firstName: partesNombre[0] || data.nombre,
        lastName: partesNombre.slice(1).join(' '),
        phone: data.celular,
        email: data.email,
        city: data.ciudad,
        interests: data.proyecto || null,
        source: 'web aliminspa.cl',
        utm_source: data.utm_source || null,
        utm_medium: data.utm_medium || null,
        utm_campaign: data.utm_campaign || null,
        utm_content: data.utm_content || null,
        utm_term: data.utm_term || null,
    })
}

/** Best-effort push of a `newsletter_subscribers` row to the CRM. Never throws. */
export function forwardNewsletterSubscriberToCrm(data: { email: string }) {
    return postToCrm({
        email: data.email,
        source: 'Newsletter',
    })
}
