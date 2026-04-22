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

                {/* GALERIA DEL PROYECTO */}
                <section className={styles.gallerySection}>
                    <div className={styles.galleryContainer}>
                        <AnimatedSection>
                            <div className={styles.galleryHeader}>
                                <h2 className={styles.galleryTitle}>Galería del Proyecto</h2>
                                <p className={styles.gallerySubtitle}>Conoce los espacios reales y el entorno privilegiado que te espera en El Tabo.</p>
                            </div>
                        </AnimatedSection>

                        <AnimatedSection delay={200}>
                            <div className={styles.masonryGrid}>
                                {/* Left column: tall portrait image */}
                                <div className={styles.gridLeft}>
                                    <Image
                                        src="/images/proyectos/libertad-y-alegria/46.png"
                                        alt="Vista 1 de Libertad y Alegría"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                
                                {/* Right column: wide top image + two small squares */}
                                <div className={styles.gridRight}>
                                    <div className={styles.gridRightTop}>
                                        <Image
                                            src="/images/proyectos/libertad-y-alegria/47.png"
                                            alt="Vista 2 de Libertad y Alegría"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className={styles.gridRightBottom}>
                                        <div className={styles.gridSmallImage}>
                                            <Image
                                                src="/images/proyectos/libertad-y-alegria/1.png"
                                                alt="Vista 3 de Libertad y Alegría"
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className={styles.gridSmallImage}>
                                            <Image
                                                src="/images/proyectos/libertad-y-alegria/copia_de_1.png"
                                                alt="Vista 4 de Libertad y Alegría"
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom row: two wide banners */}
                            <div className={styles.bannerGrid}>
                                <div className={styles.bannerItem}>
                                    <Image
                                        src="/images/proyectos/libertad-y-alegria/copia_de_2.png"
                                        alt="Banner Libertad y Alegría 1"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className={styles.bannerItem}>
                                    {/* Using same image for both as the design implies a symmetrical pair or list */}
                                    <Image
                                        src="/images/proyectos/libertad-y-alegria/copia_de_2.png"
                                        alt="Banner Libertad y Alegría 2"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            </div>
                        </AnimatedSection>
                    </div>
                </section>

                {/* CTA: COTIZAR TERRENO */}
                <LyaCTA />

                {/* TESTIMONIALS: +100 FAMILIAS */}
                <Testimonials />

                {/* ATTRACTIONS: SERVICIOS Y ACTIVIDADES */}
                <LyaAttractions />

                {/* STATUS BANNER */}
                <section className={styles.statusBanner}>
                    <AnimatedSection>
                        <div className={styles.statusContainer}>
                            <div className={styles.statusIcon}>✨</div>
                            <h2 className={styles.statusTitle}>¡Proyecto Vendido!</h2>
                            <p className={styles.statusText}>
                                Gracias a todos nuestros clientes por confiar en este hermoso proyecto. Si deseas información sobre nuestros terrenos en proyectos disponibles como Lomas del Mar o Arena y Sol, contáctanos.
                            </p>
                            <Link href="/proyectos" className={styles.buttonGold}>
                                Ver Proyectos disponibles
                            </Link>
                        </div>
                    </AnimatedSection>
                </section>

                {/* CONTACT & NEWSLETTER WRAPPER (DARK GREEN BACKGROUND) */}
                <div style={{ backgroundColor: '#2F4F4F' }} id="cotizar">
                    {/* CONTACT FORM */}
                    <section className={styles.contactSection}>
                        <div className={styles.contactContainer}>
                            <div className={styles.contactHeader}>
                                <h2 className={styles.contactTitle}>Cotizar Terreno en El Tabo</h2>
                            </div>
                            
                            <AnimatedSection>
                                <div className={styles.contactCard}>
                                    <div className={styles.contactInfo}>
                                        <h3 className={styles.contactInfoTitle}>Cotizar Terreno en El Tabo</h3>
                                        <p className={styles.contactInfoText}>
                                            Completa el formulario y un asesor de nuestro equipo de ventas se contactará contigo a la brevedad con los proyectos disponibles.
                                        </p>
                                        <div className={styles.contactFeatures}>
                                            <div className={styles.contactFeature}>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                <span>Respuesta en menos de 24 horas</span>
                                            </div>
                                            <div className={styles.contactFeature}>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                <span>Asesoría personalizada</span>
                                            </div>
                                            <div className={styles.contactFeature}>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                <span>Visitas guiadas sin costo</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles.contactFormArea}>
                                        <form onSubmit={(e) => e.preventDefault()}>
                                            <input type="text" placeholder="Nombre completo" className={styles.formInput} />
                                            <input type="email" placeholder="Correo electrónico" className={styles.formInput} />
                                            <input type="tel" placeholder="Celular" className={styles.formInput} />
                                            <input type="text" placeholder="Ciudad" className={styles.formInput} />
                                            <select className={styles.formSelect}>
                                                <option>Proyecto a interés (Opcional)</option>
                                                <option>Lomas del Mar</option>
                                                <option>Arena y Sol</option>
                                            </select>
                                            <button type="submit" className={styles.submitBtn}>Solicitar Información</button>
                                        </form>
                                    </div>
                                </div>
                            </AnimatedSection>
                        </div>
                    </section>

                    {/* NEWSLETTER */}
                    <section className={styles.newsletterSection}>
                        <AnimatedSection delay={200}>
                            <div className={styles.newsletterCard}>
                                <div className={styles.newsletterText}>
                                    <h3 className={styles.newsletterTitle}>Recibe las mejores oportunidades de terrenos</h3>
                                    <p className={styles.newsletterDesc}>
                                        Suscríbete y sé el primero en conocer nuevos proyectos y exclusivas.
                                    </p>
                                </div>
                                <form className={styles.newsletterForm} onSubmit={e => e.preventDefault()}>
                                    <input type="email" placeholder="Ingresa tu correo" className={styles.newsletterInput} />
                                    <button type="submit" className={styles.newsletterBtn}>Suscribirme</button>
                                </form>
                            </div>
                        </AnimatedSection>
                    </section>
                </div>
            </main>
        </div>
    )
}
