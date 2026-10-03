import { Metadata } from 'next'
import { SITE } from '@/lib/constants'
import DerechosForm from './DerechosForm'

export const metadata: Metadata = {
    title: 'Ejercer mis derechos sobre mis datos',
    description: `Pide a ${SITE.name} acceder, corregir, borrar o dejar de recibir publicidad con tus datos personales (Ley 21.719).`,
    alternates: {
        canonical: `${SITE.url}/privacidad/derechos`,
    },
}

export default function DerechosPage() {
    return (
        <div className="section">
            <div className="container" style={{ maxWidth: '760px', paddingTop: 'var(--navbar-height)' }}>
                <div className="section-header" style={{ textAlign: 'left' }}>
                    <span className="section-label">Privacidad</span>
                    <h1 className="section-title">Tus datos, tu decisión</h1>
                    <p className="section-subtitle" style={{ marginLeft: 0 }}>
                        Elige qué quieres hacer con los datos que nos diste. Respondemos dentro de 30 días corridos (el
                        bloqueo, en 2 días hábiles), como pide la Ley 21.719. También puedes escribirnos a{' '}
                        <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
                    </p>
                </div>
                <DerechosForm />
            </div>
        </div>
    )
}
