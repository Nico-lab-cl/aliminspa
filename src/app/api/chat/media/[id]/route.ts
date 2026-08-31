import { NextRequest, NextResponse } from 'next/server'
import {
    CHAT_COOKIE,
    ChatConfigError,
    ChatUpstreamError,
    abrirSesion,
    leerAdjunto,
} from '@/lib/web-chat'

export const dynamic = 'force-dynamic'

/**
 * Sirve al visitante un adjunto de su propia conversación.
 *
 * El navegador del visitante nunca habla con el CRM: pide el archivo acá y este
 * servidor lo trae con la API key. La comprobación de que el adjunto es
 * realmente de su conversación la hace el CRM, cruzando el sessionId de la
 * cookie firmada; acá no se puede falsificar porque la sesión no viene de la
 * URL sino de la cookie.
 */
export async function GET(
    request: NextRequest,
    // En Next 15 en adelante los parámetros de ruta llegan como promesa.
    { params }: { params: Promise<{ id: string }> }
) {
    const sesion = abrirSesion(request.cookies.get(CHAT_COOKIE)?.value)
    if (!sesion) {
        return NextResponse.json({ error: 'Sesión de chat expirada' }, { status: 409 })
    }

    try {
        const { id } = await params
        const { contenido, mimeType } = await leerAdjunto(sesion, id)

        return new NextResponse(contenido, {
            status: 200,
            headers: {
                'Content-Type': mimeType,
                'Content-Length': String(contenido.byteLength),
                // El adjunto no cambia nunca, pero es contenido de una
                // conversación privada: se cachea en el navegador del visitante
                // y en ninguna caché compartida.
                'Cache-Control': 'private, max-age=31536000, immutable',
                'X-Content-Type-Options': 'nosniff',
            },
        })
    } catch (error) {
        if (error instanceof ChatConfigError) {
            return NextResponse.json({ error: 'Chat no disponible' }, { status: 503 })
        }
        if (error instanceof ChatUpstreamError) {
            return NextResponse.json({ error: error.message }, { status: error.status })
        }

        console.error('[chat] Error entregando adjunto:', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}
