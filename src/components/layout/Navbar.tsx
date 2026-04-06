'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import styles from './Navbar.module.css'
import { SITE } from '@/lib/constants'

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMobileOpen, setIsMobileOpen] = useState(false)

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 40)
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

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
        { href: '/#proyectos', label: 'Proyectos' },
        { href: '/#beneficios', label: 'Beneficios' },
        { href: '/#ubicacion', label: 'Ubicación' },
        { href: '/quienes-somos', label: 'Quiénes Somos' },
    ]

    return (
        <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
            <nav className={styles.nav} aria-label="Navegación principal">
                <Link href="/" className={styles.logo} aria-label={`${SITE.shortName} - Inicio`}>
                    <Image
                        src="/images/home_redesign/logo.webp.webp"
                        alt={`${SITE.shortName} Inmobiliaria`}
                        width={200}
                        height={50}
                        style={{ objectFit: 'contain' }}
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
                </ul>

                <div className={styles.actions}>
                    <Link
                        href="/contacto"
                        className={styles.ctaButton}
                    >
                        Contacto
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
