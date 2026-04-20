'use client'

import React from 'react'
import styles from '../ArenaYSol.module.css'
import AnimatedSection from '@/components/ui/AnimatedSection'

export default function AysCTA() {
    return (
        <section className={styles.ctaSection}>
            <div className="container">
                <AnimatedSection>
                    <div className={styles.ctaDividerRow}>
                        <div className={styles.ctaDividerLine}></div>
                        <div className={styles.ctaLeafIcon}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 21 2c-2.5 4-3 5.5-4.1 11.2A7 7 0 0 1 11 20z" />
                                <path d="M11 20v-5" />
                                <path d="M11 15c-1-2.5-3-4.5-5.5-5.5" />
                            </svg>
                        </div>
                        <div className={styles.ctaDividerLine}></div>
                    </div>
                </AnimatedSection>
                
                <AnimatedSection delay={200}>
                    <h2 className={styles.ctaTitle}>
                        Cotizar Terreno en El Tabo
                    </h2>
                </AnimatedSection>

                <AnimatedSection delay={400}>
                    <div className={styles.ctaButtonGroup}>
                        <button className={styles.btnGold}>
                            Ver Disponibilidad
                        </button>
                        <button className={styles.btnGreen}>
                            Hablar con un asesor
                        </button>
                    </div>
                </AnimatedSection>
            </div>
        </section>
    )
}

