'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { PROJECTS } from '@/lib/constants'
import { getUtmParams, newEventId } from '@/lib/track'
import styles from './page.module.css'

// Etiqueta de respaldo para la columna `proyecto` del CRM. Solo se usa cuando
// el visitante no elige proyecto: si elige, va el nombre limpio ("Lomas del
// Mar", "Arena y Sol") igual que en las landings de /proyectos, para que el
// asesor lo lea como cualquier otro lead. El origen real —Instagram, TikTok,
// el link de la bio— viaja aparte en las columnas utm_*.
const ETIQUETA_RESPALDO = 'Cotizar - Redes Sociales'

// Valor del "aún no lo sé". Necesita ser distinto de '' porque el placeholder
// del select ya ocupa la cadena vacía y dos <option value=""> son
// indistinguibles para React.
const SIN_DEFINIR = 'sin-definir'

// Nombre fijo de la página para el Pixel y el CRM. Va aparte de la etiqueta del
// lead para que los reportes de Ads no se partan según qué proyecto eligió cada
// visitante.
const NOMBRE_PAGINA = 'Cotizar - Landing Redes'

// Un proyecto vendido no se ofrece: pedirle a alguien que cotice algo que ya no
// existe es hacerle perder el tiempo a él y al asesor.
const PROYECTOS_VIGENTES = PROJECTS.filter((p) => p.status !== 'Proyecto Vendido')

export default function CotizarForm() {
    const router = useRouter()
    const [form, setForm] = useState({
        nombre: '',
        email: '',
        celular: '',
        ciudad: '',
        proyecto: '',
    })
    const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')

    // El nombre del proyecto tal cual si lo eligió; el respaldo cubre tanto
    // "aún no lo sé" como no haber tocado el selector.
    const etiquetaLead =
        form.proyecto && form.proyecto !== SIN_DEFINIR ? form.proyecto : ETIQUETA_RESPALDO

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

            // Si el enlace del botón trae ?utm_source=instagram, se respeta. Si
            // no trae nada, al menos queda registrado que entró por esta página.
            const utm_data = getUtmParams({
                utm_source: 'redes_sociales',
                utm_medium: 'social',
                utm_campaign: 'cotizar_landing',
            })

            // Compartido entre el Pixel del navegador y la CAPI del servidor
            // para que Meta cuente un solo Lead.
            const eventId = newEventId()

            const res = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: form.nombre,
                    email: form.email,
                    celular: form.celular,
                    ciudad: form.ciudad,
                    proyecto: etiquetaLead,
                    fbp: getCookie('_fbp'),
                    fbc: getCookie('_fbc'),
                    eventId,
                    ...utm_data,
                }),
            })

            if (!res.ok) throw new Error('Error al enviar')

            if (typeof window !== 'undefined' && (window as any).fbq) {
                ;(window as any).fbq('track', 'Lead', {
                    content_name: NOMBRE_PAGINA,
                    content_category: 'Real Estate',
                    currency: 'CLP',
                }, { eventID: eventId })
            }

            if (typeof window !== 'undefined' && (window as any).AliminCRM) {
                const nameParts = form.nombre.trim().split(/\s+/)
                ;(window as any).AliminCRM.identify({
                    email: form.email,
                    firstName: nameParts[0] || '',
                    lastName: nameParts.slice(1).join(' ') || '',
                    phone: form.celular,
                    project: etiquetaLead,
                    source: `Sitio Web - ${NOMBRE_PAGINA}`,
                }).catch((err: any) => console.error('Error de tracking CRM:', err))
            }

            // Misma confirmación que el resto del sitio, para no mantener dos.
            router.push('/gracias')
        } catch {
            setStatus('error')
            setTimeout(() => setStatus('idle'), 4000)
        }
    }

    return (
        <form className={styles.formCard} onSubmit={handleSubmit} id="form-cotizar">
            <div className={styles.formTitle}>Cotiza tu terreno</div>
            <p className={styles.formSubtitle}>
                Completa tus datos y un asesor te contacta en menos de 24 horas.
            </p>

            <div className={styles.formFields}>
                <input
                    type="text"
                    className={styles.input}
                    placeholder="Tu nombre"
                    required
                    autoComplete="name"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
                <input
                    type="email"
                    className={styles.input}
                    placeholder="tu@email.com"
                    required
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <input
                    type="tel"
                    className={styles.input}
                    placeholder="+56 9 1234 5678"
                    required
                    autoComplete="tel"
                    inputMode="tel"
                    value={form.celular}
                    onChange={(e) => setForm({ ...form, celular: e.target.value })}
                />
                <input
                    type="text"
                    className={styles.input}
                    placeholder="¿Desde dónde nos contactas?"
                    required
                    autoComplete="address-level2"
                    value={form.ciudad}
                    onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
                />
                <select
                    className={styles.input}
                    value={form.proyecto}
                    onChange={(e) => setForm({ ...form, proyecto: e.target.value })}
                    aria-label="Proyecto de interés"
                >
                    <option value="">¿Qué proyecto te interesa?</option>
                    {PROYECTOS_VIGENTES.map((p) => (
                        <option key={p.id} value={p.name}>
                            {p.name} — {p.lotSize}
                        </option>
                    ))}
                    <option value={SIN_DEFINIR}>Aún no lo sé</option>
                </select>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={status === 'loading'}>
                {status === 'loading' ? 'Enviando...' : 'Quiero cotizar →'}
            </button>

            {status === 'error' && (
                <div className={styles.errorMsg}>❌ Error al enviar. Intenta nuevamente.</div>
            )}

            <p className={styles.formLegal}>
                Al enviar aceptas que un asesor de Alimin te contacte. Sin costo y sin compromiso.
            </p>
        </form>
    )
}
