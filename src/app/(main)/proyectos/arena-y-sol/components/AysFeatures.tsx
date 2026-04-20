'use client'

import React, { useRef } from 'react'
import Image from 'next/image'
import { ChevronsLeft, ChevronsRight } from 'lucide-react'
import styles from '../ArenaYSol.module.css'
import AnimatedSection from '@/components/ui/AnimatedSection'

const FEATURES = [
    { iconImage: '/images/home_redesign/1.png_1.webp', label: 'Rol propio' },
    { iconImage: '/images/home_redesign/2.png_1.webp', label: 'Proyectos legales y urbanizados' },
    { iconImage: '/images/home_redesign/3.png_1.webp', label: 'Agua certificada por la SEREMI' },
    { iconImage: '/images/home_redesign/4.png_1.webp', label: 'Luz Eléctrica' },
    { iconImage: '/images/home_redesign/5.png_1.webp', label: 'Portón automático' },
    { iconImage: '/images/home_redesign/6.png_1.webp', label: 'Recinto cerrado' },
]

export default function AysFeatures() {
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
            <div className="container" style={{ maxWidth: '1400px' }}>
                <AnimatedSection>
                    <div className={styles.featuresHeader}>
                        <h2 className={styles.featuresTitle}>
                            Ya hay <span className={styles.goldText}>clientes avanzando</span> con el <br />
                            cierre perimetral de sus terrenos.
                        </h2>
                        <h3 className={styles.featuresSubtitle}>
                            Terrenos de <span className={styles.goldText}>200 m²</span> con todo lo que necesitas
                        </h3>
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
                                        width={160}
                                        height={160}
                                        className={styles.featIcon}
                                    />
                                </div>
                                <h3 className={styles.featCardLabel}>{feature.label}</h3>
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

                <AnimatedSection delay={300}>
                    <div className={styles.featCTAWrapper}>
                        <div className={styles.featCTA}>
                            ¿Estas preparado para construir una vida en la playa?
                        </div>
                    </div>
                </AnimatedSection>
            </div>
        </section>
    )
}
