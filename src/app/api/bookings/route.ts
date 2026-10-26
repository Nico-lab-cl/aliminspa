import { NextRequest, NextResponse } from 'next/server'
import { agendarVisita } from '@/lib/agendar-visita'
import { ipDe } from '@/lib/consent-server'
import { dentroDelLimite } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
    try {
        if (!dentroDelLimite(`bookings:${ipDe(request)}`, 10, 10 * 60 * 1000)) {
            return NextResponse.json({ error: 'Demasiados intentos. Intenta en unos minutos.' }, { status: 429 })
        }

        let body
        try {
            body = await request.json()
        } catch (e) {
            console.error('Error parsing request body:', e)
            return NextResponse.json({ error: 'Payload JSON inválido' }, { status: 400 })
        }

        const { nombre, email, celular, proyecto, fecha, fechaLocal, hora, eventId, lote, modalidad } = body

        if (!nombre || !email || !celular || !proyecto || !fecha || !hora) {
            return NextResponse.json(
                { error: 'Todos los campos son obligatorios' },
                { status: 400 }
            )
        }

        const resultado = await agendarVisita(
            { nombre, email, celular, proyecto, fecha, fechaLocal, hora, lote, modalidad },
            request,
            { consentimiento: body, eventId }
        )

        if (!resultado.ok) {
            return NextResponse.json({ error: resultado.error }, { status: resultado.status })
        }

        return NextResponse.json({
            success: true,
            id: resultado.id,
            meetLink: resultado.meetLink,
            calendarEventId: resultado.calendarEventId,
        }, { status: 201 })
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
