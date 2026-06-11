'use client'

import React from 'react'
import Image from 'next/image'
import styles from '../ArenaYSol.module.css'
import AnimatedSection from '@/components/ui/AnimatedSection'
import { CheckCircle2 } from 'lucide-react'

export default function AysFinancing() {
    const pricingInfo = [
        { label: 'Valor total', value: '$42.000.000' },
        { label: 'Cuota referencial', value: '$500.000' },
        { label: 'Precio de contado', value: '$39.000.000', highlight: true }
    ]

    return (
        <section className={styles.financingSection}>
            <div className="container" style={{ maxWidth: '1400px' }}>
                <div className={styles.financeHeaderRow}>
                    <AnimatedSection>
                        <h2 className={styles.financeMainTitle}>
                            ¡TE OFRECEMOS EL MEJOR CRÉDITO <br />
                            DE FINANCIAMIENTO EN CHILE!
                        </h2>
                    </AnimatedSection>
                    
                    <ul className={styles.financeBulletList}>
                        <AnimatedSection delay={100}>
                            <li className={styles.bulletItem}>
                                <CheckCircle2 className={styles.bulletIcon} />
                                <span><span className={styles.goldText}>Crédito directo</span> con <span className={styles.boldText}>Alimin</span></span>
                            </li>
                        </AnimatedSection>
                        <AnimatedSection delay={200}>
                            <li className={styles.bulletItem}>
                                <CheckCircle2 className={styles.bulletIcon} />
                                <span><span className={styles.boldText}>NUESTRO CRÉDITO</span> es <span className={styles.goldText}>0% interés</span></span>
                            </li>
                        </AnimatedSection>
                        <AnimatedSection delay={300}>
                            <li className={styles.bulletItem}>
                                <CheckCircle2 className={styles.bulletIcon} />
                                <span>Sin importar tu <span className={styles.goldTextItalic}>DICOM</span></span>
                            </li>
                        </AnimatedSection>
                    </ul>
                </div>

                <div className={styles.financeCardsGrid}>
                    {[1, 2].map((num, idx) => (
                        <AnimatedSection key={num} delay={400 + (idx * 150)}>
                            <div className={styles.financeCard}>
                                <div className={styles.financeImageWrapperFull}>
                                    <Image
                                        src={`/images/arena_y_sol/fin-${num}.png`}
                                        alt={`Terreno Arena y Sol ${num}`}
                                        fill
                                        unoptimized
                                        priority
                                        className="object-contain"
                                    />
                                </div>
                            </div>
                        </AnimatedSection>
                    ))}
                </div>
            </div>
        </section>
    )
}
