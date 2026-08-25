import type { Metadata } from 'next'
import { SITE } from '@/lib/constants'
import MetaTrackPageView from '@/components/analytics/MetaTrackPageView'
import CotizarForm from './CotizarForm'
import styles from './page.module.css'

// Landing de cotización pensada para los botones de redes sociales (Instagram,
// TikTok, el link de la bio). El único objetivo es que el visitante complete el
// formulario, así que vive fuera del route group (main): sin navbar ni footer,
// nada que lo distraiga ni por dónde irse.
//
// Va con noindex a propósito. No es contenido para buscar en Google, y dejarla
// indexable la pondría a competir con /contacto, que sí es la página de
// contacto del sitio y está en el sitemap. `follow` queda activo para que el
// enlace a la home siga pasando autoridad.

const PAGE_URL = `${SITE.url}/cotizar`

export const metadata: Metadata = {
    title: {
        absolute: 'Cotiza tu terreno en El Tabo | Alimin Inmobiliaria',
    },
    description:
        'Cotiza tu terreno urbanizado en El Tabo, Litoral Central. Rol propio, agua y luz incluidas, financiamiento directo sin banco. Un asesor te contacta en menos de 24 horas.',
    alternates: { canonical: PAGE_URL },
    robots: { index: false, follow: true },
    openGraph: {
        type: 'website',
        url: PAGE_URL,
        siteName: SITE.name,
        locale: 'es_CL',
        title: 'Cotiza tu terreno en El Tabo | Alimin Inmobiliaria',
        description:
            'Terrenos urbanizados con rol propio, agua y luz. Financiamiento directo sin banco. Cotiza en un minuto.',
        images: [
            {
                url: `${SITE.url}/assets/homepage-v2/hero-litoral-central.webp`,
                width: 1200,
                height: 630,
                alt: 'Terrenos en El Tabo, Litoral Central',
            },
        ],
    },
}

const CheckIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#76d845" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
)

const SELLOS = [
    'Rol propio inscrito a tu nombre',
    'Agua certificada y luz incluidas',
    'Financiamiento directo, sin banco ni DICOM',
    'A 8 minutos de la playa de El Tabo',
]

export default function CotizarPage() {
    const whatsappUrl = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
        'Hola, quiero cotizar un terreno en El Tabo 👋'
    )}`

    return (
        <main className={styles.pagina}>
            <MetaTrackPageView
                eventName="ViewContent"
                customData={{ content_name: 'Cotizar - Landing Redes', content_category: 'Real Estate' }}
            />

            <div className={styles.fondo}>
                <img
                    src="/assets/homepage-v2/hero-litoral-central.webp"
                    alt=""
                    aria-hidden="true"
                    className={styles.fondoImg}
                    fetchPriority="high"
                />
                <div className={styles.fondoOverlay} />
                <div className={styles.orbe} />
            </div>

            <div className={styles.contenido}>
                <header className={styles.encabezado}>
                    <img
                        src="/assets/homepage-v2/logo-alimin-menu.webp"
                        alt="Alimin Inmobiliaria"
                        className={styles.logo}
                        width={128}
                        height={34}
                    />
                    <h1 className={styles.titulo}>
                        Cotiza tu terreno en{' '}
                        <span className={styles.destacado}>El Tabo</span>
                    </h1>
                    <p className={styles.bajada}>
                        Terrenos urbanizados en el Litoral Central, con rol propio, agua y luz.
                        Déjanos tus datos y un asesor te contacta en menos de 24 horas.
                    </p>
                </header>

                <CotizarForm />

                <div className={styles.sellos}>
                    {SELLOS.map((s) => (
                        <div key={s} className={styles.sello}>
                            <span className={styles.selloIcono}>
                                <CheckIcon />
                            </span>
                            <span>{s}</span>
                        </div>
                    ))}
                </div>

                <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styles.whatsapp} crm-track-click`}
                    data-crm-name="WhatsApp - Landing Cotizar"
                    data-crm-category="Cotizacion"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884" />
                    </svg>
                    Prefiero hablar por WhatsApp
                </a>
            </div>
        </main>
    )
}
