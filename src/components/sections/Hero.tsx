'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { SITE } from '@/lib/constants'
import QuoteForm from './QuoteForm'
import styles from './Hero.module.css'

export default function Hero() {
    useEffect(() => {
        const header = document.querySelector('header')
        if (!header) return

        const setHeaderHeight = () => {
            document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`)
        }

        setHeaderHeight()
        const observer = new ResizeObserver(setHeaderHeight)
        observer.observe(header)
        return () => observer.disconnect()
    }, [])

    return (
        <section className={styles.hero} id="hero">
            <div className={styles.bgWrapper}>
                <Image
                    src="/assets/homepage-v2/hero-litoral-central.webp"
                    alt="Vista aérea del Litoral Central: bosque, camino y costa"
                    fill
                    priority
                    className={styles.bgImage}
                    style={{ objectPosition: 'center 40%' }}
                />
                <div className={styles.overlay} />
            </div>

            <div className={`container ${styles.grid}`}>
                <div className={styles.content}>
                    <h1 className={styles.title}>
                        Terrenos urbanizados en El Tabo con{' '}
                        <span className={styles.highlight}>rol propio</span> y{' '}
                        <span className={styles.highlight}>crédito directo</span>
                    </h1>

                    <p className={styles.subtitle}>
                        A minutos de la playa, con agua, luz y{' '}
                        <strong className={styles.subtitleStrong}>facilidades de pago sin bancos</strong>
                    </p>

                    <div className={styles.ctas}>
                        <Link href="#proyectos" className={styles.btnProject}>
                            Ver Proyectos
                        </Link>
                        <Link
                            href={`https://wa.me/${SITE.whatsapp}?text=Hola,%20quiero%20cotizar%20un%20terreno%20en%20El%20Tabo.%20Vengo%20de%20la%20p%C3%A1gina%20principal%20de%20Alimin.`}
                            className={`${styles.btnWhatsApp} crm-track-click`}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-crm-name="WhatsApp Cotizar - Hero Principal"
                            data-crm-category="Cotizacion"
                        >
                            Cotizar por WhatsApp
                        </Link>
                    </div>
                </div>

                <QuoteForm source="hero" formId="form-hero" />
            </div>
        </section>
    )
}
