'use client'

import { useRef, useState, type CSSProperties } from 'react'
import dynamic from 'next/dynamic'
import { CalendarCheck } from 'lucide-react'
import type { Proyecto } from './proyectos'

/*
 * El agendamiento 3D metido dentro de una landing, justo después del hero.
 *
 * No se monta de entrada: el visor pesa (terreno, texturas, video de llegada)
 * y en el celular un mapa de pantalla completa atrapa el dedo de quien solo
 * quiere seguir bajando. Por eso primero se ve una tarjeta con el llamado, y el
 * mapa se descarga y aparece recién cuando la persona toca el botón.
 *
 * Es el mismo componente de /agendar-visita, no un iframe: el evento Schedule
 * del píxel se registra en la landing y no se cuenta una segunda visita.
 */

const Agenda3D = dynamic(() => import('./Agenda3D'), {
    ssr: false,
    loading: () => (
        <div style={{ height: '100svh', minHeight: 620, display: 'grid', placeItems: 'center', background: '#eef0ef', color: '#1f2933', font: "500 15px 'Roboto',sans-serif" }}>
            Cargando el mapa del loteo…
        </div>
    ),
})

/* Las landings tienen su propio header fijo (marquesina + nav) y, en el
   celular, una barra fija de "Cotizar" abajo. Se miden al abrir el mapa para
   que sus controles no queden tapados: arriba lo que ocupa el header, abajo la
   barra. */
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

export default function AgendaEnLanding({ proyecto, detalle }: { proyecto: Proyecto; detalle: string }) {
    const [abierto, setAbierto] = useState(false)
    const [barras, setBarras] = useState({ arriba: 64, abajo: 0 })
    const ancla = useRef<HTMLDivElement>(null)

    const abrir = () => {
        setBarras(medirBarrasFijas())
        setAbierto(true)
        // Se lleva el borde de la sección al tope exacto de la pantalla (no con
        // scrollIntoView, que respeta el scroll-padding de la landing): el
        // header queda encima y el mapa ya baja sus controles --agenda-nav-h.
        requestAnimationFrame(() => {
            const el = ancla.current
            if (!el) return
            window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: 'smooth' })
        })
    }

    const variables = {
        '--agenda-nav-h': `${barras.arriba || 64}px`,
        '--agenda-bottom': `${barras.abajo}px`,
    } as CSSProperties

    return (
        <section id="agendar" ref={ancla} style={{ position: 'relative', background: '#eef0ef', ...variables }}>
            {abierto ? (
                <Agenda3D proyecto={proyecto} />
            ) : (
                <div style={{ padding: '64px 20px' }}>
                    <div
                        style={{
                            maxWidth: 720,
                            margin: '0 auto',
                            background: '#fff',
                            border: '1.5px solid #4ba646',
                            borderRadius: 18,
                            padding: '36px 28px',
                            textAlign: 'center',
                            boxShadow: '0 12px 32px rgba(31,41,51,.08)',
                        }}
                    >
                        <span
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                font: "700 12px 'Montserrat',sans-serif",
                                letterSpacing: '.08em',
                                textTransform: 'uppercase',
                                color: '#2d7a3a',
                            }}
                        >
                            <CalendarCheck size={16} /> Agenda tu visita
                        </span>
                        <h2 style={{ margin: '12px 0 10px', font: "800 clamp(24px,4vw,34px)/1.15 'Montserrat',sans-serif", color: '#1f2933' }}>
                            Elige tu lote y agenda tu visita
                        </h2>
                        <p style={{ margin: '0 auto 24px', maxWidth: 540, font: "400 15px/1.65 'Roboto',sans-serif", color: '#4b5563' }}>
                            {detalle}
                        </p>
                        <button
                            type="button"
                            onClick={abrir}
                            style={{
                                background: '#4ba646',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 100,
                                padding: '15px 28px',
                                font: "700 15px 'Montserrat',sans-serif",
                                cursor: 'pointer',
                                boxShadow: '0 8px 22px rgba(75,166,70,.35)',
                            }}
                        >
                            Ver el mapa y agendar mi visita →
                        </button>
                        <p style={{ margin: '14px 0 0', font: "400 12px 'Roboto',sans-serif", color: '#6b7280' }}>
                            Visita en terreno en El Tabo · Sin costo y sin compromiso
                        </p>
                    </div>
                </div>
            )}
        </section>
    )
}
