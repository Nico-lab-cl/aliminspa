'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import styles from './Navbar.module.css'
import { SITE } from '@/lib/constants'
import PromoBanner from './PromoBanner'

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
        { href: '/proyectos', label: 'Proyectos' },
        { href: '/#beneficios', label: 'Beneficios' },
        { href: '/#ubicacion', label: 'Ubicación' },
        { href: '/quienes-somos', label: 'Quiénes Somos' },
        { href: '/reunion', label: 'Agenda tu Visita' },
    ]

    return (
        <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
            <PromoBanner />
            <nav className={styles.nav} aria-label="Navegación principal">
                <Link href="/" className={styles.logo} aria-label={`${SITE.shortName} - Inicio`}>
                    <Image
                        src="/images/home_redesign/logo.png.webp"
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
                        href="/reunion"
                        className={styles.agendaButton}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        Agendar
                    </Link>
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
