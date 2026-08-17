'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { getUtmParams, newEventId } from '@/lib/track'
import { FAQ_ARENA_Y_SOL } from './faq'

/* Landing de Arena y Sol para tráfico de Meta Ads (/meta/arena-y-sol).
   Copia independiente de /proyectos/arena-y-sol: se puede iterar el copy, los
   precios o los CTA solo para los anuncios sin tocar la página pública. Lo que
   cambia respecto del original es la etiqueta con la que se guarda el lead
   ("Arena y Sol - Meta"), las UTM por defecto y el noindex de la ruta. */

// ── Datos comerciales. Único lugar donde se editan. ──
const LOTES_DISPONIBLES = 17
const LOTES_TOTALES = 42
const PLAZO_CUOTAS = 44
const VENDIDOS_PCT = Math.round(((LOTES_TOTALES - LOTES_DISPONIBLES) / LOTES_TOTALES) * 100)

const WA_MARCELA = '56956654833'
const WA_ORLANDO = '56973077128'
const wa = (phone: string, message: string) =>
    `https://wa.me/${phone}?text=${encodeURIComponent(message)}`

const WA_GENERAL = wa(WA_MARCELA, 'Hola, vengo de la página de Arena y Sol y quiero info del terreno de 200 m2')

const EASE = 'cubic-bezier(.16,1,.3,1)'

/* Globales que inyecta el layout raíz: el Pixel de Meta y el tracker del CRM. */
type TrackingWindow = {
    fbq?: (
        action: string,
        event: string,
        data: Record<string, string>,
        opts: { eventID: string }
    ) => void
    AliminCRM?: {
        identify: (contact: Record<string, string>) => Promise<unknown>
    }
}

const WA_PATH =
    'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z'

const MARQUEE_ITEMS = [
    { lima: true, text: `⚠ Quedan solo ${LOTES_DISPONIBLES} terrenos en Arena y Sol` },
    { lima: false, text: '200 m² · Rol propio · A 10 min de la playa' },
    { lima: false, text: 'Financiamiento directo, sin bancos ni intereses' },
]

const TRUST_ITEMS = [
    {
        title: 'Rol propio',
        desc: 'La escritura queda a tu nombre',
        icon: (
            <>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
            </>
        ),
    },
    {
        title: 'Agua certificada',
        desc: 'Conexión lista en terreno',
        icon: <path d="M12 2.7s6 6 6 10.3a6 6 0 0 1-12 0C6 8.7 12 2.7 12 2.7z" />,
    },
    {
        title: 'Luz eléctrica',
        desc: 'Red instalada en el loteo',
        icon: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
    },
    {
        title: 'Portón automático',
        desc: 'Acceso cerrado al loteo',
        icon: (
            <>
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="M3 10h18M9 10v10M15 10v10" />
            </>
        ),
    },
]

type GalleryItem =
    | { kind: 'img'; src: string; alt: string }
    | { kind: 'video'; src: string; poster: string; label: string; alt: string }

const GALLERY: GalleryItem[] = [
    { kind: 'img', src: '/images/arena_y_sol/obra/aerea-loteo.webp', alt: 'Vista aérea del loteo Arena y Sol' },
    { kind: 'img', src: '/images/arena_y_sol/gallery-1.webp', alt: 'Calle interior del loteo Arena y Sol' },
    { kind: 'img', src: '/images/arena_y_sol/obra/acceso-porton.webp', alt: 'Acceso con portón automático del loteo' },
    { kind: 'img', src: '/images/arena_y_sol/gallery-2.webp', alt: 'Terrenos deslindados en Arena y Sol' },
    {
        kind: 'video',
        src: '/videos/arena-y-sol/recorrido.mp4',
        poster: '/videos/arena-y-sol/recorrido-poster.webp',
        label: '▶ Video · Recorrido',
        alt: 'Recorrido en video por el loteo Arena y Sol',
    },
    { kind: 'img', src: '/images/arena_y_sol/obra/cierre-porton.webp', alt: 'Muro perimetral y portón instalados' },
    { kind: 'img', src: '/images/arena_y_sol/obra/muro-perimetral.webp', alt: 'Muro perimetral de hormigón del loteo' },
    { kind: 'img', src: '/images/arena_y_sol/obra/cierre-vecino.webp', alt: 'Cierre perimetral instalado por un vecino' },
    {
        kind: 'video',
        src: '/videos/arena-y-sol/acceso.mp4',
        poster: '/videos/arena-y-sol/acceso-poster.webp',
        label: '▶ Video · Acceso',
        alt: 'Video del acceso con portón automático a Arena y Sol',
    },
]

const PLACES = [
    {
        image: '/assets/minipie/pasted-1782761706285-0.png',
        distance: '10 min',
        category: 'Playa',
        title: 'El Tabo',
        description: 'Playa icónica del litoral con arena extensa y aguas del Pacífico',
    },
    {
        image: '/assets/minipie/pasted-1782761902415-0.png',
        distance: '12 min',
        category: 'Naturaleza',
        title: 'Quebrada de Córdova',
        description: 'Paisaje natural único donde el río se une al océano Pacífico',
    },
    {
        image: '/assets/minipie/pasted-1782761935471-0.png',
        distance: '15 min',
        category: 'Cultura · Patrimonio',
        title: 'Isla Negra',
        description: 'La casa de Pablo Neruda, Patrimonio Mundial de la UNESCO',
    },
    {
        image: '/assets/minipie/pasted-1782761947129-0.png',
        distance: '20 min',
        category: 'Turismo · Recreación',
        title: 'Algarrobo',
        description: 'La piscina más grande del mundo · Playas exclusivas del Litoral',
    },
]

const REGIONES = [
    'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo', 'Valparaíso',
    'Metropolitana', 'O’Higgins', 'Maule', 'Ñuble', 'Biobío', 'Araucanía',
    'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes',
]

const CANALES = ['Instagram', 'Facebook', 'TikTok', 'Recomendación', 'Google', 'WhatsApp', 'Otro']

const PRICE_ROWS = [
    { label: 'Superficie', value: '200 m²', lima: false },
    { label: 'Pie', value: '$20.000.000', lima: false },
    { label: 'Cuota referencial', value: '$500.000', lima: true },
    { label: 'Plazo', value: `${PLAZO_CUOTAS} cuotas`, lima: false },
]

const ADVISORS = [
    {
        name: 'Marcela Escobar',
        role: 'Asesora inmobiliaria',
        photo: '/images/arena_y_sol/asesores/marcela.webp',
        blurb: 'Te asesora con soluciones rápidas y transparentes para asegurar tu terreno en Arena y Sol.',
        phoneLabel: '+56 9 5665 4833',
        href: wa(WA_MARCELA, 'Hola Marcela, vengo de la página de Arena y Sol y quiero info del terreno de 200 m2'),
        cta: 'WhatsApp con Marcela',
    },
    {
        name: 'Orlando Costa',
        role: 'Asesor inmobiliario',
        photo: '/images/arena_y_sol/asesores/orlando.webp',
        blurb: 'Te acompaña paso a paso y coordina tu visita al loteo en El Tabo.',
        phoneLabel: '+56 9 7307 7128',
        href: wa(WA_ORLANDO, 'Hola Orlando, vengo de la página de Arena y Sol y quiero coordinar una visita al loteo'),
        cta: 'WhatsApp con Orlando',
    },
]

// ── Piezas reutilizables del design system ──

function Rule({ flip = false }: { flip?: boolean }) {
    return (
        <span
            style={{
                display: 'inline-block',
                width: '32px',
                height: '2px',
                background: flip
                    ? 'linear-gradient(90deg,#4ba646,#76d845)'
                    : 'linear-gradient(90deg,#76d845,#4ba646)',
            }}
        />
    )
}

function SectionHeader({
    kicker,
    title,
    subtitle,
    dark = true,
}: {
    kicker: string
    title: React.ReactNode
    subtitle?: string
    dark?: boolean
}) {
    return (
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Rule />
                <span
                    style={{
                        font: "600 .8rem 'Montserrat',sans-serif",
                        letterSpacing: '.12em',
                        textTransform: 'uppercase',
                        color: dark ? '#76d845' : '#4ba646',
                    }}
                >
                    {kicker}
                </span>
                <Rule flip />
            </div>
            <h2
                style={{
                    font: "800 clamp(1.8rem,3.5vw,2.6rem)/1.1 'Montserrat',sans-serif",
                    letterSpacing: '-.03em',
                    margin: '0 0 12px',
                    color: dark ? '#fff' : '#1a2b3d',
                }}
            >
                {title}
            </h2>
            {subtitle && (
                <p
                    style={{
                        font: "300 1rem/1.7 'Roboto',sans-serif",
                        color: dark ? 'rgba(255,255,255,.55)' : '#4b5563',
                        maxWidth: '520px',
                        margin: '0 auto',
                    }}
                >
                    {subtitle}
                </p>
            )}
        </div>
    )
}

function Pill({ children }: { children: React.ReactNode }) {
    return (
        <span
            style={{
                padding: '9px 16px',
                borderRadius: '100px',
                background: 'rgba(10,18,28,.6)',
                border: '1.5px solid rgba(118,216,69,.25)',
                font: "400 13px 'Roboto',sans-serif",
                color: 'rgba(255,255,255,.8)',
            }}
        >
            {children}
        </span>
    )
}

function FaqItem({ question, answer, open, onToggle }: {
    question: string
    answer: string
    open: boolean
    onToggle: () => void
}) {
    return (
        <div
            style={{
                background: open ? '#f0f7e4' : '#fff',
                borderRadius: '14px',
                border: '1.5px solid #e0eecc',
                overflow: 'hidden',
                transition: 'background .25s',
            }}
        >
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={open}
                style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '18px 22px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    gap: '12px',
                }}
            >
                <span style={{ font: "600 15px 'Montserrat',sans-serif", color: '#1a2b3d' }}>{question}</span>
                <span style={{ font: "700 22px 'Montserrat',sans-serif", color: '#4ba646', flexShrink: 0 }}>
                    {open ? '−' : '+'}
                </span>
            </button>
            <div style={{ maxHeight: open ? '260px' : 0, overflow: 'hidden', transition: `max-height .35s ${EASE}` }}>
                <p style={{ padding: '0 22px 18px', font: "400 14px/1.7 'Roboto',sans-serif", color: '#4b5563', margin: 0 }}>
                    {answer}
                </p>
            </div>
        </div>
    )
}

function PlaceCard({ image, distance, category, title, description }: (typeof PLACES)[number]) {
    return (
        <div
            className="ays-place"
            style={{
                position: 'relative',
                borderRadius: '20px',
                overflow: 'hidden',
                aspectRatio: '3/4',
                border: '2px solid rgba(118,216,69,.4)',
                transition: `transform .35s ${EASE}, box-shadow .35s, border-color .35s`,
            }}
        >
            <img
                src={image}
                alt={title}
                loading="lazy"
                decoding="async"
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    transition: 'transform .6s ease',
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                        'linear-gradient(to top,rgba(10,18,28,.92) 0%,rgba(10,18,28,.3) 45%,transparent 100%)',
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    top: '14px',
                    left: '14px',
                    background: 'rgba(118,216,69,.9)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: '100px',
                    padding: '5px 12px',
                    font: "700 11px 'Montserrat',sans-serif",
                    color: '#fff',
                }}
            >
                📍 {distance}
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 20px' }}>
                <div
                    style={{
                        font: "700 10px 'Montserrat',sans-serif",
                        color: 'rgba(255,255,255,.55)',
                        textTransform: 'uppercase',
                        letterSpacing: '.1em',
                        marginBottom: '5px',
                    }}
                >
                    {category}
                </div>
                <div style={{ font: "800 22px/1.1 'Montserrat',sans-serif", color: '#fff', marginBottom: '6px' }}>
                    {title}
                </div>
                <div style={{ font: "400 13px/1.5 'Roboto',sans-serif", color: 'rgba(255,255,255,.6)' }}>
                    {description}
                </div>
            </div>
        </div>
    )
}

function CtaButton({
    href,
    onClick,
    children,
    fullWidth = false,
    size = 'xl',
}: {
    href?: string
    onClick?: () => void
    children: React.ReactNode
    fullWidth?: boolean
    size?: 'lg' | 'xl'
}) {
    const style: React.CSSProperties = {
        display: fullWidth ? 'flex' : 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        width: fullWidth ? '100%' : undefined,
        padding: size === 'xl' ? '16px 40px' : '15px 32px',
        font: size === 'xl' ? "700 16px 'Montserrat',sans-serif" : "700 15px 'Montserrat',sans-serif",
        letterSpacing: '.01em',
        background: 'linear-gradient(135deg,#76d845 0%,#4ba646 100%)',
        color: '#fff',
        border: 'none',
        borderRadius: '14px',
        boxShadow: '0 6px 28px rgba(118,216,69,.38)',
        cursor: 'pointer',
        textDecoration: 'none',
        whiteSpace: 'nowrap',
        transition: 'transform .2s, box-shadow .2s',
    }
    if (href) return <a href={href} onClick={onClick} style={style} className="ays-cta">{children}</a>
    return <button type="button" onClick={onClick} style={style} className="ays-cta">{children}</button>
}

// ── Página ──

export default function ArenaYSolMetaClient() {
    const [form, setForm] = useState({ nombre: '', email: '', celular: '', region: '', ciudad: '', como: '' })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [openFaq, setOpenFaq] = useState<number | null>(0)
    const [scrollPct, setScrollPct] = useState(0)
    const [showSticky, setShowSticky] = useState(false)
    const [planoOpen, setPlanoOpen] = useState(false)
    const [planoZoom, setPlanoZoom] = useState(false)
    const rootRef = useRef<HTMLDivElement>(null)

    // Barra de progreso + CTA sticky de mobile (aparece pasado el hero)
    useEffect(() => {
        const onScroll = () => {
            const h = document.documentElement.scrollHeight - window.innerHeight
            const y = window.scrollY || 0
            setScrollPct(h > 0 ? Math.min(100, (y / h) * 100) : 0)
            setShowSticky(window.innerWidth <= 820 && y > window.innerHeight * 0.85)
        }
        onScroll()
        window.addEventListener('scroll', onScroll, { passive: true })
        window.addEventListener('resize', onScroll)
        return () => {
            window.removeEventListener('scroll', onScroll)
            window.removeEventListener('resize', onScroll)
        }
    }, [])

    // Scroll-reveal escalonado. Respeta prefers-reduced-motion.
    useEffect(() => {
        if (typeof IntersectionObserver === 'undefined') return
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (!e.isIntersecting) return
                    const el = e.target as HTMLElement
                    const i = Array.prototype.indexOf.call(el.parentNode?.children ?? [], el)
                    el.style.animation = `fadeInUp .65s ${i * 0.13}s ${EASE} both`
                    io.unobserve(el)
                })
            },
            { threshold: 0.12 }
        )
        const t = setTimeout(() => {
            rootRef.current?.querySelectorAll('[data-animate]').forEach((el) => io.observe(el))
        }, 300)
        return () => {
            clearTimeout(t)
            io.disconnect()
        }
    }, [])

    // Esc cierra el visor del plano; mientras está abierto se bloquea el scroll de fondo.
    useEffect(() => {
        if (!planoOpen) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setPlanoOpen(false)
                setPlanoZoom(false)
            }
        }
        window.addEventListener('keydown', onKey)
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            window.removeEventListener('keydown', onKey)
            document.body.style.overflow = prev
        }
    }, [planoOpen])

    const field = (name: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = e.target.value
        setForm((s) => ({ ...s, [name]: value }))
        setErrors((prev) => {
            if (!prev[name]) return prev
            const next = { ...prev }
            delete next[name]
            return next
        })
    }

    const validate = useCallback(() => {
        const e: Record<string, string> = {}
        if (!form.nombre.trim()) e.nombre = 'Escribe tu nombre para poder contactarte.'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Revisa tu email, parece incompleto.'
        if (form.celular.replace(/\D/g, '').length < 8) e.celular = 'Necesitamos un teléfono válido.'
        if (!form.region) e.region = 'Elige tu región.'
        if (!form.ciudad.trim()) e.ciudad = 'Cuéntanos desde qué ciudad nos escribes.'
        return e
    }, [form])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (status === 'loading') return

        const found = validate()
        if (Object.keys(found).length) {
            setErrors(found)
            return
        }
        setErrors({})
        setStatus('loading')

        try {
            const getCookie = (name: string) => {
                if (typeof document === 'undefined') return undefined
                const value = '; ' + document.cookie
                const parts = value.split('; ' + name + '=')
                if (parts.length === 2) return parts.pop()?.split(';').shift()
                return undefined
            }

            const utm_data = getUtmParams({
                utm_source: 'meta',
                utm_medium: 'paid_social',
                utm_campaign: 'arenaysol_meta',
            })

            // Compartido entre el Pixel del navegador y la CAPI del servidor para
            // que Meta deduplique ambos envíos en un solo Lead.
            const eventId = newEventId()

            const payload = {
                nombre: form.nombre,
                email: form.email,
                celular: form.celular,
                // La tabla leads no tiene columna de región: se adjunta a la ciudad,
                // igual que en la landing de Lomas del Mar, para que el asesor la vea.
                ciudad: form.ciudad + (form.region ? ' (' + form.region + ')' : ''),
                proyecto: 'Arena y Sol - Meta',
                como_conocio: form.como || null,
                ...utm_data,
                fbp: getCookie('_fbp'),
                fbc: getCookie('_fbc'),
                eventId,
            }

            const res = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            if (!res.ok) throw new Error('Error al enviar')

            const w = window as unknown as TrackingWindow

            // Lead del Pixel en el navegador. Su par server-side lo manda /api/leads
            // con el mismo eventId, así Meta se queda con uno solo de los dos.
            w.fbq?.(
                'track',
                'Lead',
                { content_name: 'Arena y Sol - Meta', content_category: 'Real Estate', currency: 'CLP' },
                { eventID: eventId }
            )

            if (w.AliminCRM) {
                const parts = form.nombre.trim().split(/\s+/)
                w.AliminCRM.identify({
                    email: form.email,
                    firstName: parts[0] || '',
                    lastName: parts.slice(1).join(' ') || '',
                    phone: form.celular,
                    project: 'Arena y Sol - Meta',
                    source: 'Sitio Web',
                }).catch((err: unknown) => console.error('CRM Identify Error:', err))
            }

            setStatus('success')
            setForm({ nombre: '', email: '', celular: '', region: '', ciudad: '', como: '' })
        } catch (err) {
            console.error(err)
            setStatus('error')
            setTimeout(() => setStatus('idle'), 4000)
        }
    }

    const toForm = (e?: React.MouseEvent) => {
        e?.preventDefault()
        const el = document.getElementById('registro')
        if (!el) return
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 110, behavior: 'smooth' })
    }

    const loading = status === 'loading'
    const inputBorder = (f: string) => (errors[f] ? 'rgba(239,68,68,.65)' : 'rgba(255,255,255,.15)')

    const inputStyle = (f: string): React.CSSProperties => ({
        width: '100%',
        boxSizing: 'border-box',
        padding: '13px 14px',
        borderRadius: '10px',
        background: 'rgba(255,255,255,.05)',
        color: '#fff',
        border: `1.5px solid ${inputBorder(f)}`,
        outline: 'none',
        font: "400 15px 'Roboto',sans-serif",
    })

    const labelStyle: React.CSSProperties = {
        font: "500 13px 'Montserrat',sans-serif",
        color: 'rgba(255,255,255,.85)',
    }

    const glassCard: React.CSSProperties = {
        background: 'rgba(10,21,32,.72)',
        backdropFilter: 'blur(16px)',
        border: '1.5px solid rgba(118,216,69,.32)',
        boxShadow: '0 16px 44px rgba(0,0,0,.4)',
    }

    return (
        <div ref={rootRef} className="ays-root" style={{ background: '#0e1a24', color: '#fff', overflowX: 'hidden' }}>
            <link
                href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Roboto:wght@300;400;500&display=swap"
                rel="stylesheet"
            />
            <style
                dangerouslySetInnerHTML={{
                    __html: `
html{scroll-behavior:smooth}
.ays-root{font-family:'Roboto',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.ays-root a{text-decoration:none}
.ays-h1{font:800 clamp(2rem,5vw,3.4rem)/1.06 'Montserrat',sans-serif;letter-spacing:-.03em;margin:0 0 20px;max-width:15ch;text-wrap:balance}
.ays-root input,.ays-root button{font-family:inherit}
@keyframes aysFadeInUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
@keyframes fadeInUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
@keyframes aysPulseGreen{0%,100%{box-shadow:0 0 0 0 rgba(118,216,69,.5)}70%{box-shadow:0 0 0 14px rgba(118,216,69,0)}}
@keyframes aysDotPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.45;transform:scale(.75)}}
@keyframes aysSpin{to{transform:rotate(360deg)}}
@keyframes aysMarquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.ays-trust{transition:transform .35s ${EASE},border-color .35s}
.ays-trust:hover{transform:translateY(-5px);border-color:rgba(118,216,69,.7)}
.ays-media img{transition:transform .6s ease}
.ays-media:hover img{transform:scale(1.03)}
.ays-place:hover{transform:translateY(-5px);box-shadow:0 16px 44px rgba(0,0,0,.5);border-color:rgba(118,216,69,.7)}
.ays-place:hover img{transform:scale(1.03)}
.ays-advisor{transition:transform .35s ${EASE},box-shadow .35s}
.ays-advisor:hover{transform:translateY(-5px);box-shadow:0 16px 40px rgba(50,83,102,.16)}
.ays-cta:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(118,216,69,.5)}
.ays-ghost:hover{border-color:rgba(118,216,69,.8);background:rgba(118,216,69,.14)}
.ays-root input:focus{border-color:#76d845 !important;box-shadow:0 0 0 3px rgba(118,216,69,.25)}
.ays-root a:focus-visible,.ays-root button:focus-visible,.ays-root input:focus-visible{outline:2px solid #76d845;outline-offset:2px}
.ays-hero-mobile{display:none}
@media (max-width:768px){
  .ays-hero-desktop{display:none}
  .ays-hero-mobile{display:block}
  .ays-nav-tag{display:none}
}
@media (prefers-reduced-motion:reduce){
  .ays-root *{animation:none !important;transition:none !important}
}
`,
                }}
            />

            {/* ── Header fijo: marquesina + nav verde + progreso de scroll ── */}
            <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 998 }}>
                <div
                    style={{
                        background: '#0a1520',
                        borderBottom: '1px solid rgba(118,216,69,.3)',
                        padding: '9px 0',
                        overflow: 'hidden',
                    }}
                >
                    <div style={{ display: 'flex', width: 'max-content', animation: 'aysMarquee 26s linear infinite' }}>
                        {[0, 1].map((copy) => (
                            <div
                                key={copy}
                                style={{ display: 'flex', alignItems: 'center', gap: '34px', paddingRight: '34px' }}
                                aria-hidden={copy === 1 || undefined}
                            >
                                {MARQUEE_ITEMS.map((item) => (
                                    <span
                                        key={item.text}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '9px',
                                            font: "600 11.5px 'Montserrat',sans-serif",
                                            letterSpacing: '.12em',
                                            textTransform: 'uppercase',
                                            color: item.lima ? '#b8f07a' : 'rgba(255,255,255,.55)',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {item.lima && (
                                            <span
                                                style={{
                                                    width: '8px',
                                                    height: '8px',
                                                    borderRadius: '50%',
                                                    background: '#76d845',
                                                    display: 'block',
                                                    flex: 'none',
                                                    animation: 'aysDotPulse 2s ease-in-out infinite',
                                                }}
                                            />
                                        )}
                                        {item.text}
                                    </span>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                <nav
                    aria-label="Navegación de Arena y Sol"
                    style={{
                        background: 'linear-gradient(135deg,#3a9e48 0%,#4ba646 40%,#62c247 100%)',
                        backdropFilter: 'blur(12px)',
                        borderBottom: '2px solid rgba(255,255,255,.2)',
                        boxShadow: '0 4px 20px rgba(0,0,0,.25)',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '16px',
                            maxWidth: '1160px',
                            margin: '0 auto',
                            padding: '0 24px',
                            height: '72px',
                        }}
                    >
                        <Link href="/" aria-label="Alimin SpA — Inicio" style={{ display: 'block', flex: 'none' }}>
                            <img
                                src="/images/logo-alimin-imagotipo.webp"
                                alt="Alimin SpA"
                                style={{
                                    height: '56px',
                                    width: 'auto',
                                    objectFit: 'contain',
                                    objectPosition: 'left center',
                                    display: 'block',
                                }}
                            />
                        </Link>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span
                                className="ays-nav-tag"
                                style={{
                                    padding: '7px 14px',
                                    borderRadius: '100px',
                                    background: 'rgba(0,0,0,.18)',
                                    border: '1px solid rgba(255,255,255,.3)',
                                    font: "600 11px 'Montserrat',sans-serif",
                                    letterSpacing: '.1em',
                                    textTransform: 'uppercase',
                                    color: '#fff',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                Arena y Sol · El Tabo
                            </span>
                            <a
                                href="#registro"
                                onClick={toForm}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '7px',
                                    padding: '11px 22px',
                                    borderRadius: '100px',
                                    background: '#fff',
                                    color: '#2d7a3a',
                                    font: "700 13px 'Montserrat',sans-serif",
                                    boxShadow: '0 4px 16px rgba(0,0,0,.2)',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                QUIERO MI TERRENO →
                            </a>
                        </div>
                    </div>
                </nav>

                <div style={{ height: '3px', background: 'rgba(255,255,255,.06)' }}>
                    <div
                        style={{
                            height: '100%',
                            background: 'linear-gradient(90deg,#76d845,#4ba646)',
                            width: `${scrollPct}%`,
                            transition: 'width .1s linear',
                        }}
                    />
                </div>
            </header>

            {/* ── 01 · Hero ── */}
            <section
                style={{
                    position: 'relative',
                    minHeight: '94vh',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '170px 20px 72px',
                    overflow: 'hidden',
                }}
            >
                <img
                    className="ays-hero-desktop"
                    src="/images/arena_y_sol/hero-desktop-new.webp"
                    alt="Vista aérea del loteo Arena y Sol en El Tabo"
                    fetchPriority="high"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <img
                    className="ays-hero-mobile"
                    src="/images/arena_y_sol/hero-mobile-new.webp"
                    alt=""
                    fetchPriority="high"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background:
                            'linear-gradient(180deg,rgba(10,21,32,.55) 0%,rgba(10,21,32,.38) 45%,rgba(14,26,36,.85) 100%)',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        top: '-120px',
                        right: '-80px',
                        width: '440px',
                        height: '440px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle,rgba(118,216,69,.10),transparent 70%)',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        bottom: '-160px',
                        left: '-120px',
                        width: '440px',
                        height: '440px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle,rgba(50,83,102,.35),transparent 70%)',
                    }}
                />

                <div style={{ position: 'relative', zIndex: 1, maxWidth: '1160px', margin: '0 auto', width: '100%' }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '14px',
                            marginBottom: '26px',
                            flexWrap: 'wrap',
                            animation: `aysFadeInUp .55s ${EASE} both`,
                        }}
                    >
                        <img
                            src="/images/logo-alimin-imagotipo.webp"
                            alt="Alimin SpA"
                            style={{ height: '44px', width: 'auto', display: 'block' }}
                        />
                        <div
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '9px',
                                padding: '8px 16px',
                                borderRadius: '100px',
                                background: 'rgba(10,18,28,.82)',
                                backdropFilter: 'blur(8px)',
                                border: '1.5px solid rgba(118,216,69,.45)',
                            }}
                        >
                            <span
                                style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: '#76d845',
                                    animation: 'aysDotPulse 2s ease-in-out infinite',
                                    display: 'block',
                                }}
                            />
                            <span
                                style={{
                                    font: "600 12px 'Montserrat',sans-serif",
                                    letterSpacing: '.12em',
                                    textTransform: 'uppercase',
                                    color: '#b8f07a',
                                }}
                            >
                                Estado de proyecto avanzado
                            </span>
                        </div>
                    </div>

                    <h1 className="ays-h1" style={{ animation: `aysFadeInUp .55s .1s ${EASE} both` }}>
                        Proyecto Arena y Sol
                    </h1>

                    <p
                        style={{
                            font: "300 clamp(1rem,2vw,1.15rem)/1.7 'Roboto',sans-serif",
                            color: 'rgba(255,255,255,.72)',
                            maxWidth: '56ch',
                            margin: '0 0 32px',
                            animation: `aysFadeInUp .55s .2s ${EASE} both`,
                        }}
                    >
                        Terrenos 100% urbanizados de 200 m² a 10 minutos de la playa.
                        <br />
                        Sin bancos, sin intereses y con financiamiento directo.
                    </p>

                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '14px',
                            marginBottom: '34px',
                            animation: `aysFadeInUp .55s .3s ${EASE} both`,
                        }}
                    >
                        <CtaButton href="#registro">
                            QUIERO MI TERRENO →
                        </CtaButton>
                        <a
                            href="#loteo"
                            className="ays-ghost"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                padding: '16px 32px',
                                borderRadius: '14px',
                                border: '1.5px solid rgba(118,216,69,.45)',
                                background: 'rgba(118,216,69,.08)',
                                color: '#fff',
                                font: "700 15px 'Montserrat',sans-serif",
                                letterSpacing: '.01em',
                                transition: 'border-color .25s, background .25s',
                            }}
                        >
                            VER EL PROYECTO ↓
                        </a>
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '10px',
                            animation: `aysFadeInUp .55s .4s ${EASE} both`,
                        }}
                    >
                        <Pill>📍 A 10 min de la playa de El Tabo</Pill>
                        <Pill>200 m² por lote</Pill>
                        <Pill>Rol propio</Pill>
                    </div>
                </div>
            </section>

            {/* ── 02 · Barra de confianza ── */}
            <section style={{ position: 'relative', overflow: 'hidden', background: '#0a1520', padding: '56px 20px' }}>
                <img
                    src="/images/arena_y_sol/bg/costa-aerea.webp"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center center',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background:
                            'linear-gradient(180deg,rgba(10,21,32,.5) 0%,rgba(18,37,58,.42) 50%,rgba(10,21,32,.58) 100%)',
                    }}
                />
                <div style={{ position: 'relative', maxWidth: '1160px', margin: '0 auto' }}>
                    <div
                        style={{
                            textAlign: 'center',
                            marginBottom: '26px',
                            font: "600 11.5px 'Montserrat',sans-serif",
                            letterSpacing: '.14em',
                            textTransform: 'uppercase',
                            color: '#b8f07a',
                        }}
                    >
                        Lo que ya está certificado
                    </div>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
                            gap: '16px',
                        }}
                    >
                        {TRUST_ITEMS.map((item) => (
                            <div
                                key={item.title}
                                className="ays-trust"
                                style={{ ...glassCard, textAlign: 'center', padding: '26px 18px', borderRadius: '18px' }}
                            >
                                <span
                                    style={{
                                        display: 'inline-flex',
                                        width: '52px',
                                        height: '52px',
                                        borderRadius: '16px',
                                        background: 'linear-gradient(135deg,#76d845,#4ba646)',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: '14px',
                                        boxShadow: '0 6px 22px rgba(118,216,69,.4)',
                                    }}
                                >
                                    <svg
                                        width="22"
                                        height="22"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#fff"
                                        strokeWidth="2.3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        {item.icon}
                                    </svg>
                                </span>
                                <div style={{ font: "700 15px 'Montserrat',sans-serif", color: '#fff', marginBottom: '5px' }}>
                                    {item.title}
                                </div>
                                <div style={{ font: "300 12.5px/1.6 'Roboto',sans-serif", color: 'rgba(255,255,255,.6)' }}>
                                    {item.desc}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── 04 · Galería del proyecto ── */}
            <section
                id="loteo"
                style={{
                    position: 'relative',
                    overflow: 'hidden',
                    background: 'linear-gradient(165deg,#0e1a24 0%,#12253a 55%,#0a1520 100%)',
                    padding: '80px 20px',
                    scrollMarginTop: '120px',
                }}
            >
                <img
                    src="/images/arena_y_sol/bg/costa-aerea.webp"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background:
                            'linear-gradient(180deg,rgba(10,21,32,.8) 0%,rgba(18,37,58,.68) 45%,rgba(10,21,32,.86) 100%)',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        top: '-120px',
                        right: '-100px',
                        width: '440px',
                        height: '440px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle,rgba(118,216,69,.09),transparent 70%)',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        bottom: '-160px',
                        left: '-120px',
                        width: '440px',
                        height: '440px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle,rgba(50,83,102,.4),transparent 70%)',
                    }}
                />
                <div data-animate style={{ position: 'relative', maxWidth: '1160px', margin: '0 auto' }}>
                    <SectionHeader
                        kicker="Estado actual"
                        title="Así se ve Arena y Sol hoy"
                        subtitle="Fotos reales del loteo, sin renders ni proyecciones."
                    />
                </div>
                <div
                    style={{
                        position: 'relative',
                        maxWidth: '1160px',
                        margin: '0 auto',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))',
                        gap: '16px',
                    }}
                >
                    {GALLERY.map((item) => (
                        <div
                            key={item.src}
                            data-animate
                            className="ays-media"
                            style={{
                                minWidth: 0,
                                borderRadius: '20px',
                                overflow: 'hidden',
                                border: '2px solid rgba(118,216,69,.4)',
                                aspectRatio: '4/3',
                                boxShadow: '0 20px 60px rgba(0,0,0,.4)',
                                position: 'relative',
                            }}
                        >
                            {item.kind === 'img' ? (
                                <img
                                    src={item.src}
                                    alt={item.alt}
                                    loading="lazy"
                                    decoding="async"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                />
                            ) : (
                                <>
                                    <video
                                        src={item.src}
                                        poster={item.poster}
                                        muted
                                        loop
                                        playsInline
                                        autoPlay
                                        controls
                                        preload="none"
                                        aria-label={item.alt}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            display: 'block',
                                            background: '#0a1520',
                                        }}
                                    />
                                    <span
                                        style={{
                                            position: 'absolute',
                                            top: '12px',
                                            left: '12px',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '7px',
                                            padding: '6px 12px',
                                            borderRadius: '100px',
                                            background: 'rgba(10,18,28,.82)',
                                            backdropFilter: 'blur(8px)',
                                            border: '1px solid rgba(118,216,69,.35)',
                                            font: "700 10.5px 'Montserrat',sans-serif",
                                            letterSpacing: '.08em',
                                            textTransform: 'uppercase',
                                            color: '#b8f07a',
                                            pointerEvents: 'none',
                                        }}
                                    >
                                        {item.label}
                                    </span>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* ── 04b · Ubicación satelital ── */}
            <section style={{ position: 'relative', background: '#0e1a24', padding: '80px 20px', overflow: 'hidden' }}>
                <div
                    style={{
                        position: 'absolute',
                        top: '-140px',
                        left: '-120px',
                        width: '440px',
                        height: '440px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle,rgba(118,216,69,.09),transparent 70%)',
                    }}
                />
                <div style={{ position: 'relative', maxWidth: '1160px', margin: '0 auto' }}>
                    <div data-animate>
                        <SectionHeader
                            kicker="Dónde estamos"
                            title="Arena y Sol · El Tabo"
                            subtitle="📍 Litoral Central · Región de Valparaíso · A 10 minutos de la playa de El Tabo."
                        />
                    </div>
                    <div
                        data-animate
                        style={{
                            borderRadius: '20px',
                            overflow: 'hidden',
                            border: '2px solid rgba(118,216,69,.4)',
                            boxShadow: '0 20px 60px rgba(0,0,0,.5)',
                            background: '#0a1520',
                        }}
                    >
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d3329.5!2d-71.6290669!3d-33.4347434!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x96621500467b67e5%3A0x82414c1c5c44ed77!2sArena%20y%20Sol%20-%20Alimin%20SPA!5e1!3m2!1ses!2scl!4v1719000000000"
                            title="Mapa satelital de Arena y Sol, El Tabo"
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            allowFullScreen
                            style={{ display: 'block', border: 0, width: '100%', height: '460px' }}
                        />
                    </div>
                    <div data-animate style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '22px' }}>
                        <Pill>🚗 1h 40min desde Santiago por Ruta 78</Pill>
                        <Pill>🏖 10 min a la playa de El Tabo</Pill>
                        <Pill>🌲 Entorno de bosque</Pill>
                        <a
                            href="https://www.google.com/maps/place/Arena+y+Sol+-+Alimin+SPA/@-33.4347831,-71.6303648,613m/data=!3m1!1e3"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                padding: '9px 16px',
                                borderRadius: '100px',
                                background: 'rgba(118,216,69,.12)',
                                border: '1.5px solid rgba(118,216,69,.4)',
                                font: "700 12.5px 'Montserrat',sans-serif",
                                color: '#b8f07a',
                            }}
                        >
                            VER EN GOOGLE MAPS →
                        </a>
                    </div>
                </div>
            </section>

            {/* ── 05 · Tu terreno (banda clara) ── */}
            <section
                style={{
                    position: 'relative',
                    overflow: 'hidden',
                    background: '#f5f9f0',
                    padding: '80px 20px',
                    color: '#1a2b3d',
                }}
            >
                <img
                    src="/images/arena_y_sol/bg/litoral-atardecer.webp"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center 40%',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background:
                            'linear-gradient(180deg,rgba(245,249,240,.82) 0%,rgba(245,249,240,.92) 45%,rgba(234,247,216,.9) 100%)',
                    }}
                />
                <div style={{ position: 'relative', maxWidth: '1160px', margin: '0 auto' }}>
                    <div data-animate>
                        <SectionHeader
                            dark={false}
                            kicker="Tu terreno"
                            title="200 m² con rol propio"
                            subtitle="Todos los lotes son iguales: 200 m², urbanizados y con escritura individual a tu nombre."
                        />
                    </div>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))',
                            gap: '24px',
                            alignItems: 'start',
                        }}
                    >
                        <div
                            data-animate
                            style={{
                                background: '#fff',
                                borderRadius: '18px',
                                border: '1px solid #eef3ec',
                                boxShadow: '0 4px 20px rgba(50,83,102,.07)',
                                overflow: 'hidden',
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => {
                                    setPlanoOpen(true)
                                    setPlanoZoom(false)
                                }}
                                aria-label="Ampliar el plano del loteo Arena y Sol"
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    padding: 0,
                                    border: 'none',
                                    background: 'none',
                                    cursor: 'zoom-in',
                                    position: 'relative',
                                }}
                            >
                                <img
                                    src="/assets/venta-terrenos/plano-arena-y-sol.webp"
                                    alt="Plano del loteo Arena y Sol con la distribución de los lotes"
                                    loading="lazy"
                                    decoding="async"
                                    style={{ width: '100%', display: 'block' }}
                                />
                                <span
                                    style={{
                                        position: 'absolute',
                                        bottom: '12px',
                                        right: '12px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '7px',
                                        padding: '8px 14px',
                                        borderRadius: '100px',
                                        background: 'rgba(10,21,32,.82)',
                                        backdropFilter: 'blur(8px)',
                                        border: '1.5px solid rgba(118,216,69,.4)',
                                        font: "700 11.5px 'Montserrat',sans-serif",
                                        letterSpacing: '.06em',
                                        color: '#b8f07a',
                                    }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#76d845" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                                        <circle cx="11" cy="11" r="7" />
                                        <path d="M21 21l-4.3-4.3M11 8v6M8 11h6" />
                                    </svg>
                                    AMPLIAR PLANO
                                </span>
                            </button>
                            <div style={{ padding: '16px 20px', font: "300 13px 'Roboto',sans-serif", color: '#4b5563' }}>
                                Plano oficial del loteo. Haz clic para ampliar; los lotes disponibles te los marcamos al
                                cotizar.
                            </div>
                        </div>

                        <div
                            data-animate
                            style={{
                                background: '#fff',
                                borderRadius: '18px',
                                border: '1px solid #eef3ec',
                                boxShadow: '0 4px 20px rgba(50,83,102,.07)',
                                padding: '30px',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '22px' }}>
                                <span style={{ font: "900 44px 'Montserrat',sans-serif", letterSpacing: '-.03em', color: '#1a2b3d' }}>
                                    200
                                </span>
                                <span style={{ font: "700 18px 'Montserrat',sans-serif", color: '#4ba646' }}>m²</span>
                            </div>
                            <div style={{ display: 'grid', gap: '12px', marginBottom: '26px' }}>
                                {[
                                    'Rol propio, escritura a tu nombre',
                                    'Agua certificada lista en terreno',
                                    'Luz eléctrica en el loteo',
                                    'Portón automático de acceso',
                                    'A 10 minutos de la playa de El Tabo',
                                ].map((t) => (
                                    <div
                                        key={t}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            font: "400 14.5px 'Roboto',sans-serif",
                                            color: '#4b5563',
                                        }}
                                    >
                                        <span style={{ color: '#4ba646', fontWeight: 700 }}>✓</span> {t}
                                    </div>
                                ))}
                            </div>
                            <div
                                style={{
                                    background: '#f5f9f0',
                                    border: '1px solid #e0eecc',
                                    borderRadius: '14px',
                                    padding: '18px 20px',
                                    marginBottom: '22px',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'baseline',
                                        marginBottom: '10px',
                                        gap: '10px',
                                    }}
                                >
                                    <span style={{ font: "700 14px 'Montserrat',sans-serif", color: '#1a2b3d' }}>
                                        {LOTES_DISPONIBLES} de {LOTES_TOTALES} terrenos disponibles
                                    </span>
                                    <span style={{ font: "600 12px 'Montserrat',sans-serif", color: '#4ba646' }}>
                                        {VENDIDOS_PCT}% vendido
                                    </span>
                                </div>
                                <div
                                    role="progressbar"
                                    aria-valuenow={VENDIDOS_PCT}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-label="Porcentaje de terrenos vendidos"
                                    style={{ height: '9px', borderRadius: '100px', background: '#e2ebd8', overflow: 'hidden' }}
                                >
                                    <div
                                        style={{
                                            height: '100%',
                                            borderRadius: '100px',
                                            background: 'linear-gradient(90deg,#76d845,#4ba646)',
                                            width: `${VENDIDOS_PCT}%`,
                                        }}
                                    />
                                </div>
                            </div>
                            <CtaButton href="#registro" fullWidth size="lg">
                                QUIERO MI TERRENO →
                            </CtaButton>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── 06 · Precio ── */}
            <section style={{ background: '#0e1a24', padding: '80px 20px', position: 'relative', overflow: 'hidden' }}>
                <img
                    src="/images/arena_y_sol/bg/litoral-atardecer.webp"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center 65%',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background:
                            'linear-gradient(180deg,rgba(14,26,36,.88) 0%,rgba(50,83,102,.7) 50%,rgba(14,26,36,.92) 100%)',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        right: '-120px',
                        width: '440px',
                        height: '440px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle,rgba(118,216,69,.08),transparent 70%)',
                    }}
                />
                <div style={{ maxWidth: '1160px', margin: '0 auto', position: 'relative' }}>
                    <div data-animate>
                        <SectionHeader
                            kicker="Inversión"
                            title="Precio claro, sin letra chica"
                            subtitle="Pie, cuotas y valor total. Todo en pesos y fijo desde el primer día."
                        />
                    </div>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))',
                            gap: '24px',
                            alignItems: 'start',
                        }}
                    >
                        <div
                            data-animate
                            style={{
                                background: 'linear-gradient(155deg,#325366 0%,#1a2b3d 100%)',
                                border: '2px solid rgba(118,216,69,.4)',
                                borderRadius: '22px',
                                padding: '32px',
                                boxShadow: '0 20px 60px rgba(0,0,0,.5)',
                            }}
                        >
                            <div
                                style={{
                                    font: "600 11px 'Montserrat',sans-serif",
                                    letterSpacing: '.12em',
                                    textTransform: 'uppercase',
                                    color: '#76d845',
                                    marginBottom: '20px',
                                }}
                            >
                                Terreno de 200 m²
                            </div>
                            <div style={{ display: 'grid', gap: 0 }}>
                                {PRICE_ROWS.map((row) => (
                                    <div
                                        key={row.label}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'baseline',
                                            padding: '14px 0',
                                            borderBottom: '1px solid rgba(255,255,255,.1)',
                                            gap: '12px',
                                        }}
                                    >
                                        <span style={{ font: "300 14.5px 'Roboto',sans-serif", color: 'rgba(255,255,255,.6)' }}>
                                            {row.label}
                                        </span>
                                        <span
                                            style={{
                                                font: "700 16px 'Montserrat',sans-serif",
                                                color: row.lima ? '#b8f07a' : undefined,
                                            }}
                                        >
                                            {row.value}
                                        </span>
                                    </div>
                                ))}
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'baseline',
                                        padding: '18px 0 0',
                                        gap: '12px',
                                    }}
                                >
                                    <span style={{ font: "700 15px 'Montserrat',sans-serif" }}>Valor total</span>
                                    <span style={{ font: "900 26px 'Montserrat',sans-serif", letterSpacing: '-.02em' }}>
                                        $42.000.000
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div data-animate style={{ display: 'grid', gap: '18px' }}>
                            <div
                                style={{
                                    background: 'rgba(14,26,36,.75)',
                                    backdropFilter: 'blur(16px)',
                                    border: '2px solid rgba(118,216,69,.45)',
                                    borderRadius: '22px',
                                    padding: '30px',
                                    boxShadow: '0 20px 60px rgba(0,0,0,.5)',
                                }}
                            >
                                <div
                                    style={{
                                        font: "600 11px 'Montserrat',sans-serif",
                                        letterSpacing: '.12em',
                                        textTransform: 'uppercase',
                                        color: '#76d845',
                                        marginBottom: '12px',
                                    }}
                                >
                                    Pago contado
                                </div>
                                <div
                                    style={{
                                        font: "900 clamp(2rem,4vw,2.6rem) 'Montserrat',sans-serif",
                                        letterSpacing: '-.03em',
                                        marginBottom: '8px',
                                    }}
                                >
                                    $39.000.000
                                </div>
                                <div
                                    style={{
                                        display: 'inline-block',
                                        padding: '7px 14px',
                                        borderRadius: '8px',
                                        background: 'rgba(118,216,69,.15)',
                                        border: '1.5px solid rgba(118,216,69,.35)',
                                        font: "700 13px 'Montserrat',sans-serif",
                                        color: '#b8f07a',
                                    }}
                                >
                                    Ahorras $3.000.000
                                </div>
                                <p
                                    style={{
                                        font: "300 13.5px/1.7 'Roboto',sans-serif",
                                        color: 'rgba(255,255,255,.55)',
                                        margin: '18px 0 0',
                                    }}
                                >
                                    Precios en pesos, fijos. Sin UF, sin sorpresas.
                                </p>
                            </div>
                            <CtaButton href="#registro" fullWidth>
                                QUIERO COTIZAR MI TERRENO →
                            </CtaButton>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── 07 · Lugares cercanos ── */}
            <section style={{ position: 'relative', padding: '80px 20px', overflow: 'hidden', background: '#0a1520' }}>
                <img
                    src="/images/arena_y_sol/bg/litoral-atardecer.webp"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center center',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background:
                            'linear-gradient(180deg,rgba(10,21,32,.78) 0%,rgba(10,21,32,.62) 45%,rgba(10,21,32,.84) 100%)',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        top: '-140px',
                        right: '-120px',
                        width: '440px',
                        height: '440px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle,rgba(118,216,69,.08),transparent 70%)',
                    }}
                />
                <div style={{ position: 'relative', maxWidth: '1160px', margin: '0 auto' }}>
                    <div data-animate>
                        <SectionHeader
                            kicker="Zona de alta plusvalía"
                            title={
                                <>
                                    Todo lo que te espera
                                    <br />a minutos de tu terreno
                                </>
                            }
                            subtitle="Arena y Sol está rodeado de los destinos más icónicos del Litoral Central de Chile."
                        />
                    </div>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
                            gap: '20px',
                            marginBottom: '36px',
                        }}
                    >
                        {PLACES.map((p) => (
                            <div key={p.title} data-animate>
                                <PlaceCard {...p} />
                            </div>
                        ))}
                    </div>
                    <div data-animate style={{ display: 'flex', justifyContent: 'center' }}>
                        <CtaButton href="#registro">
                            QUIERO MI TERRENO AQUÍ →
                        </CtaButton>
                    </div>
                    <p
                        data-animate
                        style={{
                            textAlign: 'center',
                            font: "400 13px 'Roboto',sans-serif",
                            color: 'rgba(255,255,255,.45)',
                            margin: '18px 0 0',
                        }}
                    >
                        Todo esto a minutos de Arena y Sol
                    </p>
                </div>
            </section>

            {/* ── 08 · Formulario ── */}
            <section
                id="registro"
                style={{
                    position: 'relative',
                    overflow: 'hidden',
                    background: '#0a1520',
                    padding: '80px 20px',
                    scrollMarginTop: '120px',
                }}
            >
                <img
                    src="/images/arena_y_sol/gallery-2.webp"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background:
                            'linear-gradient(180deg,rgba(10,21,32,.9) 0%,rgba(18,37,58,.86) 50%,rgba(10,21,32,.94) 100%)',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        top: '-140px',
                        left: '-100px',
                        width: '440px',
                        height: '440px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle,rgba(118,216,69,.1),transparent 70%)',
                    }}
                />
                <div style={{ position: 'relative', maxWidth: '1160px', margin: '0 auto' }}>
                    <div data-animate>
                        <SectionHeader
                            kicker="Reserva"
                            title="Reserva tu terreno en Arena y Sol"
                            subtitle="Te contactamos hoy mismo con la disponibilidad real y la forma de pago."
                        />
                    </div>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))',
                            gap: '28px',
                            alignItems: 'start',
                        }}
                    >
                        <div
                            style={{
                                background: 'rgba(14,26,36,.75)',
                                backdropFilter: 'blur(24px)',
                                border: '2px solid rgba(118,216,69,.4)',
                                borderRadius: '24px',
                                padding: '32px',
                                boxShadow: '0 20px 60px rgba(0,0,0,.5)',
                            }}
                        >
                            {status === 'success' ? (
                                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                    <div
                                        style={{
                                            width: '64px',
                                            height: '64px',
                                            borderRadius: '50%',
                                            background: 'rgba(118,216,69,.15)',
                                            border: '2px solid rgba(118,216,69,.5)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto 20px',
                                        }}
                                    >
                                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#76d845" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </div>
                                    <h3 style={{ font: "800 24px 'Montserrat',sans-serif", letterSpacing: '-.02em', margin: '0 0 10px' }}>
                                        Listo, recibimos tus datos
                                    </h3>
                                    <p
                                        style={{
                                            font: "300 15px/1.7 'Roboto',sans-serif",
                                            color: 'rgba(255,255,255,.6)',
                                            margin: '0 0 22px',
                                        }}
                                    >
                                        Un asesor te va a contactar hoy mismo con la disponibilidad real de Arena y Sol.
                                    </p>
                                    <a
                                        href={WA_GENERAL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '9px',
                                            padding: '15px 28px',
                                            borderRadius: '14px',
                                            background: 'linear-gradient(135deg,#25D366,#1aad54)',
                                            color: '#fff',
                                            font: "700 14px 'Montserrat',sans-serif",
                                        }}
                                    >
                                        ESCRIBIR POR WHATSAPP AHORA →
                                    </a>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} noValidate style={{ display: 'grid', gap: '16px' }}>
                                    <div style={{ display: 'grid', gap: '6px' }}>
                                        <label htmlFor="f-nombre" style={labelStyle}>Nombre *</label>
                                        <input
                                            id="f-nombre"
                                            name="nombre"
                                            type="text"
                                            autoComplete="name"
                                            placeholder="Tu nombre y apellido"
                                            value={form.nombre}
                                            onChange={field('nombre')}
                                            aria-invalid={!!errors.nombre}
                                            aria-describedby={errors.nombre ? 'err-nombre' : undefined}
                                            style={inputStyle('nombre')}
                                        />
                                        {errors.nombre && (
                                            <span id="err-nombre" style={{ font: "400 12.5px 'Roboto',sans-serif", color: '#FCA5A5' }}>
                                                {errors.nombre}
                                            </span>
                                        )}
                                    </div>

                                    <div style={{ display: 'grid', gap: '6px' }}>
                                        <label htmlFor="f-email" style={labelStyle}>Correo electrónico *</label>
                                        <input
                                            id="f-email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            placeholder="tucorreo@mail.com"
                                            value={form.email}
                                            onChange={field('email')}
                                            aria-invalid={!!errors.email}
                                            aria-describedby={errors.email ? 'err-email' : undefined}
                                            style={inputStyle('email')}
                                        />
                                        {errors.email && (
                                            <span id="err-email" style={{ font: "400 12.5px 'Roboto',sans-serif", color: '#FCA5A5' }}>
                                                {errors.email}
                                            </span>
                                        )}
                                    </div>

                                    <div
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
                                            gap: '16px',
                                        }}
                                    >
                                        <div style={{ display: 'grid', gap: '6px' }}>
                                            <label htmlFor="f-celular" style={labelStyle}>Teléfono / WhatsApp *</label>
                                            <input
                                                id="f-celular"
                                                name="celular"
                                                type="tel"
                                                autoComplete="tel"
                                                placeholder="+56 9 1234 5678"
                                                value={form.celular}
                                                onChange={field('celular')}
                                                aria-invalid={!!errors.celular}
                                                aria-describedby={errors.celular ? 'err-celular' : undefined}
                                                style={inputStyle('celular')}
                                            />
                                            {errors.celular && (
                                                <span id="err-celular" style={{ font: "400 12.5px 'Roboto',sans-serif", color: '#FCA5A5' }}>
                                                    {errors.celular}
                                                </span>
                                            )}
                                        </div>

                                    <div style={{ display: 'grid', gap: '6px' }}>
                                        <label htmlFor="f-region" style={labelStyle}>Región *</label>
                                        <select
                                            id="f-region"
                                            name="region"
                                            value={form.region}
                                            onChange={field('region')}
                                            aria-invalid={!!errors.region}
                                            aria-describedby={errors.region ? 'err-region' : undefined}
                                            style={{ ...inputStyle('region'), appearance: 'none', WebkitAppearance: 'none' }}
                                        >
                                            <option value="">Selecciona tu región</option>
                                            {REGIONES.map((r) => (
                                                <option key={r} value={r} style={{ color: '#1a2b3d' }}>
                                                    {r === 'Metropolitana' ? 'Región Metropolitana' : r}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.region && (
                                            <span id="err-region" style={{ font: "400 12.5px 'Roboto',sans-serif", color: '#FCA5A5' }}>
                                                {errors.region}
                                            </span>
                                        )}
                                    </div>
                                        <div style={{ display: 'grid', gap: '6px' }}>
                                            <label htmlFor="f-ciudad" style={labelStyle}>Ciudad *</label>
                                            <input
                                                id="f-ciudad"
                                                name="ciudad"
                                                type="text"
                                                autoComplete="address-level2"
                                                placeholder="Santiago, Rancagua…"
                                                value={form.ciudad}
                                                onChange={field('ciudad')}
                                                aria-invalid={!!errors.ciudad}
                                                aria-describedby={errors.ciudad ? 'err-ciudad' : undefined}
                                                style={inputStyle('ciudad')}
                                            />
                                            {errors.ciudad && (
                                                <span id="err-ciudad" style={{ font: "400 12.5px 'Roboto',sans-serif", color: '#FCA5A5' }}>
                                                    {errors.ciudad}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gap: '6px' }}>
                                        <label htmlFor="f-como" style={labelStyle}>¿Cómo nos conociste?</label>
                                        <select
                                            id="f-como"
                                            name="como"
                                            value={form.como}
                                            onChange={field('como')}
                                            style={{ ...inputStyle('como'), appearance: 'none', WebkitAppearance: 'none' }}
                                        >
                                            <option value="">Selecciona una opción</option>
                                            {CANALES.map((c) => (
                                                <option key={c} value={c} style={{ color: '#1a2b3d' }}>
                                                    {c === 'Recomendación'
                                                        ? 'Recomendación de un amigo'
                                                        : c === 'Google'
                                                          ? 'Google / Búsqueda web'
                                                          : c}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        style={{
                                            marginTop: '6px',
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '10px',
                                            padding: '17px 24px',
                                            border: 'none',
                                            borderRadius: '14px',
                                            background: 'linear-gradient(135deg,#325366,#4ba646)',
                                            color: '#fff',
                                            font: "700 15px 'Montserrat',sans-serif",
                                            letterSpacing: '.01em',
                                            cursor: loading ? 'progress' : 'pointer',
                                            boxShadow: '0 6px 28px rgba(118,216,69,.28)',
                                            opacity: loading ? 0.75 : 1,
                                        }}
                                    >
                                        {loading && (
                                            <span
                                                style={{
                                                    width: '16px',
                                                    height: '16px',
                                                    borderRadius: '50%',
                                                    border: '2px solid rgba(255,255,255,.35)',
                                                    borderTopColor: '#fff',
                                                    animation: 'aysSpin .8s linear infinite',
                                                    display: 'block',
                                                }}
                                            />
                                        )}
                                        {loading ? 'ENVIANDO…' : 'RESERVAR MI TERRENO →'}
                                    </button>

                                    {status === 'error' && (
                                        <p
                                            role="alert"
                                            style={{
                                                font: "400 13px/1.6 'Roboto',sans-serif",
                                                color: '#FCA5A5',
                                                margin: 0,
                                                textAlign: 'center',
                                            }}
                                        >
                                            No pudimos enviar tus datos. Inténtalo de nuevo o escríbenos por WhatsApp.
                                        </p>
                                    )}

                                    <p
                                        style={{
                                            font: "300 12.5px/1.6 'Roboto',sans-serif",
                                            color: 'rgba(255,255,255,.45)',
                                            margin: '4px 0 0',
                                            textAlign: 'center',
                                        }}
                                    >
                                        🔒 Tus datos solo se usan para contactarte. No los compartimos con nadie.
                                    </p>
                                </form>
                            )}
                        </div>

                        <div data-animate style={{ display: 'grid', gap: '18px' }}>
                            <div
                                style={{
                                    position: 'relative',
                                    borderRadius: '22px',
                                    overflow: 'hidden',
                                    border: '2px solid rgba(118,216,69,.4)',
                                    boxShadow: '0 20px 60px rgba(0,0,0,.5)',
                                    aspectRatio: '4/3',
                                }}
                            >
                                <img
                                    src="/images/arena_y_sol/obra/cierre-porton.webp"
                                    alt="Muro perimetral y portón automático del loteo Arena y Sol"
                                    loading="lazy"
                                    decoding="async"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                />
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'linear-gradient(to top,rgba(10,18,28,.9) 0%,transparent 60%)',
                                    }}
                                />
                                <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px' }}>
                                    <div
                                        style={{
                                            font: "600 10.5px 'Montserrat',sans-serif",
                                            letterSpacing: '.12em',
                                            textTransform: 'uppercase',
                                            color: '#76d845',
                                            marginBottom: '6px',
                                        }}
                                    >
                                        El Tabo · Litoral Central
                                    </div>
                                    <div style={{ font: "800 20px 'Montserrat',sans-serif", letterSpacing: '-.02em', color: '#fff' }}>
                                        Quedan {LOTES_DISPONIBLES} de {LOTES_TOTALES} lotes de 200 m²
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── 09 · Preguntas frecuentes ── */}
            <section style={{ background: 'linear-gradient(160deg,#eaf7d8 0%,#f2fce8 50%,#e4f5d4 100%)', padding: '80px 20px' }}>
                <div style={{ maxWidth: '760px', margin: '0 auto' }}>
                    <div data-animate>
                        <SectionHeader
                            dark={false}
                            kicker="Preguntas frecuentes"
                            title="Lo que todos preguntan antes de comprar"
                        />
                    </div>
                    <div style={{ display: 'grid', gap: '12px' }}>
                        {FAQ_ARENA_Y_SOL.map((item, i) => (
                            <FaqItem
                                key={item.question}
                                question={item.question}
                                answer={item.answer}
                                open={openFaq === i}
                                onToggle={() => setOpenFaq((prev) => (prev === i ? null : i))}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* ── 10 · Asesores ── */}
            <section
                style={{
                    position: 'relative',
                    background: 'linear-gradient(160deg,#f5f9f0 0%,#eaf7d8 55%,#e4f5d4 100%)',
                    padding: '80px 20px',
                    overflow: 'hidden',
                }}
            >
                <div style={{ maxWidth: '1160px', margin: '0 auto', position: 'relative' }}>
                    <div data-animate>
                        <SectionHeader
                            dark={false}
                            kicker="Equipo comercial"
                            title="Habla con un asesor ahora"
                            subtitle="Contáctanos directamente por WhatsApp. Respondemos en minutos."
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '24px' }}>
                        {ADVISORS.map((a) => (
                            <div
                                key={a.name}
                                data-animate
                                className="ays-advisor"
                                style={{
                                    background: '#fff',
                                    borderRadius: '18px',
                                    border: '1px solid #eef3ec',
                                    boxShadow: '0 4px 20px rgba(50,83,102,.07)',
                                    overflow: 'hidden',
                                }}
                            >
                                <div style={{ position: 'relative', height: '320px', overflow: 'hidden', background: '#eaf7d8' }}>
                                    <img
                                        src={a.photo}
                                        alt={a.name}
                                        loading="lazy"
                                        decoding="async"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'contain',
                                            objectPosition: 'center bottom',
                                            display: 'block',
                                        }}
                                    />
                                    <div
                                        style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            left: 0,
                                            right: 0,
                                            padding: '18px 22px',
                                            background: 'linear-gradient(to top,rgba(26,43,61,.9) 0%,transparent 100%)',
                                        }}
                                    >
                                        <div
                                            style={{
                                                font: "600 10px 'Montserrat',sans-serif",
                                                color: '#b8f07a',
                                                textTransform: 'uppercase',
                                                letterSpacing: '.1em',
                                                marginBottom: '4px',
                                            }}
                                        >
                                            {a.role}
                                        </div>
                                        <div style={{ font: "800 22px 'Montserrat',sans-serif", color: '#fff' }}>{a.name}</div>
                                    </div>
                                </div>
                                <div style={{ padding: '22px' }}>
                                    <p style={{ font: "400 13.5px/1.7 'Roboto',sans-serif", color: '#4b5563', margin: '0 0 16px' }}>
                                        {a.blurb}
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '16px' }}>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4ba646" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.6 19.79 19.79 0 0 1 1.62 5a2 2 0 0 1 1.99-2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.09" />
                                        </svg>
                                        <span style={{ font: "400 13px 'Roboto',sans-serif", color: '#64748b' }}>{a.phoneLabel}</span>
                                    </div>
                                    <a
                                        href={a.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '9px',
                                            padding: '14px 20px',
                                            borderRadius: '14px',
                                            background: 'linear-gradient(135deg,#25D366,#1aad54)',
                                            color: '#fff',
                                            font: "700 14px 'Montserrat',sans-serif",
                                            boxShadow: '0 6px 24px rgba(37,211,102,.3)',
                                        }}
                                    >
                                        <svg width="17" height="17" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                                            <path d={WA_PATH} />
                                        </svg>
                                        {a.cta}
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer style={{ background: '#4ba646', padding: '48px 20px 36px', borderTop: '2px solid rgba(255,255,255,.15)' }}>
                <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: '28px',
                            paddingBottom: '32px',
                            borderBottom: '1px solid rgba(255,255,255,.2)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <img
                                src="/images/logo-alimin-imagotipo.webp"
                                alt="Alimin SpA"
                                loading="lazy"
                                style={{ height: '54px', width: 'auto', objectFit: 'contain', display: 'block' }}
                            />
                            <div>
                                <div style={{ font: "700 12px 'Roboto',sans-serif", color: '#0a2a0a' }}>Inmobiliaria SpA</div>
                                <div style={{ font: "600 11px 'Roboto',sans-serif", color: 'rgba(255,255,255,.9)', marginTop: '1px' }}>
                                    Litoral Central, Chile
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0a2a0a" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                    <polyline points="22,6 12,13 2,6" />
                                </svg>
                                <a href="mailto:bienesraices@aliminspa.cl" style={{ font: "700 14px 'Roboto',sans-serif", color: '#fff' }}>
                                    bienesraices@aliminspa.cl
                                </a>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <span style={{ font: "700 12px 'Roboto',sans-serif", color: 'rgba(255,255,255,.9)' }}>Síguenos:</span>
                                <a
                                    href="https://www.instagram.com/aliminspa"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Instagram de Alimin"
                                    style={{ color: '#fff', display: 'flex' }}
                                >
                                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                                        <rect x="2" y="2" width="20" height="20" rx="5" />
                                        <circle cx="12" cy="12" r="4" />
                                        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                                    </svg>
                                </a>
                                <a
                                    href="https://www.facebook.com/aliminspa"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Facebook de Alimin"
                                    style={{ color: '#fff', display: 'flex' }}
                                >
                                    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div
                        style={{
                            paddingTop: '24px',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '10px',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <span style={{ font: "400 12px 'Roboto',sans-serif", color: 'rgba(255,255,255,.85)' }}>
                            © 2026 Alimin SpA · aliminspa.cl · Todos los derechos reservados
                        </span>
                        <span style={{ font: "400 12px 'Roboto',sans-serif", color: 'rgba(255,255,255,.7)' }}>
                            Disponibilidad sujeta a los lotes que quedan en Arena y Sol
                        </span>
                    </div>
                </div>
            </footer>

            {/* ── WhatsApp flotante ── */}
            <a
                href={WA_GENERAL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Escríbenos por WhatsApp"
                style={{
                    position: 'fixed',
                    bottom: showSticky ? '96px' : '24px',
                    right: '24px',
                    width: '58px',
                    height: '58px',
                    background: 'linear-gradient(135deg,#25D366,#1aad54)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 24px rgba(118,216,69,.45)',
                    zIndex: 999,
                    animation: 'aysPulseGreen 2.8s ease-in-out infinite',
                    transition: `bottom .3s ${EASE}`,
                }}
            >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                    <path d={WA_PATH} />
                </svg>
            </a>

            {/* ── Visor del plano ── */}
            {planoOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Plano del loteo Arena y Sol"
                    onClick={() => {
                        setPlanoOpen(false)
                        setPlanoZoom(false)
                    }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 1000,
                        background: 'rgba(6,13,20,.94)',
                        backdropFilter: 'blur(6px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '24px',
                        overflow: 'auto',
                        cursor: 'zoom-out',
                    }}
                >
                    <img
                        src="/assets/venta-terrenos/plano-arena-y-sol.webp"
                        alt="Plano del loteo Arena y Sol ampliado"
                        onClick={(e) => {
                            e.stopPropagation()
                            setPlanoZoom((z) => !z)
                        }}
                        style={{
                            maxWidth: 'none',
                            width: planoZoom ? '190%' : 'min(96vw,1100px)',
                            borderRadius: '14px',
                            border: '2px solid rgba(118,216,69,.4)',
                            boxShadow: '0 30px 80px rgba(0,0,0,.7)',
                            transition: `width .4s ${EASE}`,
                            cursor: planoZoom ? 'zoom-out' : 'zoom-in',
                        }}
                    />
                    <button
                        type="button"
                        aria-label="Cerrar el plano"
                        onClick={(e) => {
                            e.stopPropagation()
                            setPlanoOpen(false)
                            setPlanoZoom(false)
                        }}
                        style={{
                            position: 'fixed',
                            top: '20px',
                            right: '20px',
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            background: 'rgba(14,26,36,.9)',
                            border: '1.5px solid rgba(118,216,69,.45)',
                            color: '#b8f07a',
                            font: "700 20px 'Montserrat',sans-serif",
                            cursor: 'pointer',
                        }}
                    >
                        ×
                    </button>
                    <div
                        style={{
                            position: 'fixed',
                            bottom: '22px',
                            left: 0,
                            right: 0,
                            textAlign: 'center',
                            font: "600 11.5px 'Montserrat',sans-serif",
                            letterSpacing: '.1em',
                            textTransform: 'uppercase',
                            color: 'rgba(255,255,255,.5)',
                            pointerEvents: 'none',
                        }}
                    >
                        Clic en el plano para {planoZoom ? 'reducir' : 'hacer zoom'} · Esc o fondo para cerrar
                    </div>
                </div>
            )}

            {/* ── CTA sticky de mobile ── */}
            {showSticky && (
                <div
                    style={{
                        position: 'fixed',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 997,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        padding: '12px 14px 14px',
                        background: 'rgba(10,21,32,.94)',
                        backdropFilter: 'blur(12px)',
                        borderTop: '1.5px solid rgba(118,216,69,.35)',
                    }}
                >
                    <div>
                        <div style={{ font: "700 13px 'Montserrat',sans-serif", color: '#b8f07a' }}>
                            Quedan {LOTES_DISPONIBLES} terrenos
                        </div>
                        <div style={{ font: "300 12px 'Roboto',sans-serif", color: 'rgba(255,255,255,.55)' }}>
                            200 m² · El Tabo
                        </div>
                    </div>
                    <a
                        href="#registro"
                        onClick={toForm}
                        style={{
                            flex: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '7px',
                            padding: '13px 20px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg,#76d845,#4ba646)',
                            color: '#fff',
                            font: "700 13px 'Montserrat',sans-serif",
                            boxShadow: '0 6px 28px rgba(118,216,69,.38)',
                        }}
                    >
                        QUIERO MI TERRENO →
                    </a>
                </div>
            )}
        </div>
    )
}
