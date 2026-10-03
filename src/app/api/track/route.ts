import { NextRequest, NextResponse } from 'next/server'
import { sendMetaEvent } from '@/lib/meta-capi'
import { aceptoMarketing, ipDe } from '@/lib/consent-server'
import { dentroDelLimite } from '@/lib/rate-limit'

/** Solo el propio sitio puede pedir que se mande un evento a Meta. */
function vieneDelSitio(request: NextRequest): boolean {
    const origen = request.headers.get('origin') || request.headers.get('referer')
    if (!origen) return false
    try {
        const host = new URL(origen).hostname
        return host === 'aliminspa.cl' || host.endsWith('.aliminspa.cl') || host === 'localhost' || host === '127.0.0.1'
    } catch {
        return false
    }
}

/**
 * API route to handle tracking events from the client side using Meta CAPI.
 * This ensures CAPI follows the same user data as the browser PIXEL.
 *
 * Ley 21.719: no manda nada si el visitante no aceptó cookies de marketing,
 * y solo atiende pedidos del propio sitio y con un tope por IP (antes
 * cualquiera podía mandar eventos con datos a Meta a nombre de Alimin).
 */
export async function POST(request: NextRequest) {
    try {
        if (!vieneDelSitio(request)) {
            return NextResponse.json({ error: 'Origen no permitido' }, { status: 403 })
        }
        if (!dentroDelLimite(`track:${ipDe(request)}`, 60, 60 * 1000)) {
            return NextResponse.json({ error: 'Demasiados eventos' }, { status: 429 })
        }
        if (!aceptoMarketing(request)) {
            // 200 y no error: el navegador no tiene nada que corregir.
            return NextResponse.json({ success: true, skipped: 'sin consentimiento de marketing' })
        }

        const body = await request.json()
        const { eventName, userData, customData, eventId } = body

        if (!eventName) {
            return NextResponse.json({ error: 'Event name is required' }, { status: 400 })
        }

        const client_ip_address = ipDe(request)
        const client_user_agent = request.headers.get('user-agent') || ''
        const eventSourceUrl = request.headers.get('referer') || 'https://aliminspa.cl'

        // Prepare extended user data
        const extendedUserData = {
            ...userData,
            client_ip_address,
            client_user_agent,
        }

        // Send to Meta CAPI
        const result = await sendMetaEvent(
            eventName,
            extendedUserData,
            customData,
            eventSourceUrl,
            eventId
        )

        return NextResponse.json({ success: true, result })
    } catch (error) {
        console.error('Error in /api/track:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
