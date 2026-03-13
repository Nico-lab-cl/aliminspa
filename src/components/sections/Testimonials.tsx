'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import AnimatedSection from '@/components/ui/AnimatedSection'
import styles from './Testimonials.module.css'

const TESTIMONIALS = [
    { id: 1, src: '/images/testimonials/testimonio-1.webp', alt: 'Familia satisfecha Alimin' },
    { id: 2, src: '/images/testimonials/testimonio-2.webp', alt: 'Familia satisfecha Alimin' },
    { id: 3, src: '/images/testimonials/testimonio-3.webp', alt: 'Familia satisfecha Alimin' },
    { id: 4, src: '/images/testimonials/testimonio-4.webp', alt: 'Familia satisfecha Alimin' },
    { id: 5, src: '/images/testimonials/testimonio-5.webp', alt: 'Familia satisfecha Alimin' },
    { id: 6, src: '/images/testimonials/testimonio-6.webp', alt: 'Familia satisfecha Alimin' },
] as const

export default function Testimonials() {
    const [lightboxOpen, setLightboxOpen] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [itemsToShow, setItemsToShow] = useState(1)

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setItemsToShow(3)
            } else if (window.innerWidth >= 768) {
                setItemsToShow(2)
            } else {
                setItemsToShow(1)
            }
        }
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

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

    useEffect(() => {
        const interval = setInterval(() => {
            if (!lightboxOpen) {
                goToNext()
            }
        }, 5000)
        return () => clearInterval(interval)
    }, [lightboxOpen, currentIndex, itemsToShow])

    const openLightbox = (index: number) => {
        setCurrentIndex(index)
        setLightboxOpen(true)
    }

    const closeLightbox = () => {
        setLightboxOpen(false)
    }

    const goToPrev = () => {
        setCurrentIndex((prev: number) => (prev === 0 ? TESTIMONIALS.length - 1 : prev - 1))
    }

    const goToNext = () => {
        setCurrentIndex((prev: number) => (prev === TESTIMONIALS.length - 1 ? 0 : prev + 1))
    }

    return (
        <section className={`section ${styles.section}`} id="testimonios">
            <div className={styles.bgOrb} />
            
            <div className="container">
                <div className="section-header">
                    <AnimatedSection>
                        <span className="section-label">Testimonios</span>
                        <h2 className="section-title">
                            +50 familias han encontrado su hogar con nosotros
                        </h2>
                    </AnimatedSection>
                </div>

                <AnimatedSection delay={0.2}>
                    <div className={styles.badgeWrapper}>
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
                    </div>
                </AnimatedSection>

                <div className={styles.carouselContainer}>
                    <div 
                        className={styles.carouselTrack} 
                        style={{ 
                            transform: `translateX(-${currentIndex * (100 / itemsToShow)}%)` 
                        }}
                    >
                        {TESTIMONIALS.map((testimonial, i) => (
                            <div 
                                key={testimonial.id} 
                                className={styles.slide}
                                style={{ flex: `0 0 ${100 / itemsToShow}%` }}
                            >
                                <button
                                    className={`${styles.card} ${i === currentIndex ? styles.activeCard : ''}`}
                                    onClick={() => openLightbox(i)}
                                    aria-label={`Ver testimonio ${testimonial.id}`}
                                >
                                    <div className={styles.imageWrapper}>
                                        <Image
                                            src={testimonial.src}
                                            alt={testimonial.alt}
                                            fill
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            className={styles.image}
                                            priority={i < itemsToShow}
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
                            </div>
                        ))}
                    </div>

                    <button className={`${styles.navButton} ${styles.prevButton}`} onClick={goToPrev} aria-label="Anterior">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m15 18-6-6 6-6" />
                        </svg>
                    </button>
                    <button className={`${styles.navButton} ${styles.nextButton}`} onClick={goToNext} aria-label="Siguiente">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m9 18 6-6-6-6" />
                        </svg>
                    </button>

                    <div className={styles.dots}>
                        {TESTIMONIALS.map((_, i) => (
                            <button
                                key={i}
                                className={`${styles.dot} ${i === currentIndex ? styles.activeDot : ''}`}
                                onClick={() => setCurrentIndex(i)}
                                aria-label={`Ir al testimonio ${i + 1}`}
                            />
                        ))}
                    </div>
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
