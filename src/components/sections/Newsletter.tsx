'use client'

import { useState, FormEvent } from 'react'
import styles from './Newsletter.module.css'

export default function Newsletter() {
    const [email, setEmail] = useState('')
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setStatus('loading')

        try {
            const res = await fetch('/api/newsletter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })

            if (!res.ok) throw new Error('Error')

            setStatus('success')
            setEmail('')
            setTimeout(() => setStatus('idle'), 5000)
        } catch {
            setStatus('error')
            setTimeout(() => setStatus('idle'), 4000)
        }
    }

    return (
        <section className={styles.section}>
            <div className="container">
                <div className={styles.wrapper}>
                    <div className={styles.content}>
                        <h3 className={styles.title}>
                            Recibe las mejores oportunidades de terrenos
                        </h3>
                        <p className={styles.desc}>
                            Suscríbete y sé el primero en conocer nuevos proyectos y precios exclusivos.
                        </p>
                    </div>

                    <form className={styles.form} onSubmit={handleSubmit} id="form-newsletter">
                        <div className={styles.inputWrapper}>
                            <input
                                type="email"
                                className={styles.input}
                                placeholder="Tu correo electrónico"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                id="newsletter-email"
                                aria-label="Correo electrónico para newsletter"
                            />
                            <button
                                type="submit"
                                className={styles.btn}
                                disabled={status === 'loading'}
                            >
                                {status === 'loading' ? '...' : 'Suscribirme'}
                            </button>
                        </div>
                        {status === 'success' && (
                            <span className={styles.success}>✅ ¡Suscrito correctamente!</span>
                        )}
                        {status === 'error' && (
                            <span className={styles.error}>❌ Error. Intenta de nuevo.</span>
                        )}
                    </form>
                </div>
            </div>
        </section>
    )
}
