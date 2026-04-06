import React from 'react'
import Link from 'next/link'
import { SITE } from '@/lib/constants'
import styles from './Steps.module.css'

export default function Steps() {
    return (
        <section className={styles.section} id="pasos">
            <div className="container">
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        <span className={styles.titleItalic}>Invertir en tu terreno puede ser</span><br />
                        <span className={styles.highlight}>más simple de lo que imaginas</span>
                    </h2>
                </div>

                <div className={styles.stepsGrid}>
                    <div className={styles.step}>
                        <div className={styles.circle}>1</div>
                        <h3 className={styles.stepTitle}>Elige tu terreno</h3>
                        <p className={styles.stepDesc}>Selecciona la ubicación que mejor se adapte a tus sueños y presupuesto.</p>
                    </div>
                    <div className={styles.step}>
                        <div className={styles.circle}>2</div>
                        <h3 className={styles.stepTitle}>Evaluación rápida</h3>
                        <p className={styles.stepDesc}>Revisamos tus documentos en menos de 48 horas sin historial complejo.</p>
                    </div>
                    <div className={styles.step}>
                        <div className={styles.circle}>3</div>
                        <h3 className={styles.stepTitle}>Firma y entrega</h3>
                        <p className={styles.stepDesc}>Formalizamos el acuerdo y recibes la posesión de tu nueva propiedad.</p>
                    </div>
                </div>

                <div className={styles.requisitosPanel}>
                    <h2 className={styles.requisitosTitle}>Requisitos básicos</h2>
                    <ul className={styles.requisitosList}>
                        <li>
                            <svg className={styles.checkIcon} viewBox="0 0 24 24" fill="currentColor">
                                <circle cx="12" cy="12" r="12" fill="var(--gold)"/>
                                <path d="M10 16.4l-4-4 1.4-1.4 2.6 2.6 6.6-6.6 1.4 1.4z" fill="#2F4F4F"/>
                            </svg>
                            <span>Cédula de Identidad <span className={styles.textGold}>(RUT)</span> vigente</span>
                        </li>
                        <li>
                            <svg className={styles.checkIcon} viewBox="0 0 24 24" fill="currentColor">
                                <circle cx="12" cy="12" r="12" fill="var(--gold)"/>
                                <path d="M10 16.4l-4-4 1.4-1.4 2.6 2.6 6.6-6.6 1.4 1.4z" fill="#2F4F4F"/>
                            </svg>
                            <span><span className={styles.textGold}>Pie inicial</span> según el proyecto elegido</span>
                        </li>
                    </ul>
                </div>

                <div className={styles.ctas}>
                    <Link href="#proyectos" className={styles.btnProjectSolid}>
                        Ver Proyectos
                    </Link>
                    <Link
                        href={`https://wa.me/${SITE.whatsapp}?text=Hola,%20quiero%20información%20sobre%20terrenos`}
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
