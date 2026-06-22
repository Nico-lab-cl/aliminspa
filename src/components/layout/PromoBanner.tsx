'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './PromoBanner.module.css'
import { CONTEST, WINTER_PROMO } from '@/lib/constants'

type PromoType = typeof CONTEST | typeof WINTER_PROMO

export default function PromoBanner() {
    const [isVisible, setIsVisible] = useState(false)
    const [activePromo, setActivePromo] = useState<PromoType | null>(null)
    const pathname = usePathname()

    useEffect(() => {
        const checkVisibility = () => {
            const now = new Date()
            
            const isPromoActive = (endDateStr: string) => {
                const dateParts = endDateStr.split('-')
                if (dateParts.length !== 3) return false
                const end = new Date(
                    parseInt(dateParts[0]),
                    parseInt(dateParts[1]) - 1,
                    parseInt(dateParts[2]),
                    23,
                    59,
                    59,
                    999
                )
                return now <= end
            }

            if (isPromoActive(WINTER_PROMO.endDate)) {
                setActivePromo(WINTER_PROMO)
                setIsVisible(true)
            } else if (isPromoActive(CONTEST.endDate)) {
                setActivePromo(CONTEST)
                setIsVisible(true)
            } else {
                setIsVisible(false)
            }
        }

        checkVisibility()
    }, [])

    if (!isVisible || !activePromo || pathname === '/cyber') return null

    const isExternal = activePromo.link.startsWith('http') && !activePromo.link.includes('aliminspa.cl')
    const isWinterPromo = activePromo.tag.includes('Invierno')

    return (
        <Link 
            href={activePromo.link} 
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className={styles.bannerLink}
        >
            <div className={`${styles.banner} ${isWinterPromo ? styles.winterBanner : ''}`}>
                {/* Floating animated sparkles and icons for Winter Promo */}
                {isWinterPromo && (
                    <div className={styles.floatingContainer}>
                        <span className={`${styles.floatingIcon} ${styles.icon1}`}>❄️</span>
                        <span className={`${styles.floatingIcon} ${styles.icon2}`}>⛄</span>
                        <span className={`${styles.floatingIcon} ${styles.icon3}`}>🎁</span>
                        <span className={`${styles.floatingIcon} ${styles.icon4}`}>✨</span>
                    </div>
                )}
                
                <div className={styles.marqueeContainer}>
                    <div className={styles.marqueeTrack}>
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className={styles.marqueeGroup} aria-hidden={i > 1 ? "true" : undefined}>
                                <span className={`${styles.tag} ${isWinterPromo ? styles.winterTag : ''}`}>
                                    {activePromo.tag}
                                </span>
                                <span className={styles.message}>
                                    {activePromo.message}
                                </span>
                                <span className={`${styles.cta} ${isWinterPromo ? styles.winterCta : ''}`}>
                                    {activePromo.cta}
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="7" y1="17" x2="17" y2="7"></line>
                                        <polyline points="7 7 17 7 17 17"></polyline>
                                    </svg>
                                </span>
                                <span className={styles.bullet}>✦</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Link>
    )
}

