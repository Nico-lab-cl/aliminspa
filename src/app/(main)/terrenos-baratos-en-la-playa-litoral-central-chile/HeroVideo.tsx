'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './page.module.css'

// Fondo en video del hero, con el mismo patrón que las landings de Arena y Sol
// y Lomas del Mar: primero el poster (va en el HTML servido, así el hero pinta
// de inmediato) y encima el video, que entra con un fundido recién cuando ya
// está reproduciendo. Si el video no puede partir —autoplay bloqueado, ahorro
// de datos, reduced-motion— se queda la imagen y el hero se ve igual de bien.
//
// La pieza es una mezcla de los dos heroes: 9 s de la aérea de Lomas del Mar
// que funden hacia 9 s del loteo de Arena y Sol. Se genera con ffmpeg desde
// public/videos/lomas-del-mar y public/videos/arena-y-sol; si alguno de esos
// heroes cambia, hay que volver a generar este.
const VIDEO_ESCRITORIO = '/videos/terrenos-baratos/hero-desktop.mp4'
const VIDEO_MOVIL = '/videos/terrenos-baratos/hero-mobile.mp4'

export default function HeroVideo() {
    const [video, setVideo] = useState<string | null>(null)
    const [reproduciendo, setReproduciendo] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)

    // El navbar es fijo, así que el hero necesita saber cuánto mide para dejarle
    // espacio al contenido sin que la sección deje de ocupar la pantalla entera.
    // Se mide en vivo porque el PromoBanner puede aparecer o desaparecer.
    useEffect(() => {
        const header = document.querySelector('header')
        if (!header) return
        const medir = () => {
            document.documentElement.style.setProperty(
                '--header-height',
                `${header.offsetHeight}px`
            )
        }
        medir()
        const observer = new ResizeObserver(medir)
        observer.observe(header)
        return () => observer.disconnect()
    }, [])

    // La fuente se elige en el cliente para bajar solo la pieza que corresponde
    // al dispositivo —horizontal o vertical— en vez de las dos.
    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
        const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
        if (conn?.saveData) return
        const movil = window.matchMedia('(max-width:768px)').matches
        setVideo(movil ? VIDEO_MOVIL : VIDEO_ESCRITORIO)
    }, [])

    // El fundido se dispara con un listener nativo: los eventos de media no
    // burbujean y React no siempre engancha onPlaying en un elemento montado
    // después del primer render. timeupdate queda de respaldo por si el
    // navegador se salta playing.
    useEffect(() => {
        const v = videoRef.current
        if (!v) return
        const revelar = () => {
            setReproduciendo(true)
            v.removeEventListener('playing', revelar)
            v.removeEventListener('timeupdate', revelar)
        }
        v.addEventListener('playing', revelar)
        v.addEventListener('timeupdate', revelar)
        v.play().catch(() => {})
        return () => {
            v.removeEventListener('playing', revelar)
            v.removeEventListener('timeupdate', revelar)
        }
    }, [video])

    return (
        <div className={styles.heroMedia}>
            <picture>
                <source
                    media="(max-width:768px)"
                    srcSet="/videos/terrenos-baratos/hero-mobile-poster.webp"
                />
                <img
                    src="/videos/terrenos-baratos/hero-desktop-poster.webp"
                    alt="Vista aérea de los terrenos en El Tabo, Litoral Central, con la costa al fondo"
                    fetchPriority="high"
                    className={styles.heroPoster}
                />
            </picture>

            {video && (
                <video
                    key={video}
                    src={video}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    aria-hidden="true"
                    tabIndex={-1}
                    ref={videoRef}
                    className={styles.heroVideo}
                    style={{ opacity: reproduciendo ? 1 : 0 }}
                />
            )}

            <div className={styles.heroOverlay} />
            <div className={styles.heroOrbVerde} />
            <div className={styles.heroOrbAzul} />
        </div>
    )
}
