'use client'

import React from 'react'
import Image from 'next/image'
import styles from '../ArenaYSol.module.css'
import AnimatedSection from '@/components/ui/AnimatedSection'
import { Check } from 'lucide-react'

export default function AysFinancing() {
    return (
        <section className={styles.financingSection}>
            <div className={styles.financingGrid}>
                <div>
                    <AnimatedSection>
                        <h2 className={styles.introHeading}>
                            ¡TE OFRECEMOS EL MEJOR <br />
                            CRÉDITO DE FINANCIAMIENTO <br />
                            EN CHILE!
                        </h2>
                    </AnimatedSection>
                    
                    <ul className={styles.benefitList}>
                        {[
                            'Crédito directo con Alimin',
                            'NUESTRO CRÉDITO es 0% interés',
                            'Sin importar tu DICOM'
                        ].map((benefit, idx) => (
                            <AnimatedSection key={idx} delay={idx * 100}>
                                <li className={styles.benefitItem}>
                                    <div className={styles.benefitIcon}>
                                        <Check size={24} />
                                    </div>
                                    <span>{benefit}</span>
                                </li>
                            </AnimatedSection>
                        ))}
                    </ul>
                </div>

                <div className={styles.cardsContainer}>
                    {[1, 2].map((i) => (
                        <AnimatedSection key={i} delay={300 + (i * 100)}>
                            <div className={styles.propertyCard}>
                                <div className={styles.cardImage}>
                                    <Image
                                        src="/images/arena_y_sol/107.png"
                                        alt="Terreno Arena y Sol"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className={styles.cardContent}>
                                    <h3 className="font-bold text-lg">Terrenos urbanizados de 200 m²</h3>
                                    <p className={styles.cardPrice}>Pie $20.000.000</p>
                                    <div className="text-sm opacity-70 mt-2">
                                        <p>Valor total: $42.000.000</p>
                                        <p>Precio de contado: $39.000.000</p>
                                    </div>
                                    <p className="text-xs mt-4 text-[#D9B055]">
                                        Aprovecha nuestro crédito directo. Sin importar tu DICOM.
                                    </p>
                                </div>
                            </div>
                        </AnimatedSection>
                    ))}
                </div>
            </div>
            
            <div className="text-center mt-12">
                <AnimatedSection delay={600}>
                    <button className={styles.buttonPrimary}>
                        Ver ubicación en Google Maps
                    </button>
                </AnimatedSection>
            </div>
        </section>
    )
}
