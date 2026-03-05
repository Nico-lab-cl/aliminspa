import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE } from '@/lib/constants'
import styles from './page.module.css'

export const metadata: Metadata = {
    title: 'En Construcción',
    description: `${SITE.name} está en construcción. Próximamente encontrarás terrenos en venta en El Tabo, Litoral Central. Contáctanos por WhatsApp.`,
    robots: { index: false, follow: false },
}

export default function EnConstruccion() {
    return (
        <div className={styles.wrapper}>
            <div className={styles.orb1} />
            <div className={styles.orb2} />

            <div className={styles.content}>
                <div className={styles.badge}>
                    <span className={styles.badgeDot} />
                    Página en Construcción
                </div>

                <div className={styles.brand}>Alimin</div>

                <h1 className={styles.title}>¡Muy pronto en línea!</h1>
                <p className={styles.subtitle}>
                    Estamos trabajando para traerte algo increíble.<br />
                    Mientras tanto, <strong>¡contáctanos!</strong>
                </p>

                <div className={styles.card}>
                    <p>
                        ¿Quieres comunicarte con nosotros?<br />
                        Escríbenos directamente por <strong>WhatsApp</strong> y te responderemos a la brevedad.
                    </p>

                    <Link
                        href={`https://wa.me/${SITE.whatsapp}?text=Hola,%20me%20comunico%20desde%20aliminspa.cl%20👋`}
                        className={styles.waBtn}
                        target="_blank"
                        rel="noopener noreferrer"
                        id="whatsapp-btn-construction"
                    >
                        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true">
                            <path d="M20.52 3.48A11.93 11.93 0 0 0 12 0C5.37 0 0 5.37 0 12a11.9 11.9 0 0 0 1.64 6.07L0 24l6.11-1.6A11.94 11.94 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.2-1.25-6.21-3.48-8.52ZM12 22a9.94 9.94 0 0 1-5.07-1.38l-.36-.22-3.75.98 1-3.64-.24-.38A9.93 9.93 0 0 1 2 12C2 6.48 6.48 2 12 2c2.66 0 5.16 1.04 7.04 2.92A9.89 9.89 0 0 1 22 12c0 5.52-4.48 10-10 10Zm5.47-7.47c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.41-1.5-.89-.8-1.49-1.78-1.67-2.08-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51H6.9c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.62.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z" />
                        </svg>
                        Chatear por WhatsApp
                    </Link>
                </div>
            </div>

            <footer className={styles.footer}>
                &copy; {new Date().getFullYear()} {SITE.name} · {SITE.domain}
            </footer>
        </div>
    )
}
