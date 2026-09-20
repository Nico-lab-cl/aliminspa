/*
 * La puerta de entrada a la agenda: el visitante elige a cuál de los dos
 * proyectos quiere ir y entra directo a su mapa.
 *
 * No hay tercera salida ni portada previa. Quien llega por un anuncio entra
 * derecho al mapa del proyecto; esta pantalla es para quien llega por el menú,
 * por buscador o porque le pasaron el link y todavía no sabe cuál le conviene.
 * Por eso cada tarjeta muestra lo que distingue a un proyecto del otro —
 * tamaño de lote, pie y disponibilidad— y no las cuatro prestaciones que los
 * dos comparten.
 */

import Link from 'next/link'
import Image from 'next/image'
import styles from './ElegirProyecto.module.css'

export interface ProyectoTarjeta {
    id: string
    nombre: string
    href: string
    imagen: string
    distancia: string
    linea: string
    superficie: string
    pie: string
    /** Lo que se lee en la píldora de la derecha. Sale del plano cuando hay número. */
    disponibilidad: string | null
    cta: string
    crmName: string
}

export default function ElegirProyecto({ proyectos }: { proyectos: ProyectoTarjeta[] }) {
    return (
        <section className={styles.wrap}>
            <span className={styles.glowUno} aria-hidden="true" />
            <span className={styles.glowDos} aria-hidden="true" />

            <div className={styles.inner}>
                <header className={styles.header}>
                    <div className={styles.kickerRow}>
                        <span className={styles.rule} aria-hidden="true" />
                        <span className={styles.kicker}>Agenda tu visita</span>
                    </div>
                    <h1 className={styles.title}>Elige el proyecto que quieres conocer</h1>
                    <p className={styles.subtitle}>
                        Te esperamos en El Tabo. Un asesor te recorre el loteo, te muestra los
                        lotes disponibles y responde todo en terreno.
                    </p>
                </header>

                <div className={styles.grid}>
                    {proyectos.map((p) => (
                        <Link
                            key={p.id}
                            href={p.href}
                            className={`${styles.card} crm-track-click`}
                            data-crm-name={p.crmName}
                            data-crm-category="Agendamiento"
                        >
                            <div className={styles.media}>
                                <Image
                                    src={p.imagen}
                                    alt={`Vista aérea de ${p.nombre}, El Tabo`}
                                    fill
                                    sizes="(max-width: 900px) 100vw, 520px"
                                    className={styles.foto}
                                />
                                <span className={styles.scrim} aria-hidden="true" />
                                <span className={styles.distancia}>{p.distancia}</span>
                                <div className={styles.rotulo}>
                                    <h2 className={styles.nombre}>{p.nombre}</h2>
                                    <p className={styles.linea}>{p.linea}</p>
                                </div>
                            </div>

                            <div className={styles.body}>
                                <div className={styles.chips}>
                                    <span className={styles.chip}>{p.superficie}</span>
                                    <span className={styles.chip}>Pie {p.pie}</span>
                                    {p.disponibilidad && (
                                        <span className={styles.chipNeutro}>{p.disponibilidad}</span>
                                    )}
                                </div>
                                <span className={styles.cta}>{p.cta}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    )
}
