import { NextRequest, NextResponse } from 'next/server'
import {
    CHAT_COOKIE,
    ChatConfigError,
    ChatUpstreamError,
    abrirSesion,
    enviarMensaje,
} from '@/lib/web-chat'
import { aliHabilitada, programarAli } from '@/lib/ali/motor'

export const dynamic = 'force-dynamic'

const MAX_LARGO = 2000

/** Envía al CRM un mensaje escrito por el visitante. */
export async function POST(request: NextRequest) {
    const sesion = abrirSesion(request.cookies.get(CHAT_COOKIE)?.value)
    if (!sesion) {
        // 409: el widget sabe que debe volver a mostrar la puerta de entrada.
        return NextResponse.json({ error: 'Sesión de chat expirada' }, { status: 409 })
    }

    let body: any
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const text = String(body.text || '').trim()
    if (!text) {
        return NextResponse.json({ error: 'Escribe un mensaje' }, { status: 400 })
    }
    if (text.length > MAX_LARGO) {
        return NextResponse.json(
            { error: `El mensaje no puede superar los ${MAX_LARGO} caracteres` },
            { status: 400 }
        )
    }

    try {
        const guardado = await enviarMensaje(sesion, text)

        // Ali responde en segundo plano; el widget ve su respuesta en la
        // siguiente consulta. Si un asesor ya tomó la conversación, Ali lo
        // detecta al leer el contexto y no escribe.
        programarAli(sesion, request)

        return NextResponse.json({
            id: guardado.id,
            createdAt: guardado.createdAt,
            ali: aliHabilitada(),
        })
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

        console.error('[chat] Error enviando el mensaje:', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}
