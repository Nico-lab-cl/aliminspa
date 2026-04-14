'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import styles from '../ArenaYSol.module.css'
import AnimatedSection from '@/components/ui/AnimatedSection'
import { X } from 'lucide-react'

const GALLERY_IMAGES = [
    { src: '/images/arena_y_sol/109.png', alt: 'Perímetro y cierre' },
    { src: '/images/arena_y_sol/108.png_2.png', alt: 'Caminos y acceso' },
    { src: '/images/arena_y_sol/110.png', alt: 'Vista panorámica del terreno' },
]

export default function AysGallery() {
    const [selectedImg, setSelectedImg] = useState<string | null>(null)

    return (
        <section className={styles.gallerySection}>
            <div className="container">
                <AnimatedSection>
                    <h2 className={styles.galleryTitle}>
                        Terrenos de 200 m² con todo <br />
                        lo que necesitas
                    </h2>
                </AnimatedSection>

                <div className={styles.galleryGrid}>
                    {GALLERY_IMAGES.map((img, idx) => (
                        <AnimatedSection key={idx} delay={idx * 150}>
                            <div 
                                className={styles.galleryCard}
                                onClick={() => setSelectedImg(img.src)}
                            >
                                <Image
                                    src={img.src}
                                    alt={img.alt}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </AnimatedSection>
                    ))}
                </div>
            </div>

            {/* Lightbox */}
            {selectedImg && (
                <div 
                    className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
                    onClick={() => setSelectedImg(null)}
                >
                    <button 
                        className="absolute top-8 right-8 text-white p-2 hover:bg-white/10 rounded-full transition-colors"
                        onClick={() => setSelectedImg(null)}
                    >
                        <X size={32} />
                    </button>
                    <div className="relative w-full max-w-5xl aspect-video">
                        <Image
                            src={selectedImg}
                            alt="Vista ampliada"
                            fill
                            className="object-contain"
                        />
                    </div>
                </div>
            )}
        </section>
    )
}
