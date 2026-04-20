'use client'

import React from 'react'
import Image from 'next/image'
import styles from '../ArenaYSol.module.css'
import AnimatedSection from '@/components/ui/AnimatedSection'

const GALLERY_IMAGES = [
    { src: '/images/arena_y_sol/gallery-1.png', alt: 'Vista terreno loteo 1' },
    { src: '/images/arena_y_sol/gallery-2.png', alt: 'Caminos y acceso pandereta' },
    { src: '/images/arena_y_sol/gallery-3.png', alt: 'Vista panorámica general' },
]

export default function AysGallery() {
    return (
        <section className={styles.gallerySection}>
            <div className="container" style={{ maxWidth: '1600px' }}>
                <AnimatedSection>
                    <h2 className={styles.galleryTitle75}>
                        Más del <span className={styles.goldText}>75%</span> del proyecto vendido
                    </h2>
                </AnimatedSection>

                <div className={styles.galleryFlexContainer}>
                    {GALLERY_IMAGES.map((img, idx) => (
                        <AnimatedSection key={idx} delay={idx * 150}>
                            <div className={styles.galleryItemCard}>
                                <Image
                                    src={img.src}
                                    alt={img.alt}
                                    fill
                                    className={styles.galleryItemImg}
                                />
                            </div>
                        </AnimatedSection>
                    ))}
                </div>
            </div>
        </section>
    )
}
