'use client'

import { useEffect, useState } from 'react'
import { DERECHOS, type TipoDerecho } from '@/lib/derechos'
import styles from './Derechos.module.css'

export default function DerechosForm() {
    const [tipo, setTipo] = useState<TipoDerecho>('baja_comunicaciones')
    const [estado, setEstado] = useState<'idle' | 'enviando' | 'ok' | 'error'>('idle')
    const [error, setError] = useState('')

    // /privacidad/derechos?tipo=acceso llega preseleccionado, para enlazar
    // directo desde la política o desde el "darse de baja" de un correo.
    useEffect(() => {
        const pedido = new URLSearchParams(window.location.search).get('tipo')
        const encontrado = DERECHOS.find((d) => d.tipo === pedido)
        if (encontrado) setTipo(encontrado.tipo)
    }, [])

    const enviar = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const f = new FormData(e.currentTarget)
        setEstado('enviando')
        setError('')
        try {
            const res = await fetch('/api/derechos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tipo,
                    nombre: f.get('nombre'),
                    email: f.get('email'),
                    celular: f.get('celular'),
                    detalle: f.get('detalle'),
                }),
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(data.error || 'No pudimos registrar la solicitud.')
            setEstado('ok')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No pudimos registrar la solicitud.')
            setEstado('error')
        }
    }

    if (estado === 'ok') {
        return (
            <div className={styles.ok}>
                <strong>Recibimos tu solicitud.</strong>
                {tipo === 'baja_comunicaciones' || tipo === 'oposicion' ? (
                    <p>
                        Ya dejamos de usar tus datos para publicidad en el sitio. En los próximos días lo aplicamos
                        también en nuestros otros sistemas.
                    </p>
                ) : (
                    <p>
                        Te escribiremos al correo que indicaste. Puede que te pidamos confirmar tu identidad antes de
                        entregar o borrar datos, para proteger tu información.
                    </p>
                )}
            </div>
        )
    }

    return (
        <form className={styles.form} onSubmit={enviar}>
            <fieldset className={styles.opciones}>
                <legend>¿Qué quieres hacer?</legend>
                {DERECHOS.map((d) => (
                    <label key={d.tipo} className={`${styles.opcion} ${tipo === d.tipo ? styles.activa : ''}`}>
                        <input
                            type="radio"
                            name="tipo"
                            value={d.tipo}
                            checked={tipo === d.tipo}
                            onChange={() => setTipo(d.tipo)}
                        />
                        <span>
                            <strong>{d.titulo}</strong>
                            {d.detalle}
                        </span>
                    </label>
                ))}
            </fieldset>

            <div className={styles.campos}>
                <label>
                    Nombre
                    <input name="nombre" required maxLength={200} autoComplete="name" />
                </label>
                <label>
                    Correo con el que nos escribiste
                    <input name="email" type="email" required maxLength={200} autoComplete="email" />
                </label>
                <label>
                    Celular (opcional)
                    <input name="celular" type="tel" maxLength={30} autoComplete="tel" />
                </label>
                <label className={styles.ancho}>
                    Detalle (opcional)
                    <textarea name="detalle" rows={4} maxLength={4000} placeholder="Por ejemplo: qué dato hay que corregir" />
                </label>
            </div>

            {estado === 'error' && <p className={styles.error}>{error}</p>}

            <button type="submit" className={styles.boton} disabled={estado === 'enviando'}>
                {estado === 'enviando' ? 'Enviando…' : 'Enviar solicitud'}
            </button>
        </form>
    )
}
