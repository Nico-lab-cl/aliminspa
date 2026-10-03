'use client'

import type { CSSProperties, ReactNode } from 'react'
import { abrirPreferenciasCookies } from './CookieBanner'

/** Reabre el banner de cookies, para cambiar o retirar el consentimiento. */
export default function PreferenciasCookiesBoton({
    children = 'Preferencias de cookies',
    className,
    style,
}: {
    children?: ReactNode
    className?: string
    style?: CSSProperties
}) {
    return (
        <button
            type="button"
            onClick={abrirPreferenciasCookies}
            className={className}
            style={{ background: 'none', border: 0, padding: 0, font: 'inherit', color: 'inherit', cursor: 'pointer', ...style }}
        >
            {children}
        </button>
    )
}
