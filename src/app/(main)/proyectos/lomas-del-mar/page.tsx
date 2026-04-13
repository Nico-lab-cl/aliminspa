import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { PROJECTS, SITE } from '@/lib/constants'
import AnimatedSection from '@/components/ui/AnimatedSection'
import ContactForm from '@/components/sections/ContactForm'
import { BreadcrumbSchema } from '@/components/seo/JsonLd'
import MetaTrackPageView from '@/components/analytics/MetaTrackPageView'
import styles from './page.module.css'

const project = PROJECTS[0] // Lomas del Mar

export const metadata: Metadata = {
    title: `${project.name} | Terrenos en El Tabo con Vista al Mar`,
    description: project.description,
    alternates: { canonical: `${SITE.url}/proyectos/${project.slug}` },
}

export default function LomasDelMarPage() {
    const defaultMessage = `Hola, vengo desde la web. Me interesa el proyecto ${project.name} y quiero solicitar más información. 🏢`
    const whatsappLink = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(defaultMessage)}`

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
                {/* Hero Section derived from web.png layout */}
                <section className={styles.hero}>
                    <div className={styles.heroImageContainer}>
                        <Image
                            src="/images/lomas-del-mar/web.png"
                            alt="Proyecto Lomas del Mar - Vista Completa"
                            fill
                            className={styles.heroImage}
                            priority
                        />
                    </div>
                    
                    <div className="container" style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'center' }}>
                        <div className={styles.heroOverlay}>
                            <h1 className={styles.title}>{project.name}</h1>
                            <p className={styles.tagline}>{project.tagline}</p>

                            <div className={styles.dicomBadge}>
                                Sin importar tu DICOM
                            </div>

                            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
                                Terrenos urbanizados de {project.lotSize}
                            </h3>

                            <div className={styles.financingBox}>
                                <div className={styles.financingGrid}>
                                    {project.financing?.options?.map((opt, i) => (
                                        <div key={i} className={styles.financingOption}>
                                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gold)' }}>
                                                {opt.terreno}
                                            </div>
                                            <div style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0.8rem 0' }}>
                                                Pie {opt.pie}
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: '#ccc', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                                <span>• Valor total: <strong style={{ color: 'white' }}>{opt.valorTotal}</strong></span>
                                                <span>• Cuota referencial: <strong style={{ color: 'white' }}>{opt.cuotaReferencial}</strong></span>
                                                {opt.plazo && <span>• Plazo aproximado: <strong style={{ color: 'white' }}>{opt.plazo}</strong></span>}
                                                <span>Precio de contado: <strong style={{ color: 'var(--gold)' }}>{opt.pagoContado}</strong></span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <p style={{ fontWeight: 700, fontSize: '1.2rem' }}>
                                Aprovecha nuestro <span style={{ color: 'var(--gold)' }}>crédito directo.</span>
                            </p>
                        </div>
                    </div>
                </section>

                <section className={`section ${styles.contentSection}`}>
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
                            {/* Instead of hardcoding all 1_1.png dynamically, let's render a few prominent ones extracted */}
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

                <section className={styles.ctaSection}>
                    <div className="container">
                        <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', fontWeight: 800 }}>¡Queda solo el 25% disponible!</h2>
                        <p style={{ fontSize: '1.2rem', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
                            Asegura tu plusvalía y calidad de vida hoy mismo. Contáctanos para conocer los lotes en venta.
                        </p>
                        <a href="#contacto" className="btn btn-secondary btn-lg" style={{ background: '#2F4F4F', color: 'white', border: 'none' }}>
                            Quiero más información
                        </a>
                    </div>
                </section>

                <div id="contacto">
                    <ContactForm />
                </div>

                {/* Hot WhatsApp Button specific for this campaign */}
                <a 
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.hotWhatsapp}
                    aria-label="Hablar por WhatsApp sobre Lomas del Mar"
                >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.675 1.438 5.662 1.439h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                    <span>Cotizar en Línea</span>
                </a>
            </div>
        </>
    )
}
