import Image from 'next/image'
import { MINI_BENEFITS } from '@/lib/constants'
import styles from './Benefits.module.css'

export default function Benefits() {
    return (
        <section className={styles.section} id="beneficios">
            <div className="container">
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        Todo lo que necesitas para dar<br />
                        el paso con confianza
                    </h2>
                    <div className={styles.divider} />
                </div>

                <div className={styles.grid}>
                    {MINI_BENEFITS.map((benefit, index) => (
                        <div key={index} className={styles.card}>
                            <div className={styles.iconWrapper}>
                                <Image
                                    src={benefit.iconImage}
                                    alt={benefit.label}
                                    width={120}
                                    height={120}
                                    className={styles.iconCropped}
                                />
                            </div>
                            <h3 className={styles.cardTitle}>{benefit.label}</h3>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
