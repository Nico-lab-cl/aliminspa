'use client'

import React from 'react'
import Image from 'next/image'
import styles from '../ArenaYSol.module.css'
import AnimatedSection from '@/components/ui/AnimatedSection'

export default function AysIntro() {
    return (
        <section className={styles.introSection}>
            <div className={styles.introText}>
                <AnimatedSection>
                    <h2 className={styles.introHeading}>
                        A solo 10 minutos <br />
                        de la playa de El Tabo.
                        <span className={styles.introHeadingLarge}>
                            Más del 75% <br />
                            proyecto vendido
                        </span>
                    </h2>
                </AnimatedSection>
                
                <AnimatedSection delay={200}>
                    <p className={styles.introBody}>
                        Un proyecto pensado para quienes quieren dar el paso hacia un terreno urbanizado cerca del mar, con acceso claro, servicios y una compra más simple.
                    </p>
                </AnimatedSection>
            </div>
            
            <div className={styles.introImage}>
                <Image
                    src="/images/arena_y_sol/15.png"
                    alt="Vista del terreno Arena y Sol"
                    fill
                    className="object-cover"
                />
            </div>
        </section>
    )
}
