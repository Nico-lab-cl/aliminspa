'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import dynamic from 'next/dynamic'
import type { Proyecto } from './proyectos'

/*
 * El agendamiento 3D metido dentro de una landing, justo después del hero.
 *
 * El mapa se ve directo, sin tarjeta previa, pero se descarga recién cuando la
 * sección se acerca a la pantalla: el visor pesa (terreno, texturas, video de
 * llegada) y no debe frenar la carga del hero. Va embebido: no toma la rueda
 * ni el dedo hasta que la persona lo toca, así puede seguir bajando la página.
 *
 * Es el mismo componente de /agendar-visita, no un iframe: el evento Schedule
 * del píxel se registra en la landing y no se cuenta una segunda visita.
 */

const Agenda3D = dynamic(() => import('./Agenda3D'), {
    ssr: false,
    loading: () => <Reserva texto="Cargando el mapa del loteo…" />,
})

const ALTO = 'max(620px, calc(100svh - var(--agenda-bottom, 0px)))'

function Reserva({ texto }: { texto: string }) {
    return (
        <div style={{ height: ALTO, display: 'grid', placeItems: 'center', background: '#eef0ef', color: '#1f2933', font: "500 15px 'Roboto',sans-serif" }}>
            {texto}
        </div>
    )
}

/* Las landings tienen su propio header fijo (marquesina + nav) y, en el
   celular, una barra fija de "Cotizar" abajo. Se miden al montar el mapa para
   que sus controles no queden tapados. */
function medirBarrasFijas() {
    let arriba = 0
    let abajo = 0
    const ancho = window.innerWidth
    const alto = window.innerHeight
    for (const el of Array.from(document.body.querySelectorAll<HTMLElement>('*'))) {
        const pos = getComputedStyle(el).position
        if (pos !== 'fixed' && pos !== 'sticky') continue
        const r = el.getBoundingClientRect()
        if (r.width < ancho * 0.6 || r.height === 0 || r.height > alto * 0.4) continue
        if (r.top <= 1) arriba = Math.max(arriba, r.bottom)
        else if (r.bottom >= alto - 1) abajo = Math.max(abajo, alto - r.top)
    }
    return { arriba: Math.round(arriba), abajo: Math.round(abajo) }
}

export default function AgendaEnLanding({ proyecto }: { proyecto: Proyecto }) {
    const [montar, setMontar] = useState(false)
    const [barras, setBarras] = useState({ arriba: 64, abajo: 0 })
    const ancla = useRef<HTMLElement>(null)

    useEffect(() => {
        const el = ancla.current
        if (!el) return
        const io = new IntersectionObserver(
            entradas => {
                if (entradas.some(e => e.isIntersecting)) {
                    setBarras(medirBarrasFijas())
                    setMontar(true)
                    io.disconnect()
                }
            },
            { rootMargin: '600px 0px' },
        )
        io.observe(el)
        return () => io.disconnect()
    }, [])

    const variables = {
        '--agenda-nav-h': `${barras.arriba || 64}px`,
        '--agenda-bottom': `${barras.abajo}px`,
    } as CSSProperties

    return (
        <section id="agendar" ref={ancla} aria-label="Elige tu lote y agenda tu visita" style={{ position: 'relative', background: '#eef0ef', ...variables }}>
            {montar ? <Agenda3D proyecto={proyecto} embebido /> : <Reserva texto="Mapa del loteo" />}
        </section>
    )
}
