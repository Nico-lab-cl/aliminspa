import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Newsletter from '@/components/sections/Newsletter'
import AnimatedSection from '@/components/ui/AnimatedSection'
import styles from './page.module.css'

export const metadata: Metadata = {
    title: 'Quiénes Somos - Nuestro Equipo',
    description: 'Conoce al equipo humano, profesional y comprometido detrás de Alimin Inmobiliaria. Dedicados a asegurar tu futuro en El Tabo, Litoral Central.',
}

const DIRECTORS = [
    {
        name: 'Patricio Escobar',
        role: 'CEO',
        desc: 'Estratega y motor del crecimiento. Patricio impulsa las decisiones clave que dan forma a nuestros proyectos, con una visión enfocada en resultados sostenibles.',
        image: '/images/team/patricio.webp'
    },
    {
        name: 'Marcela López',
        role: 'CEO',
        desc: 'Lidera Alimin con visión, energía y una pasión profunda por el desarrollo territorial responsable. Su enfoque está en acercar oportunidades reales a personas reales.',
        image: '/images/team/marcela-l.webp'
    }
];

const ADVISORS = [
    {
        name: 'Marcela Escobar',
        role: 'Asesora Inmobiliaria',
        desc: 'Experta en entender necesidades y convertirlas en decisiones seguras. Siempre con una sonrisa y soluciones prácticas.',
        image: '/images/team/marcela-e.webp',
        whatsapp: '56956654833'
    },
    {
        name: 'Bárbara Arias',
        role: 'Asesora Inmobiliaria',
        desc: 'Con una energía contagiosa y un enfoque profesional, se encarga de que tengas toda la información que necesitas para invertir con confianza.',
        image: '/images/team/barbara.webp',
        whatsapp: '56948775227'
    },
    {
        name: 'Orlando Costa',
        role: 'Asesor Inmobiliario',
        desc: 'Cercano, claro y confiable. Te acompaña paso a paso para encontrar el terreno perfecto según tus metas y posibilidades.',
        image: '/images/team/orlando.webp',
        whatsapp: '56973077128'
    }
];

export default function TeamPage() {
    return (
        <main className={styles.page}>
            <Navbar />

            {/* Premium Animated Background */}
            <div className={styles.pageBg}>
                <div className={styles.gridOverlay} />
                <div className={`${styles.orb} ${styles.orbTop}`} />
                <div className={`${styles.orb} ${styles.orbMiddle}`} />
                <div className={`${styles.orb} ${styles.orbBottom}`} />
            </div>

            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles.heroBg}>
                    <div className={styles.heroBgInner} />
                </div>

                <AnimatedSection className={styles.container}>
                    <div className="section-label">Nuestro Equipo</div>
                    <h1 className="section-title">Las personas que construyen contigo</h1>

                    <div className={styles.quote}>
                        Un equipo humano, profesional y comprometido con tu futuro
                    </div>

                    <p className={styles.subtitle}>
                        Por eso queremos presentarte a quienes están detrás de cada terreno,
                        cada llamada y cada decisión que te acompaña en tu camino de inversión.
                        Detrás de cada proyecto hay personas reales, con historias, compromiso y pasión por lo que hacen.
                    </p>
                </AnimatedSection>
            </section>

            {/* Directors Section */}
            <section className={styles.section}>
                <div className="container">
                    <AnimatedSection>
                        <h2 className={styles.sectionTitle}>Dirección</h2>
                    </AnimatedSection>

                    <div className={styles.directorsGrid}>
                        {DIRECTORS.map((director, i) => (
                            <AnimatedSection key={director.name} delay={i * 0.15}>
                                <div className={styles.memberCard}>
                                    <div className={styles.avatarWrapper}>
                                        <div className={styles.avatar}>
                                            <div className={styles.avatarPlaceholder}>
                                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                            </div>
                                            {/* Uncomment when images are ready
                                            <Image 
                                                src={director.image} 
                                                alt={director.name} 
                                                fill
                                                className={styles.avatarImage}
                                            />
                                            */}
                                        </div>
                                    </div>
                                    <h3 className={styles.name}>{director.name}</h3>
                                    <div className={styles.role}>{director.role}</div>
                                    <p className={styles.desc}>{director.desc}</p>
                                </div>
                            </AnimatedSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* Advisors Section */}
            <section className={styles.section}>
                <AnimatedSection className="container">
                    <h2 className={styles.sectionTitle}>Asesores Comerciales</h2>

                    <div className={styles.advisorsGrid}>
                        {ADVISORS.map((advisor, i) => (
                            <AnimatedSection key={advisor.name} delay={i * 0.15}>
                                <div className={styles.memberCard}>
                                    <div className={styles.avatarWrapper}>
                                        <div className={styles.avatar}>
                                            <div className={styles.avatarPlaceholder}>
                                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                            </div>
                                            {/* Uncomment when images are ready
                                            <Image 
                                                src={advisor.image} 
                                                alt={advisor.name} 
                                                fill
                                                className={styles.avatarImage}
                                            />
                                            */}
                                        </div>
                                    </div>
                                    <h3 className={styles.name}>{advisor.name}</h3>
                                    <div className={styles.role}>{advisor.role}</div>
                                    <p className={styles.desc}>{advisor.desc}</p>

                                    <div className={styles.btnWrapper}>
                                        <Link
                                            href={`https://wa.me/${advisor.whatsapp}?text=Hola%20${advisor.name.split(' ')[0]},%20me%20comunico%20desde%20aliminspa.cl%20👋`}
                                            className={`btn btn-whatsapp ${styles.contactBtn}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
                                                <path d="M20.52 3.48A11.93 11.93 0 0 0 12 0C5.37 0 0 5.37 0 12a11.9 11.9 0 0 0 1.64 6.07L0 24l6.11-1.6A11.94 11.94 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.2-1.25-6.21-3.48-8.52ZM12 22a9.94 9.94 0 0 1-5.07-1.38l-.36-.22-3.75.98 1-3.64-.24-.38A9.93 9.93 0 0 1 2 12C2 6.48 6.48 2 12 2c2.66 0 5.16 1.04 7.04 2.92A9.89 9.89 0 0 1 22 12c0 5.52-4.48 10-10 10Zm5.47-7.47c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.41-1.5-.89-.8-1.49-1.78-1.67-2.08-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51H6.9c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.62.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z" />
                                            </svg>
                                            Contáctame
                                        </Link>
                                    </div>
                                </div>
                            </AnimatedSection>
                        ))}
                    </div>
                </AnimatedSection>
            </section>

            <Newsletter />
            <Footer />
        </main>
    )
}
