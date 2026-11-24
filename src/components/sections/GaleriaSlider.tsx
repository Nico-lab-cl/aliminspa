'use client'

import { useState } from 'react'
import Image from 'next/image'
import styles from './GaleriaSlider.module.css'

export type GaleriaProyecto = 'lomas' | 'arena'

export const PROYECTO_LABEL: Record<GaleriaProyecto, string> = {
    lomas: 'Lomas del Mar',
    arena: 'Arena y Sol',
}

const PROYECTOS: GaleriaProyecto[] = ['lomas', 'arena']

type Slide = { foto: string; titulo: string; texto: string }

// Fotos y textos de cada proyecto (en el mismo orden que usa el visor ampliado de Projects).
const SLIDES: Record<GaleriaProyecto, Slide[]> = {
    lomas: [
        {
            foto: 'lomas-del-mar-01',
            titulo: 'Disfruta la tranquilidad de El Tabo',
            texto: 'El Tabo: un lugar donde la naturaleza y la tranquilidad se encuentran, con paisajes que podrás disfrutar cada fin de semana.',
        },
        {
            foto: 'lomas-del-mar-02',
            titulo: 'Conectividad y fácil acceso',
            texto: 'Llega por carretera pavimentada y continúa por el camino de acceso hasta Lomas del Mar, disfrutando de un entorno natural.',
        },
        {
            foto: 'lomas-del-mar-03',
            titulo: 'Espacio para construir tu refugio',
            texto: 'Naturaleza alrededor, aire limpio y silencio. Aquí cabe la casa que siempre imaginaste.',
        },
        {
            foto: 'lomas-del-mar-04',
            titulo: 'Naturaleza y cercanía al mar',
            texto: 'Rodeado de vegetación y a solo 8 minutos de la playa de El Tabo. Disfruta la esencia del Litoral Central en tu propio terreno.',
        },
        {
            foto: 'lomas-del-mar-05',
            titulo: 'Invierte hoy, disfruta mañana',
            texto: 'Un terreno es patrimonio: un lugar para descansar hoy y un legado para tu familia mañana.',
        },
    ],
    arena: [
        {
            foto: 'arena-y-sol-01',
            titulo: 'Terrenos planos de 200 m²',
            texto: 'Espacios amplios y despejados, pensados para desarrollar tu futuro hogar y disfrutar de un lugar propio cerca del mar.',
        },
        {
            foto: 'arena-y-sol-02',
            titulo: 'Tu lote, a tu nombre',
            texto: 'Rol propio y sin copropiedad: el terreno es tuyo desde el primer día.',
        },
        {
            foto: 'arena-y-sol-03',
            titulo: 'Un proyecto ordenado y seguro',
            texto: 'Calles trazadas, recinto cerrado y control de acceso para tu tranquilidad.',
        },
        {
            foto: 'arena-y-sol-04',
            titulo: 'Un entorno con futuro',
            texto: 'Ubicado en una zona del Litoral Central en pleno crecimiento, ideal para quienes buscan construir su patrimonio y disfrutar de una vida más tranquila.',
        },
        {
            foto: 'arena-y-sol-05-v2',
            titulo: 'Rodeado de naturaleza',
            texto: 'Disfruta de la vegetación, los paisajes naturales y la tranquilidad de Arena y Sol, a pocos minutos de la playa de El Tabo.',
        },
    ],
}

const pad = (n: number) => String(n).padStart(2, '0')

type Props = {
    onAbrir: (proyecto: GaleriaProyecto, indice: number) => void
}

function ProyectoSlider({
    proyecto,
    visibleEnMovil,
    onAbrir,
}: {
    proyecto: GaleriaProyecto
    visibleEnMovil: boolean
    onAbrir: Props['onAbrir']
}) {
    const slides = SLIDES[proyecto]
    const [activo, setActivo] = useState(0)
    const ir = (i: number) => setActivo((i + slides.length) % slides.length)
    const slide = slides[activo]

    return (
        <div className={`${styles.proyecto} ${visibleEnMovil ? '' : styles.ocultoMovil}`}>
            <div className={styles.label}>{PROYECTO_LABEL[proyecto]}</div>

            <div className={styles.card}>
                <button
                    type="button"
                    className={styles.stage}
                    onClick={() => onAbrir(proyecto, activo)}
                    aria-label={`Ampliar foto ${activo + 1} de ${PROYECTO_LABEL[proyecto]}`}
                >
                    {slides.map((s, i) => (
                        <Image
                            key={s.foto}
                            src={`/assets/venta-terrenos/gallery/${s.foto}.webp`}
                            alt={PROYECTO_LABEL[proyecto]}
                            fill
                            sizes="(max-width: 760px) 100vw, 580px"
                            className={`${styles.foto} ${i === activo ? styles.on : ''}`}
                        />
                    ))}
                </button>

                <div className={styles.copy}>
                    <div className={styles.flechas}>
                        <button type="button" className={styles.flecha} onClick={() => ir(activo - 1)} aria-label="Foto anterior">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
                        </button>
                        <button type="button" className={styles.flecha} onClick={() => ir(activo + 1)} aria-label="Foto siguiente">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                        </button>
                    </div>

                    {/* key reinicia la animación de entrada del texto en cada cambio */}
                    <div key={activo} className={styles.txt} aria-live="polite">
                        <span className={styles.big}>{pad(activo + 1)}</span>
                        {/* div y no h3: no se altera la estructura de encabezados de la página (SEO). */}
                        <div className={styles.titulo}>{slide.titulo}</div>
                        <p className={styles.texto}>{slide.texto}</p>
                    </div>
                </div>
            </div>

            <div className={styles.tabs}>
                {slides.map((s, i) => (
                    <button
                        key={s.foto}
                        type="button"
                        className={`${styles.tab} ${i === activo ? styles.tabOn : ''} ${i < activo ? styles.tabDone : ''}`}
                        onClick={() => ir(i)}
                        aria-label={`Ir a la foto ${i + 1}: ${s.titulo}`}
                        aria-current={i === activo ? 'true' : undefined}
                    >
                        <span className={styles.bar}>
                            {/* Al terminar de llenarse la barra, pasa a la siguiente foto. */}
                            <i
                                key={i === activo ? `on-${activo}` : 'off'}
                                onAnimationEnd={i === activo ? () => ir(activo + 1) : undefined}
                            />
                        </span>
                        <b>{pad(i + 1)}</b>
                    </button>
                ))}
            </div>
        </div>
    )
}

// PC/tablet: los dos proyectos lado a lado, cada uno con su slider.
// Celular: un solo slider y botones para cambiar de proyecto (scroll corto).
export default function GaleriaSlider({ onAbrir }: Props) {
    const [movil, setMovil] = useState<GaleriaProyecto>('lomas')

    return (
        <div className={styles.galeria}>
            <div className={styles.selector} role="tablist" aria-label="Elegir proyecto">
                {PROYECTOS.map((p) => (
                    <button
                        key={p}
                        type="button"
                        role="tab"
                        aria-selected={movil === p}
                        className={`${styles.selectorBtn} ${movil === p ? styles.selectorOn : ''}`}
                        onClick={() => setMovil(p)}
                    >
                        {PROYECTO_LABEL[p]}
                    </button>
                ))}
            </div>

            <div className={styles.grid}>
                {PROYECTOS.map((p) => (
                    <ProyectoSlider key={p} proyecto={p} visibleEnMovil={movil === p} onAbrir={onAbrir} />
                ))}
            </div>
        </div>
    )
}
