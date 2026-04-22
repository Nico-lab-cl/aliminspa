'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { PROJECTS, SITE } from '@/lib/constants'
import { BreadcrumbSchema } from '@/components/seo/JsonLd'
import MetaTrackPageView from '@/components/analytics/MetaTrackPageView'
import AnimatedSection from '@/components/ui/AnimatedSection'
import { Palmtree } from 'lucide-react'
import LyaFeatures from './components/LyaFeatures'
import LyaPromoCards from './components/LyaPromoCards'
import LyaCTA from './components/LyaCTA'
import LyaAttractions from './components/LyaAttractions'
import Testimonials from '@/components/sections/Testimonials'
import Newsletter from '@/components/sections/Newsletter'
import styles from './LibertadYAlegria.module.css'

const project = PROJECTS.find(p => p.id === 'libertad-y-alegria')!

export default function LibertadYAlegriaPage() {
    const whatsappMsg = encodeURIComponent("Hola, quiero hablar con un asesor sobre el proyecto Libertad y Alegría, vengo desde la página.")
    const whatsappUrl = `https://wa.me/${SITE.whatsapp}?text=${whatsappMsg}`

    return (
        <div className={styles.lyaPage}>
            <MetaTrackPageView 
                customData={{ 
                    content_name: project.name, 
                    content_category: 'Real Estate',
                    content_type: 'product' 
                }} 
            />
            <BreadcrumbSchema
                items={[
                    { name: 'Inicio', url: SITE.url },
                    { name: 'Proyectos', url: `${SITE.url}/proyectos` },
                    { name: project.name, url: `${SITE.url}/proyectos/${project.slug}` },
                ]}
            />
            
            <main>
                {/* HERO SECTION */}
                <section className={styles.hero}>
                    <video 
                        className={styles.heroVideo}
                        autoPlay 
                        muted 
                        loop 
                        playsInline
                        poster="/images/proyectos/libertad-y-alegria/1.png"
                    >
                        <source src="/videos/Hero-pagina-libertad-y-alegria.mp4#t=5" type="video/mp4" />
                    </video>
                    
                    <div className={styles.heroOverlay} />
                    
                    <div className={styles.heroContent}>
                        <AnimatedSection>
                            <span className={styles.heroProjectLabel}>Proyecto Exclusivo</span>
                            <h1 className={styles.heroTitle}>Libertad y<br/>Alegría</h1>
                            <p className={styles.heroSubtitle}>¡Tu propio lugar en El Tabo!</p>
                            <p className={styles.heroDistance}>A 10 MINUTOS DE LA PLAYA DEL TABO</p>
                            
                            <div className={styles.ctaGroupCentered}>
                                <Link href="#cotizar" className={styles.buttonPillPrimary}>
                                    Ver Disponibilidad
                                </Link>
                                <Link 
                                    href={whatsappUrl}
                                    target="_blank"
                                    rel="noopener noreferrer" 
                                    className={styles.buttonPillSecondary}
                                >
                                    Hablar con un asesor
                                </Link>
                            </div>
                        </AnimatedSection>
                    </div>
                </section>

                {/* INTRO SECTION */}
                <section className={styles.introSection}>
                    <div className="container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
                        <AnimatedSection>
                            <div className={styles.introTop}>
                                <div className={styles.iconWrapper} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Palmtree style={{ width: '80%', height: '80%' }} color="#ffffff" strokeWidth={1.5} />
                                    
                                    {/* Sol en la esquina superior izquierda */}
                                    <svg width="40%" height="40%" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" style={{ position: 'absolute', top: '-10%', left: '-10%' }}>
                                        <circle cx="12" cy="12" r="5" fill="none" />
                                        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                                    </svg>
                                    
                                    {/* Base de agua simplificada */}
                                    <svg width="120%" height="30%" viewBox="0 0 80 20" fill="none" stroke="#ffffff" strokeWidth="1.5" style={{ position: 'absolute', bottom: '-5%', left: '50%', transform: 'translateX(-50%)' }}>
                                        <path d="M5 10c3 0 5-2 8-2s5 2 8 2 5-2 8-2 5 2 8 2 5-2 8-2 5 2 8 2 5-2 8-2 5 2 8 2" />
                                        <path d="M5 15c3 0 5-2 8-2s5 2 8 2 5-2 8-2 5 2 8 2 5-2 8-2 5 2 8 2 5-2 8-2 5 2 8 2" />
                                    </svg>
                                </div>
                                <h2 className={styles.introSubtitle}>
                                    A solo 10 minutos de la playa de <span className={styles.goldText}>El Tabo.</span>
                                </h2>
                            </div>
                        </AnimatedSection>
                        
                        <AnimatedSection delay={200}>
                            <div className={styles.introDividerWrapper}>
                                <div className={styles.introDividerLine}></div>
                                <div className={styles.introLogo}>
                                    <Image 
                                        src="/images/home_redesign/logo.png.webp" 
                                        alt="Alimin Logo" 
                                        fill 
                                        style={{ objectFit: 'contain' }} 
                                    />
                                </div>
                                <div className={styles.introDividerLine}></div>
                            </div>
                        </AnimatedSection>

                        <AnimatedSection delay={400}>
                            <h2 className={styles.introMainTitle}>
                                Terrenos 100% urbanizados de <span className={styles.goldText}>400 m2</span><br />
                                a 10 minutos de la playa
                            </h2>
                            <p className={styles.introDescription}>
                                Un proyecto diseñado para aquellos que desean avanzar hacia un <br className="hidden md:block" />
                                área urbanizada cerca del mar, con un acceso claro, servicios <br className="hidden md:block" />
                                disponibles y un proceso de compra más sencillo.
                            </p>
                        </AnimatedSection>
                    </div>
                </section>

                {/* FEATURES CAROUSEL */}
                <LyaFeatures />

                {/* PROMO CARDS */}
                <LyaPromoCards />

                {/* CTA: COTIZAR TERRENO */}
                <LyaCTA />

                {/* TESTIMONIALS: +100 FAMILIAS */}
                <Testimonials />

                {/* ATTRACTIONS: SERVICIOS Y ACTIVIDADES */}
                <LyaAttractions />

                {/* NEWSLETTER */}
                <Newsletter />
            </main>
        </div>
    )
}

