import Link from 'next/link'
import Image from 'next/image'
import { SITE, PROJECTS } from '@/lib/constants'
import styles from './Footer.module.css'

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.glow} />
            <div className="container">
                <div className={styles.grid}>
                    {/* Brand */}
                    <div className={styles.brand}>
                        <Image
                            src="/images/logo-alimin-color.png"
                            alt={`${SITE.shortName} - Inmobiliaria en El Tabo`}
                            width={130}
                            height={42}
                        />
                        <p className={styles.desc}>
                            Proyectos inmobiliarios y venta de terrenos en El Tabo, Litoral Central.
                            Tu inversión segura en la costa de Chile.
                        </p>
                    </div>

                    {/* Proyectos */}
                    <div className={styles.col}>
                        <h4 className={styles.colTitle}>Proyectos</h4>
                        <ul className={styles.list}>
                            {PROJECTS.map((p) => (
                                <li key={p.id}>
                                    <Link href={`/proyectos/${p.slug}`}>{p.name}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Enlaces */}
                    <div className={styles.col}>
                        <h4 className={styles.colTitle}>Enlaces</h4>
                        <ul className={styles.list}>
                            <li><Link href="/">Inicio</Link></li>
                            <li><Link href="/#beneficios">Beneficios</Link></li>
                            <li><Link href="/#ubicacion">Ubicación</Link></li>
                            <li><Link href="/contacto">Contacto</Link></li>
                        </ul>
                    </div>

                    {/* Contacto */}
                    <div className={styles.col}>
                        <h4 className={styles.colTitle}>Contáctanos</h4>
                        <ul className={styles.list}>
                            <li>
                                <a
                                    href={`https://wa.me/${SITE.whatsapp}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    📱 WhatsApp
                                </a>
                            </li>
                            <li>
                                <a href={`mailto:${SITE.email}`}>
                                    ✉️ {SITE.email}
                                </a>
                            </li>
                            <li>📍 {SITE.address}</li>
                        </ul>
                    </div>
                </div>

                <div className={styles.bottom}>
                    <p>&copy; {new Date().getFullYear()} {SITE.name}. Todos los derechos reservados.</p>
                    <p className={styles.powered}>
                        Inmobiliaria en El Tabo, Litoral Central — Región de Valparaíso, Chile
                    </p>
                </div>
            </div>
        </footer>
    )
}
