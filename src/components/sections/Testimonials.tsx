'use client'

import { useRef } from 'react'
import Image from 'next/image'
import styles from './Testimonials.module.css'

const REVIEWS = [
    {
        initials: 'LB',
        name: 'Liz Beth',
        meta: 'Local Guide · 14 opiniones',
        time: 'Hace 16 semanas',
        gradient: 'linear-gradient(135deg,#4ba646,#325366)',
        text: 'Excelente experiencia. Trámite rápido, ágil y muy confiable. Todo fue claro y bien gestionado 😊',
    },
    {
        initials: 'RC',
        name: 'Romina Cabrera',
        meta: '2 opiniones · 11 fotos',
        time: 'Hace 16 semanas',
        gradient: 'linear-gradient(135deg,#76d845,#4ba646)',
        text: 'Excelente experiencia, la gestión fue rápida y eficaz, me tenían al tanto de todo. ¡Feliz con mi inversión!',
    },
    {
        initials: 'AP',
        name: 'Álvaro Pinto',
        meta: '2 opiniones',
        time: 'Hace 16 semanas',
        gradient: 'linear-gradient(135deg,#325366,#6ac28f)',
        text: 'Muy responsables, todo genial. La gestión fue fantástica y el terreno está en perfectas condiciones.',
    },
    {
        initials: 'RB',
        name: 'Reina Barrios',
        meta: 'Local Guide · 16 opiniones',
        time: 'Hace 3 meses',
        gradient: 'linear-gradient(135deg,#4ba646,#76d845)',
        text: 'Muy buenos los proyectos, cerca al centro del Tabo, opciones de pago y fácil de llegar.',
    },
]

const CLIENT_PHOTOS = [1, 2, 3, 4, 5, 6]

export default function Testimonials() {
    const videoRef = useRef<HTMLVideoElement>(null)

    const toggleVideo = () => {
        const el = videoRef.current
        if (!el) return
        if (el.paused) el.play(); else el.pause()
    }

    return (
        <section className={styles.section} id="testimonios">
            <div className={styles.orb} />
            <div className={`container ${styles.inner}`}>
                <div className={styles.header}>
                    <span className={styles.kicker}>Clientes felices</span>
                    <h2 className={styles.title}>Lo que dicen nuestros clientes</h2>
                </div>

                <div className={styles.featuredGrid}>
                    <div className={styles.videoCard}>
                        <video
                            ref={videoRef}
                            src="/assets/homepage-v2/video-testimonio-cliente.mp4"
                            playsInline
                            className={styles.video}
                        />
                        <div className={styles.videoClickArea} onClick={toggleVideo} />
                        <div className={styles.videoGradient} />
                        <div className={styles.playBtn} onClick={toggleVideo}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff" style={{ marginLeft: 4 }}>
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </div>
                        <div className={styles.videoCaption}>
                            <div className={styles.videoCaptionTitle}>Un cliente de Arena y Sol</div>
                            <div className={styles.videoCaptionDesc}>Su experiencia invirtiendo con Alimin</div>
                        </div>
                    </div>

                    <div className={styles.quoteCard}>
                        <div className={styles.quoteMark}>&ldquo;</div>
                        <p className={styles.quoteText}>
                            Excelente lugar, amo mi terreno aquí en El Tabo. Me costó confiar al principio, pero di
                            el primer paso y hoy estoy feliz con mi inversión.
                        </p>
                        <div className={styles.quoteFooter}>
                            <div className={styles.quoteAvatar}>SU</div>
                            <div>
                                <div className={styles.quoteName}>Sebastián Ullbrish</div>
                                <div className={styles.quoteMeta}>2 opiniones · 18 fotos · Hace 50 semanas</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.reviewsGrid}>
                    {REVIEWS.map((r) => (
                        <div key={r.name} className={styles.reviewCard}>
                            <div className={styles.reviewHeader}>
                                <div className={styles.reviewAvatar} style={{ background: r.gradient }}>
                                    {r.initials}
                                </div>
                                <div>
                                    <div className={styles.reviewName}>{r.name}</div>
                                    <div className={styles.reviewMeta}>{r.meta}</div>
                                </div>
                            </div>
                            <p className={styles.reviewText}>{r.text}</p>
                            <div className={styles.reviewTime}>{r.time}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.marqueeBand}>
                <h3 className={styles.marqueeTitle}>Nuestros nuevos clientes en Lomas del Mar</h3>
                <div className={styles.marqueeMask}>
                    <div className={styles.marqueeTrack}>
                        {[...CLIENT_PHOTOS, ...CLIENT_PHOTOS].map((n, i) => (
                            <div key={i} className={styles.marqueeCard}>
                                <Image
                                    src={`/assets/venta-terrenos/clients/testimonio-${n}.webp`}
                                    alt="Cliente Alimin en Lomas del Mar"
                                    width={200}
                                    height={250}
                                    className={styles.marqueeImg}
                                />
                                <div className={styles.marqueeGradient} />
                                <div className={styles.marqueeTag}>
                                    <span className={styles.marqueeTagDot} />
                                    Cliente verificado
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
