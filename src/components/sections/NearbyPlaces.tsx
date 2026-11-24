'use client'

import { useState } from 'react'
import Image from 'next/image'
import styles from './NearbyPlaces.module.css'

const PLACES = [
    {
        img: 'lugar-el-tabo',
        distance: '5 min',
        category: 'Playa',
        title: 'El Tabo',
        desc: 'Playa icónica del litoral con arena extensa y aguas del Pacífico',
        info: [
            'Playa extensa de arena y costanera para caminar',
            'Supermercados, comercio y restaurantes',
            'Consultorio, bancos y bencineras',
            'Centro del pueblo y feria',
        ],
    },
    {
        img: 'lugar-quebrada-cordova',
        distance: '8 min',
        category: 'Naturaleza',
        title: 'Quebrada de Córdova',
        desc: 'Paisaje natural único donde el río se une al océano Pacífico',
        info: [
            'Santuario de la naturaleza con senderos',
            'Bosque nativo y un estero que llega al mar',
            'Avistamiento de aves',
            'Ideal para caminatas y fotografía',
        ],
    },
    {
        img: 'lugar-isla-negra',
        distance: '12 min',
        category: 'Cultura · Patrimonio',
        title: 'Isla Negra',
        desc: 'La Casa Museo de Pablo Neruda, Monumento Histórico Nacional',
        info: [
            'Casa Museo Pablo Neruda, Monumento Histórico Nacional',
            'Feria de artesanía',
            'Playa de roca para caminar al atardecer',
            'Cafés y restaurantes',
        ],
    },
    {
        img: 'lugar-algarrobo',
        distance: '20 min',
        category: 'Turismo · Recreación',
        title: 'Algarrobo',
        desc: 'San Alfonso del Mar y su gran laguna cristalina · Playas exclusivas del Litoral',
        info: [
            'Playas y deportes náuticos',
            'San Alfonso del Mar y su gran laguna cristalina',
            'Islote Pájaros Niños, con pingüinos de Humboldt',
            'Restaurantes y vida de verano',
        ],
    },
]

export default function NearbyPlaces() {
    // Tarjeta girada (muestra la información del lugar). Solo una a la vez.
    const [abierta, setAbierta] = useState<string | null>(null)
    const girar = (img: string) => setAbierta((prev) => (prev === img ? null : img))

    return (
        <section className={styles.section}>
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
                    {PLACES.map((p) => {
                        const girada = abierta === p.img
                        return (
                            <div
                                key={p.img}
                                className={styles.card}
                                role="button"
                                tabIndex={0}
                                aria-pressed={girada}
                                aria-label={`${p.title}: ${girada ? 'volver a la foto' : 'ver qué encontrarás'}`}
                                onClick={() => girar(p.img)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault()
                                        girar(p.img)
                                    }
                                }}
                            >
                                <div className={`${styles.flip} ${girada ? styles.girada : ''}`}>
                                    {/* Cara frontal: la foto (sin cambios). */}
                                    <div className={styles.cara} aria-hidden={girada}>
                                        <Image
                                            src={`/assets/homepage-v2/${p.img}.webp`}
                                            alt={p.title}
                                            fill
                                            className={styles.cardImg}
                                        />
                                        <div className={styles.cardGradient} />
                                        <div className={styles.distanceBadge}>📍 {p.distance}</div>
                                        <div className={styles.verMas} aria-hidden="true">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                                        </div>
                                        <div className={styles.cardContent}>
                                            <div className={styles.cardCategory}>{p.category}</div>
                                            <div className={styles.cardTitle}>{p.title}</div>
                                            <div className={styles.cardDesc}>{p.desc}</div>
                                        </div>
                                    </div>

                                    {/* Reverso: qué encontrará el cliente en el lugar. */}
                                    <div className={`${styles.cara} ${styles.reverso}`} aria-hidden={!girada}>
                                        <div className={styles.reversoTop}>
                                            <span className={styles.reversoBadge}>📍 {p.distance}</span>
                                            <span className={styles.reversoCat}>{p.category}</span>
                                        </div>
                                        <div className={styles.reversoTitle}>{p.title}</div>
                                        <ul className={styles.reversoList}>
                                            {p.info.map((t) => (
                                                <li key={t}>{t}</li>
                                            ))}
                                        </ul>
                                        <div className={styles.reversoHint}>Toca para volver</div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
