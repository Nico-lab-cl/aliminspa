'use client'

import React, { useRef } from 'react'
import Image from 'next/image'
import { ChevronsLeft, ChevronsRight } from 'lucide-react'
import styles from './AttractionsCarousel.module.css'

const SERVICIOS = [
    { src: '/images/lomas-del-mar/dise_o_sin_t_tulo_1.png', label: 'Unimarc El Tabo' },
    { src: '/images/lomas-del-mar/kaluche.png', label: 'Kaluche Restaurant' },
    { src: '/images/lomas-del-mar/1_2.png', label: 'Supermercado' },
    { src: '/images/lomas-del-mar/2_3.png', label: 'Ferretería' },
    { src: '/images/lomas-del-mar/3_2.png', label: 'Cesfam de El Tabo' },
    { src: '/images/lomas-del-mar/4_2.png', label: 'Quebrada de Córdova' },
]

const ACTIVIDADES = [
    { src: '/images/lomas-del-mar/5_2.png', label: 'Trekking y Senderismo' },
    { src: '/images/lomas-del-mar/6_2.png', label: 'Pesca con Moscas' },
    { src: '/images/lomas-del-mar/7_2.png', label: 'Nadar y Hacer Kayak' },
    { src: '/images/lomas-del-mar/8_2.png', label: 'Cabalgatas' },
    { src: '/images/lomas-del-mar/ciclismo.jpg', label: 'Ciclismo' },
    { src: '/images/lomas-del-mar/buceo.jpg', label: 'Buceo' }
]

export default function AttractionsCarousel() {
    const scrollRefServicios = useRef<HTMLDivElement>(null)
    const scrollRefActividades = useRef<HTMLDivElement>(null)

    const scroll = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
        if (ref.current) {
            const scrollAmount = 300 // aprox 1 card + gap
            ref.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            })
        }
    }

    return (
        <section className={styles.section}>
            <div className="container">
                
                {/* Carousel Servicios */}
                <div className={styles.carouselGroup}>
                    <h2 className={styles.title}>Servicios en El Tabo</h2>
                    <div className={styles.carouselWrapper}>
                        <button 
                            onClick={() => scroll(scrollRefServicios, 'left')} 
                            className={styles.navButton}
                            aria-label="Anterior"
                        >
                            <ChevronsLeft size={20} strokeWidth={2.5} />
                        </button>
                        
                        <div className={styles.carousel} ref={scrollRefServicios}>
                            {SERVICIOS.map((item, index) => (
                                <div key={index} className={styles.card}>
                                    <Image 
                                        src={item.src}
                                        alt={item.label}
                                        fill
                                        sizes="(max-width: 768px) 240px, 260px"
                                        className={styles.image}
                                    />
                                    <div className={styles.label}>{item.label}</div>
                                </div>
                            ))}
                        </div>

                        <button 
                            onClick={() => scroll(scrollRefServicios, 'right')} 
                            className={styles.navButton}
                            aria-label="Siguiente"
                        >
                            <ChevronsRight size={20} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>

                {/* Carousel Actividades */}
                <div className={styles.carouselGroup}>
                    <h2 className={styles.title}>Actividades Recreativas</h2>
                    <div className={styles.carouselWrapper}>
                        <button 
                            onClick={() => scroll(scrollRefActividades, 'left')} 
                            className={styles.navButton}
                            aria-label="Anterior"
                        >
                            <ChevronsLeft size={20} strokeWidth={2.5} />
                        </button>
                        
                        <div className={styles.carousel} ref={scrollRefActividades}>
                            {ACTIVIDADES.map((item, index) => (
                                <div key={index} className={styles.card}>
                                    <Image 
                                        src={item.src}
                                        alt={item.label}
                                        fill
                                        sizes="(max-width: 768px) 240px, 260px"
                                        className={styles.image}
                                    />
                                    <div className={styles.label}>{item.label}</div>
                                </div>
                            ))}
                        </div>

                        <button 
                            onClick={() => scroll(scrollRefActividades, 'right')} 
                            className={styles.navButton}
                            aria-label="Siguiente"
                        >
                            <ChevronsRight size={20} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>

            </div>
        </section>
    )
}
