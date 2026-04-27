'use client'

import { useState, useMemo, useCallback } from 'react'
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, Check, Download, ExternalLink } from 'lucide-react'
import AnimatedSection from '@/components/ui/AnimatedSection'
import styles from './BookingCalendar.module.css'

/* ─── CONFIG ─── */
const TIMEZONE = 'America/Santiago'

const PROJECTS_LIST = [
    { id: 'lomas-del-mar', name: 'Lomas del Mar', color: '#006D77', location: 'El Tabo' },
    { id: 'arena-y-sol', name: 'Arena y Sol', color: '#B8860B', location: 'El Tabo' },
    { id: 'libertad-y-alegria', name: 'Libertad y Alegría', color: '#6B7280', location: 'El Tabo' },
]

/** Availability schedule. Day: 0=Sun, 1=Mon, ..., 6=Sat */
const AVAILABILITY: Record<number, { start: number; end: number }> = {
    0: { start: 9, end: 19 },  // Domingo
    1: { start: 16, end: 19 }, // Lunes
    2: { start: 16, end: 19 }, // Martes
    3: { start: 16, end: 19 }, // Miércoles
    4: { start: 16, end: 19 }, // Jueves
    5: { start: 15, end: 19 }, // Viernes
    6: { start: 9, end: 19 },  // Sábado
}

const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
const DAY_NAMES = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

/* ─── HELPERS ─── */
function getSlotsForDay(dayOfWeek: number): string[] {
    const avail = AVAILABILITY[dayOfWeek]
    if (!avail) return []
    const slots: string[] = []
    for (let h = avail.start; h < avail.end; h++) {
        slots.push(`${String(h).padStart(2, '0')}:00`)
    }
    return slots
}

function formatDateCL(date: Date): string {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    return `${days[date.getDay()]} ${date.getDate()} de ${MONTH_NAMES[date.getMonth()]}`
}

function toGoogleCalendarUrl(params: {
    title: string
    date: Date
    hour: string
    description: string
    location: string
}): string {
    const { title, date, hour, description, location } = params
    const [h] = hour.split(':').map(Number)
    const start = new Date(date)
    start.setHours(h, 0, 0, 0)
    const end = new Date(start)
    end.setHours(h + 1)

    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

    const url = new URL('https://calendar.google.com/calendar/render')
    url.searchParams.set('action', 'TEMPLATE')
    url.searchParams.set('text', title)
    url.searchParams.set('dates', `${fmt(start)}/${fmt(end)}`)
    url.searchParams.set('details', description)
    url.searchParams.set('location', location)
    return url.toString()
}

function generateICS(params: {
    title: string
    date: Date
    hour: string
    description: string
    location: string
    organizer: string
}): string {
    const { title, date, hour, description, location, organizer } = params
    const [h] = hour.split(':').map(Number)
    const start = new Date(date)
    start.setHours(h, 0, 0, 0)
    const end = new Date(start)
    end.setHours(h + 1)

    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    const uid = `booking-${Date.now()}@aliminspa.cl`

    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Alimin SPA//Booking//ES',
        'CALSCALE:GREGORIAN',
        'METHOD:REQUEST',
        'BEGIN:VEVENT',
        `DTSTART:${fmt(start)}`,
        `DTEND:${fmt(end)}`,
        `SUMMARY:${title}`,
        `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
        `LOCATION:${location}`,
        `ORGANIZER;CN=Alimin Inmobiliaria:mailto:${organizer}`,
        `UID:${uid}`,
        'STATUS:CONFIRMED',
        'BEGIN:VALARM',
        'TRIGGER:-PT30M',
        'ACTION:DISPLAY',
        'DESCRIPTION:Recordatorio de visita',
        'END:VALARM',
        'BEGIN:VALARM',
        'TRIGGER:-P1D',
        'ACTION:DISPLAY',
        'DESCRIPTION:Tu visita es mañana',
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR',
    ].join('\r\n')
}

/* ─── COMPONENT ─── */
interface BookingCalendarProps {
    defaultProject?: string
}

export default function BookingCalendar({ defaultProject }: BookingCalendarProps) {
    // State
    const [step, setStep] = useState(defaultProject ? 2 : 1)
    const [selectedProject, setSelectedProject] = useState(
        defaultProject
            ? PROJECTS_LIST.find(p => p.name === defaultProject)?.id || ''
            : ''
    )
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [selectedTime, setSelectedTime] = useState('')
    const [form, setForm] = useState({ nombre: '', email: '', celular: '' })
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

    const project = PROJECTS_LIST.find(p => p.id === selectedProject)

    // Calendar grid computation
    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear()
        const month = currentMonth.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)

        // Monday = 0, Sunday = 6 (for our grid)
        let startOffset = firstDay.getDay() - 1
        if (startOffset < 0) startOffset = 6

        const days: Array<{ date: Date | null; day: number }> = []

        // Empty cells before month starts
        for (let i = 0; i < startOffset; i++) {
            days.push({ date: null, day: 0 })
        }

        // Actual days
        for (let d = 1; d <= lastDay.getDate(); d++) {
            days.push({ date: new Date(year, month, d), day: d })
        }

        return days
    }, [currentMonth])

    const isDateDisabled = useCallback((date: Date | null) => {
        if (!date) return true
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        if (date < today) return true
        // Check if day has availability
        const avail = AVAILABILITY[date.getDay()]
        if (!avail) return true
        return false
    }, [])

    const isToday = useCallback((date: Date | null) => {
        if (!date) return false
        const t = new Date()
        return date.getDate() === t.getDate() &&
            date.getMonth() === t.getMonth() &&
            date.getFullYear() === t.getFullYear()
    }, [])

    const timeSlots = useMemo(() => {
        if (!selectedDate) return []
        const slots = getSlotsForDay(selectedDate.getDay())

        // If selected date is today, filter out past hours
        const now = new Date()
        if (
            selectedDate.getDate() === now.getDate() &&
            selectedDate.getMonth() === now.getMonth() &&
            selectedDate.getFullYear() === now.getFullYear()
        ) {
            const currentHour = now.getHours()
            return slots.filter(s => {
                const [h] = s.split(':').map(Number)
                return h > currentHour
            })
        }
        return slots
    }, [selectedDate])

    // Navigation
    const prevMonth = () => {
        const d = new Date(currentMonth)
        d.setMonth(d.getMonth() - 1)
        // Don't go before current month
        const now = new Date()
        if (d.getFullYear() > now.getFullYear() ||
            (d.getFullYear() === now.getFullYear() && d.getMonth() >= now.getMonth())) {
            setCurrentMonth(d)
        }
    }

    const nextMonth = () => {
        const d = new Date(currentMonth)
        d.setMonth(d.getMonth() + 1)
        // Max 3 months ahead
        const max = new Date()
        max.setMonth(max.getMonth() + 3)
        if (d <= max) setCurrentMonth(d)
    }

    // Step validation
    const canProceed = () => {
        switch (step) {
            case 1: return !!selectedProject
            case 2: return !!selectedDate && !!selectedTime
            case 3: return !!form.nombre && !!form.email && !!form.celular
            default: return false
        }
    }

    // Submit
    const handleSubmit = async () => {
        if (!selectedDate || !project) return
        setStatus('loading')

        try {
            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: form.nombre,
                    email: form.email,
                    celular: form.celular,
                    proyecto: project.name,
                    fecha: selectedDate.toISOString(),
                    hora: selectedTime,
                }),
            })

            if (!res.ok) throw new Error('Error al agendar')
            setStatus('success')
            setStep(4)
        } catch {
            setStatus('error')
            setTimeout(() => setStatus('idle'), 4000)
        }
    }

    const handleNext = () => {
        if (step === 3) {
            handleSubmit()
        } else {
            setStep(s => s + 1)
        }
    }

    // Google Calendar link
    const calendarLink = useMemo(() => {
        if (!selectedDate || !project) return '#'
        return toGoogleCalendarUrl({
            title: `Visita ${project.name} — Alimin Inmobiliaria`,
            date: selectedDate,
            hour: selectedTime,
            description: `Visita agendada al proyecto ${project.name} en El Tabo.\n\nContacto: ${form.nombre}\nEmail: ${form.email}\nCelular: ${form.celular}\n\nAlimin Inmobiliaria - aliminspa.cl`,
            location: 'El Tabo, Región de Valparaíso, Chile',
        })
    }, [selectedDate, selectedTime, project, form])

    const downloadICS = () => {
        if (!selectedDate || !project) return
        const ics = generateICS({
            title: `Visita ${project.name} — Alimin Inmobiliaria`,
            date: selectedDate,
            hour: selectedTime,
            description: `Visita agendada al proyecto ${project.name} en El Tabo.\nContacto: ${form.nombre}\nEmail: ${form.email}\nCelular: ${form.celular}`,
            location: 'El Tabo, Región de Valparaíso, Chile',
            organizer: 'bienesraices@aliminspa.cl',
        })
        const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `visita-${project.id}-alimin.ics`
        a.click()
        URL.revokeObjectURL(url)
    }

    /* ─── RENDER ─── */
    return (
        <section className={styles.section} id="agendar">
            <div className={styles.header}>
                <AnimatedSection>
                    <div className={styles.headerIcon}>
                        <Calendar size={28} color="#d4a946" strokeWidth={1.5} />
                    </div>
                    <h2 className={styles.mainTitle}>Agenda tu Visita</h2>
                    <p className={styles.subtitle}>
                        Elige el proyecto, selecciona una fecha y hora conveniente, y recibe la confirmación en tu calendario.
                    </p>
                </AnimatedSection>
            </div>

            {/* Steps Bar */}
            <div className={styles.stepsBar}>
                {[
                    { n: 1, label: 'Proyecto' },
                    { n: 2, label: 'Fecha y Hora' },
                    { n: 3, label: 'Tus Datos' },
                ].map((s, i) => (
                    <div key={s.n} style={{ display: 'flex', alignItems: 'center' }}>
                        <div className={`${styles.stepItem} ${step === s.n ? styles.active : ''} ${step > s.n ? styles.completed : ''}`}>
                            <div className={styles.stepCircle}>
                                {step > s.n ? <Check size={16} /> : s.n}
                            </div>
                            <span className={styles.stepLabel}>{s.label}</span>
                        </div>
                        {i < 2 && (
                            <div className={`${styles.stepConnector} ${step > s.n ? styles.done : ''}`} />
                        )}
                    </div>
                ))}
            </div>

            {/* Card */}
            <div className={styles.card}>
                <div className={styles.cardInner}>
                    {/* ── STEP 1: Project Selection ── */}
                    {step === 1 && (
                        <div className={styles.stepContent} key="step1">
                            <div className={styles.projectGrid}>
                                {PROJECTS_LIST.map((p) => (
                                    <div
                                        key={p.id}
                                        className={`${styles.projectCard} ${selectedProject === p.id ? styles.selected : ''}`}
                                        onClick={() => setSelectedProject(p.id)}
                                    >
                                        <div
                                            className={styles.projectCardDot}
                                            style={{ backgroundColor: p.color }}
                                        />
                                        <div className={styles.projectCardName}>{p.name}</div>
                                        <div className={styles.projectCardLocation}>
                                            <MapPin size={13} />
                                            {p.location}
                                        </div>
                                        <div className={styles.projectCardCheck}>
                                            <Check size={14} color="#1a1a1a" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2: Calendar & Time ── */}
                    {step === 2 && (
                        <div className={styles.stepContent} key="step2">
                            <div className={styles.calendarWrapper}>
                                {/* Calendar Grid */}
                                <div className={styles.calendarPanel}>
                                    <div className={styles.calendarNav}>
                                        <button className={styles.calendarNavBtn} onClick={prevMonth} type="button">
                                            <ChevronLeft size={18} />
                                        </button>
                                        <span className={styles.calendarMonth}>
                                            {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                                        </span>
                                        <button className={styles.calendarNavBtn} onClick={nextMonth} type="button">
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>

                                    <div className={styles.calendarGrid}>
                                        {DAY_NAMES.map((d) => (
                                            <div key={d} className={styles.calendarDayName}>{d}</div>
                                        ))}
                                        {calendarDays.map((cell, i) => {
                                            const disabled = isDateDisabled(cell.date)
                                            const today = isToday(cell.date)
                                            const sel = selectedDate && cell.date &&
                                                selectedDate.getDate() === cell.date.getDate() &&
                                                selectedDate.getMonth() === cell.date.getMonth() &&
                                                selectedDate.getFullYear() === cell.date.getFullYear()

                                            return (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    className={[
                                                        styles.calendarDay,
                                                        !cell.date ? styles.empty : '',
                                                        disabled ? styles.disabled : '',
                                                        sel ? styles.selected : '',
                                                        today ? styles.today : '',
                                                    ].filter(Boolean).join(' ')}
                                                    onClick={() => {
                                                        if (!disabled && cell.date) {
                                                            setSelectedDate(cell.date)
                                                            setSelectedTime('')
                                                        }
                                                    }}
                                                    disabled={disabled || !cell.date}
                                                >
                                                    {cell.day || ''}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Time Slots */}
                                <div className={styles.timeSlotsPanel}>
                                    <div className={styles.timeSlotsTitle}>Horarios disponibles</div>
                                    {selectedDate ? (
                                        <>
                                            <div className={styles.timeSlotsDate}>
                                                {formatDateCL(selectedDate)}
                                            </div>
                                            <div className={styles.timeSlotsList}>
                                                {timeSlots.length > 0 ? (
                                                    timeSlots.map((slot) => (
                                                        <button
                                                            key={slot}
                                                            type="button"
                                                            className={`${styles.timeSlot} ${selectedTime === slot ? styles.selected : ''}`}
                                                            onClick={() => setSelectedTime(slot)}
                                                        >
                                                            {slot} hrs
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className={styles.noDateSelected}>
                                                        <Clock size={24} />
                                                        <span>No hay horarios disponibles para esta fecha</span>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className={styles.noDateSelected}>
                                            <Calendar size={32} />
                                            <span>Selecciona un día en el calendario</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 3: Form ── */}
                    {step === 3 && (
                        <div className={styles.stepContent} key="step3">
                            <div className={styles.formGrid}>
                                {/* Booking Summary */}
                                <div className={styles.formSummary}>
                                    <div className={styles.summaryItem}>
                                        <MapPin size={15} color="#d4a946" />
                                        <div>
                                            <div className={styles.summaryLabel}>Proyecto</div>
                                            <div className={styles.summaryValue}>{project?.name}</div>
                                        </div>
                                    </div>
                                    <div className={styles.summaryItem}>
                                        <Calendar size={15} color="#d4a946" />
                                        <div>
                                            <div className={styles.summaryLabel}>Fecha</div>
                                            <div className={styles.summaryValue}>
                                                {selectedDate ? formatDateCL(selectedDate) : ''}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles.summaryItem}>
                                        <Clock size={15} color="#d4a946" />
                                        <div>
                                            <div className={styles.summaryLabel}>Hora</div>
                                            <div className={styles.summaryValue}>{selectedTime} hrs</div>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.inputGroup}>
                                    <label className={styles.inputLabel} htmlFor="booking-nombre">Nombre completo</label>
                                    <input
                                        id="booking-nombre"
                                        type="text"
                                        className={styles.input}
                                        placeholder="Tu nombre"
                                        required
                                        value={form.nombre}
                                        onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label className={styles.inputLabel} htmlFor="booking-email">Correo electrónico</label>
                                    <input
                                        id="booking-email"
                                        type="email"
                                        className={styles.input}
                                        placeholder="tu@email.com"
                                        required
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label className={styles.inputLabel} htmlFor="booking-celular">Celular</label>
                                    <input
                                        id="booking-celular"
                                        type="tel"
                                        className={styles.input}
                                        placeholder="+56 9 1234 5678"
                                        required
                                        value={form.celular}
                                        onChange={(e) => setForm({ ...form, celular: e.target.value })}
                                    />
                                </div>

                                {status === 'error' && (
                                    <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', color: '#fca5a5', textAlign: 'center', fontSize: '0.9rem' }}>
                                        ❌ Error al agendar. Intenta nuevamente.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── STEP 4: Success ── */}
                    {step === 4 && (
                        <div className={styles.stepContent} key="step4">
                            <div className={styles.successContainer}>
                                <div className={styles.successIcon}>
                                    <Check size={36} color="#34d399" strokeWidth={2.5} />
                                </div>
                                <h3 className={styles.successTitle}>¡Visita Agendada!</h3>
                                <p className={styles.successSubtitle}>
                                    Hemos registrado tu visita exitosamente.<br />
                                    Agrega el evento a tu calendario para no olvidarlo.
                                </p>

                                <div className={styles.successDetails}>
                                    <div className={styles.successDetailRow}>
                                        <span className={styles.successDetailLabel}>Proyecto</span>
                                        <span className={styles.successDetailValue}>{project?.name}</span>
                                    </div>
                                    <div className={styles.successDetailRow}>
                                        <span className={styles.successDetailLabel}>Fecha</span>
                                        <span className={styles.successDetailValue}>
                                            {selectedDate ? formatDateCL(selectedDate) : ''}
                                        </span>
                                    </div>
                                    <div className={styles.successDetailRow}>
                                        <span className={styles.successDetailLabel}>Hora</span>
                                        <span className={styles.successDetailValue}>{selectedTime} hrs</span>
                                    </div>
                                    <div className={styles.successDetailRow}>
                                        <span className={styles.successDetailLabel}>Nombre</span>
                                        <span className={styles.successDetailValue}>{form.nombre}</span>
                                    </div>
                                </div>

                                <div className={styles.calendarButtons}>
                                    <a
                                        href={calendarLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.btnGoogleCal}
                                    >
                                        <ExternalLink size={18} />
                                        Agregar a Google Calendar
                                    </a>
                                    <button
                                        type="button"
                                        className={styles.btnIcs}
                                        onClick={downloadICS}
                                    >
                                        <Download size={18} />
                                        Descargar .ics
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                {step < 4 && (
                    <div className={styles.actions}>
                        {step > 1 ? (
                            <button
                                type="button"
                                className={styles.btnBack}
                                onClick={() => setStep(s => s - 1)}
                            >
                                <ChevronLeft size={16} />
                                Atrás
                            </button>
                        ) : (
                            <div />
                        )}
                        <button
                            type="button"
                            className={styles.btnNext}
                            disabled={!canProceed() || status === 'loading'}
                            onClick={handleNext}
                        >
                            {status === 'loading'
                                ? 'Agendando...'
                                : step === 3
                                    ? 'Confirmar Visita'
                                    : 'Continuar'}
                            {status !== 'loading' && <ChevronRight size={16} />}
                        </button>
                    </div>
                )}
            </div>
        </section>
    )
}
