'use client'

import { Suspense, useState, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import styles from './QuoteForm.module.css'

const REGION_CITIES: Record<string, string[]> = {
    'Arica y Parinacota': ['Arica', 'Putre', 'General Lagos'],
    'Tarapacá': ['Iquique', 'Alto Hospicio', 'Pozo Almonte'],
    'Antofagasta': ['Antofagasta', 'Calama', 'Tocopilla', 'Mejillones'],
    'Atacama': ['Copiapó', 'Vallenar', 'Chañaral', 'Caldera'],
    'Coquimbo': ['La Serena', 'Coquimbo', 'Ovalle', 'Illapel'],
    'Valparaíso': ['Valparaíso', 'Viña del Mar', 'El Tabo', 'Algarrobo', 'San Antonio', 'Quilpué', 'Los Andes'],
    'Región Metropolitana de Santiago': ['Santiago', 'Puente Alto', 'Maipú', 'Las Condes', 'La Florida'],
    "Libertador Bernardo O'Higgins": ['Rancagua', 'San Fernando', 'Rengo', 'Pichilemu'],
    'Maule': ['Talca', 'Curicó', 'Linares', 'Constitución'],
    'Ñuble': ['Chillán', 'San Carlos', 'Bulnes'],
    'Biobío': ['Concepción', 'Los Ángeles', 'Talcahuano', 'Chillán Viejo'],
    'La Araucanía': ['Temuco', 'Villarrica', 'Pucón', 'Angol'],
    'Los Ríos': ['Valdivia', 'La Unión', 'Río Bueno'],
    'Los Lagos': ['Puerto Montt', 'Osorno', 'Castro', 'Puerto Varas'],
}

const HOW_FOUND_US_OPTIONS = [
    'Instagram', 'Facebook', 'TikTok', 'Recomendación de un amigo', 'Google / Búsqueda web', 'WhatsApp', 'Otro',
]

type QuoteFormProps = {
    source: string
    title?: string
    subtitle?: string
    submitLabel?: string
    redirectTo?: string
    formId?: string
}

function QuoteFormInner({
    source,
    title = 'Cotiza tu terreno',
    subtitle = 'Un asesor te contacta en menos de 24 horas.',
    submitLabel = 'Cotizar Ahora',
    redirectTo,
    formId,
}: QuoteFormProps) {
    const searchParams = useSearchParams()
    const router = useRouter()

    const [form, setForm] = useState({
        nombre: '',
        email: '',
        celular: '',
        region: '',
        ciudad: '',
        comoNosConociste: '',
    })
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

    const cities = form.region ? REGION_CITIES[form.region] ?? [] : []

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
                utm_source: searchParams.get('utm_source'),
                utm_medium: searchParams.get('utm_medium'),
                utm_campaign: searchParams.get('utm_campaign'),
                utm_content: searchParams.get('utm_content'),
                utm_term: searchParams.get('utm_term'),
            }

            const res = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: form.nombre,
                    email: form.email,
                    celular: form.celular,
                    ciudad: form.ciudad ? `${form.ciudad}, ${form.region}` : form.region,
                    comoNosConociste: form.comoNosConociste,
                    fuente_formulario: source,
                    ...utm_data,
                    fbp,
                    fbc,
                }),
            })

            if (!res.ok) throw new Error('Error al enviar')

            if (typeof window !== 'undefined' && (window as any).AliminCRM) {
                const nameParts = form.nombre.trim().split(/\s+/)
                const firstName = nameParts[0] || ''
                const lastName = nameParts.slice(1).join(' ') || ''
                ;(window as any).AliminCRM.identify({
                    email: form.email,
                    firstName,
                    lastName,
                    phone: form.celular,
                    source: `Sitio Web - ${source}`,
                }).catch((err: any) => console.error('Error de tracking CRM:', err))
            }

            setStatus('success')
            setForm({ nombre: '', email: '', celular: '', region: '', ciudad: '', comoNosConociste: '' })

            if (redirectTo) {
                setTimeout(() => router.push(redirectTo), 800)
            }
        } catch {
            setStatus('error')
            setTimeout(() => setStatus('idle'), 4000)
        }
    }

    if (status === 'success') {
        return (
            <div className={styles.formCard}>
                <div className={styles.successState}>
                    <span className={styles.successIcon}>✓</span>
                    <div className={styles.formTitle}>¡Listo!</div>
                    <p className={styles.formSubtitle}>Un asesor te contactará en menos de 24 horas.</p>
                </div>
            </div>
        )
    }

    return (
        <form className={styles.formCard} onSubmit={handleSubmit} id={formId}>
            <div className={styles.formTitle}>{title}</div>
            <p className={styles.formSubtitle}>{subtitle}</p>

            <div className={styles.formFields}>
                <input
                    type="text"
                    className={styles.input}
                    placeholder="Nombre completo"
                    required
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
                <input
                    type="email"
                    className={styles.input}
                    placeholder="Correo electrónico"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <input
                    type="tel"
                    className={styles.input}
                    placeholder="Teléfono / WhatsApp"
                    required
                    value={form.celular}
                    onChange={(e) => setForm({ ...form, celular: e.target.value })}
                />
                <select
                    className={styles.input}
                    required
                    value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value, ciudad: '' })}
                >
                    <option value="" disabled>Selecciona tu región</option>
                    {Object.keys(REGION_CITIES).map((r) => (
                        <option key={r} value={r}>{r}</option>
                    ))}
                </select>
                <select
                    className={styles.input}
                    required
                    value={form.ciudad}
                    disabled={!form.region}
                    onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
                >
                    <option value="" disabled>{form.region ? 'Selecciona tu ciudad' : 'Primero elige una región'}</option>
                    {cities.map((c) => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
                <select
                    className={styles.input}
                    value={form.comoNosConociste}
                    onChange={(e) => setForm({ ...form, comoNosConociste: e.target.value })}
                >
                    <option value="">¿Cómo nos conociste?</option>
                    {HOW_FOUND_US_OPTIONS.map((o) => (
                        <option key={o} value={o}>{o}</option>
                    ))}
                </select>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={status === 'loading'}>
                {status === 'loading' ? 'Enviando...' : submitLabel}
            </button>

            {status === 'error' && (
                <div className={styles.errorMsg}>❌ Error al enviar. Intenta nuevamente.</div>
            )}
        </form>
    )
}

export default function QuoteForm(props: QuoteFormProps) {
    return (
        <Suspense fallback={<div className={styles.formCard} />}>
            <QuoteFormInner {...props} />
        </Suspense>
    )
}
