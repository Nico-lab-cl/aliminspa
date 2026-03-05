import React from 'react'
import { BENEFITS } from '@/lib/constants'
import AnimatedSection from '@/components/ui/AnimatedSection'
import styles from './Benefits.module.css'

const ICONS: Record<string, React.ReactNode> = {
    shield: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
    droplet: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></svg>,
    zap: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
    'map-pin': <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
    'trending-up': <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>,
    'credit-card': <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>,
}

export default function Benefits() {
    return (
        <section className={`section ${styles.section}`} id="beneficios">
            <div className={styles.bgOrb1} />
            <div className={styles.bgOrb2} />

            <div className="container">
                <div className="section-header">
                    <AnimatedSection>
                        <span className="section-label">¿Por Qué Alimin?</span>
                        <h2 className="section-title">
                            Terrenos con Rol Propio en El Tabo
                        </h2>
                        <p className="section-subtitle">
                            Invertir en el Litoral Central nunca fue tan seguro.
                            Todos nuestros proyectos incluyen lo que necesitas para construir tu sueño.
                        </p>
                    </AnimatedSection>
                </div>

                <div className={styles.grid}>
                    {BENEFITS.map((benefit, i) => (
                        <AnimatedSection key={benefit.title} delay={i * 80}>
                            <div className={styles.card}>
                                <div className={styles.iconWrapper}>
                                    {ICONS[benefit.icon]}
                                </div>
                                <h3 className={styles.cardTitle}>{benefit.title}</h3>
                                <p className={styles.cardDesc}>{benefit.description}</p>
                            </div>
                        </AnimatedSection>
                    ))}
                </div>
            </div>
        </section>
    )
}
