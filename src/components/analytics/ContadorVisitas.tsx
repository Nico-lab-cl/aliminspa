'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Contador de visitas propio, sin cookies (ver src/lib/panel.ts).
 *
 * No usa cookies, localStorage ni sessionStorage, y no manda ningún
 * identificador: por eso no espera al banner de consentimiento. El origen de
 * la visita (UTM, referrer, si trae id de clic) se toma al cargar la página y
 * se guarda solo en la memoria de esta pestaña, para atribuir al mismo origen
 * las páginas que se recorren después sin recargar.
 */

type Entrada = {
    ref: string
    utm_source: string | null
    utm_medium: string | null
    utm_campaign: string | null
    clicGoogle: boolean
    clicMeta: boolean
}

let entrada: Entrada | null = null
let primeraVista = true
let ultimaRuta = ''

function datosDeEntrada(): Entrada {
    const p = new URLSearchParams(window.location.search)
    return {
        ref: document.referrer,
        utm_source: p.get('utm_source'),
        utm_medium: p.get('utm_medium'),
        utm_campaign: p.get('utm_campaign'),
        clicGoogle: p.has('gclid') || p.has('gbraid') || p.has('wbraid'),
        clicMeta: p.has('fbclid'),
    }
}

export default function ContadorVisitas() {
    const ruta = usePathname()

    useEffect(() => {
        if (!ruta || ruta === ultimaRuta) return
        ultimaRuta = ruta
        entrada ??= datosDeEntrada()

        const cuerpo = JSON.stringify({ ruta, entrada: primeraVista, ...entrada })
        primeraVista = false

        try {
            const enviado = navigator.sendBeacon?.('/api/panel/visita', new Blob([cuerpo], { type: 'application/json' }))
            if (!enviado) {
                fetch('/api/panel/visita', {
                    method: 'POST',
                    body: cuerpo,
                    keepalive: true,
                    headers: { 'Content-Type': 'application/json' },
                }).catch(() => {})
            }
        } catch {
            // Contar visitas nunca debe romper la página.
        }
    }, [ruta])

    return null
}
