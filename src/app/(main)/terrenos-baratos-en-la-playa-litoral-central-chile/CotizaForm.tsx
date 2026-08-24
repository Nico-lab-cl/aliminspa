'use client'

import { useState, FormEvent } from 'react'
import { getUtmParams, newEventId } from '@/lib/track'
import { TERRENOS } from './terrenos'
import styles from '../../../components/sections/QuoteForm.module.css'

// Mismo markup y estilos que QuoteForm (el formulario de la homepage). La
// diferencia es que acá etiquetamos el lead con `proyecto`, igual que las
// landings de /proyectos y /meta: QuoteForm manda `fuente_formulario`, que
// /api/leads no lee, así que esos leads llegan al CRM con proyecto vacío y no
// se puede medir qué aporta el SEO. Con esta etiqueta el equipo comercial ve
// de dónde vino cada lead en la columna proyecto.
//
// La etiqueta es la del proyecto que el usuario elige —"Lomas del Mar" o
// "Arena y Sol", limpia, igual que en /proyectos/*— para que el asesor la lea
// como cualquier otro lead. Sólo cuando no elige proyecto cae al respaldo, que
// deja constancia de que el lead entró por esta página.
const ETIQUETA_RESPALDO = 'Terrenos Baratos - SEO'

// Identificador de la página, aparte de la etiqueta del lead. El Pixel y el CRM
// necesitan un valor estable por página para que los reportes de Ads no se
// partan en dos según qué proyecto eligió cada visitante.
const NOMBRE_PAGINA = 'Terrenos Baratos Litoral Central - SEO'

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

const COMO_NOS_CONOCISTE = [
    'Google / Búsqueda web', 'Instagram', 'Facebook', 'TikTok',
    'Recomendación de un amigo', 'WhatsApp', 'Otro',
]

interface CotizaFormProps {
    formId: string
    title?: string
    subtitle?: string
    submitLabel?: string
    /** Terreno preseleccionado al llegar desde una tarjeta de precio. */
    terrenoInicial?: string
}

export default function CotizaForm({
    formId,
    title = 'Pide la lista de precios',
    subtitle = 'Te enviamos valores y lotes disponibles. Un asesor te contacta en menos de 24 horas.',
    submitLabel = 'Ver precios',
    terrenoInicial = '',
}: CotizaFormProps) {
    const [form, setForm] = useState({
        nombre: '',
        email: '',
        celular: '',
        // Guarda el id del lote (ej. 'lomas-200'), no un texto suelto: así se
        // puede resolver el proyecto sin parsear la etiqueta del select.
        terreno: terrenoInicial,
        region: '',
        ciudad: '',
        comoNosConociste: '',
    })
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

    const cities = form.region ? REGION_CITIES[form.region] ?? [] : []

    // "Lomas del Mar" / "Arena y Sol" según el lote elegido; el respaldo cubre
    // tanto "aún no lo sé" como el caso de no tocar el selector.
    const etiquetaLead =
        TERRENOS.find((t) => t.id === form.terreno)?.proyecto ?? ETIQUETA_RESPALDO

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

            const utm_data = getUtmParams({
                utm_source: 'google',
                utm_medium: 'organic',
                utm_campaign: 'terrenos_baratos_litoral_central',
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
                    ciudad: form.ciudad ? `${form.ciudad}, ${form.region}` : form.region,
                    proyecto: etiquetaLead,
                    como_conocio: form.comoNosConociste || null,
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
                    source: `Sitio Web - ${NOMBRE_PAGINA}`,
                }).catch((err: any) => console.error('Error de tracking CRM:', err))
            }

            setStatus('success')
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
                    <p className={styles.formSubtitle}>
                        Te enviamos la lista de precios. Un asesor te contactará en menos de 24 horas.
                    </p>
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
                    value={form.terreno}
                    onChange={(e) => setForm({ ...form, terreno: e.target.value })}
                    aria-label="Terreno que te interesa"
                >
                    <option value="">¿Qué terreno te interesa?</option>
                    {TERRENOS.map((t) => (
                        <option key={t.id} value={t.id}>
                            {t.proyecto} — {t.superficie} · {t.contadoTexto}
                        </option>
                    ))}
                    <option value="sin-definir">Aún no lo sé, quiero ver todas las opciones</option>
                </select>
                <select
                    className={styles.input}
                    required
                    value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value, ciudad: '' })}
                    aria-label="Región"
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
                    aria-label="Ciudad"
                >
                    <option value="" disabled>
                        {form.region ? 'Selecciona tu ciudad' : 'Primero elige una región'}
                    </option>
                    {cities.map((c) => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
                <select
                    className={styles.input}
                    value={form.comoNosConociste}
                    onChange={(e) => setForm({ ...form, comoNosConociste: e.target.value })}
                    aria-label="¿Cómo nos conociste?"
                >
                    <option value="">¿Cómo nos conociste?</option>
                    {COMO_NOS_CONOCISTE.map((o) => (
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
