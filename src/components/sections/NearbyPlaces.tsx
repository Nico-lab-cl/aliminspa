import Image from 'next/image'
import styles from './NearbyPlaces.module.css'

const PLACES = [
    {
        img: 'lugar-el-tabo',
        distance: '5 min',
        category: 'Playa',
        title: 'El Tabo',
        desc: 'Playa icónica del litoral con arena extensa y aguas del Pacífico',
    },
    {
        img: 'lugar-quebrada-cordova',
        distance: '8 min',
        category: 'Naturaleza',
        title: 'Quebrada de Córdova',
        desc: 'Paisaje natural único donde el río se une al océano Pacífico',
    },
    {
        img: 'lugar-isla-negra',
        distance: '12 min',
        category: 'Cultura · Patrimonio',
        title: 'Isla Negra',
        desc: 'La casa de Pablo Neruda, Patrimonio Mundial de la UNESCO',
    },
    {
        img: 'lugar-algarrobo',
        distance: '20 min',
        category: 'Turismo · Recreación',
        title: 'Algarrobo',
        desc: 'La piscina más grande del mundo · Playas exclusivas del Litoral',
    },
]

export default function NearbyPlaces() {
    return (
        <section className={styles.section}>
            <div className={styles.bgImg} />
            <div className={styles.overlay} />
            <div className={styles.orb} />

            <div className={`container ${styles.inner}`}>
                <div className={styles.header}>
                    <div className={styles.kickerRow}>
                        <span className={styles.rule} />
                        <span className={styles.kicker}>Zona de alta plusvalía</span>
                        <span className={styles.rule} />
                    </div>
                    <h2 className={styles.title}>
                        Todo lo que te espera
                        <br />
                        a minutos de tu terreno
                    </h2>
                    <p className={styles.subtitle}>
                        Nuestros proyectos están rodeados de los destinos más icónicos del Litoral Central de Chile.
                    </p>
                </div>

                <div className={styles.grid}>
                    {PLACES.map((p) => (
                        <div key={p.img} className={styles.card}>
                            <Image
                                src={`/assets/homepage-v2/${p.img}.webp`}
                                alt={p.title}
                                fill
                                className={styles.cardImg}
                            />
                            <div className={styles.cardGradient} />
                            <div className={styles.distanceBadge}>📍 {p.distance}</div>
                            <div className={styles.cardContent}>
                                <div className={styles.cardCategory}>{p.category}</div>
                                <div className={styles.cardTitle}>{p.title}</div>
                                <div className={styles.cardDesc}>{p.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
