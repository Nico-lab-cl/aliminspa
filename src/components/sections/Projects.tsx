import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import styles from './Projects.module.css'

const NEW_PROJECTS = [
    {
        id: 'lomas',
        title: 'Lomas del Mar',
        image: '/images/home_redesign/29.webp',
        tagline: 'Tu refugio cerca al mar',
        desc: 'Una inversión inteligente. Terrenos urbanizados en El Tabo, diseñados para quienes buscan calidad de vida y alta plusvalía.',
        alert: '¡Solo el 25% disponible!',
        href: 'https://aliminlomasdelmar.com?utm_source=aliminspa.cl&utm_medium=boton_reservas&utm_campaign=home_projects',
        target: '_blank'
    },
    {
        id: 'arena',
        title: 'Arena y Sol',
        image: '/images/home_redesign/30.webp',
        tagline: '¡Tu propio lugar en El Tabo!',
        subdesc: 'Terrenos urbanizados de 200 m2',
        desc: 'Quedan muy pocos cupos para asegurar tu espacio en este exitoso proyecto a solo 10 minutos de la costa.',
        alert: '',
        href: '#contacto',
        target: '_self'
    },
    {
        id: 'libertad',
        title: 'Libertad y Alegría',
        image: '/images/home_redesign/31.webp',
        tagline: '¡Tu propio lugar en El Tabo!',
        subdesc: 'Terrenos urbanizados de 400 m2',
        desc: 'Quedan muy pocos cupos para asegurar tu espacio en este exitoso proyecto a solo 10 minutos de la costa.',
        alert: '',
        href: '#contacto',
        target: '_self'
    }
]

export default function Projects() {
    return (
        <section className={styles.section} id="proyectos">
            <div className={styles.fluidContainer}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Nuestros Proyectos</h2>
                </div>

                <div className={styles.grid}>
                    {NEW_PROJECTS.map((proj) => (
                        <div key={proj.id} className={styles.card}>
                            <h3 className={styles.cardTitle}>{proj.title}</h3>
                            
                            <div className={styles.imageWrapper}>
                                <Image
                                    src={proj.image}
                                    alt={proj.title}
                                    width={400}
                                    height={500}
                                    className={styles.graphicImg}
                                />
                            </div>

                            <div className={styles.infoWrapper}>
                                <h4 className={styles.tagline}>{proj.tagline}</h4>
                                {proj.subdesc && <p className={styles.subdesc}>{proj.subdesc}</p>}
                                <p className={styles.desc}>{proj.desc}</p>
                                {proj.alert && <p className={styles.alert}>{proj.alert}</p>}
                            </div>

                            <div className={styles.actionWrapper}>
                                <Link 
                                    href={proj.href} 
                                    className={styles.pillButton}
                                    target={proj.target}
                                    rel={proj.target === '_blank' ? "noopener noreferrer" : undefined}
                                >
                                    Terrenos Disponibles
                                </Link>
                                <span className={styles.arrows}>&raquo;</span>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className={styles.footerSection}>
                    <div className={styles.divider} />
                    <div className={styles.leafIcon}>
                        <Image 
                            src="/images/home_redesign/logo.png.webp" 
                            alt="Alimin Logo" 
                            width={160} 
                            height={90}
                            style={{ objectFit: 'contain' }}
                        />
                    </div>
                    <div className={styles.divider} />
                </div>
            </div>
        </section>
    )
}
