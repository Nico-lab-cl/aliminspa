/**
 * Disponibilidad real de la agenda.
 *
 * `booking-rules.ts` responde "¿este bloque cabe en el horario de atención y
 * respeta la brecha de 24 horas?". Este módulo agrega la pregunta que faltaba:
 * "¿el asesor tiene libre esa hora?", cruzando los bloques contra el Google
 * Calendar del equipo.
 *
 * Cualquier evento del calendario ocupa la hora. Es la regla que pidió el
 * negocio: si está en la agenda del equipo, no se ofrece.
 */

import { getBusyIntervals } from './google-calendar'
import {
    CalendarDate,
    formatCalendarDate,
    getBookableSlots,
    toChileInstant,
    toCalendarDateInChile,
} from './booking-rules'

/** Duración de un bloque de visita. El calendario ofrece horas en punto. */
export const SLOT_MINUTES = 60

export interface DayAvailability {
    /** "YYYY-MM-DD" */
    date: string
    /** Horas realmente agendables, ej. ["16:00", "18:00"] */
    slots: string[]
}

export interface AvailabilityResult {
    days: DayAvailability[]
    /**
     * false cuando no se pudo leer el calendario. Los bloques siguen siendo
     * válidos según las reglas de horario, pero no están contrastados contra
     * la ocupación real: el front lo avisa en vez de fingir certeza.
     */
    liveCalendar: boolean
}

/** Suma días a una fecha de calendario sin arrastrar zonas horarias. */
export function addDays(d: CalendarDate, n: number): CalendarDate {
    const at = new Date(Date.UTC(d.year, d.month - 1, d.day + n))
    return { year: at.getUTCFullYear(), month: at.getUTCMonth() + 1, day: at.getUTCDate() }
}

/**
 * Bloques agendables por día para una ventana que arranca en `from`.
 *
 * Una sola consulta a Google cubre toda la ventana: pedir día por día sería
 * una llamada por celda del calendario.
 */
export async function getAvailability(
    from: CalendarDate,
    dayCount: number,
    now: Date = new Date()
): Promise<AvailabilityResult> {
    const candidates: DayAvailability[] = []

    for (let i = 0; i < dayCount; i++) {
        const day = addDays(from, i)
        const slots = getBookableSlots(day, now)
        if (slots.length > 0) {
            candidates.push({ date: formatCalendarDate(day), slots })
        }
    }

    if (candidates.length === 0) {
        return { days: [], liveCalendar: true }
    }

    const windowStart = toChileInstant(from, 0)
    const windowEnd = toChileInstant(addDays(from, dayCount), 0)
    const busy = await getBusyIntervals(windowStart, windowEnd)

    if (!busy) {
        return { days: candidates, liveCalendar: false }
    }

    const days = candidates
        .map(({ date, slots }) => ({
            date,
            slots: slots.filter(slot => !isBusy(date, slot, busy)),
        }))
        .filter(d => d.slots.length > 0)

    return { days, liveCalendar: true }
}

/** ¿El bloque de una hora que empieza en `slot` choca con algo del calendario? */
function isBusy(
    date: string,
    slot: string,
    busy: Array<{ start: number; end: number }>
): boolean {
    const [year, month, day] = date.split('-').map(Number)
    const hour = Number(slot.split(':')[0])
    const start = toChileInstant({ year, month, day }, hour).getTime()
    const end = start + SLOT_MINUTES * 60 * 1000
    return busy.some(b => b.start < end && b.end > start)
}

/**
 * Chequeo puntual de un bloque, para revalidar en el momento de agendar.
 *
 * Entre que el cliente abrió el calendario y apretó "confirmar" pueden pasar
 * minutos: sin esta segunda vuelta se agendan visitas encima de otras.
 */
export async function isSlotFree(
    d: CalendarDate,
    hora: string,
    now: Date = new Date()
): Promise<boolean> {
    const start = toChileInstant(d, Number(hora.split(':')[0]))
    const end = new Date(start.getTime() + SLOT_MINUTES * 60 * 1000)
    const busy = await getBusyIntervals(start, end)
    // Sin respuesta de Google no bloqueamos el agendamiento: el asesor
    // reagenda si hubo choque, pero no perdemos el lead por una caída.
    if (!busy) return true
    return !busy.some(b => b.start < end.getTime() && b.end > start.getTime())
}

/** Primer día con bloques realmente libres, mirando `dayCount` días hacia adelante. */
export async function firstFreeDate(
    dayCount = 21,
    now: Date = new Date()
): Promise<string | null> {
    const { days } = await getAvailability(toCalendarDateInChile(now), dayCount, now)
    return days[0]?.date ?? null
}
