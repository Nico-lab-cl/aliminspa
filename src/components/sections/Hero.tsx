'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { getImageProps } from 'next/image'
import { SITE } from '@/lib/constants'
import QuoteForm from './QuoteForm'
import styles from './Hero.module.css'

// Fondo del hero: una imagen para PC y otra para celular/tablet.
// Medidas recomendadas (WebP, calidad 75–80):
//   - PC:      2560 × 1440 px (16:9 horizontal)  → HERO_BG_PC
//   - Celular: 1080 × 2400 px (9:20 vertical)    → HERO_BG_MOVIL
// Lo importante de la foto debe ir al centro; el tercio inferior queda bajo
// el degradado y, en PC, el lado derecho queda tapado por el formulario.
// Las imágenes son el primer cuadro de cada video: se ven al instante y quedan
// de respaldo si el video no carga o el usuario prefiere menos movimiento.
const HERO_BG_PC = '/assets/homepage-v2/hero-pc-poster.webp'
const HERO_BG_MOVIL = '/assets/homepage-v2/hero-movil-poster.webp'
// Video de fondo (H.264, sin audio, 12 s en loop; el final se funde con el
// inicio para que no se note el salto). Fuente 2K. PC: 1920×1080. Celular/tablet:
// recorte central 1080×1440.
const HERO_VIDEO_PC = '/assets/homepage-v2/hero-pc.mp4'
const HERO_VIDEO_MOVIL = '/assets/homepage-v2/hero-movil.mp4'
// Coincide con el breakpoint donde el formulario pasa debajo del texto.
const HERO_BG_MEDIA_PC = '(min-width: 1025px)'

export default function Hero() {
    const heroBgCommon = {
        alt: 'Vista aérea del Litoral Central: bosque, camino y costa',
        fill: true,
        priority: true,
        sizes: '100vw',
    }
    const {
        props: { srcSet: heroBgPcSrcSet },
    } = getImageProps({ ...heroBgCommon, src: HERO_BG_PC })
    const { props: heroBgMovilProps } = getImageProps({ ...heroBgCommon, src: HERO_BG_MOVIL })

    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        // React no siempre deja el atributo `muted` en el HTML; sin él, iOS no
        // reproduce el video automáticamente.
        const video = videoRef.current
        if (!video) return
        video.muted = true
        video.play().catch(() => {
            // Autoplay bloqueado (ahorro de batería/datos): queda la imagen.
        })
    }, [])

    useEffect(() => {
        const header = document.querySelector('header')
        if (!header) return

        const setHeaderHeight = () => {
            document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`)
        }

        setHeaderHeight()
        const observer = new ResizeObserver(setHeaderHeight)
        observer.observe(header)
        return () => observer.disconnect()
    }, [])

    return (
        <section className={styles.hero} id="hero">
            <div className={styles.bgWrapper}>
                <picture>
                    <source media={HERO_BG_MEDIA_PC} srcSet={heroBgPcSrcSet} />
                    {/* eslint-disable-next-line jsx-a11y/alt-text -- alt viene en heroBgMovilProps (getImageProps) */}
                    <img
                        {...heroBgMovilProps}
                        loading="eager"
                        fetchPriority="high"
                        className={styles.bgImage}
                        style={{ ...heroBgMovilProps.style, objectPosition: 'center 40%' }}
                    />
                </picture>
                <video
                    ref={videoRef}
                    className={styles.bgVideo}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    aria-hidden="true"
                    tabIndex={-1}
                >
                    <source src={HERO_VIDEO_PC} type="video/mp4" media={HERO_BG_MEDIA_PC} />
                    <source src={HERO_VIDEO_MOVIL} type="video/mp4" />
                </video>
                <div className={styles.overlay} />
            </div>

            <div className={`container ${styles.grid}`}>
                <div className={styles.content}>
                    <h1 className={styles.title}>
                        Terrenos urbanizados en El Tabo con{' '}
                        <span className={styles.highlight}>rol propio</span> y{' '}
                        <span className={styles.highlight}>crédito directo</span>
                    </h1>

                    <p className={styles.subtitle}>
                        A minutos de la playa, con agua, luz y{' '}
                        <strong className={styles.subtitleStrong}>facilidades de pago sin bancos</strong>
                    </p>

                    <div className={styles.ctas}>
                        <Link href="#proyectos" className={styles.btnProject}>
                            Ver Proyectos
                        </Link>
                        <Link
                            href={`https://wa.me/${SITE.whatsapp}?text=Hola,%20quiero%20cotizar%20un%20terreno%20en%20El%20Tabo.%20Vengo%20de%20la%20p%C3%A1gina%20principal%20de%20Alimin.`}
                            className={`${styles.btnWhatsApp} crm-track-click`}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-crm-name="WhatsApp Cotizar - Hero Principal"
                            data-crm-category="Cotizacion"
                        >
                            Cotizar por WhatsApp
                        </Link>
                    </div>
                </div>

                <QuoteForm source="hero" formId="form-hero" />
            </div>
        </section>
    )
}
