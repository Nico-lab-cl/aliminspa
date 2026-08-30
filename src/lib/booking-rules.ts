/**
 * Reglas de agendamiento compartidas entre el calendario (cliente) y la API.
 *
 * MIN_LEAD_HOURS es la "brecha": el tiempo mínimo que debe haber entre el
 * momento en que el cliente agenda y el inicio de la visita, para que el asesor
 * alcance a organizarse y llegar al terreno.
 *
 * Ajustar MIN_LEAD_HOURS aquí cambia el bloqueo en el calendario y la
 * validación del servidor al mismo tiempo.
 */

export const TIMEZONE = 'America/Santiago'

/** Horas mínimas de anticipación para poder agendar una visita. */
export const MIN_LEAD_HOURS = 24

/** Disponibilidad por día de la semana. 0=Domingo, 1=Lunes, ..., 6=Sábado */
export const AVAILABILITY: Record<number, { start: number; end: number }> = {
    0: { start: 9, end: 19 },  // Domingo
    1: { start: 16, end: 19 }, // Lunes
    2: { start: 16, end: 19 }, // Martes
    3: { start: 16, end: 19 }, // Miércoles
    4: { start: 16, end: 19 }, // Jueves
    5: { start: 15, end: 19 }, // Viernes
    6: { start: 9, end: 19 },  // Sábado
}

/** Fecha de calendario sin hora ni zona horaria. month va de 1 a 12. */
export interface CalendarDate {
    year: number
    month: number
    day: number
}

/** Texto para el copy, derivado de MIN_LEAD_HOURS para que nunca se desincronice. */
export function minLeadLabel(): string {
    if (MIN_LEAD_HOURS % 24 === 0) {
        const dias = MIN_LEAD_HOURS / 24
        return dias === 1 ? '24 horas' : `${dias} días`
    }
    return `${MIN_LEAD_HOURS} horas`
}

export function getSlotsForDay(dayOfWeek: number): string[] {
    const avail = AVAILABILITY[dayOfWeek]
    if (!avail) return []
    const slots: string[] = []
    for (let h = avail.start; h < avail.end; h++) {
        slots.push(`${String(h).padStart(2, '0')}:00`)
    }
    return slots
}

/** Diferencia entre UTC y la hora de Chile en un instante dado, en ms. */
function chileOffsetMs(at: Date): number {
    const utc = new Date(at.toLocaleString('en-US', { timeZone: 'UTC' }))
    const local = new Date(at.toLocaleString('en-US', { timeZone: TIMEZONE }))
    return utc.getTime() - local.getTime()
}

/** Instante real (UTC) de una hora de pared chilena, respetando el horario de verano. */
export function toChileInstant(d: CalendarDate, hour: number): Date {
    const wallClock = Date.UTC(d.year, d.month - 1, d.day, hour)
    // Dos pasadas: la segunda corrige los días en que cambia el horario.
    const first = wallClock + chileOffsetMs(new Date(wallClock))
    return new Date(wallClock + chileOffsetMs(new Date(first)))
}

export function weekdayOf(d: CalendarDate): number {
    return new Date(Date.UTC(d.year, d.month - 1, d.day)).getUTCDay()
}

/** Primer instante en el que ya se puede recibir una visita. */
export function earliestBookableInstant(now: Date = new Date()): Date {
    return new Date(now.getTime() + MIN_LEAD_HOURS * 60 * 60 * 1000)
}

/** Horarios de un día que respetan tanto la disponibilidad como la brecha. */
export function getBookableSlots(d: CalendarDate, now: Date = new Date()): string[] {
    const min = earliestBookableInstant(now).getTime()
    return getSlotsForDay(weekdayOf(d)).filter(slot => {
        const hour = Number(slot.split(':')[0])
        return toChileInstant(d, hour).getTime() >= min
    })
}

export function isSlotBookable(d: CalendarDate, hora: string, now: Date = new Date()): boolean {
    return getBookableSlots(d, now).includes(normalizeHora(hora))
}

/** "16" o "16:30" -> "16:00" (los bloques son por hora en punto). */
export function normalizeHora(hora: string): string {
    const hour = Number(String(hora).split(':')[0])
    if (!Number.isFinite(hour)) return ''
    return `${String(hour).padStart(2, '0')}:00`
}

/** Primer día (a partir de hoy) que tiene al menos un horario agendable. */
export function firstBookableDate(now: Date = new Date()): CalendarDate {
    const start = earliestBookableInstant(now)
    for (let i = 0; i < 14; i++) {
        const probe = new Date(start.getTime() + i * 24 * 60 * 60 * 1000)
        const d = toCalendarDateInChile(probe)
        if (getBookableSlots(d, now).length > 0) return d
    }
    return toCalendarDateInChile(start)
}

/** Fecha de calendario según el reloj chileno para un instante dado. */
export function toCalendarDateInChile(at: Date): CalendarDate {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(at)
    const [year, month, day] = parts.split('-').map(Number)
    return { year, month, day }
}

/** Fecha de calendario a partir de un Date local del navegador. */
export function toCalendarDate(date: Date): CalendarDate {
    return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() }
}

/** "YYYY-MM-DD" o ISO completo -> CalendarDate. */
export function parseCalendarDate(value: string): CalendarDate | null {
    if (typeof value !== 'string') return null
    const plain = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (plain) {
        return { year: Number(plain[1]), month: Number(plain[2]), day: Number(plain[3]) }
    }
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return null
    return {
        year: parsed.getUTCFullYear(),
        month: parsed.getUTCMonth() + 1,
        day: parsed.getUTCDate(),
    }
}

export function formatCalendarDate(d: CalendarDate): string {
    return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
}
