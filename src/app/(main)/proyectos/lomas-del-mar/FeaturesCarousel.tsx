'use client'

import React, { useRef } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import styles from './FeaturesCarousel.module.css'

const FEATURES = [
    { iconImage: '/images/home_redesign/1.png_1.webp', label: 'Rol propio' },
    { iconImage: '/images/home_redesign/2.png_1.webp', label: 'Proyectos legales y urbanizados' },
    { iconImage: '/images/home_redesign/3.png_1.webp', label: 'Agua certificada por la SEREMI' },
    { iconImage: '/images/home_redesign/4.png_1.webp', label: 'Luz Eléctrica' },
    { iconImage: '/images/home_redesign/5.png_1.webp', label: 'Portón automático' },
    { iconImage: '/images/home_redesign/6.png_1.webp', label: 'Recinto cerrado' },
    { iconImage: '/images/home_redesign/7.png_1.webp', label: 'Calles compactadas con maicillo' },
    { iconImage: '/images/home_redesign/8.png_1.webp', label: 'Luminarias solares' },
    { iconImage: '/images/home_redesign/9.png_1.webp', label: 'Veredas con soleras' },
    { iconImage: '/images/home_redesign/10.png_1.webp', label: 'Estacionamiento para visitas' },
    { iconImage: '/images/home_redesign/11.png_1.webp', label: 'Áreas verdes' },
]

export default function FeaturesCarousel() {
    const scrollRef = useRef<HTMLDivElement>(null)

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 320 // card width + gap approx
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            })
        }
    }

    return (
        <section className={styles.section}>
            <div className="container">
                <h2 className={styles.title}>
                    Terrenos de <span>200 m<sup>2</sup></span> y <span>390 m<sup>2</sup></span> con todo lo que necesitas
                </h2>
                
                <div className={styles.carouselWrapper}>
                    <button 
                        onClick={() => scroll('left')} 
                        className={`${styles.navButton} ${styles.prevButton}`}
                        aria-label="Anterior"
                    >
                        <ChevronsLeft size={24} strokeWidth={2.5} />
                    </button>
                    
                    <div className={styles.carousel} ref={scrollRef}>
                        {FEATURES.map((feature, index) => (
                            <div key={index} className={styles.card}>
                                <div className={styles.iconWrapper}>
                                    <Image 
                                        src={feature.iconImage}
                                        alt={feature.label}
                                        width={80}
                                        height={80}
                                        className={styles.icon}
                                    />
                                </div>
                                <h3 className={styles.cardLabel}>{feature.label}</h3>
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={() => scroll('right')} 
                        className={`${styles.navButton} ${styles.nextButton}`}
                        aria-label="Siguiente"
                    >
                        <ChevronsRight size={24} strokeWidth={2.5} />
                    </button>
                </div>
            </div>
        </section>
    )
}
