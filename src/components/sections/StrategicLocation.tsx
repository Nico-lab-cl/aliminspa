import LocationMap from './LocationMap'
import styles from './StrategicLocation.module.css'

export default function StrategicLocation() {
    return (
        <section className={styles.section} id="ubicacion">
            <div className={styles.bgWrapper}>
                <img
                    src="https://images.pexels.com/photos/34671903/pexels-photo-34671903.jpeg?auto=compress&cs=tinysrgb&w=2400"
                    alt="Costa del Litoral Central de Chile"
                    className={styles.bgImage}
                />
            </div>
            <div className={styles.overlay} />

            <div className={styles.inner}>
                <div className={styles.header}>
                    <div className={styles.kickerRow}>
                        <span className={styles.rule} />
                        <span className={styles.kicker}>Ubicación Estratégica</span>
                        <span className={styles.rule} />
                    </div>
                    <h2 className={styles.title}>Terrenos en el Litoral Central de Chile</h2>
                    <p className={styles.tagline}>A solo 8 minutos de la playa</p>
                    <p className={styles.desc}>
                        Nuestros proyectos se ubican en El Tabo, a 8 minutos de la playa en auto, supermercados,
                        centros comerciales, terminal de buses y la ruta que conecta con Santiago.
                    </p>
                </div>

                <LocationMap />
            </div>
        </section>
    )
}
