'use client'

import React from 'react'
import Image from 'next/image'
import styles from '../LibertadYAlegria.module.css'
import AnimatedSection from '@/components/ui/AnimatedSection'

const PROMO_CARDS = [
    { src: '/images/proyectos/libertad-y-alegria/promo-1.png', alt: 'Terreno Libertad y Alegría - Vista 1' },
    { src: '/images/proyectos/libertad-y-alegria/promo-2.png', alt: 'Terreno Libertad y Alegría - Vista aérea' },
    { src: '/images/proyectos/libertad-y-alegria/promo-3.png', alt: 'Terreno Libertad y Alegría - Vista 2' },
]

export default function LyaPromoCards() {
    return (
        <section className={styles.promoSection}>
            <div className="container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
                <AnimatedSection>
                    <div className={styles.promoCTAWrapper}>
                        <div className={styles.promoCTA}>
                            ¿Estas preparado para construir una vida en la playa?
                        </div>
                    </div>
                </AnimatedSection>

                <AnimatedSection delay={200}>
                    <div className={styles.promoCardsGrid}>
                        {PROMO_CARDS.map((card, index) => (
                            <div key={index} className={styles.promoCard}>
                                <Image
                                    src={card.src}
                                    alt={card.alt}
                                    fill
                                    className={styles.promoCardImage}
                                    sizes="(max-width: 768px) 90vw, 33vw"
                                />
                            </div>
                        ))}
                    </div>
                </AnimatedSection>
            </div>
        </section>
    )
}
