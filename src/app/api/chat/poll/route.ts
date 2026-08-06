import { NextRequest, NextResponse } from 'next/server'
import {
    CHAT_COOKIE,
    ChatConfigError,
    ChatUpstreamError,
    abrirSesion,
    leerMensajes,
} from '@/lib/web-chat'

export const dynamic = 'force-dynamic'

/**
 * Entrega los mensajes nuevos de la conversación del visitante.
 * El widget la consulta cada pocos segundos mientras el chat está abierto.
 */
export async function GET(request: NextRequest) {
    const sesion = abrirSesion(request.cookies.get(CHAT_COOKIE)?.value)
    if (!sesion) {
        return NextResponse.json({ error: 'Sesión de chat expirada' }, { status: 409 })
    }

    try {
        const { messages } = await leerMensajes(
            sesion,
            request.nextUrl.searchParams.get('since')
        )
        return NextResponse.json({ mensajes: messages || [] })
    } catch (error) {
        if (error instanceof ChatConfigError) {
            return NextResponse.json(
                { error: 'El chat no está disponible en este momento' },
                { status: 503 }
            )
        }
        if (error instanceof ChatUpstreamError) {
            return NextResponse.json({ error: error.message }, { status: error.status })
        }

        console.error('[chat] Error consultando mensajes:', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}
