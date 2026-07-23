import styles from './Benefits.module.css'

const BENEFITS_V2 = [
    {
        label: 'Rol propio',
        desc: 'Cada lote inscrito a tu nombre, sin copropiedad',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--verde-lima)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
        ),
    },
    {
        label: 'Proyectos legales',
        desc: 'Terrenos urbanizados y con todos los permisos',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--verde-lima)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4.5 8-11.8A8 8 0 0 0 4 10.2C4 17.5 12 22 12 22z"></path>
                <circle cx="12" cy="10" r="3"></circle>
            </svg>
        ),
    },
    {
        label: 'Agua certificada',
        desc: 'Incluye empalme de agua certificado por la Seremi de Salud',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--verde-lima)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2.69s-5 6.14-5 10.13a5 5 0 0 0 10 0c0-3.99-5-10.13-5-10.13z"></path>
            </svg>
        ),
    },
    {
        label: 'Luz eléctrica',
        desc: 'Incluye empalme de luz, conexión disponible en todos los proyectos',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--verde-lima)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
        ),
    },
    {
        label: 'Recinto cerrado',
        desc: 'Portón automático y control de acceso',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--verde-lima)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="10" rx="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
            </svg>
        ),
    },
    {
        label: 'Calles compactadas',
        desc: 'Vías con maicillo y veredas con soleras',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--verde-lima)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12h18M3 6h18M3 18h18"></path>
            </svg>
        ),
    },
    {
        label: 'Luminarias solares',
        desc: 'Iluminación autónoma en todo el recinto',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--verde-lima)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            </svg>
        ),
    },
    {
        label: 'Estacionamiento',
        desc: 'Espacio reservado para visitas',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--verde-lima)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 17h2l-2-9H5L3 17h2m14 0H5m14 0v3H5v-3"></path>
                <circle cx="7.5" cy="17.5" r="1.5"></circle>
                <circle cx="16.5" cy="17.5" r="1.5"></circle>
            </svg>
        ),
    },
] as const

export default function Benefits() {
    return (
        <section className={styles.section} id="beneficios">
            <div className={styles.bgWrapper}>
                <img
                    src="https://images.pexels.com/photos/1546168/pexels-photo-1546168.jpeg?auto=compress&cs=tinysrgb&w=2400"
                    alt="Vista aérea de urbanización residencial"
                    className={styles.bgImage}
                />
            </div>
            <div className={styles.overlay} />

            <div className={styles.inner}>
                <div className={styles.header}>
                    <div className={styles.kickerRow}>
                        <span className={styles.ruleLeft} />
                        <span className={styles.kicker}>Estándar de urbanización</span>
                        <span className={styles.ruleRight} />
                    </div>
                    <h2 className={styles.title}>Todo lo que necesitas para dar el paso con confianza</h2>
                </div>

                <div className={styles.grid}>
                    {BENEFITS_V2.map((benefit) => (
                        <div key={benefit.label} className={styles.card}>
                            <div className={styles.iconWrapper}>{benefit.icon}</div>
                            <div className={styles.cardTitle}>{benefit.label}</div>
                            <div className={styles.cardDesc}>{benefit.desc}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
