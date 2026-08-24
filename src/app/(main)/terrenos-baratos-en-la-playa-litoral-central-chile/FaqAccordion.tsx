'use client'

import { useState } from 'react'
import { FAQS } from './faqs'
import styles from './page.module.css'

// Acordeón con el mismo comportamiento que el FAQ de la homepage: una sola
// pregunta abierta a la vez y la primera abierta al cargar. Las respuestas se
// renderizan siempre en el HTML (se ocultan con grid-template-rows, no con
// display:none) para que Google las lea completas y pueda usarlas en el bloque
// "Otras preguntas" y en el AI Overview que ya aparecen para esta búsqueda.
export default function FaqAccordion() {
    const [openIndex, setOpenIndex] = useState<number | null>(0)

    return (
        <div className={styles.faqList}>
            {FAQS.map((item, i) => {
                const isOpen = openIndex === i
                return (
                    <div
                        key={i}
                        className={`${styles.faqItem} ${isOpen ? styles.faqItemOpen : ''}`}
                    >
                        <h3 style={{ margin: 0 }}>
                            <button
                                type="button"
                                className={styles.faqQuestion}
                                onClick={() => setOpenIndex(isOpen ? null : i)}
                                aria-expanded={isOpen}
                                aria-controls={`faq-barato-${i}`}
                            >
                                <span>{item.q}</span>
                                <span className={`${styles.faqIcon} ${isOpen ? styles.faqIconOpen : ''}`}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="m6 9 6 6 6-6" />
                                    </svg>
                                </span>
                            </button>
                        </h3>
                        <div
                            className={styles.faqAnswer}
                            id={`faq-barato-${i}`}
                            role="region"
                        >
                            <div className={styles.faqAnswerInner}>
                                <p>{item.a}</p>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
