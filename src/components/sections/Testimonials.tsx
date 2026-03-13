'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import AnimatedSection from '@/components/ui/AnimatedSection'
import styles from './Testimonials.module.css'

const TESTIMONIALS = [
    { id: 1, src: '/images/testimonials/testimonio-1.jpg', alt: 'Familia satisfecha Alimin' },
    { id: 2, src: '/images/testimonials/testimonio-2.jpg', alt: 'Familia satisfecha Alimin' },
    { id: 3, src: '/images/testimonials/testimonio-3.jpg', alt: 'Familia satisfecha Alimin' },
    { id: 4, src: '/images/testimonials/testimonio-4.jpg', alt: 'Familia satisfecha Alimin' },
    { id: 5, src: '/images/testimonials/testimonio-5.jpg', alt: 'Familia satisfecha Alimin' },
    { id: 6, src: '/images/testimonials/testimonio-6.jpg', alt: 'Familia satisfecha Alimin' },
] as const

export default function Testimonials() {
    const [lightboxOpen, setLightboxOpen] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(0)

    useEffect(() => {
        if (lightboxOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [lightboxOpen])

    const openLightbox = (index: number) => {
        setCurrentIndex(index)
        setLightboxOpen(true)
    }

    const closeLightbox = () => {
        setLightboxOpen(false)
    }

    const goToPrev = () => {
        setCurrentIndex((prev) => (prev === 0 ? TESTIMONIALS.length - 1 : prev - 1))
    }

    const goToNext = () => {
        setCurrentIndex((prev) => (prev === TESTIMONIALS.length - 1 ? 0 : prev + 1))
    }

    return (
        <section className={`section ${styles.section}`} id="testimonios">
            <div className={styles.bgOrb} />
            
            <div className="container">
                <div className="section-header">
                    <AnimatedSection>
                        <span className="section-label">Testimonios</span>
                        <h2 className="section-title">
                            Familias que ya confiaron en nosotros
                        </h2>
                        <p className="section-subtitle">
                            Más de 50 familias han encontrado su lugar ideal en el Litoral Central con Alimin Inmobiliaria
                        </p>
                    </AnimatedSection>
                </div>

                <AnimatedSection delay={0.2}>
                    <div className={styles.badge}>
                        <span className={styles.badgeIcon}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </span>
                        <span className={styles.badgeText}>+50 familias confían en nosotros</span>
                    </div>
                </AnimatedSection>

                <div className={styles.grid}>
                    {TESTIMONIALS.map((testimonial, i) => (
                        <AnimatedSection key={testimonial.id} delay={i * 100}>
                            <button
                                className={styles.card}
                                onClick={() => openLightbox(i)}
                                aria-label={`Ver testimonio ${testimonial.id}`}
                            >
                                <div className={styles.imageWrapper}>
                                    <Image
                                        src={testimonial.src}
                                        alt={testimonial.alt}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        className={styles.image}
                                    />
                                    <div className={styles.overlay}>
                                        <span className={styles.zoomIcon}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="11" cy="11" r="8" />
                                                <path d="m21 21-4.3-4.3" />
                                                <path d="M11 8v6" />
                                                <path d="M8 11h6" />
                                            </svg>
                                        </span>
                                    </div>
                                </div>
                            </button>
                        </AnimatedSection>
                    ))}
                </div>
            </div>

            {lightboxOpen && (
                <div className={styles.lightbox} onClick={closeLightbox}>
                    <button
                        className={styles.lightboxClose}
                        onClick={closeLightbox}
                        aria-label="Cerrar"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6 6 18" />
                            <path d="m6 6 12 12" />
                        </svg>
                    </button>

                    <button
                        className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
                        onClick={(e) => { e.stopPropagation(); goToPrev(); }}
                        aria-label="Anterior"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m15 18-6-6 6-6" />
                        </svg>
                    </button>

                    <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
                        <Image
                            src={TESTIMONIALS[currentIndex].src}
                            alt={TESTIMONIALS[currentIndex].alt}
                            width={1200}
                            height={800}
                            className={styles.lightboxImage}
                            priority
                        />
                        <div className={styles.lightboxCounter}>
                            {currentIndex + 1} / {TESTIMONIALS.length}
                        </div>
                    </div>

                    <button
                        className={`${styles.lightboxNav} ${styles.lightboxNext}`}
                        onClick={(e) => { e.stopPropagation(); goToNext(); }}
                        aria-label="Siguiente"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m9 18 6-6-6-6" />
                        </svg>
                    </button>
                </div>
            )}
        </section>
    )
}
