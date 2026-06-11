'use client'

import React from 'react'
import Image from 'next/image'
import styles from '../ArenaYSol.module.css'
import AnimatedSection from '@/components/ui/AnimatedSection'
import { Palmtree } from 'lucide-react'

export default function AysIntro() {
    return (
        <section className={styles.introSection}>
            <div className="container" style={{ maxWidth: '1400px' }}>
                <AnimatedSection>
                    <div className={styles.introTop}>
                        <div className={styles.iconWrapper} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Palmtree style={{ width: '80%', height: '80%' }} color="#ffffff" strokeWidth={1.5} />
                            
                            {/* Sol en la esquina superior izquierda */}
                            <svg width="40%" height="40%" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" style={{ position: 'absolute', top: '-10%', left: '-10%' }}>
                                <circle cx="12" cy="12" r="5" fill="none" />
                                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                            </svg>
                            
                            {/* Base de agua simplificada */}
                            <svg width="120%" height="30%" viewBox="0 0 80 20" fill="none" stroke="#ffffff" strokeWidth="1.5" style={{ position: 'absolute', bottom: '-5%', left: '50%', transform: 'translateX(-50%)' }}>
                                <path d="M5 10c3 0 5-2 8-2s5 2 8 2 5-2 8-2 5 2 8 2 5-2 8-2 5 2 8 2 5-2 8-2 5 2 8 2" />
                                <path d="M5 15c3 0 5-2 8-2s5 2 8 2 5-2 8-2 5 2 8 2 5-2 8-2 5 2 8 2 5-2 8-2 5 2 8 2" />
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
