'use client'

import React from 'react'
import Image from 'next/image'
import styles from '../ArenaYSol.module.css'
import AnimatedSection from '@/components/ui/AnimatedSection'

export default function AysIntro() {
    return (
        <section className={styles.introSection}>
            <div className="container" style={{ maxWidth: '900px' }}>
                <AnimatedSection>
                    <div className={styles.introTop}>
                        <div className={styles.iconWrapper}>
                            <svg viewBox="0 0 100 100" className={styles.sunPalmIcon} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                                {/* Sol */}
                                <circle cx="22" cy="22" r="7" />
                                <path d="M22 8v4 M22 32v4 M8 22h4 M32 22h4 M12 12l3 3 M29 29l3 3 M12 32l3-3 M29 15l3 3" />
                                
                                {/* Olas */}
                                <path d="M10 82 Q 30 72 50 82 T 90 82" />
                                <path d="M15 90 Q 35 80 55 90 T 85 90" />
                                
                                {/* Base/Isla */}
                                <path d="M25 75 Q 55 65 85 75" />
                                
                                {/* Palmera Izquierda */}
                                <path d="M45 72 Q 55 45 42 35" />
                                <path d="M42 35 C 32 30 25 45 22 55 M42 35 C 35 20 20 25 15 30 M42 35 C 55 25 65 30 70 40 M42 35 C 60 45 65 55 60 65" />
                                
                                {/* Palmera Derecha (Más Grande) */}
                                <path d="M65 74 Q 85 30 72 20" />
                                <path d="M72 20 C 60 15 50 30 45 40 M72 20 C 65 5 45 10 40 15 M72 20 C 85 10 95 15 100 25 M72 20 C 95 30 100 45 95 55 M72 20 C 80 15 95 25 95 35" />
                            </svg>
                        </div>
                        <h2 className={styles.introSubtitle}>
                            A solo 10 minutos de la playa de <span className={styles.goldText}>El Tabo</span>
                        </h2>
                    </div>
                </AnimatedSection>
                
                <AnimatedSection delay={200}>
                    <div className={styles.introDividerWrapper}>
                        <div className={styles.introDividerLine}></div>
                        <div className={styles.introLogo}>
                            <Image 
                                src="/images/home_redesign/logo.png.webp" 
                                alt="Alimin Logo" 
                                fill 
                                style={{ objectFit: 'contain' }} 
                            />
                        </div>
                        <div className={styles.introDividerLine}></div>
                    </div>
                </AnimatedSection>

                <AnimatedSection delay={400}>
                    <p className={styles.introDescription}>
                        Un proyecto pensado para quienes <br className="hidden md:block" />
                        <strong>quieren dar el paso hacia un terreno urbanizado</strong> <br className="hidden md:block" />
                        cerca del mar, con acceso claro, servicios y una compra más simple
                    </p>
                </AnimatedSection>
            </div>
        </section>
    )
}
