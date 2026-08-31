import { NextRequest, NextResponse } from 'next/server'
import {
    CHAT_COOKIE,
    ChatConfigError,
    ChatUpstreamError,
    abrirSesion,
    enviarAdjunto,
} from '@/lib/web-chat'

export const dynamic = 'force-dynamic'

/**
 * El visitante manda una foto, un audio o un video por el chat.
 *
 * Es el equivalente de /api/chat/message pero con un archivo. La autorización
 * es la misma y no se relaja por ser un adjunto: la sesión sale de la cookie
 * firmada, nunca de un campo del formulario, para que nadie pueda escribir en
 * la conversación de otro visitante cambiando un valor en el navegador.
 */
export async function POST(request: NextRequest) {
    const sesion = abrirSesion(request.cookies.get(CHAT_COOKIE)?.value)
    if (!sesion) {
        return NextResponse.json({ error: 'Sesión de chat expirada' }, { status: 409 })
    }

    let formulario: FormData
    try {
        formulario = await request.formData()
    } catch {
        return NextResponse.json({ error: 'Envío inválido' }, { status: 400 })
    }

    const archivo = formulario.get('file')
    if (!(archivo instanceof File)) {
        return NextResponse.json({ error: 'No llegó ningún archivo' }, { status: 400 })
    }

    const texto = String(formulario.get('text') || '').trim()
    const duracion = Number(formulario.get('durationMs') || 0)

    try {
        const datos = await enviarAdjunto(sesion, archivo, {
            text: texto || undefined,
            durationMs: Number.isFinite(duracion) && duracion > 0 ? duracion : undefined,
        })

        return NextResponse.json(datos)
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

        console.error('[chat] Error enviando adjunto:', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}
