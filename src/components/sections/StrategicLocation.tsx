import React from 'react'
import Image from 'next/image'
import styles from './StrategicLocation.module.css'

export default function StrategicLocation() {
    return (
        <section className={styles.section} id="ubicacion">
            <div className={styles.fluidContainer}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Ubicación Estratégica</h2>
                </div>

                <div className={styles.content}>
                    <div className={styles.mapColumn}>
                        <div className={styles.mapTitleWrapper}>
                            <h3 className={styles.mapTitle}>Terrenos en el Litoral Central de Chile</h3>
                            <svg className={styles.palmIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="7" r="3" />
                                <path d="M12 10v10" />
                                <path d="M12 15c-3 0-5-2-5-5" />
                                <path d="M12 15c3 0 5-2 5-5" />
                                <path d="M7 21h10" />
                                <path d="M18 10a4 4 0 0 0-4-4" />
                            </svg>
                        </div>
                        <div className={styles.mapDecorativeWrapper}>
                            <div className={styles.imageWrapper}>
                                <Image 
                                    src="/images/home_redesign/dise_o_sin_t_tulo.webp.webp" 
                                    alt="Mapa de Ubicación El Tabo" 
                                    width={700}
                                    height={500}
                                    style={{ width: '100%', height: 'auto', display: 'block', position: 'relative', zIndex: 2 }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.infoColumn}>
                        <div className={styles.infoBox}>
                            <h3 className={styles.infoTitle}>
                                A solo <span className={styles.highlight}>8 minutos</span> de la playa
                            </h3>
                            <p className={styles.infoDesc}>
                                Nuestros proyectos se ubican en <span className={styles.highlight}>El Tabo</span>, con acceso directo a playas, centros comerciales y la ruta que conecta con Santiago.
                            </p>
                        </div>
                        <div className={styles.projectsGraphicWrapper}>
                            <Image 
                                src="/images/home_redesign/ico_proyectos.webp.webp" 
                                alt="Nuestros Proyectos" 
                                width={500}
                                height={400}
                                style={{ width: '100%', height: 'auto', display: 'block' }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
