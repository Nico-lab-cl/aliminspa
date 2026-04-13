import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { PROJECTS, SITE } from '@/lib/constants'
import AnimatedSection from '@/components/ui/AnimatedSection'
import ContactForm from '@/components/sections/ContactForm'
import { BreadcrumbSchema } from '@/components/seo/JsonLd'
import MetaTrackPageView from '@/components/analytics/MetaTrackPageView'
import { TrendingUp, CheckCircle, Palmtree } from 'lucide-react'
import FeaturesCarousel from './FeaturesCarousel'
import VideoSection from './VideoSection'
import PricingSection from './PricingSection'
import Testimonials from '@/components/sections/Testimonials'
import styles from './page.module.css'

const project = PROJECTS[0] // Lomas del Mar

export const metadata: Metadata = {
    title: `${project.name} | Terrenos en El Tabo con Vista al Mar`,
    description: project.description,
    alternates: { canonical: `${SITE.url}/proyectos/${project.slug}` },
}

export default function LomasDelMarPage() {
    return (
        <>
            <MetaTrackPageView 
                customData={{ 
                    content_name: project.name, 
                    content_category: 'Real Estate Campaign',
                    content_type: 'landing_page' 
                }} 
            />
            <BreadcrumbSchema
                items={[
                    { name: 'Inicio', url: SITE.url },
                    { name: 'Proyectos', url: `${SITE.url}/proyectos` },
                    { name: project.name, url: `${SITE.url}/proyectos/${project.slug}` },
                ]}
            />
            
            <div className={styles.page}>
                {/* Hero Section */}
                <section className={styles.hero}>
                    <video 
                        className={styles.videoDesktop}
                        autoPlay 
                        muted 
                        loop 
                        playsInline
                        poster="/images/projects/lomas-del-mar-v2.jpg"
                    >
                        <source src="/videos/lomas-del-mar/Lomas web.mp4" type="video/mp4" />
                    </video>
                    
                    <video 
                        className={styles.videoMobile}
                        autoPlay 
                        muted 
                        loop 
                        playsInline
                    >
                        <source src="/videos/lomas-del-mar/lomas cel.mp4" type="video/mp4" />
                    </video>

                    <div className={styles.heroOverlay}></div>
                    
                    <div className={styles.heroContent}>
                        <span className={styles.heroProjectSubtitle}>Proyecto</span>
                        <h1 className={styles.heroProjectTitle}>Lomas del Mar</h1>
                        <div className={styles.heroDivider}></div>
                        <p className={styles.heroDescription}>
                            Terrenos 100% urbanizados a<br/>
                            8 min de la playa.
                        </p>
                        <p className={styles.heroFinancing}>
                            Sin bancos, sin intereses y con financiamiento directo
                        </p>
                        
                        <div className={styles.heroButtons}>
                            <a href="#disponibilidad" className={styles.btnDisponibilidad}>Ver Disponibilidad</a>
                            <a href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(`Hola, vengo desde la web. Me interesa el proyecto ${project.name} y quiero solicitar más información. 🏢`)}`} target="_blank" rel="noopener noreferrer" className={styles.btnAsesor}>Hablar con un asesor</a>
                        </div>
                    </div>
                </section>

                <section className={styles.introSection}>
                    <div className="container" style={{ maxWidth: '800px' }}>
                        <div className={styles.introTop}>
                            <div style={{ position: 'relative', width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Palmtree size={60} color="#ffffff" strokeWidth={1.5} />
                                {/* Sol en la esquina superior izquierda como diseño de la maqueta */}
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" style={{ position: 'absolute', top: 0, left: 0 }}>
                                    <circle cx="12" cy="12" r="5" fill="none" />
                                </svg>
                                {/* Base de agua simplificada */}
                                <svg width="80" height="20" viewBox="0 0 80 20" fill="none" stroke="#ffffff" strokeWidth="1.5" style={{ position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)' }}>
                                    <path d="M5 10c3 0 5-2 8-2s5 2 8 2 5-2 8-2 5 2 8 2 5-2 8-2 5 2 8 2 5-2 8-2 5 2 8 2" />
                                    <path d="M5 15c3 0 5-2 8-2s5 2 8 2 5-2 8-2 5 2 8 2 5-2 8-2 5 2 8 2 5-2 8-2 5 2 8 2" />
                                </svg>
                            </div>
                            <h2 className={styles.introSubtitle}>
                                A solo 8 minutos de la playa de <strong>El Tabo.</strong>
                            </h2>
                        </div>
                        
                        <p className={styles.introGreeting}>
                            Hola, queremos contarte algo especial...
                        </p>
                        
                        <div className={styles.introDivider}>
                            <div className={styles.introLine}></div>
                            <div className={styles.introLogo}>
                                <Image 
                                    src="/images/lomas-del-mar/logo-verde.png" 
                                    alt="Alimin Logo Verde" 
                                    fill 
                                    style={{ objectFit: 'contain' }} 
                                />
                            </div>
                            <div className={styles.introLine}></div>
                        </div>

                        <p className={styles.introMainText}>
                            Estamos lanzando un nuevo proyecto<br/>
                            llamado <strong>Lomas del Mar</strong>, <strong>una propuesta a<br/>
                            largo plazo</strong> que hemos preparado en Alimin.
                        </p>
                    </div>
                </section>

                <section className={styles.statsSection}>
                    <div className="container" style={{ maxWidth: '900px', width: '100%' }}>
                        <AnimatedSection>
                            <div className={styles.statsCardWrapper}>
                                <div className={styles.statsCard}>
                                    <div className={styles.statsHeader}>
                                        <div className={styles.statsTitleBox}>
                                            <div className={styles.statsIcon}>
                                                <TrendingUp size={24} color="#ffffff" strokeWidth={2.5}/>
                                            </div>
                                            <div>
                                                <h3 className={styles.statsTitle}>LOTES VENDIDOS</h3>
                                                <p className={styles.statsSubtitle}>
                                                    <span className={styles.liveDot}></span> Actualización en tiempo real
                                                </p>
                                            </div>
                                        </div>
                                        <div className={styles.statsPercentage}>
                                            42<span>%</span>
                                        </div>
                                    </div>
                                    
                                    <div className={styles.statsGrid}>
                                        <div className={styles.statBox}>
                                            <span className={styles.statLabel}>VENDIDOS</span>
                                            <span className={styles.statValue}>
                                                <CheckCircle size={20} color="#a0b2b3" /> 50
                                            </span>
                                        </div>
                                        <div className={styles.statBox}>
                                            <span className={styles.statLabel}>RESERVADOS</span>
                                            <span className={styles.statValue}>0</span>
                                        </div>
                                        <div className={styles.statBox}>
                                            <span className={styles.statLabel}>DISPONIBLES</span>
                                            <span className={styles.statValue}>76</span>
                                        </div>
                                    </div>

                                    <div className={styles.progressBarContainer}>
                                        <div className={styles.progressBarTrack}>
                                            <div className={styles.progressBarFill} style={{ width: '42%' }}></div>
                                        </div>
                                        <div className={styles.progressLabels}>
                                            <span>L-01</span>
                                            <span>42% COMPLETADO</span>
                                            <span>L-191</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </AnimatedSection>
                    </div>
                </section>

                <FeaturesCarousel />

                <VideoSection />

                <PricingSection />

                <Testimonials />

                <section className={`section ${styles.contentSection}`} id="disponibilidad">
                    <div className="container">
                        <AnimatedSection>
                            <div className="section-header">
                                <span className="section-label" style={{ color: '#E2B230' }}>Características</span>
                                <h2 className="section-title" style={{ color: 'white' }}>Los beneficios para ti</h2>
                                <p className="section-subtitle" style={{ color: 'white' }}>
                                    Todo lo que necesitas saber antes de asegurar tu terreno. 
                                    A 8 minutos del mar.
                                </p>
                            </div>
                        </AnimatedSection>
                        
                        <div className={styles.benefitsGrid}>
                            {[
                                { img: '/images/lomas-del-mar/1_1.png', label: 'Rol Propio' },
                                { img: '/images/lomas-del-mar/2_1.png', label: 'Parcelas Legales' },
                                { img: '/images/lomas-del-mar/3_1.png', label: 'Agua Certificada' },
                                { img: '/images/lomas-del-mar/4_1.png', label: 'Luz Eléctrica' },
                                { img: '/images/lomas-del-mar/5_1.png', label: 'Portón Automático' },
                                { img: '/images/lomas-del-mar/6_1.png', label: 'Recinto Cerrado' },
                                { img: '/images/lomas-del-mar/7_1.png', label: 'Calles Compactadas' },
                                { img: '/images/lomas-del-mar/8_1.png', label: 'Luminaria Solar' },
                            ].map((bene, i) => (
                                <AnimatedSection key={i} delay={i * 100}>
                                    <div className={styles.benefitCard}>
                                        <div className={styles.benefitIcon}>
                                            <Image src={bene.img} alt={bene.label} fill sizes="80px" />
                                        </div>
                                        <div className={styles.benefitLabel}>{bene.label}</div>
                                    </div>
                                </AnimatedSection>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="section">
                    <div className="container">
                        <AnimatedSection>
                            <div className="section-header">
                                <span className="section-label" style={{ color: '#E2B230' }}>El Entorno</span>
                                <h2 className="section-title" style={{ color: 'white' }}>Cercano a todo</h2>
                                <p className="section-subtitle" style={{ color: 'white' }}>
                                    Ubicación estratégica cerca de atractivos turísticos, restaurantes y zonas naturales.
                                </p>
                            </div>
                        </AnimatedSection>

                        <div className={styles.attractionsGrid}>
                            <AnimatedSection delay={100}>
                                <div className={styles.attractionCard}>
                                    <div className={styles.attractionImageContainer}>
                                        <Image src="/images/lomas-del-mar/kaluche.png" alt="Restaurante Kaluche" fill sizes="(max-width: 768px) 100vw, 33vw" />
                                    </div>
                                    <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Restaurant Kaluche</h3>
                                        <p style={{ color: '#a0b2b3', fontSize: '0.9rem', marginTop: '0.5rem' }}>Gastronomía local a minutos de tu terreno.</p>
                                    </div>
                                </div>
                            </AnimatedSection>

                            <AnimatedSection delay={200}>
                                <div className={styles.attractionCard}>
                                    <div className={styles.attractionImageContainer}>
                                        <Image src="/images/lomas-del-mar/dise_o_sin_t_tulo_1.png" alt="Playa El Tabo" fill sizes="(max-width: 768px) 100vw, 33vw" />
                                    </div>
                                    <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Playa de El Tabo</h3>
                                        <p style={{ color: '#a0b2b3', fontSize: '0.9rem', marginTop: '0.5rem' }}>Disfruta de la costa del litoral central.</p>
                                    </div>
                                </div>
                            </AnimatedSection>

                            <AnimatedSection delay={300}>
                                <div className={styles.attractionCard}>
                                    <div className={styles.attractionImageContainer}>
                                        <Image src="/images/lomas-del-mar/10.png" alt="Naturaleza y Relax" fill sizes="(max-width: 768px) 100vw, 33vw" />
                                    </div>
                                    <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Tranquilidad Natural</h3>
                                        <p style={{ color: '#a0b2b3', fontSize: '0.9rem', marginTop: '0.5rem' }}>Ecosistema perfecto para desconectar.</p>
                                    </div>
                                </div>
                            </AnimatedSection>
                        </div>
                    </div>
                </section>

                <div id="contacto">
                    <ContactForm />
                </div>
            </div>
        </>
    )
}
