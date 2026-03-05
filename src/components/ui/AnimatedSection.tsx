'use client'

import { useEffect, useRef, ReactNode } from 'react'

interface AnimatedSectionProps {
    children: ReactNode
    className?: string
    delay?: number
}

export default function AnimatedSection({ children, className = '', delay = 0 }: AnimatedSectionProps) {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const el = ref.current
        if (!el) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        el.classList.add('is-visible')
                    }, delay)
                    observer.unobserve(el)
                }
            },
            { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
        )

        observer.observe(el)
        return () => observer.disconnect()
    }, [delay])

    return (
        <div ref={ref} className={`animate-on-scroll ${className}`}>
            {children}
        </div>
    )
}
