'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { getUtmParams, newEventId } from '@/lib/track'
import type { Ebook } from '@/lib/ebooks'
import ConsentimientoFormulario, { useConsentimiento } from '@/components/consent/ConsentimientoFormulario'
import styles from './Ebooks.module.css'

/** Marca local para no volver a ofrecer un ebook que ya bajó. */
export const claveDescargado = (slug: string) => `alimin_ebook_${slug}`

export function marcarDescargado(slug: string) {
    try {
        localStorage.setItem(claveDescargado(slug), String(Date.now()))
    } catch {
        // Sin almacenamiento (modo privado): a lo más se le vuelve a ofrecer.
    }
}

const getCookie = (name: string) => {
    if (typeof document === 'undefined') return undefined
    const parts = `; ${document.cookie}`.split(`; ${name}=`)
    return parts.length === 2 ? parts.pop()?.split(';').shift() : undefined
}

interface Props {
    ebook: Ebook
    /** Dónde está el formulario, para las UTM por defecto y el nombre del evento. */
    ubicacion: 'pagina' | 'popup'
    compacto?: boolean
}

/**
 * Tres datos y el consentimiento: es un contacto frío, no una cotización. Al
 * enviarlo el PDF queda para descargar en la misma pantalla; el correo con la
 * guía y su secuencia salen solo si marcó la casilla de novedades.
 */
export default function EbookForm({ ebook, ubicacion, compacto = false }: Props) {
    const [form, setForm] = useState({ nombre: '', email: '', celular: '' })
    const [estado, setEstado] = useState<'idle' | 'enviando' | 'listo' | 'error'>('idle')
    const consentimiento = useConsentimiento()

    const enviar = async (e: FormEvent) => {
        e.preventDefault()
        setEstado('enviando')
        const eventId = newEventId()
        const nombreEvento = `Ebook - ${ebook.slug}`
        try {
            const res = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: form.nombre,
                    email: form.email,
                    celular: form.celular,
                    // /api/leads exige ciudad; aquí no se pregunta.
                    ciudad: 'No especificada',
                    ebook: ebook.slug,
                    content_name: nombreEvento,
                    fbp: getCookie('_fbp'),
                    fbc: getCookie('_fbc'),
                    eventId,
                    ...getUtmParams({ utm_source: 'web', utm_medium: `ebook_${ubicacion}`, utm_campaign: ebook.slug }),
                    ...consentimiento.datos(),
                }),
            })
            if (!res.ok) throw new Error('Error al enviar')

            marcarDescargado(ebook.slug)
            const w = window as any
            // Mismo eventID que la CAPI del servidor. No es un Lead a propósito.
            w.fbq?.('track', 'CompleteRegistration', { content_name: nombreEvento, content_category: 'Ebook' }, { eventID: eventId })
            w.gtag?.('event', 'ebook_descarga', { ebook: ebook.slug, ubicacion })
            if (w.AliminCRM) {
                const partes = form.nombre.trim().split(/\s+/)
                w.AliminCRM.identify({
                    email: form.email,
                    firstName: partes[0] || '',
                    lastName: partes.slice(1).join(' '),
                    phone: form.celular,
                    source: 'Ebook',
                }).catch(() => {})
            }
            setEstado('listo')
        } catch {
            setEstado('error')
            setTimeout(() => setEstado('idle'), 4000)
        }
    }

    if (estado === 'listo') {
        return (
            <div className={styles.listo} role="status">
                <span className={styles.listoIcono} aria-hidden="true">✓</span>
                <p className={styles.listoTitulo}>Tu guía está lista</p>
                <a
                    className={styles.boton}
                    href={ebook.pdf}
                    target="_blank"
                    rel="noopener"
                    download
                    onClick={() => (window as any).gtag?.('event', 'ebook_abrir_pdf', { ebook: ebook.slug })}
                >
                    Descargar la guía (PDF)
                </a>
                {consentimiento.marketing && (
                    <p className={styles.nota}>También te la enviamos a {form.email}.</p>
                )}
                <p className={styles.nota}>
                    ¿Quieres verlo en persona? <Link href="/agendar-visita">Agenda una visita a El Tabo</Link>
                </p>
            </div>
        )
    }

    return (
        <form className={compacto ? styles.formCompacto : styles.form} onSubmit={enviar}>
            <label className={styles.campo}>
                <span>Nombre</span>
                <input
                    className={styles.input}
                    type="text"
                    autoComplete="name"
                    required
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
            </label>
            <label className={styles.campo}>
                <span>Correo</span>
                <input
                    className={styles.input}
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
            </label>
            <label className={styles.campo}>
                <span>Teléfono / WhatsApp</span>
                <input
                    className={styles.input}
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    required
                    value={form.celular}
                    onChange={(e) => setForm({ ...form, celular: e.target.value })}
                />
            </label>

            <ConsentimientoFormulario consentimiento={consentimiento} textoContacto="para descargar esta guía." />

            <button type="submit" className={styles.boton} disabled={estado === 'enviando'}>
                {estado === 'enviando' ? 'Preparando tu guía…' : 'Quiero mi guía gratis'}
            </button>
            <p className={styles.nota}>Sin costo. Un PDF de {ebook.paginas} páginas para leer con calma.</p>
            {estado === 'error' && (
                <p className={styles.error} role="alert">
                    No pudimos enviar tus datos. Revisa tu conexión e inténtalo de nuevo.
                </p>
            )}
        </form>
    )
}
