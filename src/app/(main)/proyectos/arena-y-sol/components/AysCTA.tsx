'use client'

import React from 'react'
import Image from 'next/image'
import styles from '../ArenaYSol.module.css'
import AnimatedSection from '@/components/ui/AnimatedSection'

export default function AysCTA() {
    return (
        <section className={styles.ctaSection}>
            <div className="container">
                <AnimatedSection>
                    <div className={styles.ctaLogo}>
                        <Image
                            src="/images/arena_y_sol/logo.png"
                            alt="Alimin Logo"
                            width={150}
                            height={60}
                            className="mx-auto grayscale invert"
                        />
                    </div>
                </AnimatedSection>
                
                <AnimatedSection delay={200}>
                    <h2 className={styles.ctaTitle}>
                        Cotizar Terreno <br />
                        en El Tabo
                    </h2>
                </AnimatedSection>

                <AnimatedSection delay={400}>
                    <div className={styles.ctaGroup + " justify-center"}>
                        <button className={styles.buttonPrimary}>
                            Ver Disponibilidad
                        </button>
                        <button className={styles.buttonSecondary}>
                            Hablar con un asesor
                        </button>
                    </div>
                </AnimatedSection>
            </div>
        </section>
    )
}
