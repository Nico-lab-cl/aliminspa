'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import styles from './Projects.module.css'
import GaleriaSlider from './GaleriaSlider'
import VideoDiferido from '@/components/ui/VideoDiferido'

const GALLERY = {
    lomas: ['lomas-del-mar-01', 'lomas-del-mar-02', 'lomas-del-mar-03', 'lomas-del-mar-04', 'lomas-del-mar-05'],
    arena: ['arena-y-sol-01', 'arena-y-sol-02', 'arena-y-sol-03', 'arena-y-sol-04', 'arena-y-sol-05-v2'],
} as const

const GALLERY_LABELS = {
    lomas: 'Lomas del Mar',
    arena: 'Arena y Sol',
} as const

type Project = keyof typeof GALLERY

export default function Projects() {
    const [lightbox, setLightbox] = useState<{ project: Project; index: number } | null>(null)

    useEffect(() => {
        if (!lightbox) return

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setLightbox(null)
            if (e.key === 'ArrowRight') {
                setLightbox((prev) => prev && {
                    ...prev,
                    index: (prev.index + 1) % GALLERY[prev.project].length,
                })
            }
            if (e.key === 'ArrowLeft') {
                setLightbox((prev) => prev && {
                    ...prev,
                    index: (prev.index - 1 + GALLERY[prev.project].length) % GALLERY[prev.project].length,
                })
            }
        }

        document.body.style.overflow = 'hidden'
        window.addEventListener('keydown', onKeyDown)
        return () => {
            document.body.style.overflow = ''
            window.removeEventListener('keydown', onKeyDown)
        }
    }, [lightbox])

    const goNext = () => {
        setLightbox((prev) => prev && {
            ...prev,
            index: (prev.index + 1) % GALLERY[prev.project].length,
        })
    }

    const goPrev = () => {
        setLightbox((prev) => prev && {
            ...prev,
            index: (prev.index - 1 + GALLERY[prev.project].length) % GALLERY[prev.project].length,
        })
    }

    // Logo de Alimin difuminado que sigue al cursor sobre el fondo oscuro.
    // Queda detrás del contenido, así que solo se ve en las zonas sin tarjetas.
    const glowRef = useRef<HTMLDivElement>(null)
    const estelaRef = useRef<HTMLDivElement>(null)
    const ultimaChispa = useRef(0)

    const moverGlow = (e: React.MouseEvent<HTMLElement>) => {
        const glow = glowRef.current
        if (!glow) return
        const r = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - r.left
        const y = e.clientY - r.top
        glow.style.transform = `translate(${x}px, ${y}px)`
        glow.classList.add(styles.logoGlowOn)

        // Estela tipo cometa: chispas que se desvanecen donde pasó el cursor.
        const estela = estelaRef.current
        const ahora = performance.now()
        if (!estela || ahora - ultimaChispa.current < 28 || estela.childElementCount > 24) return
        ultimaChispa.current = ahora
        const chispa = document.createElement('span')
        chispa.className = styles.chispa
        chispa.style.left = `${x}px`
        chispa.style.top = `${y}px`
        chispa.addEventListener('animationend', () => chispa.remove())
        estela.appendChild(chispa)
    }

    const ocultarGlow = () => glowRef.current?.classList.remove(styles.logoGlowOn)

    return (
        <section
            className={styles.section}
            id="proyectos"
            onMouseMove={moverGlow}
            onMouseLeave={ocultarGlow}
        >
            <div ref={estelaRef} className={styles.estela} aria-hidden="true" />
            <div ref={glowRef} className={styles.logoGlow} aria-hidden="true" />
            <div className={styles.inner}>
                <div className={styles.header}>
                    <div className={styles.kickerRow}>
                        <span className={styles.rule} />
                        <span className={styles.kicker}>Disponibles ahora</span>
                        <span className={styles.ruleRight} />
                    </div>
                    <h2 className={styles.title}>Terrenos Disponibles</h2>
                    <p className={styles.subtitle}>Nuestros dos proyectos activos con lotes disponibles hoy en El Tabo.</p>
                </div>

                <div className={styles.videoGrid}>
                    <div className={styles.videoCard}>
                        <VideoDiferido
                            src="/assets/homepage-v2/video-lomas-del-mar.mp4"
                            poster="/assets/homepage-v2/video-lomas-del-mar-poster.webp"
                            className={styles.video}
                        />
                        <div className={styles.videoOverlay} />
                        <div className={styles.videoCaption}>
                            <div className={styles.videoTitle}>Lomas del Mar</div>
                            <div className={styles.videoDesc}>Terrenos de 200 m² – 390 m² · A 8 min de la playa</div>
                        </div>
                    </div>
                    <div className={styles.videoCard}>
                        <VideoDiferido
                            src="/assets/homepage-v2/video-arena-y-sol.mp4"
                            poster="/assets/homepage-v2/video-arena-y-sol-poster.webp"
                            className={styles.video}
                        />
                        <div className={styles.videoOverlay} />
                        <div className={styles.videoCaption}>
                            <div className={styles.videoTitle}>Arena y Sol</div>
                            <div className={styles.videoDesc}>Terrenos de 200 m² · A 8 min de la playa</div>
                        </div>
                    </div>
                </div>

                <div className={styles.galleryWrapper}>
                    <div className={styles.galleryHeader}>
                        <div className={styles.galleryTitle}>Así están los terrenos hoy</div>
                        <div className={styles.gallerySubtitle}>Galería de avance de cada proyecto en El Tabo</div>
                    </div>
                    <GaleriaSlider onAbrir={(project, index) => setLightbox({ project, index })} />
                </div>

                <div className={styles.ctaWrapper}>
                    <Link href="#formulario" className={styles.ctaButton}>
                        Cotizar
                    </Link>
                </div>
            </div>

            {lightbox && (
                <div className={styles.lightbox} onClick={() => setLightbox(null)}>
                    <button
                        type="button"
                        className={styles.lightboxClose}
                        onClick={() => setLightbox(null)}
                        aria-label="Cerrar galería"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>

                    <button
                        type="button"
                        className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
                        onClick={(e) => { e.stopPropagation(); goPrev() }}
                        aria-label="Foto anterior"
                    >
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    </button>

                    <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.lightboxImgWrapper}>
                            <Image
                                src={`/assets/venta-terrenos/gallery/${GALLERY[lightbox.project][lightbox.index]}.webp`}
                                alt={GALLERY_LABELS[lightbox.project]}
                                fill
                                className={styles.lightboxImg}
                                sizes="90vw"
                            />
                        </div>
                        <div className={styles.lightboxCaption}>
                            <span>{GALLERY_LABELS[lightbox.project]}</span>
                            <span className={styles.lightboxCounter}>{lightbox.index + 1} / {GALLERY[lightbox.project].length}</span>
                        </div>
                        <div className={styles.lightboxDots}>
                            {GALLERY[lightbox.project].map((_, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    className={`${styles.lightboxDot} ${i === lightbox.index ? styles.lightboxDotActive : ''}`}
                                    onClick={() => setLightbox({ project: lightbox.project, index: i })}
                                    aria-label={`Ir a foto ${i + 1}`}
                                />
                            ))}
                        </div>
                    </div>

                    <button
                        type="button"
                        className={`${styles.lightboxNav} ${styles.lightboxNext}`}
                        onClick={(e) => { e.stopPropagation(); goNext() }}
                        aria-label="Foto siguiente"
                    >
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                    </button>
                </div>
            )}
        </section>
    )
}
