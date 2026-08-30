import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendMetaEvent } from '@/lib/meta-capi'
import { createCalendarEvent } from '@/lib/google-calendar'
import {
    parseCalendarDate,
    normalizeHora,
    isSlotBookable,
    getBookableSlots,
    getSlotsForDay,
    weekdayOf,
    minLeadLabel,
} from '@/lib/booking-rules'

export async function POST(request: NextRequest) {
    try {
        let body
        try {
            body = await request.json()
        } catch (e) {
            console.error('Error parsing request body:', e)
            return NextResponse.json({ error: 'Payload JSON inválido' }, { status: 400 })
        }

        const { nombre, email, celular, proyecto, fecha, fechaLocal, hora, eventId } = body

        if (!nombre || !email || !celular || !proyecto || !fecha || !hora) {
            return NextResponse.json(
                { error: 'Todos los campos son obligatorios' },
                { status: 400 }
            )
        }

        // La brecha mínima de anticipación se valida también acá: el calendario
        // ya bloquea las horas, pero una pestaña abierta hace rato o un POST
        // directo podrían llegar con una hora imposible para el asesor.
        const calendarDate = parseCalendarDate(fechaLocal || fecha)
        const horaNormalizada = normalizeHora(hora)

        if (!calendarDate || !horaNormalizada) {
            return NextResponse.json(
                { error: 'Fecha u hora inválida' },
                { status: 400 }
            )
        }

        if (!isSlotBookable(calendarDate, horaNormalizada)) {
            const enHorarioDeAtencion = getSlotsForDay(weekdayOf(calendarDate)).includes(horaNormalizada)
            const quedanHorarios = getBookableSlots(calendarDate).length > 0

            let error: string
            if (!enHorarioDeAtencion) {
                error = 'Ese horario está fuera del horario de atención. Elige otro bloque en el calendario.'
            } else if (quedanHorarios) {
                error = `Ese horario ya no está disponible. Las visitas se agendan con al menos ${minLeadLabel()} de anticipación.`
            } else {
                error = `Ese día ya no tiene horarios disponibles. Las visitas se agendan con al menos ${minLeadLabel()} de anticipación.`
            }

            return NextResponse.json({ error }, { status: 400 })
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

        // Create Google Calendar event with Google Meet
        const calendarResult = await createCalendarEvent({
            nombre,
            email,
            celular,
            proyecto,
            fecha,
            hora,
        })

        // Send Meta event for tracking
        const client_ip_address = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'
        const client_user_agent = request.headers.get('user-agent') || ''
        const eventSourceUrl = request.headers.get('referer') || 'https://aliminspa.cl'

        try {
            await sendMetaEvent(
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
                eventSourceUrl,
                // Mismo ID que el evento del navegador: Meta descarta la copia repetida
                eventId
            )
        } catch (err) {
            console.error('Error sending Meta Schedule event:', err)
        }

        return NextResponse.json({
            success: true,
            id: booking.id,
            meetLink: calendarResult.meetLink,
            calendarEventId: calendarResult.eventId,
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
