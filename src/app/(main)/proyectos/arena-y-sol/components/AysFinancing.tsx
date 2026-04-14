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
                            { title: 'Crédito directo con Alimin', desc: 'Sin trámites bancarios engorrosos.' },
                            { title: 'NUESTRO CRÉDITO es 0% interés', desc: 'Paga solo el valor de tu terreno.' },
                            { title: 'Sin importar tu DICOM', desc: 'Tu capacidad de ahorro es lo que cuenta.' }
                        ].map((benefit, idx) => (
                            <AnimatedSection key={idx} delay={idx * 100}>
                                <li className={styles.benefitItem}>
                                    <div className={styles.benefitIcon}>
                                        <Check size={28} strokeWidth={3} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-lg">{benefit.title}</div>
                                        <div className="text-sm opacity-60 font-light">{benefit.desc}</div>
                                    </div>
                                </li>
                            </AnimatedSection>
                        ))}
                    </ul>
                </div>

                <div className={styles.cardsContainer}>
                    <AnimatedSection delay={400}>
                        <div className={styles.propertyCard}>
                            <div className={styles.cardImage}>
                                <Image
                                    src="/images/arena_y_sol/property-card.png"
                                    alt="Terreno Arena y Sol"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className={styles.cardContent}>
                                <h3 className="font-bold text-xl uppercase tracking-wider">Terrenos Urbanizados</h3>
                                <div className="text-sm opacity-60 mb-2">Sup. 200 m² / Rol Propio</div>
                                <p className={styles.cardPrice}>Pie $20.000.000</p>
                                <div className="space-y-1 text-sm opacity-80 mt-2 border-t border-white/10 pt-4">
                                    <p>Valor total: $42.000.000</p>
                                    <p>Precio de contado: $39.000.000</p>
                                </div>
                                <p className="text-xs mt-6 text-[#D9B055] font-semibold uppercase tracking-tighter">
                                    Financiamiento directo disponible hoy
                                </p>
                            </div>
                        </div>
                    </AnimatedSection>
                </div>
            </div>
            
            <div className="text-center mt-20">
                <AnimatedSection delay={600}>
                    <button className={styles.buttonPrimary}>
                        Ver ubicación en Google Maps
                    </button>
                </AnimatedSection>
            </div>
        </section>
    )
}
