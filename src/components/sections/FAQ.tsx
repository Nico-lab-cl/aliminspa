'use client'

import { useState } from 'react'
import { FAQ_ITEMS } from '@/lib/constants'
import AnimatedSection from '@/components/ui/AnimatedSection'
import styles from './FAQ.module.css'

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(null)

    return (
        <section className="section" id="faq">
            <div className="container">
                <div className="section-header">
                    <AnimatedSection>
                        <span className="section-label">Preguntas Frecuentes</span>
                        <h2 className="section-title">
                            Todo lo que necesitas saber
                        </h2>
                        <p className="section-subtitle">
                            Resolvemos las dudas más comunes sobre nuestros terrenos y
                            proyectos inmobiliarios en El Tabo.
                        </p>
                    </AnimatedSection>
                </div>

                <div className={styles.list}>
                    {FAQ_ITEMS.map((item, i) => (
                        <AnimatedSection key={i} delay={i * 60}>
                            <div
                                className={`${styles.item} ${openIndex === i ? styles.open : ''}`}
                            >
                                <button
                                    className={styles.question}
                                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                    aria-expanded={openIndex === i}
                                    aria-controls={`faq-answer-${i}`}
                                >
                                    <span>{item.question}</span>
                                    <span className={styles.icon}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="m6 9 6 6 6-6" />
                                        </svg>
                                    </span>
                                </button>
                                <div
                                    className={styles.answer}
                                    id={`faq-answer-${i}`}
                                    role="region"
                                >
                                    <p>{item.answer}</p>
                                </div>
                            </div>
                        </AnimatedSection>
                    ))}
                </div>
            </div>
        </section>
    )
}
