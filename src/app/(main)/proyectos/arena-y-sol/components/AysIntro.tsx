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
                            {/* Palm and Sun Icon Group */}
                            <svg viewBox="0 0 100 60" className={styles.sunPalmIcon} fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="20" cy="20" r="8" stroke="currentColor" strokeWidth="2" />
                                <path d="M20 5V10M20 30V35M35 20H30M5 20H10M31 9L27 13M13 27L9 31M31 31L27 27M13 13L9 9" stroke="currentColor" strokeWidth="2" />
                                <path d="M50 50C50 35 65 25 80 25M50 50C50 35 35 25 20 25M50 50V25M45 55H55M40 58H60" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <path d="M10 50Q30 45 50 50T90 50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
