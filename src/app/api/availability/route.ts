import { NextRequest, NextResponse } from 'next/server'
import { getAvailability } from '@/lib/availability'
import { parseCalendarDate, toCalendarDateInChile } from '@/lib/booking-rules'

/** Ventana máxima que puede pedir el cliente, para no barrer el calendario entero. */
const MAX_DAYS = 60
const DEFAULT_DAYS = 21

/**
 * GET /api/availability?from=YYYY-MM-DD&days=21
 *
 * Devuelve solo los días que tienen al menos un bloque libre, ya cruzados
 * contra el Google Calendar del equipo. El calendario del front pinta como
 * "sin cupo" cualquier día que no venga en la respuesta.
 */
export async function GET(request: NextRequest) {
    const params = request.nextUrl.searchParams
    const fromParam = params.get('from')
    const from = fromParam ? parseCalendarDate(fromParam) : toCalendarDateInChile(new Date())

    if (!from) {
        return NextResponse.json({ error: 'Parámetro "from" inválido' }, { status: 400 })
    }

    const requested = Number(params.get('days'))
    const days = Number.isFinite(requested)
        ? Math.min(Math.max(Math.trunc(requested), 1), MAX_DAYS)
        : DEFAULT_DAYS

    try {
        const availability = await getAvailability(from, days)
        return NextResponse.json(availability, {
            // La ocupación cambia durante el día: un cache largo devolvería
            // horas ya tomadas. Un minuto alcanza para absorber los rebotes
            // de alguien navegando entre meses.
            headers: { 'Cache-Control': 'private, max-age=60' },
        })
    } catch (error) {
        console.error('Error consultando disponibilidad:', error)
        return NextResponse.json(
            { error: 'No pudimos leer la agenda en este momento' },
            { status: 500 }
        )
    }
}
