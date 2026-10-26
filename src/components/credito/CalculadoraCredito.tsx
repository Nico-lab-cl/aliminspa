'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { getUtmParams, newEventId, trackGoogleAdsLead } from '@/lib/track'
import ConsentimientoFormulario, { useConsentimiento } from '@/components/consent/ConsentimientoFormulario'
import {
    VALORES_PLANILLA,
    etiquetaLead,
    formatoDividendos,
    numeroDeDividendos,
    type DatosCredito,
    type PlanCredito,
} from './calculo'
import styles from './CalculadoraCredito.module.css'

// Nombre fijo para el Pixel y la CAPI. Va aparte de la etiqueta del lead, que
// cambia con cada cálculo: si el content_name llevara los montos, los reportes
// de Ads quedarían partidos en un evento distinto por persona.
const NOMBRE_PAGINA = 'Calculadora Crédito'

type TrackingWindow = Window & {
    fbq?: (action: string, event: string, data: Record<string, string>, opts: { eventID: string }) => void
    AliminCRM?: { identify: (contact: Record<string, string>) => Promise<unknown> }
}

const getCookie = (name: string) => {
    if (typeof document === 'undefined') return undefined
    const parts = `; ${document.cookie}`.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(';').shift()
    return undefined
}

/** Los montos se escriben con puntos de miles mientras se tipean; se guarda solo el número. */
const aNumero = (texto: string) => Number(texto.replace(/\D/g, '')) || 0
const conPuntos = (n: number) => (n ? n.toLocaleString('es-CL') : '')

const CAMPOS: { clave: keyof DatosCredito; label: string }[] = [
    { clave: 'valorTotal', label: 'Valor total del terreno' },
    { clave: 'pie', label: 'Pie' },
    { clave: 'dividendo', label: 'Valor dividendo' },
]

interface Props {
    /** Dónde está la calculadora: va en la etiqueta del lead ("Crédito - Lomas del Mar | …"). Vacío en /credito. */
    origen?: string
    /** Montos con los que parte. Por defecto, los de la planilla. */
    valoresIniciales?: DatosCredito
    /** Tamaños de terreno con su plan. Con dos o más se muestra un selector y parte con el primero. */
    planes?: PlanCredito[]
    /** Título sobre la calculadora; null cuando la página ya lo pone en su H1. */
    titulo?: string | null
}

export default function CalculadoraCredito({
    origen,
    valoresIniciales = VALORES_PLANILLA,
    planes,
    titulo = 'Calculadora de cuotas',
}: Props) {
    const router = useRouter()
    const [plan, setPlan] = useState(0)
    const [datos, setDatos] = useState<DatosCredito>(planes?.[0]?.datos ?? valoresIniciales)
    const [form, setForm] = useState({ nombre: '', email: '', celular: '', ciudad: '' })
    const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
    const consentimiento = useConsentimiento()

    const dividendos = numeroDeDividendos(datos)

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        if (dividendos === null) return
        setStatus('loading')

        // El tamaño elegido va junto al origen: "Crédito - Lomas del Mar 390 m² | …".
        const terreno = planes?.[plan]?.etiqueta
        const etiqueta = etiquetaLead(datos, [origen, terreno].filter(Boolean).join(' ') || undefined)

        try {
            // Compartido entre el Pixel del navegador y la CAPI del servidor
            // para que Meta cuente un solo Lead.
            const eventId = newEventId()

            const res = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    proyecto: etiqueta,
                    content_name: NOMBRE_PAGINA,
                    fbp: getCookie('_fbp'),
                    fbc: getCookie('_fbc'),
                    eventId,
                    ...getUtmParams(),
                    ...consentimiento.datos(),
                }),
            })

            if (!res.ok) throw new Error('Error al enviar')

            trackGoogleAdsLead(eventId, { email: form.email, telefono: form.celular })

            const w = window as TrackingWindow
            w.fbq?.('track', 'Lead', {
                content_name: NOMBRE_PAGINA,
                content_category: 'Real Estate',
                currency: 'CLP',
            }, { eventID: eventId })

            if (w.AliminCRM) {
                const nameParts = form.nombre.trim().split(/\s+/)
                w.AliminCRM.identify({
                    email: form.email,
                    firstName: nameParts[0] || '',
                    lastName: nameParts.slice(1).join(' ') || '',
                    phone: form.celular,
                    project: etiqueta,
                    source: `Sitio Web - ${NOMBRE_PAGINA}${origen ? ` - ${origen}` : ''}`,
                }).catch((err) => console.error('Error de tracking CRM:', err))
            }

            router.push('/gracias')
        } catch {
            setStatus('error')
            setTimeout(() => setStatus('idle'), 4000)
        }
    }

    return (
        <form className={styles.tarjeta} onSubmit={handleSubmit}>
            {titulo && <div className={styles.titulo}>{titulo}</div>}

            {planes && planes.length > 1 && (
                <div className={styles.planes} role="group" aria-label="Tamaño del terreno">
                    {planes.map((p, i) => (
                        <button
                            key={p.etiqueta}
                            type="button"
                            className={`${styles.plan} ${i === plan ? styles.planActivo : ''}`}
                            aria-pressed={i === plan}
                            onClick={() => {
                                setPlan(i)
                                setDatos(p.datos)
                            }}
                        >
                            {p.etiqueta}
                        </button>
                    ))}
                </div>
            )}

            <div className={styles.calculadora}>
                {CAMPOS.map(({ clave, label }) => (
                    <label key={clave} className={styles.fila}>
                        <span className={styles.etiqueta}>{label}</span>
                        <span className={styles.monto}>
                            <span className={styles.signo}>$</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                className={styles.inputMonto}
                                value={conPuntos(datos[clave])}
                                onChange={(e) => setDatos({ ...datos, [clave]: aNumero(e.target.value) })}
                                aria-label={label}
                            />
                        </span>
                    </label>
                ))}

                {/* La celda calculada de la planilla: se muestra, no se edita. */}
                <div className={`${styles.fila} ${styles.resultado}`} aria-live="polite">
                    <span className={styles.etiqueta}>Número de dividendos</span>
                    <output className={styles.valorResultado}>
                        {dividendos === null ? '—' : formatoDividendos(dividendos)}
                    </output>
                </div>
            </div>

            <p className={styles.nota}>
                Cálculo referencial. Déjanos tus datos y un asesor te contacta para revisar este plan contigo.
            </p>

            <div className={styles.campos}>
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
            </div>

            <ConsentimientoFormulario consentimiento={consentimiento} />

            <button
                type="submit"
                className={styles.boton}
                disabled={status === 'loading' || dividendos === null}
            >
                {status === 'loading' ? 'Enviando...' : 'Quiero este plan de pago →'}
            </button>

            {dividendos === null && (
                <div className={styles.aviso}>Completa los montos: el pie tiene que ser menor que el valor total.</div>
            )}
            {status === 'error' && (
                <div className={styles.error}>Error al enviar. Intenta nuevamente.</div>
            )}
        </form>
    )
}
