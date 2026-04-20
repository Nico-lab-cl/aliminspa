'use client'

import React, { useRef } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import styles from '../ArenaYSol.module.css'
import AnimatedSection from '@/components/ui/AnimatedSection'

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

export default function AysAttractions() {
    const scrollRefServicios = useRef<HTMLDivElement>(null)
    const scrollRefActividades = useRef<HTMLDivElement>(null)

    const scroll = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
        if (ref.current) {
            const amount = 300
            ref.current.scrollBy({
                left: direction === 'left' ? -amount : amount,
                behavior: 'smooth'
            })
        }
    }

    return (
        <section className={styles.attractionsSection}>
            <div className="container">
                
                {/* Carousel Servicios */}
                <div className={styles.attrGroup}>
                    <AnimatedSection>
                        <h2 className={styles.attrTitle}>Servicios en El Tabo</h2>
                    </AnimatedSection>
                    <div className={styles.attrCarouselWrapper}>
                        <button onClick={() => scroll(scrollRefServicios, 'left')} className={styles.attrNavBtn}>
                            <ChevronLeft size={24} />
                        </button>
                        
                        <div className={styles.attrCarousel} ref={scrollRefServicios}>
                            {SERVICIOS.map((item, index) => (
                                <div key={index} className={styles.attrCard}>
                                    <Image src={item.src} alt={item.label} fill className="object-cover" />
                                </div>
                            ))}
                        </div>

                        <button onClick={() => scroll(scrollRefServicios, 'right')} className={styles.attrNavBtn}>
                            <ChevronRight size={24} />
                        </button>
                    </div>
                </div>

                {/* Carousel Actividades */}
                <div className={styles.attrGroup}>
                    <AnimatedSection delay={200}>
                        <h2 className={styles.attrTitle}>Actividades Recreativas</h2>
                    </AnimatedSection>
                    <div className={styles.attrCarouselWrapper}>
                        <button onClick={() => scroll(scrollRefActividades, 'left')} className={styles.attrNavBtn}>
                            <ChevronLeft size={24} />
                        </button>
                        
                        <div className={styles.attrCarousel} ref={scrollRefActividades}>
                            {ACTIVIDADES.map((item, index) => (
                                 <div key={index} className={styles.attrCard}>
                                     <Image src={item.src} alt={item.label} fill className="object-cover" />
                                 </div>
                             ))}
                         </div>

                        <button onClick={() => scroll(scrollRefActividades, 'right')} className={styles.attrNavBtn}>
                            <ChevronRight size={24} />
                        </button>
                    </div>
                </div>

            </div>
        </section>
    )
}
