import { SITE } from '@/lib/constants'

export default function TermsOfServicePage() {
    return (
        <div className="section">
            <div className="container" style={{ maxWidth: '800px', paddingTop: 'var(--navbar-height)' }}>
                <div className="section-header" style={{ textAlign: 'left' }}>
                    <span className="section-label">Legal</span>
                    <h1 className="section-title">Condiciones del Servicio</h1>
                    <p className="section-subtitle" style={{ marginLeft: 0 }}>
                        Última actualización: 7 de marzo de 2026
                    </p>
                </div>

                <div className="content" style={{ color: 'var(--text)', fontSize: '1.1rem', lineHeight: '1.8' }}>
                    <p style={{ marginBottom: '1.5rem' }}>
                        Bienvenido a <strong>{SITE.name}</strong>. Al acceder y utilizar nuestro sitio web <strong>{SITE.domain}</strong>, usted acepta cumplir y estar sujeto a los siguientes términos y condiciones de uso.
                    </p>

                    <h2 style={{ fontSize: '1.8rem', margin: '2.5rem 0 1rem', color: 'var(--text-secondary)' }}>1. Aceptación de los Términos</h2>
                    <p style={{ marginBottom: '1.5rem' }}>
                        El acceso a este sitio web es gratuito y atribuye a quien lo realiza la condición de Usuario. El uso del sitio implica la aceptación plena y sin reservas de todas y cada una de las disposiciones incluidas en estos Términos y Condiciones.
                    </p>

                    <h2 style={{ fontSize: '1.8rem', margin: '2.5rem 0 1rem', color: 'var(--text-secondary)' }}>2. Información sobre los Proyectos</h2>
                    <p style={{ marginBottom: '1.5rem' }}>
                        Toda la información proporcionada en este sitio sobre nuestros proyectos de terrenos urbanizados en El Tabo (como precios, dimensiones de lotes y disponibilidad) es referencial. <strong>{SITE.name}</strong> se reserva el derecho de modificar esta información sin previo aviso. La confirmación de detalles específicos se realizará durante el proceso de reserva y venta directa con nuestros asesores.
                    </p>

                    <h2 style={{ fontSize: '1.8rem', margin: '2.5rem 0 1rem', color: 'var(--text-secondary)' }}>3. Uso Correcto del Sitio</h2>
                    <p style={{ marginBottom: '1.5rem' }}>
                        El Usuario se compromete a utilizar el sitio web, sus contenidos y servicios de conformidad con la Ley, la moral y el orden público. Queda prohibido el uso del sitio con fines ilícitos o lesivos contra <strong>{SITE.name}</strong> o cualquier tercero.
                    </p>

                    <h2 style={{ fontSize: '1.8rem', margin: '2.5rem 0 1rem', color: 'var(--text-secondary)' }}>4. Propiedad Intelectual</h2>
                    <p style={{ marginBottom: '1.5rem' }}>
                        Todos los contenidos del sitio web, incluyendo textos, fotografías, gráficos, imágenes, iconos, tecnología y diseño gráfico, son propiedad intelectual de <strong>{SITE.name}</strong> o de terceros, sin que puedan entenderse cedidos al Usuario ninguno de los derechos de explotación sobre los mismos.
                    </p>

                    <h2 style={{ fontSize: '1.8rem', margin: '2.5rem 0 1rem', color: 'var(--text-secondary)' }}>5. Limitación de Responsabilidad</h2>
                    <p style={{ marginBottom: '1.5rem' }}>
                        <strong>{SITE.name}</strong> no se hace responsable de los daños y perjuicios de cualquier naturaleza que pudieran derivarse de la falta de disponibilidad, mantenimiento o continuidad del funcionamiento del sitio web, así como de posibles errores en la información publicada.
                    </p>

                    <h2 style={{ fontSize: '1.8rem', margin: '2.5rem 0 1rem', color: 'var(--text-secondary)' }}>6. Enlaces a Terceros</h2>
                    <p style={{ marginBottom: '1.5rem' }}>
                        Nuestro sitio puede contener enlaces a sitios externos (como redes sociales de Meta). Estos enlaces se proporcionan solo para su conveniencia. No tenemos control sobre el contenido de estos sitios y no asumimos responsabilidad por ellos.
                    </p>

                    <h2 style={{ fontSize: '1.8rem', margin: '2.5rem 0 1rem', color: 'var(--text-secondary)' }}>7. Ley Aplicable y Jurisdicción</h2>
                    <p style={{ marginBottom: '1.5rem' }}>
                        Estas condiciones se rigen por las leyes de la República de Chile. Para cualquier controversia, las partes se someten a la jurisdicción de los tribunales de justicia correspondientes al domicilio de <strong>{SITE.name}</strong>.
                    </p>

                    <h2 style={{ fontSize: '1.8rem', margin: '2.5rem 0 1rem', color: 'var(--text-secondary)' }}>8. Contacto</h2>
                    <p style={{ marginBottom: '1.5rem' }}>
                        Para cualquier duda o comentario sobre estos términos, por favor contáctenos a través de <strong>{SITE.email}</strong>.
                    </p>
                </div>
            </div>
        </div>
    )
}
