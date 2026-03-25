import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { PROJECTS, SITE } from '@/lib/constants'
import AnimatedSection from '@/components/ui/AnimatedSection'
import ContactForm from '@/components/sections/ContactForm'
import { BreadcrumbSchema } from '@/components/seo/JsonLd'
import MetaTrackPageView from '@/components/analytics/MetaTrackPageView'

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
            <div style={{ paddingTop: 'var(--navbar-height)' }}>
                <section className="section">
                    <div className="container">
                        <AnimatedSection>
                            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                                <span className="section-label">{project.status}</span>
                                <h1 className="section-title">{project.name}</h1>
                                <p className="section-subtitle">{project.tagline}</p>
                            </div>
                        </AnimatedSection>

                        <AnimatedSection delay={200}>
                            <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '3rem', border: '1px solid var(--border)' }}>
                                <Image
                                    src={project.image}
                                    alt={`${project.name} - Vista del proyecto de terrenos en El Tabo`}
                                    width={1200}
                                    height={600}
                                    style={{ width: '100%', height: 'auto', objectFit: 'cover' }}
                                    priority
                                />
                            </div>
                        </AnimatedSection>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
                            <AnimatedSection>
                                <div>
                                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Sobre {project.name}</h2>
                                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '1.5rem' }}>
                                        {project.description}
                                    </p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {project.features.map((f) => (
                                            <span key={f} style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                                fontSize: '0.85rem', fontWeight: 500, color: 'var(--green-light)',
                                                background: 'rgba(45,122,58,0.1)', border: '1px solid rgba(45,122,58,0.2)',
                                                padding: '0.35rem 0.8rem', borderRadius: 'var(--radius-full)'
                                            }}>
                                                ✓ {f}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </AnimatedSection>

                            <AnimatedSection delay={150}>
                                <div style={{
                                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-lg)', padding: '2rem'
                                }}>
                                    <h3 style={{ fontSize: '1.2rem', marginBottom: '1.2rem', color: 'var(--gold)' }}>Detalles del Proyecto</h3>
                                    <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                        {[
                                            { label: 'Ubicación', value: project.location },
                                            { label: 'Distancia al mar', value: project.distance },
                                            { label: 'Tamaño de lotes', value: project.lotSize },
                                            { label: 'Estado', value: project.status },
                                        ].map(({ label, value }) => (
                                            <li key={label} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.6rem', borderBottom: '1px solid var(--border)' }}>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{label}</span>
                                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{value}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    {project.externalUrl && (
                                        <Link
                                            href={project.externalUrl}
                                            className="btn btn-primary"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ width: '100%', marginTop: '1.5rem' }}
                                        >
                                            Visitar Sitio Web →
                                        </Link>
                                    )}
                                </div>
                            </AnimatedSection>
                        </div>
                    </div>
                </section>

                <ContactForm />
            </div>
        </>
    )
}
