'use client'

import React from 'react'
import Image from 'next/image'
import styles from '../ArenaYSol.module.css'

export default function AysHero() {
    return (
        <section className={styles.hero}>
            <div className={styles.heroBackground}>
                {/* Desktop Background */}
                <div className="hidden md:block absolute inset-0">
                    <Image
                        src="/images/arena_y_sol/110.png"
                        alt="Proyecto Arena y Sol Desktop"
                        fill
                        priority
                        className="object-cover"
                    />
                </div>
                {/* Mobile Background */}
                <div className="block md:hidden absolute inset-0">
                    <Image
                        src="/images/arena_y_sol/lomas.png"
                        alt="Proyecto Arena y Sol Mobile"
                        fill
                        priority
                        className="object-cover"
                    />
                </div>
            </div>
            
            <div className={styles.heroOverlay} />
            
            <div className={styles.heroContent}>
                <h1 className={styles.heroTitle}>
                    Proyecto <br />
                    Arena y Sol
                </h1>
                <p className={styles.heroSubtitle}>
                    Terrenos 100% urbanizados de 200 m² a 8 min de la playa. 
                    El refugio que estabas buscando en El Tabo.
                </p>
                <span className={styles.heroHighlight}>
                    Sin bancos, sin intereses y con financiamiento directo.
                </span>
                
                <div className={styles.ctaGroup}>
                    <button className={styles.buttonPrimary}>
                        Ver Disponibilidad
                    </button>
                    <button className={styles.buttonSecondary}>
                        Hablar con un asesor
                    </button>
                </div>
            </div>
        </section>
    )
}
