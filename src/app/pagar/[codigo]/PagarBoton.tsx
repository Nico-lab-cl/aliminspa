'use client'

import { useState, type FormEvent } from 'react'
import ConsentimientoFormulario, { useConsentimiento } from '@/components/consent/ConsentimientoFormulario'
import styles from '../../reservar/reservar.module.css'

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

export default function PagarBoton({ id, monto }: { id: string; monto: string }) {
    const [acepta, setAcepta] = useState(false)
    const [estado, setEstado] = useState<'listo' | 'enviando' | 'error'>('listo')
    const [error, setError] = useState('')
    const consentimiento = useConsentimiento()

    async function pagar(e: FormEvent) {
        e.preventDefault()
        setEstado('enviando')
        setError('')
        try {
            const res = await fetch('/api/reservas/pagar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, acepta_condiciones: acepta, ...consentimiento.datos() }),
            })
            const j = await res.json().catch(() => ({}))
            if (!res.ok || !j.url || !j.token) throw new Error(j.error || 'No pudimos iniciar el pago. Intenta de nuevo.')
            irAWebpay(j.url, j.token)
        } catch (err) {
            setEstado('error')
            setError(err instanceof Error ? err.message : 'No pudimos iniciar el pago. Intenta de nuevo.')
        }
    }

    return (
        <form onSubmit={pagar}>
            <label className={styles.condiciones}>
                <input type="checkbox" required checked={acepta} onChange={e => setAcepta(e.target.checked)} />
                <span>
                    Entiendo que la reserva de {monto} no se devuelve si decido no seguir, y que tengo 10 días corridos para
                    pagar el pie y firmar la promesa.
                </span>
            </label>
            <ConsentimientoFormulario consentimiento={consentimiento} textoContacto="y que Alimin me contacte para seguir con mi reserva." />
            <button type="submit" className={styles.boton} disabled={estado === 'enviando'}>
                {estado === 'enviando' ? 'Conectando con Webpay…' : `Pagar reserva ${monto} con Webpay`}
            </button>
            {estado === 'error' && error ? <p className={styles.error}>{error}</p> : null}
        </form>
    )
}
