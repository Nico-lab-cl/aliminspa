'use client'

import { useState, type FormEvent } from 'react'
import ConsentimientoFormulario, { useConsentimiento } from '@/components/consent/ConsentimientoFormulario'
import styles from '../reservar.module.css'

interface Props {
    proyecto: { slug: string; nombre: string; monto: number }
    lotes: string[]
    loteInicial: string | null
    origen: string | null
    utm: Record<string, string | null>
}

const clp = (n: number) => '$' + n.toLocaleString('es-CL')

/** Manda a la persona a Webpay con un formulario POST, como pide Transbank. */
function irAWebpay(url: string, token: string) {
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = url
    const campo = document.createElement('input')
    campo.type = 'hidden'
    campo.name = 'token_ws'
    campo.value = token
    form.appendChild(campo)
    document.body.appendChild(form)
    form.submit()
}

export default function ReservaForm({ proyecto, lotes: lotesIniciales, loteInicial, origen, utm }: Props) {
    const [lotes, setLotes] = useState(lotesIniciales)
    const [lote, setLote] = useState<string | null>(loteInicial)
    const [form, setForm] = useState({ nombre: '', rut: '', email: '', celular: '' })
    const [acepta, setAcepta] = useState(false)
    const [estado, setEstado] = useState<'listo' | 'enviando' | 'error'>('listo')
    const [error, setError] = useState('')
    const consentimiento = useConsentimiento()

    const cambiar = (campo: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm(f => ({ ...f, [campo]: e.target.value }))

    async function enviar(e: FormEvent) {
        e.preventDefault()
        if (!lote) {
            setEstado('error')
            setError('Elige el lote que quieres reservar.')
            return
        }
        setEstado('enviando')
        setError('')
        try {
            const res = await fetch('/api/reservas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    proyecto: proyecto.slug,
                    lote,
                    ...form,
                    acepta_condiciones: acepta,
                    origen,
                    ...utm,
                    ...consentimiento.datos(),
                }),
            })
            const j = await res.json().catch(() => ({}))
            if (!res.ok || !j.url || !j.token) {
                if (Array.isArray(j.lotes)) {
                    setLotes(j.lotes.map((l: { ref: string }) => l.ref))
                    setLote(null)
                }
                throw new Error(j.error || 'No pudimos iniciar la reserva. Intenta de nuevo.')
            }
            irAWebpay(j.url, j.token)
        } catch (err) {
            setEstado('error')
            setError(err instanceof Error ? err.message : 'No pudimos iniciar la reserva. Intenta de nuevo.')
        }
    }

    if (!lotes.length) {
        return (
            <p className={styles.aviso}>
                En este momento no quedan lotes disponibles para reservar en línea en {proyecto.nombre}. Escríbenos y te
                ayudamos.
            </p>
        )
    }

    return (
        <form onSubmit={enviar} className={styles.formulario}>
            <h2 className={styles.subtitulo}>1. Elige tu lote</h2>
            <p className={styles.ayuda}>Lotes disponibles hoy ({lotes.length}):</p>
            <div className={styles.lotes} role="radiogroup" aria-label="Lotes disponibles">
                {lotes.map(ref => (
                    <button
                        key={ref}
                        type="button"
                        role="radio"
                        aria-checked={lote === ref}
                        className={`${styles.lote} ${lote === ref ? styles.loteElegido : ''}`}
                        onClick={() => setLote(ref)}
                    >
                        {ref}
                    </button>
                ))}
            </div>

            <h2 className={styles.subtitulo}>2. Tus datos</h2>
            <div className={styles.campos}>
                <label className={styles.campo}>
                    <span>Nombre y apellido</span>
                    <input required autoComplete="name" value={form.nombre} onChange={cambiar('nombre')} />
                </label>
                <label className={styles.campo}>
                    <span>RUT</span>
                    <input required placeholder="12.345.678-9" value={form.rut} onChange={cambiar('rut')} />
                </label>
                <label className={styles.campo}>
                    <span>Correo</span>
                    <input required type="email" autoComplete="email" value={form.email} onChange={cambiar('email')} />
                </label>
                <label className={styles.campo}>
                    <span>Celular</span>
                    <input required type="tel" autoComplete="tel" placeholder="9 1234 5678" value={form.celular} onChange={cambiar('celular')} />
                </label>
            </div>

            <label className={styles.condiciones}>
                <input type="checkbox" required checked={acepta} onChange={e => setAcepta(e.target.checked)} />
                <span>
                    Entiendo que la reserva de {clp(proyecto.monto)} no se devuelve si decido no seguir, y que tengo 10 días
                    corridos para pagar el pie y firmar la promesa.
                </span>
            </label>
            <ConsentimientoFormulario
                consentimiento={consentimiento}
                textoContacto="y que Alimin me contacte para seguir con mi reserva."
            />

            <button type="submit" className={styles.boton} disabled={estado === 'enviando'}>
                {estado === 'enviando'
                    ? 'Conectando con Webpay…'
                    : `Pagar reserva ${clp(proyecto.monto)}${lote ? ` · Lote ${lote}` : ''}`}
            </button>
            {estado === 'error' && error ? <p className={styles.error}>{error}</p> : null}
            <p className={styles.ayuda}>Pagas en Webpay (Transbank) con débito o crédito. El lote queda apartado 15 minutos mientras pagas.</p>
        </form>
    )
}
