'use client'

import React from 'react'
import Image from 'next/image'
import styles from '../ArenaYSol.module.css'
import { motion } from 'framer-motion'

import Link from 'next/link'

export default function AysHero() {
    const whatsappMsg = encodeURIComponent("Hola, me interesa saber más de Arena y Sol 🌊. Vengo desde la página principal.")
    const whatsappUrl = `https://wa.me/56956654833?text=${whatsappMsg}`

    return (
        <section className={styles.hero}>
            <div className={styles.heroBackground}>
                {/* Desktop Background */}
                <div className="hidden md:block absolute inset-0">
                    <Image
                        src="/images/arena_y_sol/hero-desktop-new.png"
                        alt="Proyecto Arena y Sol Desktop"
                        fill
                        priority
                        className="object-cover"
                    />
                </div>
                {/* Mobile Background */}
                <div className="block md:hidden absolute inset-0">
                    <Image
                        src="/images/arena_y_sol/hero-mobile-new.png"
                        alt="Proyecto Arena y Sol Mobile"
                        fill
                        priority
                        className="object-cover"
                    />
                </div>
            </div>
            
            <div className={styles.heroOverlay} />
            
            <motion.div 
                className={styles.heroContentCentered}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                <div className={styles.heroTextWrapper}>
                    <span className={styles.heroProjectLabelGold}>Proyecto</span>
                    <h1 className={styles.heroTitleCentered}>
                        Arena y Sol
                    </h1>
                    <p className={styles.heroSubtitleCentered}>
                        Terrenos 100% urbanizados de <span className={styles.goldText}>200 m2</span> <br />
                        a 10 minutos de la playa.
                    </p>
                    <span className={styles.heroHighlightGold}>
                        Sin bancos, sin intereses y con financiamiento directo
                    </span>
                    
                    <div className={styles.ctaGroupCentered}>
                        <Link href="#contacto" className={styles.buttonPillPrimary}>
                            Ver Disponibilidad
                        </Link>
                        <Link 
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer" 
                            className={styles.buttonPillSecondary}
                        >
                            Hablar con un asesor
                        </Link>
                    </div>
                </div>
            </motion.div>
        </section>
    )
}
