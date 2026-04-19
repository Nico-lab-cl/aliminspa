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
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" stroke="currentColor" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round" className={styles.sunPalmIcon}>
                                {/* Sol */}
                                <circle cx="56" cy="56" r="24" />
                                <line x1="56" y1="12" x2="56" y2="20" />
                                <line x1="56" y1="92" x2="56" y2="100" />
                                <line x1="12" y1="56" x2="20" y2="56" />
                                <line x1="92" y1="56" x2="100" y2="56" />
                                <line x1="24.89" y1="24.89" x2="30.55" y2="30.55" />
                                <line x1="81.45" y1="81.45" x2="87.11" y2="87.11" />
                                <line x1="24.89" y1="87.11" x2="30.55" y2="81.45" />
                                <line x1="81.45" y1="30.55" x2="87.11" y2="24.89" />

                                {/* Palmera */}
                                <path d="M120,216c8-56,32-96,72-104" />
                                <path d="M192,112c-29.33-40-77.33-40-104,0" />
                                <path d="M192,112c34.67-34.67,66.67-18.67,40,32" />
                                <path d="M192,112c40,18.67,45.33,56,8,72" />
                                <path d="M192,112c-45.33,18.67-56,56-24,72" />

                                {/* Olas */}
                                <path d="M24,216c16-16,32-16,48,0s32,16,48,0s32-16,48,0s32,16,48,0" />
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
