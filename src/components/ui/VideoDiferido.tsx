'use client'

import { useEffect, useRef } from 'react'

type Props = {
    src: string
    poster: string
    className?: string
}

// Video de fondo (mudo, en loop) que no se descarga al abrir la página:
// empieza a cargar y reproducirse cuando se acerca a la pantalla y se pausa
// al salir. Mientras tanto se ve el poster.
export default function VideoDiferido({ src, poster, className }: Props) {
    const ref = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        const video = ref.current
        if (!video) return
        // React no siempre deja `muted` en el HTML; sin él, iOS no reproduce.
        video.muted = true

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    video.play().catch(() => {
                        // Autoplay bloqueado (ahorro de batería/datos): queda el poster.
                    })
                } else {
                    video.pause()
                }
            },
            { rootMargin: '200px 0px' },
        )
        observer.observe(video)
        return () => observer.disconnect()
    }, [])

    return (
        <video ref={ref} muted loop playsInline preload="none" poster={poster} className={className}>
            <source src={src} type="video/mp4" />
        </video>
    )
}
