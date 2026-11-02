import type { Metadata } from 'next'
import { SITE } from '@/lib/constants'
import MetaTrackPageView from '@/components/analytics/MetaTrackPageView'
import SimuladorProyectos from '@/components/credito/SimuladorProyectos'
import styles from './page.module.css'

// Página de la calculadora de cuotas ("Simula tu crédito" en el menú), con
// navbar, footer y chat como el resto del sitio. La persona elige el proyecto
// y cada lead lleva en la etiqueta el proyecto y los montos que calculó, para
// que el asesor lo vea en la ficha del CRM.
//
// La misma calculadora va embebida en la home y en las páginas de proyecto;
// allá la etiqueta dice desde dónde se usó.

const PAGE_URL = `${SITE.url}/credito`

export const metadata: Metadata = {
    title: {
        absolute: 'Calculadora de cuotas para tu terreno | Alimin Inmobiliaria',
    },
    description:
        'Calcula en cuántas cuotas pagas tu terreno en El Tabo con financiamiento directo Alimin: ingresa el valor del terreno, el pie y la cuota mensual.',
    alternates: { canonical: PAGE_URL },
    openGraph: {
        type: 'website',
        url: PAGE_URL,
        siteName: SITE.name,
        locale: 'es_CL',
        title: 'Calculadora de cuotas para tu terreno | Alimin Inmobiliaria',
        description: 'Ingresa el valor del terreno, el pie y la cuota mensual, y ve en cuántas cuotas lo pagas.',
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

export default function CreditoPage() {
    return (
        <div className={styles.pagina}>
            <MetaTrackPageView
                eventName="ViewContent"
                customData={{ content_name: 'Calculadora Crédito', content_category: 'Real Estate' }}
            />

            <div className={styles.contenido}>
                <header className={styles.encabezado}>
                    <h1 className={styles.titulo}>
                        Simula tu <span className={styles.destacado}>crédito</span>
                    </h1>
                    <p className={styles.bajada}>
                        Elige el proyecto y ajusta el pie y la cuota mensual que te acomoda.
                    </p>
                </header>

                <SimuladorProyectos />
            </div>
        </div>
    )
}
