'use client'

import { useState, FormEvent, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PROJECTS } from '@/lib/constants'
import AnimatedSection from '@/components/ui/AnimatedSection'
import styles from './ContactForm.module.css'

function ContactFormInner() {
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

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setStatus('loading')

        try {
            // Helper para obtener cookies del navegador (Meta Pixel)
            const getCookie = (name: string) => {
                if (typeof document === 'undefined') return undefined
                const value = `; ${document.cookie}`
                const parts = value.split(`; ${name}=`)
                if (parts.length === 2) return parts.pop()?.split(';').shift()
                return undefined
            }

            const fbp = getCookie('_fbp')
            const fbc = getCookie('_fbc')

            // Capturar UTMs de la URL
            const utm_data = {
                utm_source: searchParams.get('utm_source'),
                utm_medium: searchParams.get('utm_medium'),
                utm_campaign: searchParams.get('utm_campaign'),
                utm_content: searchParams.get('utm_content'),
                utm_term: searchParams.get('utm_term'),
            }

            const res = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, ...utm_data, fbp, fbc }),
            })

            if (!res.ok) throw new Error('Error al enviar')

            setStatus('success')
            setForm({ nombre: '', email: '', celular: '', ciudad: '', proyecto: '' })

            // Redirigir a la página de gracias después de un breve delay
            setTimeout(() => {
                router.push('/gracias')
            }, 500)
        } catch {
            setStatus('error')
            setTimeout(() => setStatus('idle'), 4000)
        }
    }

    return (
        <section className={`section ${styles.section}`} id="contacto">
            <div className={styles.bgOrb} />

            <div className="container" style={{ position: 'relative' }}>
                <div className={styles.header}>
                    <h2 className={styles.mainTitle}>Cotizar Terreno en El Tabo</h2>
                </div>
                
                <div className={styles.decorativeFrame}></div>

                <AnimatedSection>
                    <div className={styles.wrapper}>
                        <div className={styles.info}>
                            <h3 className={styles.boxTitle}>
                                Cotizar Terreno en El Tabo
                            </h3>
                            <p className={styles.desc}>
                                Completa el formulario y un asesor te contactará con
                                las mejores opciones de terrenos disponibles en nuestros
                                proyectos del Litoral Central.
                            </p>

                            <div className={styles.features}>
                                <div className={styles.feature}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    <span>Respuesta en menos de 24 horas</span>
                                </div>
                                <div className={styles.feature}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    <span>Asesoría personalizada</span>
                                </div>
                                <div className={styles.feature}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    <span>Visitas guiadas sin costo</span>
                                </div>
                            </div>
                        </div>

                        <form className={styles.form} onSubmit={handleSubmit} id="form-contacto">
                            <div className="input-group">
                                <label htmlFor="lead-nombre" className="input-label">Nombre completo</label>
                                <input
                                    id="lead-nombre"
                                    type="text"
                                    className="input"
                                    placeholder="Tu nombre"
                                    required
                                    value={form.nombre}
                                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                                />
                            </div>

                            <div className="input-group">
                                <label htmlFor="lead-email" className="input-label">Correo electrónico</label>
                                <input
                                    id="lead-email"
                                    type="email"
                                    className="input"
                                    placeholder="tu@email.com"
                                    required
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                />
                            </div>

                            <div className="input-group">
                                <label htmlFor="lead-celular" className="input-label">Celular</label>
                                <input
                                    id="lead-celular"
                                    type="tel"
                                    className="input"
                                    placeholder="+56 9 1234 5678"
                                    required
                                    value={form.celular}
                                    onChange={(e) => setForm({ ...form, celular: e.target.value })}
                                />
                            </div>

                            <div className="input-group">
                                <label htmlFor="lead-ciudad" className="input-label">Ciudad</label>
                                <input
                                    id="lead-ciudad"
                                    type="text"
                                    className="input"
                                    placeholder="¿Desde dónde nos contactas?"
                                    required
                                    value={form.ciudad}
                                    onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
                                />
                            </div>

                            <div className="input-group">
                                <label htmlFor="lead-proyecto" className="input-label">Proyecto de interés (opcional)</label>
                                <select
                                    id="lead-proyecto"
                                    className="input"
                                    value={form.proyecto}
                                    onChange={(e) => setForm({ ...form, proyecto: e.target.value })}
                                >
                                    <option value="">Selecciona un proyecto</option>
                                    {PROJECTS.map((p) => (
                                        <option key={p.id} value={p.name}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="submit"
                                className={`btn btn-primary btn-lg ${styles.submitBtn}`}
                                disabled={status === 'loading'}
                            >
                                {status === 'loading' ? 'Enviando...' : 'Solicitar Información'}
                            </button>

                            {status === 'success' && (
                                <div className={styles.message + ' ' + styles.success}>
                                    ✅ ¡Datos enviados! Te contactaremos pronto.
                                </div>
                            )}
                            {status === 'error' && (
                                <div className={styles.message + ' ' + styles.error}>
                                    ❌ Error al enviar. Intenta nuevamente.
                                </div>
                            )}
                        </form>
                    </div>
                </AnimatedSection>
            </div>
        </section>
    )
}

export default function ContactForm() {
    return (
        <Suspense fallback={<div>Cargando formulario...</div>}>
            <ContactFormInner />
        </Suspense>
    )
}
