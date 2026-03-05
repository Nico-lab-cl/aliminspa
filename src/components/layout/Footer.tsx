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
                        />
                        <p className={styles.desc}>
                            Proyectos inmobiliarios y venta de terrenos en El Tabo, Litoral Central.
                            Tu inversión segura en la costa de Chile.
                        </p>
                        <div className={styles.socials}>
                            <a href="https://www.instagram.com/inmobiliaria.alimin/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                            </a>
                            <a href="https://wa.me/56956654833?text=Hola%2C%20me%20comunico%20desde%20aliminspa.cl%20%F0%9F%91%8B" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.898-4.45 9.898-9.898 0-5.448-4.45-9.898-9.898-9.898-5.449 0-9.898 4.45-9.898 9.898 0 2.015.545 3.848 1.59 5.5l-.83 3.033 3.146-.827zM17.51 14.86c-.219-.11-.19-.188-.415-.306-.217-.11-1.284-.635-1.483-.708-.2-.072-.345-.11-.49.11-.144.218-.56.707-.686.852-.126.145-.25.163-.468.053-.217-.11-.916-.339-1.745-1.079-.646-.576-1.082-1.288-1.21-1.506-.126-.219-.014-.337.095-.446.098-.098.217-.253.326-.38.109-.126.145-.218.219-.363.071-.145.035-.274-.019-.383-.054-.11-.49-1.18-.671-1.616-.176-.425-.355-.367-.49-.374-.127-.006-.273-.008-.418-.008s-.383.054-.582.273c-.199.218-.763.746-.763 1.82 0 1.073.782 2.11 8.89 2.256.11.146.772 1.182 1.874 1.666.97.426 1.725.367 2.37.227.72-.156 2.219-.906 2.531-1.78.311-.874.311-1.624.218-1.78-.093-.157-.348-.25-.567-.36z" /></svg>
                            </a>
                            <a href="https://www.tiktok.com/@inmobiliaria.alimin" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>
                            </a>
                            <a href="https://www.facebook.com/alimininmobiliaria/" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-3 7h-1.924c-.615 0-1.076.252-1.076.889v1.111h3l-.239 3h-2.761v8h-3v-8h-2v-3h2v-1.923c0-2.022 1.064-3.077 3.461-3.077h2.539v3z" /></svg>
                            </a>
                            <a href="https://www.youtube.com/@alimininmobiliaria" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.015 3.015 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.501 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.377.55 9.377.55s7.505 0 9.377-.55a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                            </a>
                        </div>
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
