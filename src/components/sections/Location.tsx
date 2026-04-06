import AnimatedSection from '@/components/ui/AnimatedSection'
import styles from './Location.module.css'

export default function Location() {
    return (
        <section className={`section ${styles.section}`} id="ubicacion">
            <div className="container">
                <div className="section-header">
                    <AnimatedSection>
                        <span className="section-label">Ubicación Estratégica</span>
                        <h2 className="section-title">
                            Terrenos en el Litoral Central de Chile
                        </h2>
                        <p className="section-subtitle">
                            Nuestros proyectos se ubican en El Tabo, a solo 8 minutos de la
                            playa, centros comerciales y la ruta que conecta con Santiago.
                        </p>
                    </AnimatedSection>
                </div>

                <AnimatedSection>
                    <div className={styles.content}>
                        <div className={styles.mapWrapper}>
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d26628.07!2d-71.65!3d-33.45!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9662171e8e123ad3%3A0x702f4d3bf9ad5a0!2sEl%20Tabo!5e0!3m2!1ses!2scl!4v1709600000000"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Ubicación de proyectos Alimin en El Tabo, Litoral Central"
                            />
                        </div>

                        <div className={styles.info}>
                            <div className={styles.distances}>
                                <div className={styles.distItem}>
                                    <span className={styles.distIcon}>🏖️</span>
                                    <div>
                                        <span className={styles.distValue}>7–10 min</span>
                                        <span className={styles.distLabel}>de la playa</span>
                                    </div>
                                </div>
                                <div className={styles.distItem}>
                                    <span className={styles.distIcon}>🏪</span>
                                    <div>
                                        <span className={styles.distValue}>5 min</span>
                                        <span className={styles.distLabel}>del centro de El Tabo</span>
                                    </div>
                                </div>
                                <div className={styles.distItem}>
                                    <span className={styles.distIcon}>🚗</span>
                                    <div>
                                        <span className={styles.distValue}>3 min</span>
                                        <span className={styles.distLabel}>de la carretera principal</span>
                                    </div>
                                </div>
                                <div className={styles.distItem}>
                                    <span className={styles.distIcon}>🏙️</span>
                                    <div>
                                        <span className={styles.distValue}>~1.5 hrs</span>
                                        <span className={styles.distLabel}>desde Santiago</span>
                                    </div>
                                </div>
                            </div>

                            <p className={styles.note}>
                                <strong>Conectividad perfecta:</strong> A minutos de San Antonio,
                                Algarrobo y Cartagena. La ruta costera conecta directamente con Santiago
                                a través de la Ruta 78.
                            </p>
                        </div>
                    </div>
                </AnimatedSection>
            </div>
        </section>
    )
}
