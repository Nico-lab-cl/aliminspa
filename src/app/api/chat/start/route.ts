import { NextRequest, NextResponse } from 'next/server'
import {
    CHAT_COOKIE,
    CHAT_COOKIE_MAX_AGE,
    ChatConfigError,
    ChatUpstreamError,
    abrirConversacion,
    nuevoSessionId,
    sellarSesion,
} from '@/lib/web-chat'
import { sendMetaEvent } from '@/lib/meta-capi'

export const dynamic = 'force-dynamic'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/**
 * Abre la conversación del chat en vivo tras la puerta de entrada.
 *
 * El identificador de sesión se genera aquí y viaja en una cookie httpOnly
 * firmada: el navegador nunca lo ve ni puede cambiarlo, así que nadie puede
 * pedir los mensajes de otra persona.
 */
export async function POST(request: NextRequest) {
    let body: any
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const nombre = String(body.nombre || '').trim()
    const telefono = String(body.telefono || '').trim()
    const email = String(body.email || '').trim().toLowerCase()

    if (nombre.length < 2) {
        return NextResponse.json({ error: 'Escribe tu nombre' }, { status: 400 })
    }
    if (telefono.replace(/\D/g, '').length < 8) {
        return NextResponse.json({ error: 'Escribe un teléfono válido' }, { status: 400 })
    }
    if (!EMAIL_RE.test(email)) {
        return NextResponse.json({ error: 'Escribe un correo válido' }, { status: 400 })
    }
    if (body.consentimiento !== true) {
        return NextResponse.json(
            { error: 'Necesitamos tu autorización para contactarte' },
            { status: 400 }
        )
    }

    const sessionId = nuevoSessionId()

    try {
        const { conversationId, reanudada } = await abrirConversacion({
            sessionId,
            name: nombre,
            phone: telefono,
            email,
            utm_source: body.utm_source || null,
            utm_medium: body.utm_medium || null,
            utm_campaign: body.utm_campaign || null,
            utm_content: body.utm_content || null,
            utm_term: body.utm_term || null,
        })

        const respuesta = NextResponse.json({ ok: true, reanudada })

        respuesta.cookies.set(CHAT_COOKIE, sellarSesion({ sessionId, conversationId }), {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: CHAT_COOKIE_MAX_AGE,
        })

        // Se registra como "Contact" y no como "Lead" a propósito: abrir el chat
        // no es lo mismo que un lead de formulario, y mezclarlos deformaría la
        // optimización de las campañas que ya usan el evento Lead.
        try {
            await sendMetaEvent(
                'Contact',
                {
                    em: email,
                    ph: telefono,
                    fn: nombre,
                    client_ip_address:
                        request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1',
                    client_user_agent: request.headers.get('user-agent') || '',
                    fbp: body.fbp,
                    fbc: body.fbc,
                },
                { content_name: 'Chat en vivo', content_category: 'Real Estate' },
                request.headers.get('referer') || 'https://aliminspa.cl',
                body.eventId
            )
        } catch (error) {
            console.error('[chat] No se pudo enviar el evento Contact a Meta:', error)
        }

        return respuesta
    } catch (error) {
        if (error instanceof ChatConfigError) {
            console.error('[chat] Configuración incompleta:', error.message)
            return NextResponse.json(
                { error: 'El chat no está disponible en este momento' },
                { status: 503 }
            )
        }
        if (error instanceof ChatUpstreamError) {
            return NextResponse.json({ error: error.message }, { status: error.status })
        }

        console.error('[chat] Error abriendo la conversación:', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}
