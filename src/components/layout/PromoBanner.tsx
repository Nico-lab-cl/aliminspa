'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import styles from './PromoBanner.module.css'
import { CONTEST } from '@/lib/constants'

export default function PromoBanner() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const checkVisibility = () => {
            const now = new Date()
            const end = new Date(CONTEST.endDate)
            // Set end time to 23:59:59 of that day
            end.setHours(23, 59, 59, 999)
            
            if (now <= end) {
                setIsVisible(true)
            }
        }

        checkVisibility()
    }, [])

    if (!isVisible) return null

    return (
        <div className={styles.banner}>
            <div className={styles.container}>
                <span className={styles.tag}>Sorteo Día del Trabajador 🎁</span>
                <p className={styles.message}>{CONTEST.message}</p>
                <Link 
                    href={CONTEST.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.cta}
                >
                    {CONTEST.cta}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="7" y1="17" x2="17" y2="7"></line>
                        <polyline points="7 7 17 7 17 17"></polyline>
                    </svg>
                </Link>
            </div>
        </div>
    )
}
