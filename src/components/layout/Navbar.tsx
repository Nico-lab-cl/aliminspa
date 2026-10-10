'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import styles from './Navbar.module.css'
import { SITE } from '@/lib/constants'
import PromoBanner from './PromoBanner'

export default function Navbar() {
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    // Las landings de Google Ads (/google/*) llevan solo logo y "Cotizar", que
    // baja al formulario de la misma página. En Clarity el 15% de los toques en
    // la landing de terrenos baratos era abrir el menú e irse a otra página.
    const enLandingAds = usePathname()?.startsWith('/google/') ?? false

    useEffect(() => {
        if (isMobileOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => { document.body.style.overflow = '' }
    }, [isMobileOpen])

    const navLinks = [
        { href: '/', label: 'Inicio' },
        { href: '/proyectos', label: 'Proyectos' },
        { href: '/quienes-somos', label: 'Quiénes somos' },
        { href: '/asesores', label: 'Asesores' },
        { href: '/blog', label: 'Blog' },
        { href: '/#formulario', label: 'Contacto' },
    ]

    if (enLandingAds) {
        return (
            <header className={styles.header}>
                <nav className={styles.nav} aria-label="Navegación principal">
                    <a href="#inicio" className={styles.logo} aria-label={SITE.shortName}>
                        <Image
                            src="/assets/homepage-v2/logo-alimin-menu.webp"
                            alt="Alimin"
                            width={128}
                            height={34}
                            className={styles.logoImg}
                            priority
                        />
                    </a>
                    <div className={styles.actions}>
                        <a
                            href="#cotizar"
                            className={`${styles.ctaButton} ${styles.ctaLanding} crm-track-click`}
                            data-crm-name="Cotizar - Menu Landing Google"
                            data-crm-category="Navegacion"
                        >
                            Cotizar →
                        </a>
                    </div>
                </nav>
            </header>
        )
    }

    return (
        <header className={styles.header}>
            <PromoBanner />
            <nav className={styles.nav} aria-label="Navegación principal">
                <Link href="/" className={styles.logo} aria-label={`${SITE.shortName} - Inicio`}>
                    <Image
                        src="/assets/homepage-v2/logo-alimin-menu.webp"
                        alt="Alimin"
                        width={128}
                        height={34}
                        className={styles.logoImg}
                        priority
                    />
                </Link>

                <ul className={`${styles.links} ${isMobileOpen ? styles.open : ''}`}>
                    {navLinks.map((link) => (
                        <li key={link.href}>
                            <Link
                                href={link.href}
                                className={styles.link}
                                onClick={() => setIsMobileOpen(false)}
                            >
                                {link.label}
                            </Link>
                        </li>
                    ))}
                    <li className={styles.mobileCta}>
                        <Link
                            href="/reunion"
                            className={`${styles.ctaButtonOutline} crm-track-click`}
                            data-crm-name="Agendar - Menu Superior"
                            data-crm-category="Navegacion"
                            onClick={() => setIsMobileOpen(false)}
                        >
                            Agendar
                        </Link>
                        <Link
                            href="/#formulario"
                            className={`${styles.ctaButton} crm-track-click`}
                            data-crm-name="Cotizar - Menu Superior"
                            data-crm-category="Navegacion"
                            onClick={() => setIsMobileOpen(false)}
                        >
                            Cotizar →
                        </Link>
                    </li>
                </ul>

                <div className={styles.actions}>
                    <Link
                        href="/reunion"
                        className={`${styles.ctaButtonOutline} crm-track-click`}
                        data-crm-name="Agendar - Menu Superior"
                        data-crm-category="Navegacion"
                    >
                        Agendar
                    </Link>
                    <Link
                        href="/#formulario"
                        className={`${styles.ctaButton} crm-track-click`}
                        data-crm-name="Cotizar - Menu Superior"
                        data-crm-category="Navegacion"
                    >
                        Cotizar →
                    </Link>

                    <button
                        className={`${styles.hamburger} ${isMobileOpen ? styles.active : ''}`}
                        onClick={() => setIsMobileOpen(!isMobileOpen)}
                        aria-label={isMobileOpen ? 'Cerrar menú' : 'Abrir menú'}
                    >
                        <span />
                        <span />
                        <span />
                    </button>
                </div>
            </nav>

            {isMobileOpen && <div className={styles.overlay} onClick={() => setIsMobileOpen(false)} />}
        </header>
    )
}
