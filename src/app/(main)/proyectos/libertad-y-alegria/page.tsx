import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { PROJECTS, SITE, MINI_BENEFITS } from '@/lib/constants'
import { BreadcrumbSchema } from '@/components/seo/JsonLd'
import MetaTrackPageView from '@/components/analytics/MetaTrackPageView'
import AnimatedSection from '@/components/ui/AnimatedSection'
import ContactForm from '@/components/sections/ContactForm'
import Newsletter from '@/components/sections/Newsletter'
import styles from './LibertadYAlegria.module.css'

const project = PROJECTS.find(p => p.id === 'libertad-y-alegria')!

export const metadata: Metadata = {
    title: `${project.name} | Terrenos en El Tabo`,
    description: project.description,
    alternates: { canonical: `${SITE.url}/proyectos/${project.slug}` },
}

export default function LibertadYAlegriaPage() {
    const whatsappMsg = encodeURIComponent(`Hola, me interesa el proyecto ${project.name} 🏡.`)
    const whatsappUrl = `https://wa.me/${SITE.whatsapp}?text=${whatsappMsg}`

    const galleryImages = [
        '/images/proyectos/libertad-y-alegria/1.png',
        '/images/proyectos/libertad-y-alegria/2.png',
        '/images/proyectos/libertad-y-alegria/46.png',
        '/images/proyectos/libertad-y-alegria/47.png',
        '/images/proyectos/libertad-y-alegria/copia_de_1.png',
        '/images/proyectos/libertad-y-alegria/copia_de_2.png',
    ]

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
                {/* Hero Section */}
                <section className={styles.hero}>
                    <video 
                        className={styles.heroVideo}
                        autoPlay 
                        muted 
                        loop 
                        playsInline
                        poster="/images/proyectos/libertad-y-alegria/1.png"
                    >
                        <source src="/videos/Hero-pagina-libertad-y-alegria.mp4" type="video/mp4" />
                    </video>
                    
                    <div className={styles.heroOverlay} />
                    
                    <div className={styles.heroContent}>
                        <span className={styles.heroProjectLabel}>Proyecto Exclusivo</span>
                        <h1 className={styles.heroTitle}>{project.name}</h1>
                        <p className={styles.heroSubtitle}>
                            {project.tagline} <br/>
                            <span className={styles.goldText}>{project.distance}</span>
                        </p>
                    </div>
                </section>

                {/* Intro Section */}
                <section className={styles.introSection}>
                    <div className={styles.introContainer}>
                        <AnimatedSection>
                            <div className={styles.introContent}>
                                <h2 className={styles.introTitle}>Descubre un lugar donde la libertad y la alegría se encuentran</h2>
                                <p className={styles.introText}>
                                    {project.description}
                                    <br /><br />
                                    Un proyecto diseñado para conectar con la naturaleza, disfrutar del aire puro del Litoral Central y construir los mejores recuerdos en familia.
                                </p>
                                
                                <div className={styles.introFeatures}>
                                    {project.features.map(f => (
                                        <span key={f} className={styles.featureTag}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                            {f}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </AnimatedSection>
                        
                        <AnimatedSection delay={200}>
                            <div style={{ position: 'relative', width: '100%', height: '500px', borderRadius: '1rem', overflow: 'hidden' }}>
                                <Image 
                                    src="/images/proyectos/libertad-y-alegria/2.png" 
                                    alt="Naturaleza Libertad y Alegría"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </AnimatedSection>
                    </div>
                </section>

                {/* Gallery Mosaic */}
                <section className={styles.gallerySection}>
                    <div className={styles.galleryContainer}>
                        <AnimatedSection>
                            <div className={styles.galleryHeader}>
                                <h2 className={styles.galleryTitle}>Galería del Proyecto</h2>
                                <p className={styles.gallerySubtitle}>Conoce los espacios reales y el entorno privilegiado que te espera en El Tabo.</p>
                            </div>
                        </AnimatedSection>

                        <AnimatedSection delay={200}>
                            <div className={styles.mosaicGrid}>
                                {galleryImages.map((src, index) => (
                                    <div key={index} className={styles.mosaicItem}>
                                        <Image
                                            src={src}
                                            alt={`Vista ${index + 1} de ${project.name}`}
                                            fill
                                            className={`${styles.mosaicImage} object-cover`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </AnimatedSection>
                    </div>
                </section>

                {/* Status Banner */}
                <section className={styles.statusBanner}>
                    <div className={styles.statusContainer}>
                        <AnimatedSection>
                            <div className={styles.statusIcon}>✨</div>
                            <h2 className={styles.statusTitle}>¡{project.status}!</h2>
                            <p className={styles.statusText}>
                                Gracias a todos nuestros clientes por confiar en este hermoso proyecto. 
                                Si deseas información sobre nuestros otros proyectos disponibles como <strong>Lomas del Mar</strong> o <strong>Arena y Sol</strong>, contáctanos.
                            </p>
                            <div style={{ marginTop: '2rem' }}>
                                <Link href="/proyectos" className={styles.buttonPillPrimary}>
                                    Ver Proyectos Disponibles
                                </Link>
                            </div>
                        </AnimatedSection>
                    </div>
                </section>

                <ContactForm />
                <Newsletter />
            </main>
        </div>
    )
}
