'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    CONSENT_COOKIE,
    CONSENT_COOKIE_MAX_AGE,
    parsearConsentimiento,
    serializarConsentimiento,
    type CookieConsent,
} from '@/lib/consent'
import { aplicarConsentimiento, limpiarRastros, requiereRecarga } from './trackers'
import styles from './CookieBanner.module.css'

/** Evento para reabrir las preferencias desde el footer o la política. */
export const ABRIR_PREFERENCIAS = 'alimin:abrir-preferencias-cookies'

export function abrirPreferenciasCookies() {
    window.dispatchEvent(new Event(ABRIR_PREFERENCIAS))
}

function leerCookie(): CookieConsent | null {
    const par = document.cookie.split('; ').find((p) => p.startsWith(`${CONSENT_COOKIE}=`))
    return parsearConsentimiento(par?.slice(CONSENT_COOKIE.length + 1))
}

function guardarCookie(c: CookieConsent) {
    const seguro = location.protocol === 'https:' ? '; Secure' : ''
    document.cookie = `${CONSENT_COOKIE}=${serializarConsentimiento(c)}; Max-Age=${CONSENT_COOKIE_MAX_AGE}; path=/; SameSite=Lax${seguro}`
}

/**
 * Banner de cookies de la Ley 21.719.
 *
 * Rechazar está al mismo nivel que aceptar (no escondido en "configurar"), y
 * nada de analítica ni marketing se carga hasta que el visitante decide.
 */
export default function CookieBanner() {
    const [visible, setVisible] = useState(false)
    const [detalle, setDetalle] = useState(false)
    const [analitica, setAnalitica] = useState(false)
    const [marketing, setMarketing] = useState(false)

    useEffect(() => {
        const guardado = leerCookie()
        if (guardado) aplicarConsentimiento(guardado)
        // La cookie solo existe en el navegador: hasta acá el servidor y el
        // primer render no saben si hay que preguntar.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        else setVisible(true)

        const abrir = () => {
            const actual = leerCookie()
            setAnalitica(actual?.analitica ?? false)
            setMarketing(actual?.marketing ?? false)
            setDetalle(true)
            setVisible(true)
        }
        window.addEventListener(ABRIR_PREFERENCIAS, abrir)
        return () => window.removeEventListener(ABRIR_PREFERENCIAS, abrir)
    }, [])

    const decidir = (c: CookieConsent) => {
        guardarCookie(c)
        setVisible(false)
        setDetalle(false)
        if (requiereRecarga(c)) {
            limpiarRastros(c)
            location.reload()
            return
        }
        limpiarRastros(c)
        aplicarConsentimiento(c)
    }

    if (!visible) return null

    return (
        <div className={styles.banner} role="dialog" aria-modal="false" aria-labelledby="cookies-titulo">
            <p id="cookies-titulo" className={styles.titulo}>Tu privacidad</p>
            <p className={styles.texto}>
                Usamos cookies propias y de Google, Meta y Microsoft para medir las visitas y mostrarte
                anuncios de nuestros proyectos. Solo las activamos si tú aceptas. Más detalle en la{' '}
                <Link href="/politica-de-privacidad#cookies">política de privacidad</Link>.
            </p>

            {detalle && (
                <div className={styles.opciones}>
                    <label className={styles.opcion}>
                        <input type="checkbox" checked disabled />
                        <span>
                            <strong>Necesarias</strong>
                            Hacen funcionar el sitio y recuerdan esta decisión. Siempre activas.
                        </span>
                    </label>
                    <label className={styles.opcion}>
                        <input type="checkbox" checked={analitica} onChange={(e) => setAnalitica(e.target.checked)} />
                        <span>
                            <strong>Analítica</strong>
                            Google Analytics y Microsoft Clarity: qué páginas se visitan y cómo se usa el sitio.
                        </span>
                    </label>
                    <label className={styles.opcion}>
                        <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />
                        <span>
                            <strong>Marketing</strong>
                            Meta Pixel y el seguimiento de nuestro CRM: medir los anuncios de Facebook e Instagram y
                            mostrarte publicidad de Alimin.
                        </span>
                    </label>
                </div>
            )}

            <div className={styles.botones}>
                <button type="button" className={styles.boton} onClick={() => decidir({ analitica: false, marketing: false })}>
                    Rechazar
                </button>
                {detalle ? (
                    <button type="button" className={styles.boton} onClick={() => decidir({ analitica, marketing })}>
                        Guardar selección
                    </button>
                ) : (
                    <button type="button" className={styles.boton} onClick={() => setDetalle(true)}>
                        Configurar
                    </button>
                )}
                <button
                    type="button"
                    className={`${styles.boton} ${styles.principal}`}
                    onClick={() => decidir({ analitica: true, marketing: true })}
                >
                    Aceptar todas
                </button>
            </div>
        </div>
    )
}
