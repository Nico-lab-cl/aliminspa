'use client'

import React from 'react'
import styles from './VideoSection.module.css'

export default function VideoSection() {
    return (
        <section className={styles.section}>
            <div className="container">
                <h2 className={styles.title}>
                    Explora cada rincón de Lomas del Mar desde una<br/>
                    perspectiva única.
                    <span className={styles.goldText}>Conoce el entorno y las vistas reales.</span>
                </h2>
                
                <div className={styles.videoContainer}>
                    <div className={styles.videoCard}>
                        <div className={styles.videoWrapper}>
                            <video 
                                controls 
                                preload="none"
                            >
                                <source src="/videos/lomas-del-mar/Lomas web.mp4" type="video/mp4" />
                                Tu navegador no soporta la etiqueta de video.
                            </video>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
