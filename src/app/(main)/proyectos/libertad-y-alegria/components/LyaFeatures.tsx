'use client'

import React, { useRef } from 'react'
import Image from 'next/image'
import { ChevronsLeft, ChevronsRight } from 'lucide-react'
import styles from '../LibertadYAlegria.module.css'
import AnimatedSection from '@/components/ui/AnimatedSection'

const FEATURES = [
    { iconImage: '/images/home_redesign/1.png_1.webp', label: 'Rol propio' },
    { iconImage: '/images/home_redesign/2.png_1.webp', label: 'Proyectos legales y urbanizados' },
    { iconImage: '/images/home_redesign/3.png_1.webp', label: 'Agua certificada por la SEREMI' },
    { iconImage: '/images/home_redesign/4.png_1.webp', label: 'Luz Eléctrica' },
    { iconImage: '/images/home_redesign/5.png_1.webp', label: 'Portón automático' },
    { iconImage: '/images/home_redesign/6.png_1.webp', label: 'Recinto cerrado' },
]

export default function LyaFeatures() {
    const scrollRef = useRef<HTMLDivElement>(null)

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 350
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            })
        }
    }

    return (
        <section className={styles.featuresSection}>
            <div className="container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
                <AnimatedSection>
                    <div className={styles.featuresHeader}>
                        <h2 className={styles.featuresTitle}>
                            Mas del <span className={styles.goldText}>95%</span> del proyecto vendido
                        </h2>
                    </div>
                </AnimatedSection>
                
                <div className={styles.featCarouselWrapper}>
                    <button 
                        onClick={() => scroll('left')} 
                        className={`${styles.featNavButton} ${styles.featPrevButton}`}
                        aria-label="Anterior"
                    >
                        <ChevronsLeft size={30} strokeWidth={2} />
                    </button>
                    
                    <div className={styles.featCarousel} ref={scrollRef}>
                        {FEATURES.map((feature, index) => (
                            <div key={index} className={styles.featCard}>
                                <div className={styles.featIconWrapper}>
                                    <Image 
                                        src={feature.iconImage}
                                        alt={feature.label}
                                        width={240}
                                        height={240}
                                        className={styles.featIcon}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={() => scroll('right')} 
                        className={`${styles.featNavButton} ${styles.featNextButton}`}
                        aria-label="Siguiente"
                    >
                        <ChevronsRight size={30} strokeWidth={2} />
                    </button>
                </div>
            </div>
        </section>
    )
}
