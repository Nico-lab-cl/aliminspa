import { Metadata } from 'next'
import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import { LEGAL, SITE } from '@/lib/constants'
import { POLITICA_VERSION } from '@/lib/consent'
import PreferenciasCookiesBoton from '@/components/consent/PreferenciasCookiesBoton'

export const metadata: Metadata = {
    title: 'Política de Privacidad',
    description: `Cómo ${SITE.name} trata tus datos personales según la Ley 21.719: qué datos, para qué, con quién, por cuánto tiempo y cómo ejercer tus derechos.`,
    alternates: {
        canonical: `${SITE.url}/politica-de-privacidad`,
    },
}

/**
 * Plazos de conservación. Son una propuesta para que Alimin los confirme: la
 * ley no fija números, pide que sean los necesarios para cada fin y que se
 * informen. Si cambian, actualizar también POLITICA_VERSION y las consultas
 * de borrado de prisma/sql/2026-10-03-ley-21719.sql.
 */
const PLAZOS = {
    consultas: '24 meses desde el último contacto',
    visitas: '24 meses desde la fecha de la visita',
    chat: '24 meses desde el último mensaje',
}

const h2: CSSProperties = { fontSize: '1.6rem', margin: '2.5rem 0 1rem', color: 'var(--text-secondary)', scrollMarginTop: 'calc(var(--navbar-height) + 16px)' }
const p: CSSProperties = { marginBottom: '1rem' }
const ul: CSSProperties = { marginBottom: '1.5rem', paddingLeft: '1.5rem', listStyle: 'disc' }
const tabla: CSSProperties = { width: '100%', borderCollapse: 'collapse', margin: '0.5rem 0 1.5rem', fontSize: '0.95rem', lineHeight: 1.5 }
const celda: CSSProperties = { border: '1px solid var(--border-hover)', padding: '10px 12px', verticalAlign: 'top', textAlign: 'left' }

function Tabla({ cabecera, filas }: { cabecera: string[]; filas: ReactNode[][] }) {
    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={tabla}>
                <thead>
                    <tr>
                        {cabecera.map((c) => (
                            <th key={c} style={{ ...celda, background: 'var(--sec-bg)' }}>{c}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {filas.map((fila, i) => (
                        <tr key={i}>
                            {fila.map((c, j) => (
                                <td key={j} style={celda}>{c}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function fechaLarga(iso: string) {
    return new Date(`${iso}T12:00:00`).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function PrivacyPolicyPage() {
    const responsable = [LEGAL.razonSocial, LEGAL.rut && `RUT ${LEGAL.rut}`].filter(Boolean).join(', ')

    return (
        <div className="section">
            <div className="container" style={{ maxWidth: '820px', paddingTop: 'var(--navbar-height)' }}>
                <div className="section-header" style={{ textAlign: 'left' }}>
                    <span className="section-label">Privacidad</span>
                    <h1 className="section-title">Política de Privacidad</h1>
                    <p className="section-subtitle" style={{ marginLeft: 0 }}>
                        Versión vigente desde el {fechaLarga(POLITICA_VERSION)}. Cumple la Ley N° 21.719 sobre Protección de
                        Datos Personales.
                    </p>
                </div>

                <div className="content" style={{ color: 'var(--text)', fontSize: '1.05rem', lineHeight: '1.8' }}>
                    <p style={p}>
                        Esta política explica qué datos personales tratamos cuando usas <strong>{SITE.domain}</strong>, nos
                        escribes por el chat o WhatsApp, o respondes a nuestros anuncios en Facebook e Instagram; para qué
                        los usamos, con quién los compartimos, cuánto tiempo los guardamos y cómo puedes ejercer tus
                        derechos.
                    </p>

                    <h2 style={h2} id="responsable">1. Quién es responsable de tus datos</h2>
                    <p style={p}>
                        <strong>{SITE.name}</strong>
                        {responsable && <> ({responsable})</>}, con domicilio en {LEGAL.domicilio || SITE.address}. Para
                        cualquier tema de privacidad escríbenos a <a href={`mailto:${SITE.email}`}>{SITE.email}</a> o usa
                        el formulario de <Link href="/privacidad/derechos">ejercicio de derechos</Link>.
                    </p>

                    <h2 style={h2} id="datos">2. Qué datos tratamos</h2>
                    <ul style={ul}>
                        <li>
                            <strong>Los que nos das en formularios:</strong> nombre, correo, celular, ciudad y región,
                            proyecto o lote de interés, cómo nos conociste y, si agendas, la fecha y hora de la visita.
                        </li>
                        <li>
                            <strong>Conversaciones:</strong> los mensajes y archivos que nos envías por el chat del sitio o
                            por WhatsApp.
                        </li>
                        <li>
                            <strong>Datos de navegación, solo si aceptas cookies:</strong> páginas visitadas, clics,
                            dispositivo y navegador, ubicación aproximada según la IP, y la campaña o anuncio desde el que
                            llegaste.
                        </li>
                        <li>
                            <strong>Concursos y sorteos:</strong> el nombre de usuario de Instagram con el que participas.
                        </li>
                        <li>
                            <strong>Encuestas del sitio:</strong> tu respuesta y una huella cifrada de la IP para evitar
                            votos repetidos; no guardamos la IP.
                        </li>
                    </ul>
                    <p style={p}>
                        No pedimos datos sensibles (salud, origen, creencias, etc.). El sitio no está dirigido a menores de
                        edad y no recopilamos a sabiendas datos de menores de 14 años.
                    </p>

                    <h2 style={h2} id="finalidades">3. Para qué los usamos y con qué base legal</h2>
                    <Tabla
                        cabecera={['Para qué', 'Base legal']}
                        filas={[
                            ['Responder tu consulta, cotizar, coordinar la visita y hacer seguimiento de tu interés en un terreno.', 'Tu solicitud y tu consentimiento (casilla obligatoria del formulario).'],
                            ['Enviarte novedades, ofertas y lanzamientos por correo o WhatsApp.', 'Tu consentimiento aparte y opcional. Puedes retirarlo cuando quieras.'],
                            ['Medir y mejorar el sitio (Google Analytics, Microsoft Clarity).', 'Tu consentimiento en el banner de cookies (analítica).'],
                            ['Medir nuestros anuncios y mostrarte publicidad de Alimin en Facebook e Instagram (Meta Pixel, API de Conversiones, audiencias personalizadas).', 'Tu consentimiento en el banner de cookies (marketing) y, para audiencias armadas con tu correo o teléfono, tu consentimiento para recibir publicidad.'],
                            ['Proteger el sitio contra abusos y envíos automáticos.', 'Interés legítimo de Alimin en la seguridad del sitio.'],
                            ['Si compras, preparar la promesa y la escritura, cobrar y cumplir obligaciones tributarias.', 'El contrato y las obligaciones legales.'],
                        ]}
                    />
                    <p style={p}>
                        No vendemos tus datos. No tomamos decisiones sobre ti basadas solo en tratamiento automatizado.
                    </p>

                    <h2 style={h2} id="terceros">4. Con quién los compartimos</h2>
                    <p style={p}>
                        Solo con proveedores que los tratan por encargo nuestro y para los fines de arriba:
                    </p>
                    <ul style={ul}>
                        <li>Proveedor de hosting y base de datos del sitio.</li>
                        <li>Nuestro sistema de gestión de clientes (CRM), donde los asesores ven tu consulta y te responden.</li>
                        <li>Google (Analytics, Tag Manager y Calendar, que usamos para agendar visitas).</li>
                        <li>Meta Platforms (Facebook, Instagram y WhatsApp).</li>
                        <li>Microsoft (Clarity).</li>
                    </ul>
                    <p style={p}>
                        Google, Meta y Microsoft pueden procesar datos fuera de Chile, principalmente en Estados Unidos. Lo
                        hacen bajo sus términos de tratamiento de datos para empresas, y a Meta le enviamos el correo y el
                        teléfono cifrados (hash), no en texto legible.
                    </p>

                    <h2 style={h2} id="cookies">5. Cookies</h2>
                    <p style={p}>
                        Al entrar te preguntamos qué cookies aceptas. Las de analítica y marketing no se activan hasta que
                        dices que sí, y rechazarlas no te impide usar el sitio.
                    </p>
                    <Tabla
                        cabecera={['Tipo', 'Qué hace', 'Cuánto dura']}
                        filas={[
                            ['Necesarias', 'Recordar tu decisión sobre cookies (alimin_consent) y el funcionamiento del chat.', '6 meses'],
                            ['Analítica', 'Google Analytics (_ga), Microsoft Clarity (_clck, _clsk).', 'Hasta 13 meses según el proveedor'],
                            ['Marketing', 'Meta Pixel (_fbp, _fbc) e identificador del seguimiento de nuestro CRM.', 'Hasta 90 días (Meta); el del CRM, hasta que lo borres'],
                        ]}
                    />
                    <p style={p}>
                        Puedes cambiar o retirar tu consentimiento cuando quieras:{' '}
                        <PreferenciasCookiesBoton style={{ color: 'var(--verde-solido)', textDecoration: 'underline', fontWeight: 600 }} />.
                    </p>

                    <h2 style={h2} id="plazos">6. Cuánto tiempo los guardamos</h2>
                    <ul style={ul}>
                        <li>Consultas y cotizaciones que no terminan en compra: {PLAZOS.consultas}.</li>
                        <li>Visitas agendadas: {PLAZOS.visitas}.</li>
                        <li>Conversaciones del chat: {PLAZOS.chat}.</li>
                        <li>Suscripción a novedades: hasta que te des de baja.</li>
                        <li>Clientes: mientras dure la relación y los plazos que exigen las leyes tributarias y civiles.</li>
                        <li>Solicitudes de derechos: el tiempo necesario para acreditar que las respondimos.</li>
                    </ul>
                    <p style={p}>Cumplidos esos plazos, los borramos o los dejamos anónimos.</p>

                    <h2 style={h2} id="derechos">7. Tus derechos</h2>
                    <p style={p}>Puedes pedirnos en cualquier momento y sin costo:</p>
                    <ul style={ul}>
                        <li><strong>Acceso:</strong> saber qué datos tuyos tenemos, de dónde salieron y con quién los compartimos.</li>
                        <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
                        <li><strong>Supresión:</strong> borrar tus datos, salvo los que una ley nos obligue a guardar.</li>
                        <li><strong>Oposición:</strong> que dejemos de usarlos para publicidad o perfiles.</li>
                        <li><strong>Portabilidad:</strong> recibir una copia en un formato estructurado.</li>
                        <li><strong>Bloqueo:</strong> suspender temporalmente su uso mientras se resuelve otra solicitud.</li>
                        <li><strong>Retirar tu consentimiento</strong>, sin que eso afecte lo hecho antes.</li>
                    </ul>
                    <p style={p}>
                        Hazlo desde <Link href="/privacidad/derechos">este formulario</Link> o escribiendo a{' '}
                        <a href={`mailto:${SITE.email}`}>{SITE.email}</a>. Respondemos dentro de 30 días corridos,
                        prorrogables una vez por otros 30 si lo justificamos; el bloqueo, dentro de 2 días hábiles. Para
                        proteger tu información, podemos pedirte que confirmes tu identidad antes de entregar o borrar
                        datos. Si no te respondemos o no estás de acuerdo con la respuesta, puedes reclamar ante la Agencia
                        de Protección de Datos Personales.
                    </p>

                    <h2 style={h2} id="seguridad">8. Seguridad</h2>
                    <p style={p}>
                        El sitio funciona solo con conexión cifrada (HTTPS), el acceso a la base de datos y al CRM está
                        restringido al equipo que lo necesita, y las claves de los sistemas no se publican. Si ocurre un
                        incidente que comprometa tus datos, lo informaremos a la Agencia y, cuando corresponda, a ti, sin
                        demoras indebidas.
                    </p>

                    <h2 style={h2} id="cambios">9. Cambios a esta política</h2>
                    <p style={p}>
                        Si la cambiamos, publicamos la nueva versión aquí con su fecha. Si el cambio afecta un uso que
                        consentiste, te pediremos el consentimiento de nuevo.
                    </p>
                </div>
            </div>
        </div>
    )
}
