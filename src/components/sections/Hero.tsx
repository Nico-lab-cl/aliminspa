'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { SITE } from '@/lib/constants'
import styles from './Hero.module.css'

export default function Hero() {
    return (
        <section className={styles.hero} id="hero">
            <div className={styles.bgWrapper}>
                <video 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    className={styles.video}
                >
                    <source src="/hero-video.mp4" type="video/mp4" />
                </video>
                <div className={styles.overlay} />
            </div>

            <div className={`container ${styles.content}`}>
                <h1 className={styles.title}>
                    <div>Terrenos urbanizados en</div>
                    <div>El Tabo con <span className={styles.highlight}>rol propio</span> y</div>
                    <div><span className={styles.highlight}>crédito directo</span></div>
                </h1>

                <p className={styles.subtitle}>
                    A minutos de la playa, con agua, luz y <span className={styles.highlight}>facilidades de pago sin bancos</span>
                </p>

                <div className={styles.ctas}>
                    <Link href="#proyectos" className={styles.btnProject}>
                        Ver Proyectos
                    </Link>
                    <Link
                        href={`https://wa.me/${SITE.whatsapp}?text=Hola,%20quiero%20información%20sobre%20terrenos%20en%20El%20Tabo%20🏡`}
                        className={styles.btnWhatsApp}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Cotizar por WhatsApp
                    </Link>
                </div>
            </div>
        </section>
    )
}
