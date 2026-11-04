/**
 * Outbound webhook to push new leads to the CRM in real time,
 * instead of relying solely on the CRM's own polling sync.
 */

const CRM_WEBHOOK_URL = process.env.CRM_WEBHOOK_URL || 'https://crm.aliminlomasdelmar.com/api/leads'
const CRM_API_KEY = process.env.CRM_API_KEY
const CRM_WEBHOOK_TIMEOUT_MS = 5000
/** CRM web (marketing): secuencias de correo, lead score y actividad web. */
const CRM_WEB_URL = (process.env.CRM_WEB_URL || 'https://marketing.aliminspa.cl').replace(/\/+$/, '')

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
    como_conocio?: string | null
}

interface CrmNewsletterPayload {
    email: string
    source: 'Newsletter'
}

/** Devuelve el lead que guardó el CRM (con su `id`), o null si falló. */
async function postToCrm(payload: CrmLeadPayload | CrmNewsletterPayload): Promise<{ id?: string } | null> {
    if (!CRM_API_KEY) {
        console.error('CRM webhook skipped: missing CRM_API_KEY environment variable.')
        return null
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
            return null
        }
        return await response.json().catch(() => null)
    } catch (error) {
        console.error('CRM webhook network/timeout error:', error)
        return null
    }
}

/**
 * Deja una actividad en el CRM web (la misma tabla que llena crm-tracker.js),
 * desde el servidor. Sirve para lo que no puede depender del rastreador del
 * navegador, que solo carga con cookies de marketing: la descarga de un ebook
 * es la que dispara su secuencia de correos. Nunca lanza.
 */
export async function registrarActividadCrmWeb(actividad: {
    leadId: string
    tipo: string
    pagina?: string | null
    detalles?: Record<string, unknown>
}) {
    try {
        const res = await fetch(`${CRM_WEB_URL}/api/track/activity`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lead_id: actividad.leadId,
                event_type: actividad.tipo,
                page_url: actividad.pagina || '',
                details: actividad.detalles || {},
            }),
            signal: AbortSignal.timeout(CRM_WEBHOOK_TIMEOUT_MS),
        })
        if (!res.ok) console.error('CRM web activity error:', res.status, await res.text().catch(() => ''))
    } catch (error) {
        console.error('CRM web activity network/timeout error:', error)
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
    como_conocio?: string | null
    /**
     * Origen en el CRM. "Ebook" entra sin asesor y sin avisos (lo decide el CRM
     * móvil); por defecto, "web aliminspa.cl", que va a la rueda.
     */
    origen?: 'web aliminspa.cl' | 'Ebook'
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
        source: data.origen || 'web aliminspa.cl',
        utm_source: data.utm_source || null,
        utm_medium: data.utm_medium || null,
        utm_campaign: data.utm_campaign || null,
        utm_content: data.utm_content || null,
        utm_term: data.utm_term || null,
        // "¿Cómo nos conociste?": el CRM lo muestra en el aviso de lead nuevo
        // al grupo de WhatsApp del equipo.
        como_conocio: data.como_conocio || null,
    })
}

/** Best-effort push of a `newsletter_subscribers` row to the CRM. Never throws. */
export function forwardNewsletterSubscriberToCrm(data: { email: string }) {
    return postToCrm({
        email: data.email,
        source: 'Newsletter',
    })
}
