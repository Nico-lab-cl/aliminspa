'use client'

import { useEffect } from 'react'

/**
 * Medición de las páginas de brochure en Clarity y Google Analytics.
 *
 * No carga nada por su cuenta: si el visitante no aceptó las cookies de
 * analítica, Clarity y gtag nunca llegan a cargarse y lo que se encola acá se
 * descarta (Ley 21.719). El stub de Clarity es el mismo que usa
 * components/consent/trackers.ts, que lo reutiliza si ya existe.
 *
 * Filtros útiles en Clarity: etiqueta `brochure` (lomas-del-mar / arena-y-sol),
 * `origen` (instagram / facebook) y `via` (comentario / dm), y los eventos
 * brochure_pdf, brochure_agendar y brochure_final (llegó a la última página).
 */

type W = Window & {
    clarity?: ((...args: unknown[]) => void) & { q?: unknown[] }
    gtag?: (...args: unknown[]) => void
}

function clarity(...args: unknown[]) {
    const w = window as W
    w.clarity =
        w.clarity ||
        Object.assign(
            function clarity(...a: unknown[]) {
                ;(w.clarity!.q = w.clarity!.q || []).push(a)
            },
            { q: [] as unknown[] }
        )
    w.clarity(...args)
}

function evento(nombre: string, slug: string) {
    clarity('event', nombre)
    ;(window as W).gtag?.('event', nombre, { brochure: slug })
}

export default function BrochureMedicion({ slug }: { slug: string }) {
    useEffect(() => {
        const q = new URLSearchParams(window.location.search)
        clarity('set', 'brochure', slug)
        const origen = q.get('utm_source')
        const via = q.get('utm_content')
        if (origen) clarity('set', 'origen', origen)
        if (via) clarity('set', 'via', via)
        ;(window as W).gtag?.('event', 'brochure_visto', { brochure: slug, origen: origen || 'directo' })

        // Los botones marcan data-medir="brochure_pdf" o "brochure_agendar".
        const alClic = (e: MouseEvent) => {
            const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-medir]')
            if (el?.dataset.medir) evento(el.dataset.medir, slug)
        }
        document.addEventListener('click', alClic)

        let final: IntersectionObserver | null = null
        const ultima = document.querySelector('[data-ultima-pagina]')
        if (ultima && 'IntersectionObserver' in window) {
            final = new IntersectionObserver((entradas) => {
                if (entradas.some((x) => x.isIntersecting)) {
                    evento('brochure_final', slug)
                    final?.disconnect()
                }
            })
            final.observe(ultima)
        }

        return () => {
            document.removeEventListener('click', alClic)
            final?.disconnect()
        }
    }, [slug])

    return null
}
