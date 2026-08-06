import { createHmac, randomBytes, timingSafeEqual } from 'crypto'

/**
 * Chat en vivo del sitio público.
 *
 * La conversación no se guarda acá: vive en el CRM, que es donde los asesores
 * la leen y responden (bandeja web y CRM móvil comparten la misma base). Este
 * módulo sólo hace de puente de servidor a servidor y firma la sesión del
 * visitante para que nadie pueda leer una conversación ajena.
 */

const CRM_BASE_URL = (process.env.CRM_BASE_URL || 'https://crm.aliminlomasdelmar.com').replace(/\/$/, '')
const WEB_CHAT_API_KEY = process.env.WEB_CHAT_API_KEY
const CHAT_SESSION_SECRET = process.env.CHAT_SESSION_SECRET
const TIMEOUT_MS = 8000

export const CHAT_COOKIE = 'alimin_chat'
export const CHAT_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 días

export interface ChatSession {
    sessionId: string
    conversationId: string
}

export class ChatConfigError extends Error {}
export class ChatUpstreamError extends Error {
    constructor(message: string, readonly status: number) {
        super(message)
    }
}

function requireConfig() {
    if (!WEB_CHAT_API_KEY) throw new ChatConfigError('Falta WEB_CHAT_API_KEY')
    if (!CHAT_SESSION_SECRET) throw new ChatConfigError('Falta CHAT_SESSION_SECRET')
}

/* ── Sesión firmada ──────────────────────────────────────────────── */

export function nuevoSessionId() {
    return randomBytes(24).toString('base64url')
}

function firmar(payload: string) {
    return createHmac('sha256', CHAT_SESSION_SECRET as string)
        .update(payload)
        .digest('base64url')
}

/** Serializa la sesión en un valor de cookie firmado. */
export function sellarSesion(session: ChatSession) {
    requireConfig()
    const payload = `${session.sessionId}.${session.conversationId}`
    return `${payload}.${firmar(payload)}`
}

/**
 * Verifica y abre el valor de la cookie. Devuelve null si viene manipulada,
 * incompleta o firmada con otro secreto.
 */
export function abrirSesion(valor: string | undefined): ChatSession | null {
    if (!valor || !CHAT_SESSION_SECRET) return null

    const partes = valor.split('.')
    if (partes.length !== 3) return null

    const [sessionId, conversationId, firma] = partes
    if (!sessionId || !conversationId || !firma) return null

    const esperada = firmar(`${sessionId}.${conversationId}`)
    const a = Buffer.from(firma)
    const b = Buffer.from(esperada)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null

    return { sessionId, conversationId }
}

/* ── Puente hacia el CRM ─────────────────────────────────────────── */

async function llamarCrm(path: string, init: RequestInit) {
    requireConfig()

    let respuesta: Response
    try {
        respuesta = await fetch(`${CRM_BASE_URL}${path}`, {
            ...init,
            headers: {
                'Content-Type': 'application/json',
                'x-crm-api-key': WEB_CHAT_API_KEY as string,
                ...(init.headers || {}),
            },
            signal: AbortSignal.timeout(TIMEOUT_MS),
            cache: 'no-store',
        })
    } catch (error) {
        console.error('[chat] El CRM no respondió:', error)
        throw new ChatUpstreamError('El CRM no respondió', 503)
    }

    const datos = await respuesta.json().catch(() => ({}))

    if (!respuesta.ok) {
        console.error('[chat] Error del CRM:', respuesta.status, datos)
        // Al visitante nunca se le devuelve el detalle interno del CRM.
        throw new ChatUpstreamError(
            respuesta.status === 429 ? 'Demasiados mensajes seguidos' : 'No se pudo procesar',
            respuesta.status === 429 ? 429 : 502
        )
    }

    return datos
}

export async function abrirConversacion(datos: {
    sessionId: string
    name: string
    phone: string
    email: string
    utm_source?: string | null
    utm_medium?: string | null
    utm_campaign?: string | null
    utm_content?: string | null
    utm_term?: string | null
}): Promise<{ conversationId: string; reanudada: boolean }> {
    return llamarCrm('/api/public/web-chat/start', {
        method: 'POST',
        body: JSON.stringify(datos),
    })
}

export async function enviarMensaje(session: ChatSession, text: string) {
    return llamarCrm('/api/public/web-chat/message', {
        method: 'POST',
        body: JSON.stringify({ ...session, text }),
    })
}

export async function leerMensajes(session: ChatSession, since?: string | null) {
    const params = new URLSearchParams({
        conversationId: session.conversationId,
        sessionId: session.sessionId,
    })
    if (since) params.set('since', since)

    return llamarCrm(`/api/public/web-chat/messages?${params.toString()}`, { method: 'GET' })
}
