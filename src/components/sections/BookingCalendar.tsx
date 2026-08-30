'use client'

import { useState, useMemo, useCallback } from 'react'
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, Check, Mail, Video, Shield, Zap, Droplet } from 'lucide-react'
import AnimatedSection from '@/components/ui/AnimatedSection'
import {
    getBookableSlots,
    toCalendarDate,
    formatCalendarDate,
    firstBookableDate,
    minLeadLabel,
} from '@/lib/booking-rules'
import styles from './BookingCalendar.module.css'

/* ─── CONFIG ─── */
const TIMEZONE = 'America/Santiago'

const PROJECTS_LIST = [
    { 
        id: 'lomas-del-mar', 
        name: 'Lomas del Mar', 
        color: '#006D77', 
        location: 'El Tabo',
        tagline: 'Tu refugio cerca al mar',
        lotSize: '200 m² - 390 m²',
        status: 'Terrenos Disponibles',
        image: '/images/projects/lomas-del-mar-v3.jpg',
        video: '/videos/lomas-del-mar/Lomas web optimized.mp4',
        features: ['Rol Propio', 'Agua Certificada', 'Luz Eléctrica', 'Portón Automático'],
        googleMapsUrl: 'https://maps.app.goo.gl/gvsmU1zsa2phRiUD7'
    },
    { 
        id: 'arena-y-sol', 
        name: 'Arena y Sol', 
        color: '#B8860B', 
        location: 'El Tabo',
        tagline: '¡Tu propio lugar en El Tabo!',
        lotSize: '200 m²',
        status: 'Últimos Terrenos',
        image: '/images/projects/arena-y-sol-v2.jpg',
        video: null,
        features: ['Rol Propio', 'Agua Certificada', 'Luz Eléctrica', 'Portón Automático'],
        googleMapsUrl: 'https://maps.app.goo.gl/h7gaaTCV1J4F2zCAA'
    },
    { 
        id: 'libertad-y-alegria', 
        name: 'Libertad y Alegría', 
        color: '#6B7280', 
        location: 'El Tabo',
        tagline: '¡Tu propio lugar en El Tabo!',
        lotSize: 'Desde 400 m²',
        status: 'Proyecto Vendido',
        image: '/images/projects/libertad-y-alegria.webp',
        video: '/videos/Hero-pagina-libertad-y-alegria.mp4',
        features: ['Rol Propio', 'Agua Certificada', 'Luz Eléctrica', 'Acceso Pavimentado'],
        googleMapsUrl: 'https://maps.app.goo.gl/SukbRpoNdZHuKZLM8'
    },
]

const GENERAL_SHOWCASE = {
    id: 'general',
    name: 'Alimin Inmobiliaria',
    color: '#d4a946',
    location: 'El Tabo, Litoral Central',
    tagline: 'Terrenos con Rol Propio y Urbanización',
    lotSize: 'Desde 200 m²',
    status: 'Proyectos Activos',
    image: '/images/og-image.webp',
    video: '/hero-video.mp4',
    features: ['Terrenos Urbanizados', 'Agua Certificada', 'Luz Eléctrica', 'Financiamiento Directo'],
    googleMapsUrl: null
}

const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
const DAY_NAMES = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

/* ─── HELPERS ─── */
function formatDateCL(date: Date): string {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    return `${days[date.getDay()]} ${date.getDate()} de ${MONTH_NAMES[date.getMonth()]}`
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
    // Referencia de "ahora" fija durante la sesión: evita que el calendario
    // cambie de estado a mitad de render.
    const [now] = useState(() => new Date())
    const [currentMonth, setCurrentMonth] = useState(() => {
        const first = firstBookableDate(new Date())
        return new Date(first.year, first.month - 1, 1)
    })
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [selectedTime, setSelectedTime] = useState('')
    const [form, setForm] = useState({ nombre: '', email: '', celular: '' })
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [meetLink, setMeetLink] = useState<string | null>(null)
    const [errorMsg, setErrorMsg] = useState('')

    const project = PROJECTS_LIST.find(p => p.id === selectedProject)
    const showcaseProject = project || GENERAL_SHOWCASE

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

    // Un día se bloquea si no le queda ningún horario que cumpla la brecha
    // mínima de anticipación (MIN_LEAD_HOURS en @/lib/booking-rules).
    const isDateDisabled = useCallback((date: Date | null) => {
        if (!date) return true
        return getBookableSlots(toCalendarDate(date), now).length === 0
    }, [now])

    const isToday = useCallback((date: Date | null) => {
        if (!date) return false
        const t = new Date()
        return date.getDate() === t.getDate() &&
            date.getMonth() === t.getMonth() &&
            date.getFullYear() === t.getFullYear()
    }, [])

    const timeSlots = useMemo(() => {
        if (!selectedDate) return []
        return getBookableSlots(toCalendarDate(selectedDate), now)
    }, [selectedDate, now])

    // Navigation
    const prevMonth = () => {
        const d = new Date(currentMonth)
        d.setMonth(d.getMonth() - 1)
        // No retroceder antes del primer mes con horarios agendables
        const first = firstBookableDate(now)
        if (d.getFullYear() > first.year ||
            (d.getFullYear() === first.year && d.getMonth() >= first.month - 1)) {
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
        setErrorMsg('')

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
                    // Fecha del día elegido sin zona horaria: es la que valida el servidor
                    fechaLocal: formatCalendarDate(toCalendarDate(selectedDate)),
                    hora: selectedTime,
                }),
            })

            const data = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(data?.error || 'Error al agendar')
            setMeetLink(data.meetLink || null)
            setStatus('success')
            setStep(4)
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : '')
            setStatus('error')
            setTimeout(() => setStatus('idle'), 6000)
        }
    }

    const handleNext = () => {
        if (step === 3) {
            handleSubmit()
        } else {
            setStep(s => s + 1)
        }
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
                <div className={styles.cardGrid}>
                    
                    {/* LEFT COLUMN: Showcase Column */}
                    {showcaseProject && (
                        <div className={styles.showcaseColumn}>
                            <div className={styles.mediaContainer}>
                                {showcaseProject.video ? (
                                    <video 
                                        key={showcaseProject.id}
                                        className={styles.showcaseVideo}
                                        src={showcaseProject.video}
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                    />
                                ) : (
                                    <img 
                                        className={styles.showcaseImage}
                                        src={showcaseProject.image}
                                        alt={showcaseProject.name}
                                    />
                                )}
                                <div className={styles.mediaOverlay} />
                                <span className={styles.statusBadge} style={{ 
                                    color: showcaseProject.color, 
                                    borderColor: `${showcaseProject.color}40`, 
                                    backgroundColor: `${showcaseProject.color}15` 
                                }}>
                                    {showcaseProject.status}
                                </span>
                            </div>

                            <div className={styles.showcaseDetails}>
                                <h3 className={styles.showcaseTitle}>{showcaseProject.name}</h3>
                                <p className={styles.showcaseTagline}>{showcaseProject.tagline}</p>
                                
                                <div className={styles.showcaseMeta}>
                                    <span className={styles.metaItem}>
                                        <MapPin size={14} color="#d4a946" />
                                        {'googleMapsUrl' in showcaseProject && showcaseProject.googleMapsUrl ? (
                                            <a 
                                                href={showcaseProject.googleMapsUrl as string} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className={styles.mapLink}
                                                title="Ver ubicación en Google Maps"
                                            >
                                                {showcaseProject.location} <span className={styles.mapLinkHint}>(Ver mapa)</span>
                                            </a>
                                        ) : (
                                            showcaseProject.location
                                        )}
                                    </span>
                                    <span className={styles.metaItem}>
                                        <strong>Lotes:</strong> {showcaseProject.lotSize}
                                    </span>
                                </div>

                                <div className={styles.showcaseFeatures}>
                                    {showcaseProject.features.map((feat, idx) => (
                                        <div key={idx} className={styles.showcaseFeature}>
                                            <div className={styles.featureIconWrapper} style={{ 
                                                backgroundColor: `${showcaseProject.color}15`, 
                                                color: showcaseProject.color 
                                            }}>
                                                <Check size={10} strokeWidth={3} />
                                            </div>
                                            <span>{feat}</span>
                                        </div>
                                    ))}
                                </div>

                                {selectedDate && selectedTime && (
                                    <div className={styles.appointmentBox}>
                                        <div className={styles.appointmentTitle}>Tu cita seleccionada</div>
                                        <div className={styles.appointmentTime}>
                                            <Calendar size={14} color="#d4a946" />
                                            <span>{formatDateCL(selectedDate)} a las {selectedTime} hrs</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* RIGHT COLUMN: Flow Column */}
                    <div className={styles.flowColumn}>
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
                                            <div className={styles.leadTimeNote}>
                                                <Clock size={13} />
                                                <span>
                                                    Las visitas se agendan con al menos {minLeadLabel()} de
                                                    anticipación, para que tu asesor prepare el recorrido.
                                                </span>
                                            </div>
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
                                                    <div className={styles.summaryValue}>{project?.name || showcaseProject.name}</div>
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
                                                ❌ {errorMsg || 'Error al agendar. Intenta nuevamente.'}
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
                                            Te enviamos una invitación con Google Meet a tu correo.
                                        </p>

                                        <div className={styles.successDetails}>
                                            <div className={styles.successDetailRow}>
                                                <span className={styles.successDetailLabel}>Proyecto</span>
                                                <span className={styles.successDetailValue}>{project?.name || showcaseProject.name}</span>
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
                                        <div className={styles.meetNotice}>
                                            <Mail size={20} color="#d4a946" />
                                            <p>Revisa tu correo <strong>{form.email}</strong> para la invitación con el evento y link de Google Meet.</p>
                                        </div>
                                        {project?.googleMapsUrl && (
                                            <div className={styles.mapNotice}>
                                                <MapPin size={20} color="#d4a946" />
                                                <p>
                                                    <strong>Indicaciones de viaje:</strong> Para saber cómo llegar al terreno, puedes ver su ubicación en{' '}
                                                    <a 
                                                        href={project.googleMapsUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className={styles.mapLink}
                                                    >
                                                        Google Maps aquí
                                                    </a>.
                                                </p>
                                            </div>
                                        )}
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
                </div>
            </div>
        </section>
    )
}
