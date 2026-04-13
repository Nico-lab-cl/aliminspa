import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { PROJECTS, SITE } from '@/lib/constants'
import AnimatedSection from '@/components/ui/AnimatedSection'
import ContactForm from '@/components/sections/ContactForm'
import { BreadcrumbSchema } from '@/components/seo/JsonLd'
import MetaTrackPageView from '@/components/analytics/MetaTrackPageView'
import { TrendingUp, CheckCircle } from 'lucide-react'
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
                            <Image 
                                src="/images/projects/lomas-del-mar-v2.jpg" // Fallback context 
                                alt="Ubicación El Tabo" 
                                width={60} 
                                height={60} 
                                style={{ display: 'none' }} 
                            />
                            {/* Generic Island icon fallback via SVG as it perfectly matches the request outline */}
                            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'white' }}>
                                <path d="M13 22c0-3.33-2-5-5-5s-5 1.67-5 5"/>
                                <path d="M14 17a10.4 10.4 0 0 0 3-4c1.5-2.5 3-4 3-7"/>
                                <path d="M14 17c1.5-2.5 3-4 3-7"/>
                                <path d="M17 6a8 8 0 0 0-8 8"/>
                                <path d="M9 14h.01"/>
                                <path d="M13 8h.01"/>
                                <path d="M17 11h.01"/>
                                <path d="m2 22 2-2 2 2 2-2 2 2 2-2 2 2 2-2 2 2 2-2 2 2"/>
                                <circle cx="5" cy="5" r="2"/>
                            </svg>
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
                                    src="/favicon.png" 
                                    alt="Alimin Logo" 
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
                                            26<span>%</span>
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
                                            <span className={styles.statValue}>81</span>
                                        </div>
                                    </div>

                                    <div className={styles.progressBarContainer}>
                                        <div className={styles.progressBarTrack}>
                                            <div className={styles.progressBarFill} style={{ width: '26%' }}></div>
                                        </div>
                                        <div className={styles.progressLabels}>
                                            <span>L-01</span>
                                            <span>26% COMPLETADO</span>
                                            <span>L-191</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </AnimatedSection>
                    </div>
                </section>

                <section className={`section ${styles.contentSection}`} id="disponibilidad">
                    <div className="container">
                        <AnimatedSection>
                            <div className="section-header">
                                <span className="section-label">Características</span>
                                <h2 className="section-title">Los beneficios para ti</h2>
                                <p className="section-subtitle">
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

                <section className="section" style={{ backgroundColor: 'white' }}>
                    <div className="container">
                        <AnimatedSection>
                            <div className="section-header">
                                <span className="section-label">El Entorno</span>
                                <h2 className="section-title">Cercano a todo</h2>
                                <p className="section-subtitle">
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
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Gastronomía local a minutos de tu terreno.</p>
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
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Disfruta de la costa del litoral central.</p>
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
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Ecosistema perfecto para desconectar.</p>
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
