import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import styles from './PricingSection.module.css'
import { Leaf } from 'lucide-react'

export default function PricingSection() {
    return (
        <section className={styles.section}>
            <div className="container">
                <div className={styles.cardsContainer}>
                    {/* Card 200m2 */}
                    <div className={`${styles.pricingCard} ${styles.cardFrameLeft}`}>
                        <div className={styles.imageWrapper}>
                            <Image 
                                src="/images/projects/lomas-del-mar-v2.jpg" 
                                alt="Terrenos Lomas del Mar" 
                                fill 
                                className={styles.cardImage}
                            />
                            <div className={styles.logoBadge}>
                                <Image
                                    src="/images/home_redesign/ico_proyectos.png.webp"
                                    alt="Lomas del Mar Logo"
                                    fill
                                    className={styles.logoBadgeImage}
                                />
                            </div>
                        </div>
                        <div className={styles.contentWrapper}>
                            <h3 className={styles.planTitle}>
                                Terrenos urbanizados de <strong>200 m²</strong>
                            </h3>
                            <p className={styles.pieText}>Pie $5.500.000</p>
                            
                            <ul className={styles.featuresList}>
                                <li>Valor total: <span>$29.990.000</span></li>
                                <li>Cuota referencial: <span>$550.000</span></li>
                                <li>Plazo aproximado: <span>63 cuotas</span></li>
                                <li>Precio de contado: <span className={styles.goldText}>$26.000.000</span></li>
                            </ul>

                            <div className={styles.dicomTitle}>
                                Aprovecha nuestro crédito directo.<br/>
                                <div className={styles.dicomFocus}>Sin importar tu <span className={styles.goldText}>DICOM</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Card 390m2 */}
                    <div className={`${styles.pricingCard} ${styles.cardFrameRight}`}>
                        <div className={styles.imageWrapper}>
                            <Image 
                                src="/images/projects/lomas-del-mar.webp" 
                                alt="Terrenos Lomas del Mar 390m2" 
                                fill 
                                className={styles.cardImage}
                            />
                            <div className={styles.logoBadge}>
                                <Image
                                    src="/images/home_redesign/ico_proyectos.png.webp"
                                    alt="Lomas del Mar Logo"
                                    fill
                                    className={styles.logoBadgeImage}
                                />
                            </div>
                        </div>
                        <div className={styles.contentWrapper}>
                            <h3 className={styles.planTitle}>
                                Terrenos urbanizados de <strong>390 m²</strong>
                            </h3>
                            <p className={styles.pieText}>Pie $7.500.000</p>
                            
                            <ul className={styles.featuresList}>
                                <li>Valor total: <span>$37.990.000</span></li>
                                <li>Cuota referencial: <span>$550.000</span></li>
                                <li>Plazo aproximado: <span>76 cuotas</span></li>
                                <li>Precio de contado: <span className={styles.goldText}>$35.000.000</span></li>
                            </ul>

                            <div className={styles.dicomTitle}>
                                Aprovecha nuestro crédito directo.<br/>
                                <div className={styles.dicomFocus}>Sin importar tu <span className={styles.goldText}>DICOM</span></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.ctaSection}>
                    <div className={styles.ctaDivider}>
                        <div className={styles.ctaLine}></div>
                        {/* El ícono hojita de Alimin simplificado */}
                        <Leaf className={styles.ctaIcon} strokeWidth={1} size={48} />
                        <div className={styles.ctaLine}></div>
                    </div>
                    
                    <h2 className={styles.ctaTitle}>Cotizar Terreno en El Tabo</h2>
                    
                    <div className={styles.buttonsWrapper}>
                        <Link 
                            href="https://aliminlomasdelmar.com/?utm_source=aliminspa.cl&utm_medium=website&utm_campaign=lomas-del-mar"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.btnGold}
                        >
                            Ver Disponibilidad
                        </Link>
                        
                        <Link 
                            href="https://wa.me/56956654833?text=Hola,%20vengo%20desde%20la%20web%20y%20me%20interesa%20saber%20mas%20del%20proyecto%20Lomas%20del%20Mar"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.btnGreen}
                        >
                            Hablar con un asesor
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    )
}
