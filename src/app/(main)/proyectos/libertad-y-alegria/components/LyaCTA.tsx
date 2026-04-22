'use client'

import React from 'react'
import Link from 'next/link'
import { Leaf } from 'lucide-react'
import styles from '../LibertadYAlegria.module.css'
import { SITE } from '@/lib/constants'

export default function LyaCTA() {
    const whatsappMsg = encodeURIComponent("Hola, vengo desde la web. Me interesa el proyecto Libertad y Alegría y quiero solicitar más información.")
    const whatsappUrl = `https://wa.me/${SITE.whatsapp}?text=${whatsappMsg}`

    return (
        <section className={styles.lyaCTASection}>
            <div className="container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div className={styles.lyaCTADivider}>
                    <div className={styles.lyaCTALine}></div>
                    <Leaf className={styles.lyaCTAIcon} strokeWidth={1} size={48} />
                    <div className={styles.lyaCTALine}></div>
                </div>

                <h2 className={styles.lyaCTATitle}>Cotizar Terreno en El Tabo</h2>

                <div className={styles.lyaCTAButtons}>
                    <Link 
                        href="#cotizar"
                        className={styles.lyaBtnGold}
                    >
                        Ver Disponibilidad
                    </Link>
                    <Link 
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.lyaBtnGreen}
                    >
                        Hablar con un asesor
                    </Link>
                </div>
            </div>
        </section>
    )
}
