'use client'

import { useState } from 'react'
import { FAQ_ITEMS } from '@/lib/constants'
import styles from './FAQ.module.css'

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(0)

    return (
        <section className={styles.section} id="faq">
            <div className={styles.header}>
                <h2 className={styles.title}>Todo lo que necesitas saber</h2>
                <p className={styles.subtitle}>
                    Resolvemos las dudas más comunes sobre nuestros terrenos y proyectos inmobiliarios en El Tabo.
                </p>
            </div>

            <div className={styles.list}>
                {FAQ_ITEMS.map((item, i) => (
                    <div
                        key={i}
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
                        <div className={styles.answer} id={`faq-answer-${i}`} role="region">
                            <p>{item.answer}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}
