'use client'

import React from 'react'
import Image from 'next/image'
import styles from '../ArenaYSol.module.css'
import { motion } from 'framer-motion'

export default function AysHero() {
    return (
        <section className={styles.hero}>
            <div className={styles.heroBackground}>
                {/* Desktop Background */}
                <div className="hidden md:block absolute inset-0">
                    <Image
                        src="/images/arena_y_sol/hero-desktop.png"
                        alt="Proyecto Arena y Sol Desktop"
                        fill
                        priority
                        className="object-cover"
                    />
                </div>
                {/* Mobile Background */}
                <div className="block md:hidden absolute inset-0">
                    <Image
                        src="/images/arena_y_sol/hero-mobile.png"
                        alt="Proyecto Arena y Sol Mobile"
                        fill
                        priority
                        className="object-cover"
                    />
                </div>
            </div>
            
            <div className={styles.heroOverlay} />
            
            <motion.div 
                className={styles.heroContent}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
            >
                <span className={styles.heroProjectLabel}>Proyecto</span>
                <h1 className={styles.heroTitle}>
                    Arena y Sol
                </h1>
                <p className={styles.heroSubtitle}>
                    Terrenos 100% urbanizados de 200 m² a 10 min de la playa. <br className="hidden md:block" />
                    El refugio sofisticado que estabas buscando en El Tabo.
                </p>
                <motion.span 
                    className={styles.heroHighlight}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 1 }}
                >
                    SIN BANCOS, SIN INTERESES Y CON FINANCIAMIENTO DIRECTO.
                </motion.span>
                
                <div className={styles.ctaGroup}>
                    <button className={styles.buttonPrimary}>
                        Ver Disponibilidad
                    </button>
                    <button className={styles.buttonSecondary}>
                        Hablar con un asesor
                    </button>
                </div>
            </motion.div>
        </section>
    )
}
