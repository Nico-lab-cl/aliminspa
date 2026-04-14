'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import styles from '../ArenaYSol.module.css'
import AnimatedSection from '@/components/ui/AnimatedSection'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const GALLERY_IMAGES = [
    { src: '/images/arena_y_sol/gallery-1.png', alt: 'Perímetro y cierre', className: styles.item1 },
    { src: '/images/arena_y_sol/gallery-2.png', alt: 'Caminos y acceso', className: styles.item2 },
    { src: '/images/arena_y_sol/gallery-3.png', alt: 'Vista panorámica del terreno', className: styles.item3 },
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
                        <div 
                            key={idx}
                            className={`${styles.galleryCard} ${img.className}`}
                            onClick={() => setSelectedImg(img.src)}
                        >
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

            {/* Lightbox with Framer Motion */}
            <AnimatePresence>
                {selectedImg && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-12 cursor-zoom-out"
                        onClick={() => setSelectedImg(null)}
                    >
                        <button 
                            className="absolute top-8 right-8 text-white p-2 hover:bg-white/10 rounded-full transition-colors z-[110]"
                            onClick={() => setSelectedImg(null)}
                        >
                            <X size={40} />
                        </button>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full h-full max-w-7xl"
                        >
                            <Image
                                src={selectedImg}
                                alt="Vista ampliada"
                                fill
                                className="object-contain"
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    )
}
