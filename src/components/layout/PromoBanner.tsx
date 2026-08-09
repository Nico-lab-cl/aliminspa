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
    const marqueeCta = activePromo.cta

    const group = (key: string | number) => (
        <span className={styles.group} key={key} aria-hidden={key !== 0 ? true : undefined}>
            <span className={styles.pulseWrapper}>
                <span className={styles.pulseDot} />
            </span>
            {activePromo.segments.map((segment, i) => (
                <span key={i} className={styles.segmentGroup}>
                    <span className={styles.segment}>{segment}</span>
                    <span className={styles.bullet}>✦</span>
                </span>
            ))}
            <span className={styles.cta}>
                {marqueeCta} <span>→</span>
            </span>
        </span>
    )

    return (
        <Link
            href={activePromo.link}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
            className={styles.bannerLink}
        >
            <div className={styles.flag}>
                <span className={styles.flagText}>{activePromo.badge}</span>
            </div>
            <div className={styles.marqueeViewport}>
                <div className={styles.marqueeTrack}>
                    {group(0)}
                    {group(1)}
                </div>
            </div>
        </Link>
    )
}
