'use client'

import React, { useRef } from 'react'
import Image from 'next/image'
import { ChevronsLeft, ChevronsRight } from 'lucide-react'
import styles from '../LibertadYAlegria.module.css'

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
    { src: '/images/lomas-del-mar/buceo.jpg', label: 'Buceo' },
]

export default function LyaAttractions() {
    const scrollRefServicios = useRef<HTMLDivElement>(null)
    const scrollRefActividades = useRef<HTMLDivElement>(null)

    const scroll = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
        if (ref.current) {
            const scrollAmount = 300
            ref.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            })
        }
    }

    return (
        <section className={styles.attractionsSection}>
            <div className="container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
                
                {/* Carousel Servicios */}
                <div className={styles.attractionGroup}>
                    <h2 className={styles.attractionTitle}>Servicios en El Tabo</h2>
                    <div className={styles.attractionCarouselWrapper}>
                        <button 
                            onClick={() => scroll(scrollRefServicios, 'left')} 
                            className={styles.attractionNavBtn}
                            aria-label="Anterior"
                        >
                            <ChevronsLeft size={20} strokeWidth={2.5} />
                        </button>
                        
                        <div className={styles.attractionCarousel} ref={scrollRefServicios}>
                            {SERVICIOS.map((item, index) => (
                                <div key={index} className={styles.attractionCard}>
                                    <Image 
                                        src={item.src}
                                        alt={item.label}
                                        fill
                                        sizes="(max-width: 768px) 240px, 260px"
                                        className={styles.attractionImage}
                                    />
                                    <div className={styles.attractionLabel}>{item.label}</div>
                                </div>
                            ))}
                        </div>

                        <button 
                            onClick={() => scroll(scrollRefServicios, 'right')} 
                            className={styles.attractionNavBtn}
                            aria-label="Siguiente"
                        >
                            <ChevronsRight size={20} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>

                {/* Carousel Actividades */}
                <div className={styles.attractionGroup}>
                    <h2 className={styles.attractionTitle}>Actividades Recreativas</h2>
                    <div className={styles.attractionCarouselWrapper}>
                        <button 
                            onClick={() => scroll(scrollRefActividades, 'left')} 
                            className={styles.attractionNavBtn}
                            aria-label="Anterior"
                        >
                            <ChevronsLeft size={20} strokeWidth={2.5} />
                        </button>
                        
                        <div className={styles.attractionCarousel} ref={scrollRefActividades}>
                            {ACTIVIDADES.map((item, index) => (
                                <div key={index} className={styles.attractionCard}>
                                    <Image 
                                        src={item.src}
                                        alt={item.label}
                                        fill
                                        sizes="(max-width: 768px) 240px, 260px"
                                        className={styles.attractionImage}
                                    />
                                    <div className={styles.attractionLabel}>{item.label}</div>
                                </div>
                            ))}
                        </div>

                        <button 
                            onClick={() => scroll(scrollRefActividades, 'right')} 
                            className={styles.attractionNavBtn}
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
