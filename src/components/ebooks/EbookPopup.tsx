'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { EBOOKS, ebookParaRuta, type EbookSlug } from '@/lib/ebooks'
import EbookForm, { claveDescargado } from './EbookForm'
import styles from './Ebooks.module.css'

/**
 * Ofrece un ebook solo a quien muestra interés, para no estorbar al resto.
 *
 * Aparece cuando se cumple una de dos señales:
 *   - lectura: 35 s con la pestaña a la vista y 40% de la página recorrida
 *     (20 s si ya es su segunda página en la visita);
 *   - salida (escritorio): el mouse se va hacia la barra del navegador después
 *     de 12 s y un 25% de recorrido.
 *
 * Y nunca:
 *   - en páginas que no están en ebooks.ts (cotizar, agendar, landings de
 *     anuncios, legales, las propias páginas de los ebooks);
 *   - si ya lo bajó, si ya es lead (tiene id del CRM), si lo cerró en los
 *     últimos 14 días o si ya se le mostró en esta visita;
 *   - mientras escribe en un formulario o está el aviso de cookies.
 *
 * En el celular es una franja abajo, no una pantalla completa: Google castiga
 * los intersticiales que tapan el contenido.
 */

const CERRADO = 'alimin_ebook_popup_cerrado'
const VISTO_EN_SESION = 'alimin_ebook_popup_visto'
const PAGINAS_EN_SESION = 'alimin_paginas_en_sesion'
const DIAS_SILENCIO = 14

const SEG_LECTURA = 35
const SEG_LECTURA_SEGUNDA_PAGINA = 20
const SCROLL_LECTURA = 0.4
const SEG_SALIDA = 12
const SCROLL_SALIDA = 0.25
/** Si tocó un campo hace menos de esto, está ocupado llenando algo. */
const MS_OCUPADO = 20_000

function leer(storage: 'local' | 'session', clave: string): string | null {
    try {
        return (storage === 'local' ? localStorage : sessionStorage).getItem(clave)
    } catch {
        return null
    }
}

function escribir(storage: 'local' | 'session', clave: string, valor: string) {
    try {
        ;(storage === 'local' ? localStorage : sessionStorage).setItem(clave, valor)
    } catch {
        // Sin almacenamiento: el popup puede repetirse, nada más.
    }
}

function puedeOfrecer(slug: EbookSlug): boolean {
    if (leer('session', VISTO_EN_SESION)) return false
    if (leer('local', claveDescargado(slug))) return false
    if (leer('local', 'crm_lead_id')) return false
    const cerrado = Number(leer('local', CERRADO) || 0)
    return !cerrado || Date.now() - cerrado > DIAS_SILENCIO * 86_400_000
}

export default function EbookPopup() {
    const ruta = usePathname() || '/'
    const slug = ebookParaRuta(ruta)
    const [abierto, setAbierto] = useState(false)
    const [conFormulario, setConFormulario] = useState(false)
    const primerCampo = useRef<HTMLDivElement>(null)

    const cerrar = useCallback(() => {
        setAbierto(false)
        escribir('local', CERRADO, String(Date.now()))
        ;(window as any).gtag?.('event', 'ebook_popup_cerrado', { ebook: slug })
    }, [slug])

    useEffect(() => {
        setAbierto(false)
        setConFormulario(false)
        const paginas = Number(leer('session', PAGINAS_EN_SESION) || 0) + 1
        escribir('session', PAGINAS_EN_SESION, String(paginas))
        if (!slug || !puedeOfrecer(slug)) return

        let segundos = 0
        let recorrido = 0
        let ultimoCampo = 0
        let mostrado = false
        const umbral = paginas >= 2 ? SEG_LECTURA_SEGUNDA_PAGINA : SEG_LECTURA

        const medirScroll = () => {
            const alto = document.documentElement.scrollHeight - window.innerHeight
            recorrido = Math.max(recorrido, alto > 0 ? window.scrollY / alto : 1)
        }
        const ocupado = () =>
            Date.now() - ultimoCampo < MS_OCUPADO ||
            !!document.getElementById('cookies-titulo') ||
            // Ya está escribiendo en algún formulario de la página.
            Array.from(document.querySelectorAll<HTMLInputElement>('main input[type="text"], main input[type="email"], main input[type="tel"]')).some(
                (i) => i.value.trim() !== ''
            )

        const mostrar = (motivo: 'lectura' | 'salida') => {
            if (mostrado || ocupado()) return
            mostrado = true
            escribir('session', VISTO_EN_SESION, '1')
            setAbierto(true)
            ;(window as any).gtag?.('event', 'ebook_popup_visto', { ebook: slug, motivo })
        }

        const reloj = window.setInterval(() => {
            if (document.visibilityState !== 'visible') return
            segundos++
            if (segundos >= umbral && recorrido >= SCROLL_LECTURA) mostrar('lectura')
        }, 1000)

        const alEnfocar = (e: FocusEvent) => {
            const t = e.target as HTMLElement | null
            if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) && !t.closest('[data-ebook-popup]')) ultimoCampo = Date.now()
        }
        const alSalir = (e: MouseEvent) => {
            if (e.clientY > 0 || e.relatedTarget) return
            if (!window.matchMedia('(pointer: fine)').matches) return
            if (segundos >= SEG_SALIDA && recorrido >= SCROLL_SALIDA) mostrar('salida')
        }

        medirScroll()
        window.addEventListener('scroll', medirScroll, { passive: true })
        document.addEventListener('focusin', alEnfocar)
        document.documentElement.addEventListener('mouseout', alSalir)
        return () => {
            window.clearInterval(reloj)
            window.removeEventListener('scroll', medirScroll)
            document.removeEventListener('focusin', alEnfocar)
            document.documentElement.removeEventListener('mouseout', alSalir)
        }
    }, [ruta, slug])

    useEffect(() => {
        if (!abierto) return
        const alTeclado = (e: KeyboardEvent) => {
            if (e.key === 'Escape') cerrar()
        }
        document.addEventListener('keydown', alTeclado)
        return () => document.removeEventListener('keydown', alTeclado)
    }, [abierto, cerrar])

    useEffect(() => {
        if (conFormulario) primerCampo.current?.querySelector('input')?.focus()
    }, [conFormulario])

    if (!abierto || !slug) return null
    const ebook = EBOOKS[slug]

    return (
        <div className={styles.popup} role="dialog" aria-modal="false" aria-labelledby="ebook-popup-titulo" data-ebook-popup>
            <button type="button" className={styles.popupCerrar} onClick={cerrar} aria-label="Cerrar">
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </button>

            {!conFormulario ? (
                <div className={styles.popupOferta}>
                    <div className={styles.portadaMini} aria-hidden="true">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={ebook.portada} alt="" />
                        <span>PDF</span>
                    </div>
                    <div className={styles.popupTexto}>
                        <p className={styles.antetitulo}>Guía gratis · {ebook.paginas} páginas</p>
                        <p id="ebook-popup-titulo" className={styles.popupTitulo}>
                            {ebook.titulo}
                        </p>
                        <p className={styles.popupGancho}>{ebook.gancho}</p>
                        <div className={styles.popupAcciones}>
                            <button
                                type="button"
                                className={styles.boton}
                                onClick={() => {
                                    setConFormulario(true)
                                    ;(window as any).gtag?.('event', 'ebook_popup_clic', { ebook: slug })
                                }}
                            >
                                Quiero la guía
                            </button>
                            <button type="button" className={styles.botonTexto} onClick={cerrar}>
                                No, gracias
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div ref={primerCampo}>
                    <p id="ebook-popup-titulo" className={styles.popupTitulo}>
                        {ebook.titulo}
                    </p>
                    <EbookForm ebook={ebook} ubicacion="popup" compacto />
                </div>
            )}
        </div>
    )
}
