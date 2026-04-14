'use client'

import React, { useRef } from 'react'
import Image from 'next/image'
import { ChevronsLeft, ChevronsRight } from 'lucide-react'
import styles from '../ArenaYSol.module.css'
import AnimatedSection from '@/components/ui/AnimatedSection'

const CLIENTS = [
    { src: '/images/arena_y_sol/client-1.png', label: 'Ya hay clientes avanzando con el cierre perimetral' },
    { src: '/images/arena_y_sol/client-2.png', label: 'Nuevos propietarios planificando su futuro' },
    { src: '/images/arena_y_sol/gallery-3.png', label: 'Terrenos listos para entrega inmediata' },
    { src: '/images/arena_y_sol/intro.png', label: 'Vistas panorámicas garantizadas' },
]

export default function AysFamilyCarousel() {
    const scrollRef = useRef<HTMLDivElement>(null)

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 500
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
                
                <div className="flex gap-4">
                    <button 
                        onClick={() => scroll('left')} 
                        className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"
                        aria-label="Anterior"
                    >
                        <ChevronsLeft size={32} strokeWidth={1.5} />
                    </button>
                    <button 
                        onClick={() => scroll('right')} 
                        className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"
                        aria-label="Siguiente"
                    >
                        <ChevronsRight size={32} strokeWidth={1.5} />
                    </button>
                </div>
            </div>

            <div className="relative mt-8 px-[5%]">
                <div 
                    className="flex gap-8 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-12"
                    ref={scrollRef}
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {CLIENTS.map((item, index) => (
                        <div 
                            key={index} 
                            className="flex-shrink-0 w-[85vw] md:w-[600px] aspect-[16/10] relative rounded-lg overflow-hidden snap-start group"
                        >
                            <Image 
                                src={item.src}
                                alt={item.label}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-8">
                                <p className="text-white text-xl font-light tracking-wide">{item.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
