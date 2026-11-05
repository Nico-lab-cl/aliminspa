/**
 * Le cuenta al CRM que alguien abrió el brochure que le mandó la respuesta
 * automática de Instagram o Facebook, para que el asesor lo vea en la
 * conversación ("Abrió el brochure de Lomas del Mar").
 *
 * El enlace del mensaje trae `r`, el id de la conversación en el CRM. No es un
 * dato personal: es un identificador opaco que solo el CRM sabe a quién
 * corresponde, y acá no se guarda nada ni se pone ninguna cookie.
 */

const CRM_BASE_URL = (process.env.CRM_BASE_URL || 'https://crm.aliminlomasdelmar.com').replace(/\/$/, '')
// Id completo de la conversación, o sus 8 primeros caracteres (enlace corto /b/…).
const UUID = /^[0-9a-f]{8}(-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})?$/i

/**
 * Meta abre cada enlace que se manda por Messenger o Instagram para armar la
 * vista previa. Esas visitas no son del cliente y no se avisan.
 */
const BOTS = /facebookexternalhit|facebot|meta-externalagent|meta-externalfetcher|instagram|whatsapp|bot|crawler|spider|preview/i

export async function avisarBrochureAbierto(ref: string | undefined, brochure: string, userAgent: string) {
    const clave = process.env.WEB_CHAT_API_KEY
    if (!ref || !UUID.test(ref) || !clave) return
    // Ojo: el navegador interno de Instagram se identifica con "Instagram" en
    // el user agent, igual que su rastreador. Se distinguen porque el
    // rastreador no trae "Mobile"/"Mozilla ... Safari".
    const esNavegador = /Mozilla\/5\.0/.test(userAgent) && /(Mobile|Safari|Chrome|Firefox)/.test(userAgent)
    if (!esNavegador || (BOTS.test(userAgent) && !/FBAN|FBAV|FB_IAB|Instagram \d/.test(userAgent))) return

    try {
        await fetch(`${CRM_BASE_URL}/api/public/social/brochure`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-crm-api-key': clave },
            body: JSON.stringify({ conversationId: ref, brochure }),
            signal: AbortSignal.timeout(4000),
            cache: 'no-store',
        })
    } catch (error) {
        console.error('[brochure] No se pudo avisar al CRM:', error)
    }
}
