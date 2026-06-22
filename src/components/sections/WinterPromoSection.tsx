'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import styles from './WinterPromoSection.module.css'

const IMAGES = [
    {
        src: '/images/fathers-day/box_sunset.jpg',
        alt: 'Mystery Box Alimin en El Tabo',
        title: 'Tu Terreno, Tu Futuro',
        description: 'La caja guarda una sorpresa. Tu terreno guarda tu futuro.'
    },
    {
        src: '/images/fathers-day/gift_giving.jpg',
        alt: 'Entrega de regalo especial Mystery Box',
        title: 'Premios para toda la familia',
        description: 'Porque algunas sorpresas no se cuentan... Se descubren en familia.'
    },
    {
        src: '/images/fathers-day/box_on_land.jpg',
        alt: 'Mystery Box de Alimin en el proyecto',
        title: 'Mystery Box Extendida',
        description: 'Durante todo junio, agenda tu visita de vacaciones y recibe tu Mystery Box.'
    }
]

export default function WinterPromoSection() {
    const [activeIndex, setActiveIndex] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % IMAGES.length)
        }, 5000)
        return () => clearInterval(interval)
    }, [])

    return (
        <section className={styles.section} id="vacaciones-de-invierno">
            <div className={`container ${styles.container}`}>
                <div className={styles.grid}>
                    <div className={styles.content}>
                        <span className={styles.label}>Especial de Invierno</span>
                        <h2 className={styles.title}>
                            Vacaciones de Invierno <br />
                            <span className={styles.highlight}>¡Y Mystery Box de Regalo!</span>
                        </h2>
                        
                        <div className={styles.intro}>
                            <p className={styles.lead}>
                                Disfruta en familia y asegura tu futuro. <br />
                                <strong>El Día del Padre terminó, ¡pero extendemos la Mystery Box por todo Junio!</strong>
                            </p>
                            <p className={styles.description}>
                                Queremos que estas vacaciones de invierno sean inolvidables. 
                                A quienes nos visiten junto a su familia durante este mes y reserven su terreno, 
                                les entregaremos una <strong>Mystery Box exclusiva de Alimin</strong> repleta de premios y sorpresas. 
                                ¡La mejor inversión para tu familia está aquí!
                            </p>
                        </div>

                        <div className={styles.features}>
                            <div className={styles.featureItem}>
                                <div className={styles.featureCheck}>✓</div>
                                <div className={styles.featureText}>
                                    <strong>Terrenos Urbanizados:</strong> Con agua certificada y luz listos para construir.
                                </div>
                            </div>
                            <div className={styles.featureItem}>
                                <div className={styles.featureCheck}>✓</div>
                                <div className={styles.featureText}>
                                    <strong>Rol Individual:</strong> Terrenos listos para escriturar e inscribir en el CBR.
                                </div>
                            </div>
                            <div className={styles.featureItem}>
                                <div className={styles.featureCheck}>✓</div>
                                <div className={styles.featureText}>
                                    <strong>Crédito Directo:</strong> Facilidades de pago directo con 0% de interés.
                                </div>
                            </div>
                            <div className={styles.featureItem}>
                                <div className={styles.featureCheck}>🎁</div>
                                <div className={styles.featureText}>
                                    <strong>Mystery Box Extendida:</strong> Premios y sorpresas para quienes nos visiten y reserven.
                                </div>
                            </div>
                        </div>

                        <div className={styles.ctaWrapper}>
                            <Link 
                                href="/asesores" 
                                className={`${styles.btnCta} crm-track-click`}
                                data-crm-name="Agenda tu visita - Seccion Vacaciones de Invierno"
                                data-crm-category="Contacto Agendamiento"
                            >
                                AGENDA TU VISITA
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                    <polyline points="12 5 19 12 12 19"></polyline>
                                </svg>
                            </Link>
                            <span className={styles.ctaNote}>*Válido para todas las visitas agendadas durante el mes de junio.</span>
                        </div>
                    </div>

                    <div className={styles.showcase}>
                        <div className={styles.mainImageWrapper}>
                            {IMAGES.map((img, idx) => (
                                <div 
                                    key={idx} 
                                    className={`${styles.slide} ${idx === activeIndex ? styles.activeSlide : ''}`}
                                >
                                    <Image 
                                        src={img.src}
                                        alt={img.alt}
                                        fill
                                        sizes="(max-width: 768px) 100vw, 500px"
                                        className={styles.image}
                                        priority={idx === 0}
                                    />
                                    <div className={styles.imageOverlay}>
                                        <h4 className={styles.imageTitle}>{img.title}</h4>
                                        <p className={styles.imageDesc}>{img.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className={styles.thumbnails}>
                            {IMAGES.map((img, idx) => (
                                <button
                                    key={idx}
                                    className={`${styles.thumbnailBtn} ${idx === activeIndex ? styles.activeThumbnail : ''}`}
                                    onClick={() => setActiveIndex(idx)}
                                    aria-label={`Ver imagen ${idx + 1}`}
                                >
                                    <div className={styles.thumbnailImgWrapper}>
                                        <Image 
                                            src={img.src}
                                            alt={`Miniatura ${idx + 1}`}
                                            fill
                                            sizes="80px"
                                            className={styles.thumbnailImg}
                                        />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
