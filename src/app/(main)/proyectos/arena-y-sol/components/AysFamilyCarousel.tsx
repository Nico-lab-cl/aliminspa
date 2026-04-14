'use client'

import React, { useRef } from 'react'
import Image from 'next/image'
import { ChevronsLeft, ChevronsRight } from 'lucide-react'
import styles from '../ArenaYSol.module.css'
import AnimatedSection from '@/components/ui/AnimatedSection'

const CLIENTS = [
    { src: '/images/arena_y_sol/client-1.png', label: 'Ya hay clientes avanzando con el cierre perimetral' },
    { src: '/images/arena_y_sol/client-2.png', label: 'Nuevos propietarios en El Tabo' },
    { src: '/images/arena_y_sol/110.png', label: 'Vista desde el lote 14' },
    { src: '/images/arena_y_sol/15.png', label: 'Etapa de urbanización completa' },
]

export default function AysFamilyCarousel() {
    const scrollRef = useRef<HTMLDivElement>(null)

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 400
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            })
        }
    }

    return (
        <section className={styles.carouselSection}>
            <div className={styles.carouselHeader}>
                <AnimatedSection>
                    <h2 className={styles.carouselTitle}>
                        Ya hay clientes avanzando con el cierre perimetral de sus terrenos
                    </h2>
                </AnimatedSection>
                
                <div className="flex gap-2">
                    <button 
                        onClick={() => scroll('left')} 
                        className={styles.buttonPrimary + " p-2 min-w-0"}
                        aria-label="Anterior"
                    >
                        <ChevronsLeft size={24} />
                    </button>
                    <button 
                        onClick={() => scroll('right')} 
                        className={styles.buttonPrimary + " p-2 min-w-0"}
                        aria-label="Siguiente"
                    >
                        <ChevronsRight size={24} />
                    </button>
                </div>
            </div>

            <div className="relative mt-8 px-[5%]">
                <div 
                    className="flex gap-6 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-8"
                    ref={scrollRef}
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {CLIENTS.map((item, index) => (
                        <div 
                            key={index} 
                            className="flex-shrink-0 w-[80vw] md:w-[450px] aspect-[4/3] relative rounded-lg overflow-hidden snap-start"
                        >
                            <Image 
                                src={item.src}
                                alt={item.label}
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
                                <p className="text-white font-medium">{item.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
