import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendMetaEvent } from '@/lib/meta-capi'

export async function POST(request: NextRequest) {
    try {
        let body
        try {
            body = await request.json()
        } catch (e) {
            console.error('Error parsing request body:', e)
            return NextResponse.json({ error: 'Payload JSON inválido' }, { status: 400 })
        }

        const { nombre, email, celular, proyecto, fecha, hora } = body

        if (!nombre || !email || !celular || !proyecto || !fecha || !hora) {
            return NextResponse.json(
                { error: 'Todos los campos son obligatorios' },
                { status: 400 }
            )
        }

        // Save booking to database
        const booking = await prisma.booking.create({
            data: {
                nombre,
                email,
                celular,
                proyecto,
                fecha: new Date(fecha),
                hora,
                status: 'confirmed',
            },
        })

        // Send Meta event for tracking
        const client_ip_address = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'
        const client_user_agent = request.headers.get('user-agent') || ''
        const eventSourceUrl = request.headers.get('referer') || 'https://aliminspa.cl'

        sendMetaEvent(
            'Schedule',
            {
                em: email,
                ph: celular,
                fn: nombre,
                external_id: booking.id,
                client_ip_address,
                client_user_agent,
            },
            {
                content_name: proyecto,
                content_category: 'Real Estate Visit',
            },
            eventSourceUrl
        ).catch(err => console.error('Error sending Meta Schedule event:', err))

        return NextResponse.json({ success: true, id: booking.id }, { status: 201 })
    } catch (error: any) {
        console.error('Error creating booking:', {
            message: error.message,
            code: error.code,
            meta: error.meta,
            stack: error.stack,
        })

        return NextResponse.json(
            {
                error: 'Error interno del servidor',
                message: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        )
    }
}
