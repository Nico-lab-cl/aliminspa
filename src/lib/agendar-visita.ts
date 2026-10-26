import type { NextRequest } from 'next/server'
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
import { isSlotFree } from '@/lib/availability'
import { aceptoMarketing, columnasConsentimiento, ipDe } from '@/lib/consent-server'

/**
 * Agenda una visita: valida el bloque, la guarda en `bookings`, crea el evento
 * en el Google Calendar del equipo y manda el evento Schedule a Meta.
 *
 * La usan el formulario de /agendar-visita (vía /api/bookings) y Ali en el chat,
 * así una visita agendada por cualquiera de los dos camina igual: el CRM la
 * levanta de la misma tabla y le avisa al asesor.
 */

export interface DatosVisita {
    nombre: string
    email: string
    celular: string
    proyecto: string
    /** Instante de la visita en ISO; se guarda tal cual en bookings.fecha. */
    fecha: string
    /** Día de calendario en Chile, "YYYY-MM-DD". Si falta se deduce de `fecha`. */
    fechaLocal?: string | null
    hora: string
    lote?: string | null
    modalidad?: string | null
}

export type ResultadoVisita =
    | {
          ok: true
          id: string
          meetLink: string | null | undefined
          calendarEventId: string | null | undefined
      }
    | { ok: false; status: number; error: string }

export async function agendarVisita(
    datos: DatosVisita,
    request: NextRequest,
    opciones: {
        /** Cuerpo con los campos de consentimiento (ver consent-server). */
        consentimiento?: Record<string, unknown>
        /** ID compartido con el evento del navegador, para que Meta descarte el duplicado. */
        eventId?: string
    } = {}
): Promise<ResultadoVisita> {
    const { nombre, email, celular, proyecto, fecha, fechaLocal, hora, lote, modalidad } = datos

    // La brecha mínima de anticipación se valida también acá: el calendario
    // ya bloquea las horas, pero una pestaña abierta hace rato o un POST
    // directo podrían llegar con una hora imposible para el asesor.
    const calendarDate = parseCalendarDate(fechaLocal || fecha)
    const horaNormalizada = normalizeHora(hora)

    if (!calendarDate || !horaNormalizada) {
        return { ok: false, status: 400, error: 'Fecha u hora inválida' }
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

        return { ok: false, status: 400, error }
    }

    // El calendario del front pudo quedar abierto varios minutos: se
    // vuelve a preguntar si el bloque sigue libre antes de tomarlo.
    if (!(await isSlotFree(calendarDate, horaNormalizada))) {
        return { ok: false, status: 409, error: 'Justo tomaron ese horario. Elige otro bloque en el calendario.' }
    }

    // Save booking to database
    const bookingData = {
        nombre,
        email,
        celular,
        proyecto,
        fecha: new Date(fecha),
        hora,
        lote: typeof lote === 'string' && lote.trim() ? lote.trim() : null,
        modalidad: typeof modalidad === 'string' && modalidad.trim() ? modalidad.trim() : null,
        status: 'confirmed',
    }

    // Las columnas de consentimiento (Ley 21.719, octubre 2026) se agregan
    // con ALTER TABLE a mano: si el deploy llega antes, se guarda la visita
    // igual sin ellas en vez de perderla.
    let booking
    try {
        booking = await prisma.booking.create({
            data: { ...bookingData, ...columnasConsentimiento(opciones.consentimiento || {}, request) },
        })
    } catch (e) {
        console.error('Fallo el insert con consentimiento, reintentando sin esas columnas:', e)
        booking = await prisma.booking.create({ data: bookingData })
    }

    // Create Google Calendar event with Google Meet
    const calendarResult = await createCalendarEvent({
        nombre,
        email,
        celular,
        proyecto,
        fecha,
        hora,
        lote: booking.lote,
        modalidad: booking.modalidad,
    })

    // Send Meta event for tracking, solo con cookies de marketing aceptadas
    // (ver /api/leads).
    const client_ip_address = ipDe(request)
    const client_user_agent = request.headers.get('user-agent') || ''
    const eventSourceUrl = request.headers.get('referer') || 'https://aliminspa.cl'

    if (aceptoMarketing(request)) {
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
                    ...(booking.lote ? { content_ids: [booking.lote] } : {}),
                },
                eventSourceUrl,
                // Mismo ID que el evento del navegador: Meta descarta la copia repetida
                opciones.eventId
            )
        } catch (err) {
            console.error('Error sending Meta Schedule event:', err)
        }
    }

    return {
        ok: true,
        id: booking.id,
        meetLink: calendarResult.meetLink,
        calendarEventId: calendarResult.eventId,
    }
}
