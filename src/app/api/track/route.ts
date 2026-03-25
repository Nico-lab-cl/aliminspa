import { NextRequest, NextResponse } from 'next/server'
import { sendMetaEvent } from '@/lib/meta-capi'

/**
 * API route to handle tracking events from the client side using Meta CAPI.
 * This ensures CAPI follows the same user data as the browser PIXEL.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { eventName, userData, customData, eventId } = body

        if (!eventName) {
            return NextResponse.json({ error: 'Event name is required' }, { status: 400 })
        }

        const client_ip_address = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'
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
