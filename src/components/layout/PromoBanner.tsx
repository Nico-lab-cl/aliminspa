'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './PromoBanner.module.css'
import { CONTEST } from '@/lib/constants'

export default function PromoBanner() {
    const [isVisible, setIsVisible] = useState(false)
    const pathname = usePathname()

    useEffect(() => {
        const checkVisibility = () => {
            const now = new Date()
            const dateParts = CONTEST.endDate.split('-')
            if (dateParts.length === 3) {
                const end = new Date(
                    parseInt(dateParts[0]),
                    parseInt(dateParts[1]) - 1,
                    parseInt(dateParts[2]),
                    23,
                    59,
                    59,
                    999
                )
                
                if (now <= end) {
                    setIsVisible(true)
                } else {
                    setIsVisible(false)
                }
            }
        }

        checkVisibility()
    }, [])

    if (!isVisible || pathname === '/cyber') return null

    const isExternal = CONTEST.link.startsWith('http') && !CONTEST.link.includes('aliminspa.cl')

    return (
        <Link 
            href={CONTEST.link} 
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className={styles.bannerLink}
        >
            <div className={styles.banner}>
                <div className={styles.marqueeContainer}>
                    <div className={styles.marqueeTrack}>
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className={styles.marqueeGroup} aria-hidden={i > 1 ? "true" : undefined}>
                                <span className={styles.tag}>{CONTEST.tag}</span>
                                <span className={styles.message}>{CONTEST.message}</span>
                                <span className={styles.cta}>
                                    {CONTEST.cta}
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
