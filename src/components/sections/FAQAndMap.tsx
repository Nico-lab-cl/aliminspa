'use client'

import { useState } from 'react'
import { FAQ_ITEMS } from '@/lib/constants'
import styles from './FAQAndMap.module.css'

export default function FAQAndMap() {
    const [openIndex, setOpenIndex] = useState<number | null>(null)

    return (
        <section className={styles.section} id="faq-y-mapa">
            <div className="container">
                <div className={styles.splitLayout}>
                    {/* LEFTSIDE: FAQ */}
                    <div className={styles.faqCol}>
                        <h2 className={styles.title}>
                            <span className={styles.highlight}>Todo</span> lo que necesitas saber
                        </h2>
                        <p className={styles.subtitle}>
                            Resolvemos las dudas más comunes sobre nuestros terrenos y proyectos inmobiliarios en <span className={styles.highlight}>El Tabo</span>.
                        </p>

                        <div className={styles.faqList}>
                            {FAQ_ITEMS.map((item, i) => {
                                const isOpen = openIndex === i
                                return (
                                    <div key={i} className={styles.faqItem}>
                                        <button
                                            className={styles.faqButton}
                                            onClick={() => setOpenIndex(isOpen ? null : i)}
                                            aria-expanded={isOpen}
                                        >
                                            <span className={styles.faqQuestion}>{item.question}</span>
                                            <span className={`${styles.faqIcon} ${isOpen ? styles.faqIconOpen : ''}`}>
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                            </span>
                                        </button>
                                        <div 
                                            className={styles.faqAnswerWrapper}
                                            style={{ maxHeight: isOpen ? '200px' : '0' }}
                                        >
                                            <div className={styles.faqAnswer}>
                                                {item.answer}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* RIGHTSIDE: MAP */}
                    <div className={styles.mapCol}>
                        <h2 className={styles.title}>
                            <span className={styles.highlight}>Ubicación</span> Estratégica
                        </h2>
                        <p className={styles.subtitle}>
                            Terrenos en el Litoral Central de Chile<br/>
                            Nuestros proyectos se ubican en <span className={styles.highlight}>El Tabo</span>, a 8 minutos de la playa en auto, supermercados, centros comerciales, terminal de buses y la ruta que conecta con Santiago.
                        </p>
                        <div className={styles.mapWrapper}>
                            <iframe
                                src="https://maps.google.com/maps?q=El%20Tabo,%20Region%20de%20Valparaiso,%20Chile&t=&z=13&ie=UTF8&iwloc=&output=embed"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
