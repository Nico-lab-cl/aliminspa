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
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className={styles.sunPalmIcon}>
                                {/* Isla Base */}
                                <path d="M14 46 Q 36 36 56 46" strokeWidth="2.5" />
                                
                                {/* Sol */}
                                <g transform="translate(6, 4)">
                                    <circle cx="12" cy="12" r="5" strokeWidth="2.5" />
                                    <path d="M12 1v3 M12 20v3 M1.5 12h3 M19.5 12h3 M4.5 4.5l2.5 2.5 M17 17l2.5 2.5 M4.5 19.5l2.5-2.5 M17 4.5l2.5 2.5" strokeWidth="2.5" />
                                </g>

                                {/* Palmera Tropical (Tronco curvo y hojas) */}
                                <g transform="translate(24, 10) scale(1.6)" strokeWidth="1.5">
                                    <path d="M13 8c0-2.76-2.46-5-5.5-5S2 5.24 2 8h2l1-1 1 1h4" />
                                    <path d="M13 7.14A5.82 5.82 0 0 1 16.5 6c3.04 0 5.5 2.24 5.5 5h-3l-1-1-1 1h-3" />
                                    <path d="M5.89 9.71c-2.15 2.15-2.3 5.47-.35 7.43l4.24-4.25.7-.7.71-.71 2.12-2.12c-1.95-1.96-5.27-1.8-7.42.35z" />
                                    <path d="M11 15.5c.5 2.5-.17 4.5-1 6.5h4c2-5.5-.5-12-1-14" />
                                    <path d="M8.28 12.11c1.99-1.95 5.31-1.79 7.46.36l-4.24 4.24-.7.7-.71.71-2.12 2.12c1.95 1.96 5.27 1.8 7.42-.35z" />
                                </g>

                                {/* Olas */}
                                <path d="M8 53 Q 12 56 16 53 T 24 53 T 32 53 T 40 53 T 48 53 T 56 53" strokeWidth="2" />
                                <path d="M12 59 Q 16 62 20 59 T 28 59 T 36 59 T 44 59 T 52 59" strokeWidth="2" />
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
