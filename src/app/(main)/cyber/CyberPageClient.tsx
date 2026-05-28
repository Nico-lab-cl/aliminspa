'use client'

import { useState, useEffect, FormEvent, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Clock, ShieldCheck, Check, CheckCircle, MessageCircle, Phone, ArrowRight, Tag, Sparkles, Droplet, Zap, Lock } from 'lucide-react'
import { SITE, PROJECTS } from '@/lib/constants'
import MetaTrackPageView from '@/components/analytics/MetaTrackPageView'
import Testimonials from '@/components/sections/Testimonials'
import styles from './page.module.css'

const ADVISORS = [
    {
        name: "Marcela Escobar",
        role: "Asesora inmobiliaria",
        image: "/images/asesores/Marcela.png",
        phone: "+56 9 5665 4833",
        whatsapp: "https://wa.me/56956654833?text=Hola%20Marcela,%20quiero%20m%C3%A1s%20informaci%C3%B3n%20sobre%20la%20promoci%C3%B3n%20Cyber%20Monday%20de%20terrenos%20%F0%9F%94%A5",
        description: "Te asesora con soluciones rápidas y transparentes para asegurar tu inversión."
    },
    {
        name: "Bárbara Arias",
        role: "Asesora inmobiliaria",
        image: "/images/asesores/Barbara.png",
        phone: "+56 9 4877 5227",
        whatsapp: "https://wa.me/56948775227?text=Hola%20B%C3%A1rbara,%20quiero%20m%C3%A1s%20informaci%C3%B3n%20sobre%20la%20promoci%C3%B3n%20Cyber%20Monday%20de%20terrenos%20%F0%9F%94%A5",
        description: "Especialista en proyectos del litoral, lista para resolver todas tus dudas."
    },
    {
        name: "Orlando Costa",
        role: "Asesor inmobiliario",
        image: "/images/asesores/Orlando.png",
        phone: "+56 9 7307 7128",
        whatsapp: "https://wa.me/56973077128?text=Hola%20Orlando,%20quiero%20m%C3%A1s%20informaci%C3%B3n%20sobre%20la%20promoci%C3%B3n%20Cyber%20Monday%20de%20terrenos%20%F0%9F%94%A5",
        description: "Te acompaña paso a paso para encontrar el lote ideal para tu familia."
    }
]

// Animation Variants
const fadeInUp = {
    hidden: { opacity: 0, y: 35 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: { type: "spring", stiffness: 80, damping: 15 }
    }
} as const

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.12
        }
    }
} as const

interface CyberFormProps {
    proyectoInteres: string;
    setProyectoInteres: (proyecto: string) => void;
}

function CyberForm({ proyectoInteres, setProyectoInteres }: CyberFormProps) {
    const searchParams = useSearchParams()
    const router = useRouter()
    
    const [form, setForm] = useState({
        nombre: '',
        email: '',
        celular: '',
        ciudad: '',
        proyecto: '',
    })
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

    // Sync lifted state to form's select value
    useEffect(() => {
        if (proyectoInteres) {
            setForm(prev => ({ ...prev, proyecto: proyectoInteres }))
        }
    }, [proyectoInteres])

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setStatus('loading')

        try {
            const getCookie = (name: string) => {
                if (typeof document === 'undefined') return undefined
                const value = `; ${document.cookie}`
                const parts = value.split(`; ${name}=`)
                if (parts.length === 2) return parts.pop()?.split(';').shift()
                return undefined
            }

            const fbp = getCookie('_fbp')
            const fbc = getCookie('_fbc')

            const utm_data = {
                utm_source: searchParams.get('utm_source') || 'cyber_monday_landing',
                utm_medium: searchParams.get('utm_medium') || 'web',
                utm_campaign: searchParams.get('utm_campaign') || 'cyber_monday_2026',
                utm_content: searchParams.get('utm_content'),
                utm_term: searchParams.get('utm_term'),
            }

            const res = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    ...form, 
                    ...utm_data, 
                    fbp, 
                    fbc,
                    mensaje: 'Interesado en Promoción Cyber Monday (Pie en 3 cuotas sin interés y asesoría gratuita)'
                }),
            })

            if (!res.ok) throw new Error('Error al enviar')

            setStatus('success')
            setForm({ nombre: '', email: '', celular: '', ciudad: '', proyecto: '' })

            setTimeout(() => {
                router.push('/gracias')
            }, 600)
        } catch {
            setStatus('error')
            setTimeout(() => setStatus('idle'), 4000)
        }
    }

    return (
        <form className={styles.form} onSubmit={handleSubmit} id="cyber-form">
            <div className="input-group">
                <label htmlFor="cyber-nombre" className="input-label" style={{ color: '#ffffff', fontWeight: 600 }}>Nombre completo</label>
                <input
                    id="cyber-nombre"
                    type="text"
                    className={`input ${styles.darkInput}`}
                    placeholder="Tu nombre y apellido"
                    required
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
            </div>

            <div className="input-group" style={{ marginTop: '1.25rem' }}>
                <label htmlFor="cyber-email" className="input-label" style={{ color: '#ffffff', fontWeight: 600 }}>Correo electrónico</label>
                <input
                    id="cyber-email"
                    type="email"
                    className={`input ${styles.darkInput}`}
                    placeholder="ejemplo@correo.com"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
            </div>

            <div className="input-group" style={{ marginTop: '1.25rem' }}>
                <label htmlFor="cyber-celular" className="input-label" style={{ color: '#ffffff', fontWeight: 600 }}>Celular</label>
                <input
                    id="cyber-celular"
                    type="tel"
                    className={`input ${styles.darkInput}`}
                    placeholder="+56 9 1234 5678"
                    required
                    value={form.celular}
                    onChange={(e) => setForm({ ...form, celular: e.target.value })}
                />
            </div>

            <div className="input-group" style={{ marginTop: '1.25rem' }}>
                <label htmlFor="cyber-ciudad" className="input-label" style={{ color: '#ffffff', fontWeight: 600 }}>Ciudad de residencia</label>
                <input
                    id="cyber-ciudad"
                    type="text"
                    className={`input ${styles.darkInput}`}
                    placeholder="¿Desde dónde nos escribes?"
                    required
                    value={form.ciudad}
                    onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
                />
            </div>

            <div className="input-group" style={{ marginTop: '1.25rem' }}>
                <label htmlFor="cyber-proyecto" className="input-label" style={{ color: '#ffffff', fontWeight: 600 }}>Proyecto de interés</label>
                <select
                    id="cyber-proyecto"
                    className={`input ${styles.darkInput}`}
                    required
                    value={form.proyecto}
                    onChange={(e) => {
                        setForm({ ...form, proyecto: e.target.value })
                        setProyectoInteres(e.target.value)
                    }}
                >
                    <option value="">Selecciona un proyecto</option>
                    <option value="Lomas del Mar">Lomas del Mar (Desde $29.990.000)</option>
                    <option value="Arena y Sol">Arena y Sol (Desde $42.000.000)</option>
                    <option value="Ambos / Consulta general">Ambos / Consulta general</option>
                </select>
            </div>

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className={`btn btn-primary btn-lg ${styles.submitButton}`}
                style={{ width: '100%', marginTop: '2rem' }}
                disabled={status === 'loading'}
            >
                {status === 'loading' ? 'Enviando...' : 'Asegurar mi promoción'}
            </motion.button>

            {status === 'success' && (
                <div className={`${styles.message} ${styles.success}`}>
                    ✅ ¡Registro exitoso! Te estamos redirigiendo...
                </div>
            )}
            {status === 'error' && (
                <div className={`${styles.message} ${styles.error}`}>
                    ❌ Hubo un error al procesar tus datos. Por favor, intenta de nuevo.
                </div>
            )}
        </form>
    )
}

export default function CyberPageClient() {
    const searchParams = useSearchParams()
    const [timeLeft, setTimeLeft] = useState({ days: '00', hours: '00', minutes: '00', seconds: '00' })
    const [proyectoInteres, setProyectoInteres] = useState('')

    useEffect(() => {
        const targetDate = new Date('2026-05-31T23:59:59').getTime()

        const updateCountdown = () => {
            const now = new Date().getTime()
            const difference = targetDate - now

            if (difference <= 0) {
                setTimeLeft({ days: '00', hours: '00', minutes: '00', seconds: '00' })
                return
            }

            const d = Math.floor(difference / (1000 * 60 * 60 * 24))
            const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
            const s = Math.floor((difference % (1000 * 60)) / 1000)

            setTimeLeft({
                days: d.toString().padStart(2, '0'),
                hours: h.toString().padStart(2, '0'),
                minutes: m.toString().padStart(2, '0'),
                seconds: s.toString().padStart(2, '0')
            })
        }

        updateCountdown()
        const intervalId = setInterval(updateCountdown, 1000)
        return () => clearInterval(intervalId)
    }, [])

    const scrollToForm = (e: React.MouseEvent) => {
        e.preventDefault()
        const target = document.getElementById('cyber-contacto')
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }

    // Scroll and set selected project
    const handleCotizar = (proyecto: string) => (e: React.MouseEvent) => {
        e.preventDefault()
        setProyectoInteres(proyecto)
        const target = document.getElementById('cyber-contacto')
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }

    // Capture current UTM params and forward to external domain for "Ver Detalles"
    const getLomasLink = () => {
        const baseUrl = 'https://aliminlomasdelmar.com'
        const params = new URLSearchParams()
        
        searchParams.forEach((value, key) => {
            params.set(key, value)
        })

        if (!params.has('utm_source')) params.set('utm_source', 'aliminspa')
        if (!params.has('utm_medium')) params.set('utm_medium', 'cyber_page')
        if (!params.has('utm_campaign')) params.set('utm_campaign', 'cyber_monday_2026')

        return `${baseUrl}?${params.toString()}`
    }

    return (
        <main className={styles.page}>
            <MetaTrackPageView eventName="ViewContent" customData={{ content_name: 'Cyber Monday Promotion Landing' }} />
            
            {/* --- HERO SECTION (Two-column layout displaying the ad image in full on desktop) --- */}
            <section className={styles.hero}>
                <div className={styles.heroGlowContainer}>
                    <div className={styles.glowSphere1}></div>
                    <div className={styles.glowSphere2}></div>
                    <div className={styles.glowSphere3}></div>
                </div>

                <div className="container">
                    <motion.div 
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                        className={styles.heroGrid}
                    >
                        {/* Left column: Ad Poster */}
                        <motion.div variants={fadeInUp} className={styles.heroImageContainer}>
                            <Image 
                                src="/images/hero/cyber-hero-ad.jpg" 
                                alt="Asegura tu terreno en este Cyber"
                                width={500}
                                height={625}
                                className={styles.heroImage}
                                priority
                            />
                        </motion.div>

                        {/* Right column: Active Cyber Elements */}
                        <motion.div variants={fadeInUp} className={styles.heroActions}>
                            {/* Countdown (Glassmorphic border/background) */}
                            <div className={styles.countdownWrapper}>
                                <span className={styles.countdownLabel}>La promoción termina en:</span>
                                <div className={styles.countdownGrid}>
                                    <div className={styles.countdownItem}>
                                        <div className={styles.countdownValue}>{timeLeft.days}</div>
                                        <div className={styles.countdownUnit}>días</div>
                                    </div>
                                    <div className={styles.countdownItem}>
                                        <div className={styles.countdownValue}>{timeLeft.hours}</div>
                                        <div className={styles.countdownUnit}>horas</div>
                                    </div>
                                    <div className={styles.countdownItem}>
                                        <div className={styles.countdownValue}>{timeLeft.minutes}</div>
                                        <div className={styles.countdownUnit}>min</div>
                                    </div>
                                    <div className={styles.countdownItem}>
                                        <div className={styles.countdownValue}>{timeLeft.seconds}</div>
                                        <div className={styles.countdownUnit}>seg</div>
                                    </div>
                                </div>
                            </div>

                            <a 
                                href="#cyber-contacto" 
                                onClick={scrollToForm} 
                                className={styles.shimmerBtn}
                                style={{ width: '100%', justifyContent: 'center' }}
                            >
                                Reservar con descuento <ArrowRight size={18} />
                            </a>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* --- PROJECTS IN PROMO SECTION --- */}
            <section className={styles.projectsSection}>
                <div className="container">
                    <div className={styles.projectsHeader}>
                        <h2 className={styles.sectionHeading}>Proyectos en <span>promoción Cyber</span></h2>
                        <p style={{ color: 'rgba(255, 255, 255, 0.7)', maxWidth: '600px', margin: '0.5rem auto 0 auto' }}>
                            Opciones exclusivas ubicadas en las zonas con mayor plusvalía de El Tabo.
                        </p>
                    </div>

                    <div className={styles.projectsGrid}>
                        {/* PROJECT 1: LOMAS DEL MAR */}
                        <motion.div 
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ type: "spring", stiffness: 60, damping: 15 }}
                            className={styles.projectCard}
                        >
                            <div className={styles.projectImgContainer}>
                                <video
                                    className={`${styles.projectVideo} ${styles.desktopVideo}`}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    poster="/images/projects/lomas-del-mar-poster-premium.png"
                                >
                                    <source src="/videos/lomas-del-mar/Lomas web optimized.mp4" type="video/mp4" />
                                </video>
                                <video
                                    className={`${styles.projectVideo} ${styles.mobileVideo}`}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    poster="/images/projects/lomas-del-mar-poster-premium.png"
                                >
                                    <source src="/videos/lomas-del-mar/lomas cel optimized.mp4" type="video/mp4" />
                                </video>
                                <span className={styles.projectTag}>🔥 ¡Sólo 25% disponible!</span>
                            </div>
                            <div className={styles.projectContent}>
                                <h3 className={styles.projectName}>Lomas del Mar</h3>
                                <p className={styles.projectDistance}>A 8 minutos de la playa del Tabo</p>
                                <p className={styles.projectDesc}>
                                    Terrenos con alta plusvalía y excelente conectividad. Diseñados para quienes buscan un refugio cerca del mar con urbanización completa de gran nivel.
                                </p>
                                
                                <div className={styles.featuresList}>
                                    <span className={styles.featureBadge}>
                                        <span className={styles.featureCheck}>✓</span> Rol propio
                                    </span>
                                    <span className={styles.featureBadge}>
                                        <span className={styles.featureCheck}>✓</span> Agua certificada
                                    </span>
                                    <span className={styles.featureBadge}>
                                        <span className={styles.featureCheck}>✓</span> Luz eléctrica
                                    </span>
                                    <span className={styles.featureBadge}>
                                        <span className={styles.featureCheck}>✓</span> Portón automático
                                    </span>
                                </div>

                                <div className={styles.projectFinancing}>
                                    <h4 className={styles.financeTitle}>Opciones Cyber Lomas</h4>
                                    <div className={styles.financeDetails}>
                                        <div className={styles.financeItem}>
                                            <span className={styles.financeLabel}>Valor contado especial:</span>
                                            <span className={`${styles.financeValue} ${styles.highlightValue}`}>Desde $26.000.000</span>
                                        </div>
                                        <div className={styles.financeItem}>
                                            <span className={styles.financeLabel}>Pago con financiamiento:</span>
                                            <span className={styles.financeValue}>Total $29.990.000</span>
                                        </div>
                                        <div className={styles.financeItem}>
                                            <span className={styles.financeLabel}>Pie Cyber (3 cuotas sin interés):</span>
                                            <span className={styles.financeValue}>Pie $5.500.000</span>
                                        </div>
                                        <div className={styles.financeItem}>
                                            <span className={styles.financeLabel}>Dimensiones terreno:</span>
                                            <span className={styles.financeValue}>200 m² - 390 m²</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <a 
                                        href={getLomasLink()} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className={`btn ${styles.lomasBtnSecondary}`} 
                                        style={{ width: '100%', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        Ver detalles
                                    </a>
                                    <a 
                                        href="#cyber-contacto" 
                                        onClick={handleCotizar('Lomas del Mar')}
                                        className={`btn ${styles.lomasBtnPrimary}`} 
                                        style={{ width: '100%', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        Cotizar promo
                                    </a>
                                </div>
                            </div>
                        </motion.div>

                        {/* PROJECT 2: ARENA Y SOL */}
                        <motion.div 
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ type: "spring", stiffness: 60, damping: 15, delay: 0.1 }}
                            className={styles.projectCard}
                        >
                            <div className={styles.projectImgContainer}>
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    style={{ width: '100%', height: '100%', position: 'relative' }}
                                >
                                    <Image
                                        src="/images/projects/arena-y-sol-v2.jpg"
                                        alt="Proyecto Arena y Sol"
                                        fill
                                        className={styles.projectImg}
                                        sizes="(max-width: 992px) 100vw, 50vw"
                                    />
                                </motion.div>
                                <span className={styles.projectTag} style={{ backgroundColor: '#ef4444', color: '#ffffff' }}>🔥 ¡Últimas unidades!</span>
                            </div>
                            <div className={styles.projectContent}>
                                <h3 className={styles.projectName}>Arena y Sol</h3>
                                <p className={styles.projectDistance}>A 10 minutos de la playa del Tabo</p>
                                <p className={styles.projectDesc}>
                                    El terreno perfecto para consolidar tu casa de descanso. Quedan muy pocas unidades en este exitoso proyecto ya consolidado en una de las mejores zonas costeras.
                                </p>

                                <div className={styles.featuresList}>
                                    <span className={styles.featureBadge}>
                                        <span className={styles.featureCheck}>✓</span> Rol propio
                                    </span>
                                    <span className={styles.featureBadge}>
                                        <span className={styles.featureCheck}>✓</span> Agua certificada
                                    </span>
                                    <span className={styles.featureBadge}>
                                        <span className={styles.featureCheck}>✓</span> Luz eléctrica
                                    </span>
                                    <span className={styles.featureBadge}>
                                        <span className={styles.featureCheck}>✓</span> Acceso pavimentado
                                    </span>
                                </div>

                                <div className={styles.projectFinancing}>
                                    <h4 className={styles.financeTitle}>Opciones Cyber Arena</h4>
                                    <div className={styles.financeDetails}>
                                        <div className={styles.financeItem}>
                                            <span className={styles.financeLabel}>Valor contado especial:</span>
                                            <span className={`${styles.financeValue} ${styles.highlightValue}`}>Desde $39.000.000</span>
                                        </div>
                                        <div className={styles.financeItem}>
                                            <span className={styles.financeLabel}>Financiamiento / pie:</span>
                                            <span className={styles.financeValue}>Total $42.000.000</span>
                                        </div>
                                        <div className={styles.financeItem}>
                                            <span className={styles.financeLabel}>Pie Cyber (3 cuotas sin interés):</span>
                                            <span className={styles.financeValue}>Pie $20.000.000</span>
                                        </div>
                                        <div className={styles.financeItem}>
                                            <span className={styles.financeLabel}>Dimensiones terreno:</span>
                                            <span className={styles.financeValue}>200 m²</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <Link 
                                        href="/proyectos/arena-y-sol" 
                                        className={`btn ${styles.lomasBtnSecondary}`} 
                                        style={{ width: '100%', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        Ver detalles
                                    </Link>
                                    <a 
                                        href="#cyber-contacto" 
                                        onClick={handleCotizar('Arena y Sol')}
                                        className={`btn ${styles.lomasBtnPrimary}`} 
                                        style={{ width: '100%', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        Cotizar promo
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* --- BENEFITS SECTION --- */}
            <section className={styles.promoSection}>
                <div className="container">
                    <div className={styles.projectsHeader}>
                        <h2 className={styles.sectionHeading}>¿En qué consiste la <span>promoción Cyber</span>?</h2>
                        <p style={{ color: 'rgba(255, 255, 255, 0.7)', maxWidth: '600px', margin: '0.5rem auto 0 auto' }}>
                            Descubre los beneficios exclusivos de comprar tu terreno durante esta campaña.
                        </p>
                    </div>

                    <motion.div 
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={staggerContainer}
                        className={styles.promoGrid}
                    >
                        {/* BENTO LARGE CARD */}
                        <motion.div variants={fadeInUp} className={`${styles.promoCard} ${styles.bentoLarge}`}>
                            <div className={styles.promoIcon}>
                                <Tag size={24} />
                            </div>
                            <h3 className={styles.promoCardTitle}>Pie en 3 cuotas sin interés</h3>
                            <p className={styles.promoCardDesc}>
                                Flexibilidad total para tu pago inicial. Cancela el pie de tu terreno en 3 cuotas mensuales sin ningún recargo, reajuste ni necesidad de crédito bancario. Diseñado para simplificar tu inversión en el litoral.
                            </p>
                        </motion.div>

                        <motion.div variants={fadeInUp} className={styles.promoCard}>
                            <div className={styles.promoIcon}>
                                <ShieldCheck size={24} />
                            </div>
                            <h3 className={styles.promoCardTitle}>Gestión legal gratuita</h3>
                            <p className={styles.promoCardDesc}>
                                Nos hacemos cargo del estudio de títulos, redacción de escrituras y gestiones legales 100% sin costo para ti.
                            </p>
                        </motion.div>

                        <motion.div variants={fadeInUp} className={styles.promoCard}>
                            <div className={styles.promoIcon}>
                                <Lock size={24} />
                            </div>
                            <h3 className={styles.promoCardTitle}>Proceso digital seguro</h3>
                            <p className={styles.promoCardDesc}>
                                Rápido, transparente y 100% seguro. Reserva tu terreno e inicia el proceso desde la comodidad de tu hogar.
                            </p>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* --- TRUST BELT --- */}
            <section className={styles.trustBelt}>
                <div className="container">
                    <h3 className={styles.trustBeltTitle}>Nuestros sellos de confianza y seguridad</h3>
                    <div className={styles.trustGrid}>
                        <div className={styles.trustItem}>
                            <div className={styles.trustIcon}>
                                <ShieldCheck size={36} />
                            </div>
                            <h4 className={styles.trustName}>Rol propio</h4>
                            <p className={styles.trustDesc}>Individualizado e inscrito en el Conservador de Bienes Raíces</p>
                        </div>
                        <div className={styles.trustItem}>
                            <div className={styles.trustIcon}>
                                <Droplet size={36} />
                            </div>
                            <h4 className={styles.trustName}>Agua certificada</h4>
                            <p className={styles.trustDesc}>Aprobada por la SEREMI de Salud para consumo humano</p>
                        </div>
                        <div className={styles.trustItem}>
                            <div className={styles.trustIcon}>
                                <Zap size={36} />
                            </div>
                            <h4 className={styles.trustName}>Luz eléctrica</h4>
                            <p className={styles.trustDesc}>Empalme instalado en el frontis de cada lote</p>
                        </div>
                        <div className={styles.trustItem}>
                            <div className={styles.trustIcon}>
                                <Lock size={36} />
                            </div>
                            <h4 className={styles.trustName}>Compra segura</h4>
                            <p className={styles.trustDesc}>Reserva 100% digital respaldada con contrato notarial</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- TESTIMONIALS SECTION --- */}
            <section className={styles.testimonialsSection}>
                <Testimonials />
            </section>

            {/* --- FORM AND SALES TEAM SECTION --- */}
            <section className={styles.contactSection} id="cyber-contacto">
                <div className="container">
                    <div className={styles.formAdvisorGrid}>
                        {/* Form Column */}
                        <motion.div 
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ type: "spring", stiffness: 80, damping: 15 }}
                            className={styles.formSection}
                        >
                            <h2 className={styles.formTitle}>Asegura tu terreno Cyber</h2>
                            <p className={styles.formSubtitle}>
                                Completa el formulario de contacto para recibir toda la información legal, de precios y financiamiento en minutos. Un asesor te guiará.
                            </p>
                            
                            <Suspense fallback={<div>Cargando formulario...</div>}>
                                <CyberForm proyectoInteres={proyectoInteres} setProyectoInteres={setProyectoInteres} />
                            </Suspense>
                        </motion.div>

                        {/* Advisors Column */}
                        <div className={styles.advisorsColumn}>
                            <div className={styles.advisorsHeader}>
                                <h2 className={styles.advisorsTitle}>Equipo comercial</h2>
                                <p className={styles.advisorsSubtitle}>
                                    Ponte en contacto directo con nuestros asesores comerciales por WhatsApp para reservar de inmediato o resolver tus dudas.
                                </p>
                            </div>

                            {ADVISORS.map((adv, idx) => (
                                <motion.div 
                                    key={adv.name} 
                                    initial={{ opacity: 0, x: 30 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ type: "spring", stiffness: 80, damping: 15, delay: idx * 0.1 }}
                                    className={styles.advisorCard}
                                >
                                    <Image
                                        src={adv.image}
                                        alt={adv.name}
                                        width={75}
                                        height={75}
                                        className={styles.advisorImg}
                                    />
                                    <div className={styles.advisorInfo}>
                                        <span className={styles.advisorRole}>{adv.role}</span>
                                        <h4 className={styles.advisorName}>{adv.name}</h4>
                                        <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.5rem', textAlign: 'justify' }}>{adv.description}</p>
                                        <div className={styles.advisorPhone}>
                                            <Phone size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle', color: '#C5A059' }} />
                                            {adv.phone}
                                        </div>
                                    </div>
                                    <a
                                        href={adv.whatsapp}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.whatsappButton}
                                        aria-label={`Hablar por WhatsApp con ${adv.name}`}
                                    >
                                        <MessageCircle size={22} />
                                    </a>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}
