import QuoteForm from './QuoteForm'
import styles from './HomeContactForm.module.css'

export default function HomeContactForm() {
    return (
        <section className={styles.section} id="formulario">
            <div className={styles.bgWrapper}>
                <img
                    src="https://images.pexels.com/photos/34671904/pexels-photo-34671904.jpeg?auto=compress&cs=tinysrgb&w=2400"
                    alt="Costa del Litoral Central de Chile"
                    className={styles.bgImage}
                />
            </div>
            <div className={styles.overlay} />

            <div className={styles.grid}>
                <div className={styles.info}>
                    <h2 className={styles.title}>Cotizar Terreno en El Tabo</h2>
                    <p className={styles.desc}>
                        Completa el formulario y un asesor te contactará con las mejores opciones de terrenos
                        disponibles en nuestros proyectos del Litoral Central.
                    </p>
                    <div className={styles.trustList}>
                        <div className={styles.trustItem}>
                            <span className={styles.checkIcon}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#76d845" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </span>
                            <span>Respuesta en menos de 24 horas</span>
                        </div>
                        <div className={styles.trustItem}>
                            <span className={styles.checkIcon}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#76d845" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </span>
                            <span>Asesoría personalizada</span>
                        </div>
                        <div className={styles.trustItem}>
                            <span className={styles.checkIcon}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#76d845" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </span>
                            <span>Visitas guiadas sin costo</span>
                        </div>
                    </div>
                </div>

                <QuoteForm
                    source="formulario-home"
                    redirectTo="/gracias"
                    submitLabel="Solicitar Información"
                    formId="form-contacto-home"
                />
            </div>
        </section>
    )
}
