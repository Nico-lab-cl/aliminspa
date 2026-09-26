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
   celular, una barra fija de "Cotizar" abajo que aparece recién al bajar
   de la portada. Se miden para que no tapen los controles del mapa: si la
   barra de abajo tapa "Agendar visita", en el celular no se puede agendar.

   barraEn busca, subiendo desde lo que hay en ese punto de la pantalla, una
   barra fija de borde a borde (así no cuenta el personaje de Ali, que también
   es fijo). Se ignora el propio mapa y lo que ocupe más del 40% del alto (una
   portada sticky, por ejemplo). */
function barraEn(y: number, mapa: HTMLElement | null): DOMRect | null {
    const ancho = window.innerWidth
    const alto = window.innerHeight
    for (const hit of document.elementsFromPoint(ancho / 2, y)) {
        if (mapa && mapa.contains(hit)) continue
        for (let el: Element | null = hit; el && el !== document.body; el = el.parentElement) {
            const pos = getComputedStyle(el).position
            if (pos !== 'fixed' && pos !== 'sticky') continue
            const r = el.getBoundingClientRect()
            const deBordeABorde = r.left <= ancho * 0.1 && r.right >= ancho * 0.9
            if (deBordeABorde && r.height > 0 && r.height <= alto * 0.4) return r
        }
    }
    return null
}

/* Mide cuánto tapan las barras fijas arriba (pueden ser dos apiladas:
   marquesina y nav) y abajo, en este momento. */
function medirBarrasFijas(mapa: HTMLElement | null) {
    const alto = window.innerHeight
    let arriba = 0
    for (let i = 0; i < 3; i++) {
        const r = barraEn(arriba + 1, mapa)
        if (!r || r.bottom <= arriba + 1) break
        arriba = r.bottom
    }
    let abajo = 0
    for (let i = 0; i < 3; i++) {
        const r = barraEn(alto - abajo - 2, mapa)
        if (!r || alto - r.top <= abajo + 1) break
        abajo = alto - r.top
    }
    return { arriba: Math.round(arriba), abajo: Math.round(abajo) }
}

/* La landing de Arena y Sol escala su contenido con zoom (1,06 en celular y
   hasta 1,24 en pantallas grandes). Dentro del mapa ese zoom desalinea los
   toques con los lotes y lo agranda más allá de la pantalla, así que la
   sección lo anula con el zoom inverso. */
function zoomHeredado(el: HTMLElement | null) {
    let z = 1
    for (let p = el?.parentElement ?? null; p; p = p.parentElement) {
        const v = parseFloat(getComputedStyle(p).zoom || '1')
        if (Number.isFinite(v) && v > 0) z *= v
    }
    return z
}

export default function AgendaEnLanding({ proyecto }: { proyecto: Proyecto }) {
    const [montar, setMontar] = useState(false)
    const [barras, setBarras] = useState({ arriba: 64, abajo: 0 })
    const [zoom, setZoom] = useState(1)
    const ancla = useRef<HTMLElement>(null)

    useEffect(() => {
        const el = ancla.current
        if (!el) return
        const io = new IntersectionObserver(
            entradas => {
                if (entradas.some(e => e.isIntersecting)) {
                    setMontar(true)
                    io.disconnect()
                }
            },
            { rootMargin: '600px 0px' },
        )
        io.observe(el)
        return () => io.disconnect()
    }, [])

    /* Las barras aparecen y desaparecen según el scroll (la de abajo, por
       ejemplo, se muestra al pasar la portada), así que se vuelven a medir
       mientras la persona baja (una vez por cuadro, como mucho) y cada segundo. */
    useEffect(() => {
        if (!montar) return
        let pendiente = 0
        const medir = () => {
            pendiente = 0
            setZoom(zoomHeredado(ancla.current))
            const b = medirBarrasFijas(ancla.current)
            setBarras(prev => (prev.arriba === b.arriba && prev.abajo === b.abajo ? prev : b))
        }
        const alMover = () => {
            if (!pendiente) pendiente = requestAnimationFrame(medir)
        }
        medir()
        window.addEventListener('scroll', alMover, { passive: true })
        window.addEventListener('resize', alMover)
        // Algunas barras aparecen un momento después del scroll (la de "Quiero
        // mi terreno" se monta por estado); un repaso cada segundo las alcanza.
        const repaso = window.setInterval(alMover, 1000)
        return () => {
            window.removeEventListener('scroll', alMover)
            window.removeEventListener('resize', alMover)
            window.clearInterval(repaso)
            if (pendiente) cancelAnimationFrame(pendiente)
        }
    }, [montar])

    const variables = {
        '--agenda-nav-h': `${barras.arriba || 64}px`,
        '--agenda-bottom': `${barras.abajo}px`,
    } as CSSProperties

    return (
        <section id="agendar" ref={ancla} aria-label="Elige tu lote y agenda tu visita" style={{ position: 'relative', background: '#eef0ef', zoom: zoom === 1 ? undefined : 1 / zoom, ...variables }}>
            {montar ? <Agenda3D proyecto={proyecto} embebido /> : <Reserva texto="Mapa del loteo" />}
        </section>
    )
}
