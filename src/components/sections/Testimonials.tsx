'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
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
    const [currentIndex, setCurrentIndex] = useState(0)
    const [itemsToShow, setItemsToShow] = useState(4)
    const [selectedImage, setSelectedImage] = useState<typeof TESTIMONIALS[number] | null>(null)

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) setItemsToShow(4)
            else if (window.innerWidth >= 768) setItemsToShow(2)
            else setItemsToShow(1)
        }
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const goToPrev = () => {
        setCurrentIndex((prev) => (prev === 0 ? TESTIMONIALS.length - itemsToShow : prev - 1))
    }

    const goToNext = () => {
        setCurrentIndex((prev) => (prev >= TESTIMONIALS.length - itemsToShow ? 0 : prev + 1))
    }

    return (
        <section className={styles.section} id="testimonios">
            <div className="container">
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        +100 familias<br/>
                        <span className={styles.highlight}>han invertido con nosotros</span>
                    </h2>
                </div>

                <div className={styles.carouselWrapper}>
                    <button className={styles.navButton} onClick={goToPrev} aria-label="Anterior">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    </button>

                    <div className={styles.carouselContainer}>
                        <div 
                            className={styles.carouselTrack} 
                            style={{ transform: `translateX(-${currentIndex * (100 / itemsToShow)}%)` }}
                        >
                            {TESTIMONIALS.map((testimonial, i) => (
                                <div 
                                    key={testimonial.id} 
                                    className={styles.slide}
                                    style={{ flex: `0 0 ${100 / itemsToShow}%`, padding: '0 8px' }}
                                >
                                    <div className={styles.card} onClick={() => setSelectedImage(testimonial)}>
                                        <Image
                                            src={testimonial.src}
                                            alt={testimonial.alt}
                                            width={500}
                                            height={600}
                                            className={styles.image}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button className={styles.navButton} onClick={goToNext} aria-label="Siguiente">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                    </button>
                </div>
            </div>

            {selectedImage && (
                <div className={styles.lightbox} onClick={() => setSelectedImage(null)}>
                    <button className={styles.closeBtn} onClick={() => setSelectedImage(null)}>✕</button>
                    <div className={styles.lightboxContent}>
                        <Image
                            src={selectedImage.src}
                            alt={selectedImage.alt}
                            fill
                            className={styles.lightboxImage}
                        />
                    </div>
                </div>
            )}
        </section>
    )
}
