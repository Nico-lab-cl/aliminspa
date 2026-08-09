'use client'

import Link from 'next/link'
import { SITE } from '@/lib/constants'
import styles from './Footer.module.css'
import { trackMetaEvent } from '@/lib/track'

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.inner}>
                <div className={styles.linksGrid}>
                    <div>
                        <div className={styles.colTitle}>Proyectos</div>
                        <div className={styles.linkList}>
                            <Link href="/#proyectos">Lomas del Mar — El Tabo</Link>
                            <Link href="/#proyectos">Arena y Sol — El Tabo</Link>
                            <Link href="/#proyectos">Libertad y Alegría — El Tabo</Link>
                            <Link href="/minipie">Lomas del Mar — Financiamiento directo</Link>
                        </div>
                    </div>
                    <div>
                        <div className={styles.colTitle}>Terrenos en El Tabo</div>
                        <div className={styles.linkList}>
                            <Link href="/#proyectos">Venta de terrenos en El Tabo</Link>
                            <Link href="/#beneficios">Terrenos con rol propio</Link>
                            <Link href="/#formulario">Financiamiento directo sin banco</Link>
                            <Link href="/#ubicacion">Terrenos Litoral Central</Link>
                        </div>
                    </div>
                    <div>
                        <div className={styles.colTitle}>Empresa</div>
                        <div className={styles.linkList}>
                            <Link href="/quienes-somos">Quiénes somos</Link>
                            <Link href="/asesores">Asesores</Link>
                            <Link href="/blog">Blog</Link>
                            <Link href="/politica-de-privacidad">Política de Privacidad</Link>
                            <Link href="/terminos-del-servicio">Términos del Servicio</Link>
                        </div>
                    </div>
                    <div>
                        <div className={styles.colTitle}>Contacto</div>
                        <div className={styles.linkList}>
                            <Link href="/#formulario">Cotizar terreno</Link>
                            <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                            <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
                            <span>{SITE.address}</span>
                        </div>
                    </div>
                </div>

                <div className={styles.top}>
                    <div className={styles.brand}>
                        <img
                            src="/assets/homepage-v2/logo-alimin-icon.webp"
                            alt="Alimin"
                            className={styles.logoImg}
                        />
                        <div>
                            <div className={styles.wordmark}>ALIMIN</div>
                            <div className={styles.tagline}>Inmobiliaria SpA</div>
                            <div className={styles.taglineSub}>Litoral Central, Chile</div>
                        </div>
                    </div>

                    <div className={styles.right}>
                        <a href={`mailto:${SITE.email}`} className={styles.emailLink}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#76d845" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                            {SITE.email}
                        </a>

                        <div className={styles.socials}>
                            <span className={styles.followLabel}>Síguenos:</span>
                            <a
                                href="https://www.instagram.com/inmobiliaria.alimin/"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Instagram"
                                className={styles.socialIcon}
                            >
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"></circle></svg>
                            </a>
                            <a
                                href="https://www.facebook.com/alimininmobiliaria/"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Facebook"
                                className={styles.socialIcon}
                            >
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                            </a>
                            <a
                                href="https://www.tiktok.com/@inmobiliaria.alimin"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="TikTok"
                                className={styles.socialIcon}
                            >
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.81a8.2 8.2 0 0 0 4.77 1.51V6.87a4.86 4.86 0 0 1-1-.18z"></path></svg>
                            </a>
                            <a
                                href={`https://wa.me/${SITE.whatsapp}?text=Hola%2C%20me%20comunico%20desde%20aliminspa.cl%20%F0%9F%91%8B`}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="WhatsApp"
                                className={`${styles.socialIcon} crm-track-click`}
                                data-crm-name="WhatsApp Social - Footer"
                                data-crm-category="Redes Sociales"
                                onClick={() => trackMetaEvent('Contact', {}, { method: 'WhatsApp', position: 'Footer Social' })}
                            >
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.675 1.438 5.662 1.439h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                            </a>
                        </div>
                    </div>
                </div>

                <div className={styles.bottom}>
                    <span>© {new Date().getFullYear()} Alimin SpA · aliminspa.cl · Todos los derechos reservados</span>
                </div>
            </div>
        </footer>
    )
}
