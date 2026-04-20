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
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className={styles.sunPalmIcon}>
                                {/* Sol Brillante */}
                                <circle cx="22" cy="25" r="8" />
                                <path d="M22 8v4 M22 42v4 M4 25h4 M36 25h4 M9 12l3 3 M32 38l3 3 M9 38l3-3 M32 12l3 3" />

                                {/* Olas Fluidas */}
                                <path d="M10 78 Q 20 70 30 78 T 50 78 T 70 78 T 90 78" />
                                <path d="M15 90 Q 25 82 35 90 T 55 90 T 75 90" />

                                {/* Duna / Isla */}
                                <path d="M20 68 Q 50 50 85 68" />

                                {/* Tronco de la Palmera */}
                                <path d="M65 62 Q 74 45 60 25" />

                                {/* Hojas Curvadas Elegantes */}
                                <path d="M60 25 Q 35 20 30 40" />  
                                <path d="M60 25 Q 45 5 40 15" />    
                                <path d="M60 25 Q 75 0 80 15" />    
                                <path d="M60 25 Q 90 25 90 45" />   
                                <path d="M60 25 Q 75 40 65 50" />   
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
