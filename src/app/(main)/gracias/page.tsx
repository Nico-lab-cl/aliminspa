
import React from 'react'
import Link from 'next/link'
import { Metadata } from 'next'
import AnimatedSection from '@/components/ui/AnimatedSection'
import Testimonials from '@/components/sections/Testimonials'
import { AdvisorsSection } from '@/components/sections/AdvisorsSection'
import styles from './Gracias.module.css'

export const metadata: Metadata = {
    title: '¡Gracias por contactarnos! - Alimin Inmobiliaria',
    description: 'Hemos recibido tus datos con éxito. Un asesor de Alimin Inmobiliaria se pondrá en contacto contigo a la brevedad.',
    robots: 'noindex, follow', // Perfect for Google Ads conversion pages
}

export default function GraciasPage() {
    return (
        <div className={styles.graciasPage}>
            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles.bgOrb} />
                <div className={styles.container}>
                    <AnimatedSection>
                        <div className={styles.iconWrapper}>
                            <div className={styles.successIcon}>
                                <svg 
                                    width="40" height="40" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="white" 
                                    strokeWidth="3" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                >
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                        </div>
                        <h1 className={styles.title}>¡Solicitud Recibida!</h1>
                        <p className={styles.subtitle}>
                            Gracias por tu interés en nuestros proyectos. Hemos recibido tus datos 
                            con éxito y uno de nuestros asesores expertos te contactará en las 
                            próximas 24 horas para brindarte toda la información que necesitas.
                        </p>
                        <div className={styles.btnGroup}>
                            <Link href="/" className="btn btn-primary btn-lg">
                                Volver al Inicio
                            </Link>
                            <Link href="/#proyectos" className="btn btn-outline btn-lg" style={{ borderColor: 'white', color: 'white' }}>
                                Ver Proyectos
                            </Link>
                        </div>
                    </AnimatedSection>
                </div>
            </section>

            {/* Testimonials Section - Proof and Trust */}
            <section className={styles.infoSection}>
                <div className={styles.container}>
                    <h2 className={styles.sectionTitle}>Lo que dicen nuestros clientes</h2>
                    <div className={styles.sectionDivider} />
                    <Testimonials />
                </div>
            </section>

            {/* Advisors Section - Direct Contact */}
            <section className={styles.infoSection} style={{ backgroundColor: '#ffffff' }}>
                <div className={styles.container}>
                    <h2 className={styles.sectionTitle}>Habla directamente con un experto</h2>
                    <div className={styles.sectionDivider} />
                    <AdvisorsSection />
                </div>
            </section>
        </div>
    )
}
