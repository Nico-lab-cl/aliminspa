'use client'

import React from 'react'
import Image from 'next/image'
import styles from '../ArenaYSol.module.css'
import AnimatedSection from '@/components/ui/AnimatedSection'
import Link from 'next/link'

export default function AysCTA() {
    const whatsappMsg = encodeURIComponent("Hola, me interesa saber más de las parcelas en Arena y Sol 🌊☀️")
    const whatsappUrl = `https://wa.me/56956654833?text=${whatsappMsg}`

    return (
        <section className={styles.ctaSection}>
            <div className="container">
                <AnimatedSection>
                    <div className={styles.ctaDividerRow}>
                        <div className={styles.ctaDividerLine}></div>
                        <div className={styles.ctaLeafIcon}>
                            <Image 
                                src="/images/arena_y_sol/logo-ays.png" 
                                alt="Alimin Logo" 
                                width={120} 
                                height={45} 
                                className="brightness-0 invert opacity-60"
                                style={{ objectFit: 'contain' }}
                            />
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
                        <Link href="#contacto" className={styles.btnGold}>
                            Ver Disponibilidad
                        </Link>
                        <Link 
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.btnGreen}
                        >
                            Hablar con un asesor
                        </Link>
                    </div>
                </AnimatedSection>
            </div>
        </section>
    )
}

