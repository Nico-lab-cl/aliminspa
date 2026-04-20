'use client'

import React, { useRef } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import styles from '../ArenaYSol.module.css'
import AnimatedSection from '@/components/ui/AnimatedSection'

const FAMILY_IMAGES = [
    { src: '/images/testimonials/testimonio-1.webp', alt: 'Familia Alimin 1' },
    { src: '/images/testimonials/testimonio-2.webp', alt: 'Familia Alimin 2' },
    { src: '/images/testimonials/testimonio-3.webp', alt: 'Familia Alimin 3' },
    { src: '/images/testimonials/testimonio-4.webp', alt: 'Familia Alimin 4' },
    { src: '/images/testimonials/testimonio-5.webp', alt: 'Familia Alimin 5' },
    { src: '/images/testimonials/testimonio-6.webp', alt: 'Familia Alimin 6' },
]

export default function AysFamilyCarousel() {
    const scrollRef = useRef<HTMLDivElement>(null)

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const amount = 350
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -amount : amount,
                behavior: 'smooth'
            })
        }
    }

    return (
        <section className={styles.familySection}>
            <div className="container">
                <AnimatedSection>
                    <h2 className={styles.familyTitle}>
                        +100 familias <br />
                        <span className={styles.goldText}>han invertido con nosotros</span>
                    </h2>
                </AnimatedSection>
                
                <div className={styles.familyCarouselActions}>
                    <button onClick={() => scroll('left')} className={styles.familyNavBtn} aria-label="Anterior">
                        <ChevronLeft size={24} />
                    </button>
                    <button onClick={() => scroll('right')} className={styles.familyNavBtn} aria-label="Siguiente">
                        <ChevronRight size={24} />
                    </button>
                </div>

                <div className={styles.familyScrollContainer} ref={scrollRef}>
                    {FAMILY_IMAGES.map((img, idx) => (
                        <div key={idx} className={styles.familyCard}>
                            <Image 
                                src={img.src}
                                alt={img.alt}
                                fill
                                className="object-cover"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

