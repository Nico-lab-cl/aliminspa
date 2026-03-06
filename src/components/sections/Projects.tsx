import Link from 'next/link'
import Image from 'next/image'
import { PROJECTS } from '@/lib/constants'
import AnimatedSection from '@/components/ui/AnimatedSection'
import styles from './Projects.module.css'

export default function Projects() {
    return (
        <section className="section" id="proyectos">
            <div className="container">
                <div className="section-header">
                    <AnimatedSection>
                        <span className="section-label">Nuestros Proyectos</span>
                        <h2 className="section-title">
                            Venta de Terrenos en El Tabo
                        </h2>
                        <p className="section-subtitle">
                            Descubre nuestros proyectos inmobiliarios con terrenos urbanizados,
                            rol propio y ubicación privilegiada en el Litoral Central.
                        </p>
                    </AnimatedSection>
                </div>

                <div className={styles.grid}>
                    {PROJECTS.map((project, i) => {
                        const isSoldOut = project.status === 'Proyecto Vendido';
                        const hasSoldPercentage = 'soldPercentage' in project;

                        return (
                            <AnimatedSection key={project.id} delay={i * 120}>
                                <div className={`${styles.card} ${isSoldOut ? styles.soldOut : ''} ${project.isFeatured ? styles.featured : ''}`}>
                                    <Link
                                        href={project.externalUrl || `/proyectos/${project.slug}`}
                                        target={project.externalUrl ? '_blank' : undefined}
                                        rel={project.externalUrl ? 'noopener noreferrer' : undefined}
                                        className={styles.cardLink}
                                    >
                                        <div className={styles.imageWrapper}>
                                            <Image
                                                src={project.image}
                                                alt={`${project.name} - Terrenos en venta en El Tabo, Litoral Central`}
                                                width={600}
                                                height={360}
                                                className={styles.image}
                                            />
                                            <div className={styles.imageOverlay} />
                                            <span
                                                className={styles.status}
                                                style={{ background: project.color }}
                                            >
                                                {project.status}
                                            </span>

                                            {hasSoldPercentage && (
                                                <div className={styles.progressBadge}>
                                                    <span className={styles.progressText}>
                                                        ¡{project.soldPercentage}% Vendido!
                                                    </span>
                                                    <div className={styles.progressBar}>
                                                        <div
                                                            className={styles.progressFill}
                                                            style={{ width: `${project.soldPercentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className={styles.body}>
                                            <div className={styles.headerRow}>
                                                <h3 className={styles.name}>{project.name}</h3>
                                                {project.isFeatured && (
                                                    <span className={styles.featuredLabel}>Inversión Destacada</span>
                                                )}
                                            </div>
                                            <p className={styles.tagline}>{project.tagline}</p>
                                            <p className={styles.description}>{project.description}</p>

                                            <div className={styles.features}>
                                                {project.features.map((feat) => (
                                                    <span key={feat} className={styles.feature}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                                                        {feat}
                                                    </span>
                                                ))}
                                            </div>

                                            <div className={styles.meta}>
                                                <span className={styles.metaItem}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                                    {project.distance}
                                                </span>
                                                <span className={styles.metaItem}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /></svg>
                                                    {project.lotSize}
                                                </span>
                                            </div>

                                            <div className={styles.cta}>
                                                <span>{isSoldOut ? 'Más información' : (project.externalUrl ? 'Terrenos Disponibles' : 'Ver Proyecto')}</span>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            </AnimatedSection>
                        );
                    })}
                </div>
            </div>
        </section>
    )
}
