import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { PROJECTS, SITE } from '@/lib/constants'
import AnimatedSection from '@/components/ui/AnimatedSection'
import { BreadcrumbSchema } from '@/components/seo/JsonLd'
import MetaTrackPageView from '@/components/analytics/MetaTrackPageView'
import styles from './page.module.css'

export const metadata: Metadata = {
    title: 'Proyectos Inmobiliarios en El Tabo | Terrenos en Venta',
    description: 'Explora nuestros proyectos de terrenos urbanizados en El Tabo: Lomas del Mar, Arena y Sol, y Libertad y Alegría. Terrenos con rol propio desde 200 m².',
    alternates: {
        canonical: `${SITE.url}/proyectos`,
    },
}

export default function ProyectosPage() {
    return (
        <>
            <MetaTrackPageView 
                eventName="ViewContent"
                customData={{ 
                    content_category: 'Real Estate Catalog',
                }} 
            />
            <BreadcrumbSchema
                items={[
                    { name: 'Inicio', url: SITE.url },
                    { name: 'Proyectos', url: `${SITE.url}/proyectos` },
                ]}
            />
            <div className={styles.page}>
                <div className="container">
                    <AnimatedSection>
                        <div className="section-header">
                            <span className="section-label">Nuestros Proyectos</span>
                            <h1 className="section-title">Proyectos Inmobiliarios en El Tabo</h1>
                            <p className="section-subtitle">
                                Descubre nuestras opciones de terrenos urbanizados con rol propio
                                en el Litoral Central de Chile.
                            </p>
                        </div>
                    </AnimatedSection>

                    <div className={styles.grid}>
                        {PROJECTS.map((project, i) => (
                            <AnimatedSection key={project.id} delay={i * 150}>
                                <Link
                                    href={project.externalUrl || `/proyectos/${project.slug}`}
                                    target={project.externalUrl ? '_blank' : undefined}
                                    rel={project.externalUrl ? 'noopener noreferrer' : undefined}
                                    className={`card ${styles.card}`}
                                >
                                    <div className={styles.imageWrapper}>
                                        <Image
                                            src={project.image}
                                            alt={`${project.name} - Proyecto de terrenos en El Tabo`}
                                            width={800}
                                            height={450}
                                            className={styles.image}
                                        />
                                    </div>
                                    <div className={styles.body}>
                                        <span className={styles.status} style={{ background: project.color }}>
                                            {project.status}
                                        </span>
                                        <h2 className={styles.name}>{project.name}</h2>
                                        <p className={styles.tagline}>{project.tagline}</p>
                                        <p className={styles.desc}>{project.description}</p>
                                        <div className={styles.meta}>
                                            <span>{project.distance}</span>
                                            <span>📐 {project.lotSize}</span>
                                        </div>
                                    </div>
                                </Link>
                            </AnimatedSection>
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}
