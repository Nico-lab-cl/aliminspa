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
                        <div className={styles.intro}>
                            <div className={styles.titleContainer}>
                                <div className={styles.titleLine}></div>
                                <h1 className={styles.title}>Nuestros Proyectos</h1>
                                <div className={styles.titleLine}></div>
                            </div>
                        </div>
                    </AnimatedSection>

                    <div className={styles.grid}>
                        {PROJECTS.map((project, i) => (
                            <AnimatedSection key={project.id} delay={i * 150} className={styles.card}>
                                <h2 className={styles.projectTitle}>{project.name}</h2>
                                <div className={styles.imageWrapper}>
                                    <Image
                                        src={project.image}
                                        alt={`${project.name} - Proyecto de terrenos en El Tabo`}
                                        fill
                                        className={styles.image}
                                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                    />
                                </div>
                                <h3 className={styles.subtitle}>{project.tagline}</h3>
                                <p className={styles.lotInfo}>Terrenos urbanizados de {project.lotSize}</p>
                                <p className={styles.description}>{project.description}</p>
                                
                                <div className={styles.buttonContainer}>
                                    <Link 
                                        href={project.externalUrl || `/proyectos/${project.slug}`}
                                        target={project.externalUrl ? '_blank' : undefined}
                                        rel={project.externalUrl ? 'noopener noreferrer' : undefined}
                                        className={styles.btnAction}
                                    >
                                        Más info &raquo;
                                    </Link>
                                </div>
                            </AnimatedSection>
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}
