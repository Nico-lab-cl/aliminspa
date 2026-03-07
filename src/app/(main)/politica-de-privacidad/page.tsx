import { SITE } from '@/lib/constants'

export default function PrivacyPolicyPage() {
    return (
        <div className="section">
            <div className="container" style={{ maxWidth: '800px', paddingTop: 'var(--navbar-height)' }}>
                <div className="section-header" style={{ textAlign: 'left' }}>
                    <span className="section-label">Privacidad</span>
                    <h1 className="section-title">Política de Privacidad</h1>
                    <p className="section-subtitle" style={{ marginLeft: 0 }}>
                        Última actualización: 7 de marzo de 2026
                    </p>
                </div>

                <div className="content" style={{ color: 'var(--text)', fontSize: '1.1rem', lineHeight: '1.8' }}>
                    <p style={{ marginBottom: '1.5rem' }}>
                        En <strong>{SITE.name}</strong>, la privacidad de nuestros usuarios es una prioridad. Esta Política de Privacidad describe cómo recopilamos, usamos y protegemos su información personal cuando utiliza nuestro sitio web <strong>{SITE.domain}</strong> y nuestras aplicaciones asociadas en plataformas de Meta (Facebook, Instagram).
                    </p>

                    <h2 style={{ fontSize: '1.8rem', margin: '2.5rem 0 1rem', color: 'var(--text-secondary)' }}>1. Información que Recopilamos</h2>
                    <p style={{ marginBottom: '1rem' }}>
                        Recopilamos información que usted nos proporciona voluntariamente a través de nuestros formularios de contacto y clientes potenciales (Leads), incluyendo:
                    </p>
                    <ul style={{ marginBottom: '1.5rem', paddingLeft: '1.5rem', listStyle: 'disc' }}>
                        <li>Nombre y apellidos.</li>
                        <li>Dirección de correo electrónico.</li>
                        <li>Número de teléfono (WhatsApp).</li>
                        <li>Mensajes o comentarios específicos sobre proyectos.</li>
                    </ul>

                    <h2 style={{ fontSize: '1.8rem', margin: '2.5rem 0 1rem', color: 'var(--text-secondary)' }}>2. Uso de la Información</h2>
                    <p style={{ marginBottom: '1rem' }}>Utilizamos la información recopilada para:</p>
                    <ul style={{ marginBottom: '1.5rem', paddingLeft: '1.5rem', listStyle: 'disc' }}>
                        <li>Gestionar sus consultas sobre nuestros proyectos inmobiliarios en El Tabo.</li>
                        <li>Enviarle información comercial y actualizaciones de disponibilidad de terrenos.</li>
                        <li>Mejorar nuestros servicios y la experiencia de usuario en el sitio.</li>
                        <li>Cumplir con los requisitos de las plataformas publicitarias de Meta para el seguimiento de conversiones y leads.</li>
                    </ul>

                    <h2 style={{ fontSize: '1.8rem', margin: '2.5rem 0 1rem', color: 'var(--text-secondary)' }}>3. Herramientas de Meta y Terceros</h2>
                    <p style={{ marginBottom: '1.5rem' }}>
                        Para el funcionamiento de nuestras campañas en Facebook e Instagram, utilizamos herramientas como el Meta Pixel y el Conversions API. Estas herramientas nos permiten medir el rendimiento de nuestros anuncios y ofrecer contenido más relevante a los usuarios interesados en nuestros terrenos urbanizados.
                    </p>

                    <h2 style={{ fontSize: '1.8rem', margin: '2.5rem 0 1rem', color: 'var(--text-secondary)' }}>4. Cookies y Seguimiento</h2>
                    <p style={{ marginBottom: '1.5rem' }}>
                        Utilizamos cookies y tecnologías similares para entender el comportamiento de los usuarios en nuestro sitio y optimizar nuestras estrategias de marketing. Usted puede configurar su navegador para rechazar las cookies, aunque esto podría afectar la funcionalidad de algunas partes del sitio.
                    </p>

                    <h2 style={{ fontSize: '1.8rem', margin: '2.5rem 0 1rem', color: 'var(--text-secondary)' }}>5. Protección de Datos</h2>
                    <p style={{ marginBottom: '1.5rem' }}>
                        Implementamos medidas de seguridad técnicas y organizativas para proteger sus datos contra acceso no autorizado, alteración o divulgación. No vendemos ni compartimos su información personal con terceros para fines publicitarios ajenos a <strong>{SITE.name}</strong>.
                    </p>

                    <h2 style={{ fontSize: '1.8rem', margin: '2.5rem 0 1rem', color: 'var(--text-secondary)' }}>6. Sus Derechos</h2>
                    <p style={{ marginBottom: '1.5rem' }}>
                        De acuerdo con la legislación chilena, usted tiene derecho a acceder, rectificar o eliminar sus datos personales en cualquier momento. Para ejercer estos derechos, simplemente envíe un correo electrónico a <strong>{SITE.email}</strong> indicando su solicitud.
                    </p>

                    <h2 style={{ fontSize: '1.8rem', margin: '2.5rem 0 1rem', color: 'var(--text-secondary)' }}>7. Contacto</h2>
                    <p style={{ marginBottom: '1.5rem' }}>
                        Si tiene alguna pregunta sobre esta política, puede contactarnos en <strong>{SITE.address}</strong> o a través de nuestro correo electrónico de soporte.
                    </p>
                </div>
            </div>
        </div>
    )
}
