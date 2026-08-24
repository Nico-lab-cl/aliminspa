import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { SITE } from '@/lib/constants'
import MetaTrackPageView from '@/components/analytics/MetaTrackPageView'
import LocationMap from '@/components/sections/LocationMap'
import NearbyPlaces from '@/components/sections/NearbyPlaces'
import Testimonials from '@/components/sections/Testimonials'
import HomeNewsletter from '@/components/sections/HomeNewsletter'
import CotizaForm from './CotizaForm'
import FaqAccordion from './FaqAccordion'
import HeroVideo from './HeroVideo'
import { FAQS } from './faqs'
import { TERRENOS, INCLUIDO, POR_QUE_BARATO, PRECIO_DESDE, PIE_DESDE, CUOTA_DESDE } from './terrenos'
import styles from './page.module.css'

// Landing SEO para "terrenos baratos en la playa litoral central chile".
//
// Investigación (Ubersuggest, Chile / es, agosto 2026):
//   · Volumen 30/mes · SEO difficulty 15 · CPC US$0,155 · intención Commercial.
//   · El SERP no tiene ni una landing de marca: es todo marketplace
//     (MercadoLibre #1, Portal Inmobiliario #3, Yapo #9, Trovit, Mitula,
//     Doomos). Todos muestran precio. Por eso esta página publica precios
//     reales en vez de esconderlos tras "consultar": sin precio no compite.
//   · Sobre los orgánicos hay un bloque de "Otras preguntas" (#4) y un AI
//     Overview (#5) → FAQPage con respuestas autocontenidas.
//   · Hay bloque de video (#8) e imágenes (#10, #18) → media con alt descriptivo.
//   · /venta-de-terrenos-litoral-central rankeaba #28 (tráfico 0) para esta
//     keyword. Esta URL exact-match la reemplaza; la otra se queda con
//     "venta / urbanizados / rol propio", que es donde sí tiene posiciones.
//
// Vive dentro del route group (main) a propósito: hereda Navbar, Footer y el
// widget de chat de Ali sin duplicar componentes.

const PAGE_URL = `${SITE.url}/terrenos-baratos-en-la-playa-litoral-central-chile`
const OG_IMAGE = `${SITE.url}/videos/terrenos-baratos/hero-desktop-poster.webp`

export const metadata: Metadata = {
    // `absolute` evita el template `%s | Alimin Inmobiliaria` del layout raíz:
    // con el sufijo el title se iba a 91 caracteres y Google lo cortaba justo
    // en el precio, que es el gancho de CTR de esta búsqueda. Así queda en 64.
    title: {
        absolute: 'Terrenos Baratos en la Playa Litoral Central Chile — $35.000.000',
    },
    description:
        'Terrenos baratos en la playa del Litoral Central, Chile. Lotes urbanizados en El Tabo desde $35.000.000, a 8 minutos de la playa. Pie desde $5.500.000, cuotas desde $500.000, sin banco y sin importar tu DICOM. Rol propio, agua y luz incluidas. Ve precios y disponibilidad.',
    keywords: [
        'terrenos baratos en la playa litoral central chile',
        'terrenos baratos litoral central',
        'terrenos baratos en la playa',
        'terrenos baratos en la playa chile',
        'sitios baratos en la playa litoral central',
        'terrenos baratos en el tabo',
        'venta de terrenos urbanizados en el litoral central baratos',
        'terrenos en la playa con luz y agua litoral central',
        'terrenos baratos en venta',
        'cuanto cuesta un terreno en el litoral central',
    ],
    alternates: { canonical: PAGE_URL },
    openGraph: {
        type: 'website',
        url: PAGE_URL,
        siteName: SITE.name,
        locale: 'es_CL',
        title: 'Terrenos Baratos en la Playa Litoral Central Chile — Desde $35.000.000',
        description:
            'Lotes urbanizados en El Tabo desde $35.000.000, a 8 minutos de la playa. Pie desde $5.500.000 y cuotas desde $500.000, sin banco. Rol propio, agua y luz incluidas.',
        images: [
            {
                url: OG_IMAGE,
                width: 1200,
                height: 630,
                alt: 'Terrenos baratos en la playa del Litoral Central, El Tabo, Chile',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Terrenos Baratos en la Playa Litoral Central Chile — Desde $35.000.000',
        description:
            'Lotes urbanizados en El Tabo desde $35.000.000, a 8 minutos de la playa. Sin banco y sin DICOM.',
        images: [OG_IMAGE],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-video-preview': -1,
            'max-snippet': -1,
        },
    },
    other: {
        'geo.region': 'CL-VS',
        'geo.placename': 'El Tabo',
        'geo.position': '-33.4542;-71.6667',
        ICBM: '-33.4542, -71.6667',
    },
}

function JsonLd() {
    const graph = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'RealEstateAgent',
                '@id': `${PAGE_URL}#business`,
                name: SITE.name,
                url: SITE.url,
                image: OG_IMAGE,
                email: SITE.email,
                telephone: SITE.phone,
                priceRange: '$$',
                areaServed: [
                    { '@type': 'Place', name: 'El Tabo' },
                    { '@type': 'Place', name: 'El Quisco' },
                    { '@type': 'Place', name: 'Algarrobo' },
                    { '@type': 'Place', name: 'Isla Negra' },
                    { '@type': 'Place', name: 'Cartagena' },
                    { '@type': 'Place', name: 'Litoral Central' },
                ],
                address: {
                    '@type': 'PostalAddress',
                    addressLocality: 'El Tabo',
                    addressRegion: 'Región de Valparaíso',
                    addressCountry: 'CL',
                },
            },
            {
                '@type': 'WebPage',
                '@id': PAGE_URL,
                url: PAGE_URL,
                name: 'Terrenos Baratos en la Playa Litoral Central Chile',
                inLanguage: 'es-CL',
                isPartOf: { '@id': `${SITE.url}#website` },
                about: { '@id': `${PAGE_URL}#business` },
                primaryImageOfPage: OG_IMAGE,
                description:
                    'Listado de terrenos baratos en la playa del Litoral Central de Chile, con precios publicados. Lotes urbanizados en El Tabo desde $35.000.000, con rol propio, agua certificada, luz y financiamiento directo sin banco.',
            },
            // ItemList con precio: es la pieza que nos pone a competir con los
            // listados de MercadoLibre y Portal Inmobiliario que hoy copan el SERP.
            {
                '@type': 'ItemList',
                '@id': `${PAGE_URL}#listado`,
                name: 'Terrenos baratos en la playa del Litoral Central',
                numberOfItems: TERRENOS.length,
                itemListOrder: 'https://schema.org/ItemListOrderAscending',
                itemListElement: TERRENOS.map((t, i) => ({
                    '@type': 'ListItem',
                    position: i + 1,
                    item: {
                        '@type': 'Product',
                        '@id': `${PAGE_URL}#${t.id}`,
                        name: `Terreno ${t.superficie} en ${t.proyecto}, El Tabo — Litoral Central`,
                        description: `Terreno urbanizado de ${t.superficie} en ${t.proyecto}, El Tabo, Litoral Central, a 8 minutos de la playa. Incluye rol propio, agua certificada y luz. Pie de ${t.pie} y ${t.plazo.toLowerCase()} de ${t.cuota}, sin banco.`,
                        image: `${SITE.url}${t.imagen}`,
                        brand: { '@type': 'Brand', name: SITE.name },
                        category: 'Terrenos / Bienes Raíces',
                        offers: {
                            '@type': 'Offer',
                            priceCurrency: 'CLP',
                            price: String(t.contado),
                            availability: `https://schema.org/${t.disponibilidad}`,
                            url: PAGE_URL,
                            areaServed: 'El Tabo, Litoral Central, Chile',
                            seller: { '@id': `${PAGE_URL}#business` },
                        },
                    },
                })),
            },
            {
                '@type': 'FAQPage',
                '@id': `${PAGE_URL}#faq`,
                mainEntity: FAQS.map((f) => ({
                    '@type': 'Question',
                    name: f.q,
                    acceptedAnswer: { '@type': 'Answer', text: f.a },
                })),
            },
            {
                '@type': 'BreadcrumbList',
                '@id': `${PAGE_URL}#breadcrumb`,
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE.url },
                    {
                        '@type': 'ListItem',
                        position: 2,
                        name: 'Venta de terrenos Litoral Central',
                        item: `${SITE.url}/venta-de-terrenos-litoral-central`,
                    },
                    {
                        '@type': 'ListItem',
                        position: 3,
                        name: 'Terrenos baratos en la playa Litoral Central Chile',
                        item: PAGE_URL,
                    },
                ],
            },
        ],
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
        />
    )
}

const CheckIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#76d845" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
)

// Un icono por beneficio, en el mismo orden que INCLUIDO.
const ICONOS_INCLUIDO = [
    <svg key="rol" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="var(--verde-lima)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>,
    <svg key="agua" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="var(--verde-lima)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69s-5 6.14-5 10.13a5 5 0 0 0 10 0c0-3.99-5-10.13-5-10.13z" /></svg>,
    <svg key="luz" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="var(--verde-lima)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
    <svg key="banco" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="var(--verde-lima)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>,
    <svg key="recinto" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="var(--verde-lima)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
    <svg key="calles" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="var(--verde-lima)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22 9 2" /><path d="m15 2 5 20" /><path d="M12 6v3" /><path d="M12 13v3" /></svg>,
    <svg key="playa" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="var(--verde-lima)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
    <svg key="areas" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="var(--verde-lima)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V12" /><path d="M12 12a6 6 0 0 0 6-6 6 6 0 0 0-6 6 6 6 0 0 0-6-6 6 6 0 0 0 6 6z" /></svg>,
]

export default function TerrenosBaratosPage() {
    const whatsappUrl = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
        'Hola, vi los terrenos baratos en la playa del Litoral Central en aliminspa.cl y quiero la lista de precios 👋'
    )}`

    return (
        <>
            <JsonLd />
            <MetaTrackPageView
                eventName="ViewContent"
                customData={{
                    content_name: 'Terrenos Baratos Litoral Central - SEO',
                    content_category: 'Real Estate',
                }}
            />

            {/* ===================== HERO ===================== */}
            <section className={styles.hero} id="inicio">
                <HeroVideo />

                <div className={styles.heroGrid}>
                    <div className={styles.heroContent}>
                        <span className={styles.heroBadge}>El Tabo · Región de Valparaíso</span>

                        <h1 className={styles.heroTitle}>
                            Terrenos baratos en la playa del{' '}
                            <span className={styles.highlight}>Litoral Central</span> de Chile
                        </h1>

                        <p className={styles.heroSubtitle}>
                            Lotes urbanizados en El Tabo{' '}
                            <strong className={styles.heroSubtitleStrong}>desde {PRECIO_DESDE}</strong>, a 8 minutos
                            de la playa. Con rol propio, agua y luz incluidas, y financiamiento directo{' '}
                            <strong className={styles.heroSubtitleStrong}>sin banco</strong>.
                        </p>

                        <div className={styles.priceRow}>
                            <div className={styles.priceChip}>
                                <span className={styles.priceChipLabel}>Terreno desde</span>
                                <span className={styles.priceChipValue}>{PRECIO_DESDE}</span>
                            </div>
                            <div className={styles.priceChip}>
                                <span className={styles.priceChipLabel}>Pie desde</span>
                                <span className={styles.priceChipValue}>{PIE_DESDE}</span>
                            </div>
                            <div className={styles.priceChip}>
                                <span className={styles.priceChipLabel}>Cuotas desde</span>
                                <span className={styles.priceChipValue}>{CUOTA_DESDE}</span>
                            </div>
                        </div>

                        <div className={styles.ctas}>
                            <Link
                                href="#precios"
                                className={`${styles.btnPrimary} crm-track-click`}
                                data-crm-name="Ver precios - Hero Terrenos Baratos"
                                data-crm-category="Cotizacion"
                            >
                                Ver precios y terrenos
                            </Link>
                            <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`${styles.btnGhost} crm-track-click`}
                                data-crm-name="WhatsApp - Hero Terrenos Baratos"
                                data-crm-category="Cotizacion"
                            >
                                Pedir precios por WhatsApp
                            </a>
                        </div>
                    </div>

                    <CotizaForm
                        formId="form-hero-terrenos-baratos"
                        title="Recibe la lista de precios"
                        subtitle="Precios, tamaños y lotes disponibles. Sin costo y sin compromiso."
                        submitLabel="Ver precios"
                    />
                </div>
            </section>

            {/* ===================== BREADCRUMB ===================== */}
            <nav className={styles.breadcrumb} aria-label="Ruta de navegación">
                <div className={styles.breadcrumbInner}>
                    <Link href="/">Inicio</Link>
                    <span aria-hidden="true">›</span>
                    <Link href="/venta-de-terrenos-litoral-central">Venta de terrenos Litoral Central</Link>
                    <span aria-hidden="true">›</span>
                    <span className={styles.breadcrumbCurrent}>Terrenos baratos en la playa</span>
                </div>
            </nav>

            {/* ===================== LISTADO DE PRECIOS ===================== */}
            <section className={styles.preciosSection} id="precios">
                {/* Costa aérea (Pexels, licencia libre) con un lavado claro encima:
                    da textura a la sección sin restarle contraste a las tarjetas
                    blancas de precio, que son lo que tiene que leerse primero. */}
                <div className={styles.preciosBgWrapper}>
                    <img
                        src="https://images.pexels.com/photos/7573616/pexels-photo-7573616.jpeg?auto=compress&cs=tinysrgb&w=1400"
                        alt=""
                        aria-hidden="true"
                        className={styles.preciosBgImage}
                        loading="lazy"
                    />
                    <div className={styles.preciosOverlay} />
                </div>

                <div className={styles.preciosInner}>
                    <header className={styles.sectionHeader}>
                        <div className={styles.kickerRow}>
                            <span className={styles.ruleLeft} />
                            <span className={styles.kicker}>Precios publicados</span>
                            <span className={styles.ruleRight} />
                        </div>
                        <h2 className={`${styles.sectionTitle} ${styles.sectionTitleDark}`}>
                            Cuánto cuesta un terreno barato en la playa del Litoral Central
                        </h2>
                        <p className={`${styles.sectionDesc} ${styles.sectionDescDark}`}>
                            Estos son nuestros terrenos disponibles en El Tabo, ordenados del más barato al más
                            caro. El precio que ves es el del terreno urbanizado y listo para construir: incluye
                            rol propio, agua certificada, luz, calles y portón automático.
                        </p>
                    </header>

                    <div className={styles.preciosGrid}>
                        {TERRENOS.map((t) => (
                            <article
                                key={t.id}
                                id={t.id}
                                className={`${styles.terrenoCard} ${t.destacado ? styles.terrenoCardDestacado : ''}`}
                            >
                                <div className={styles.terrenoImgWrap}>
                                    <Image
                                        src={t.imagen}
                                        alt={`Terreno barato de ${t.superficie} en ${t.proyecto}, El Tabo, Litoral Central, desde ${t.contadoTexto}`}
                                        fill
                                        className={styles.terrenoImg}
                                        sizes="(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 33vw"
                                    />
                                    <span
                                        className={styles.terrenoBadge}
                                        style={{ background: t.color }}
                                    >
                                        {t.badge}
                                    </span>
                                    <span className={styles.terrenoStock}>{t.disponibilidadTexto}</span>
                                </div>

                                <div className={styles.terrenoBody}>
                                    <h3 className={styles.terrenoProyecto}>{t.proyecto}</h3>
                                    <p className={styles.terrenoSuperficie}>
                                        {t.superficie} urbanizados · El Tabo, Litoral Central
                                    </p>

                                    <div className={styles.terrenoPrecioBloque}>
                                        <span className={styles.terrenoPrecioLabel}>Precio contado</span>
                                        <p className={styles.terrenoPrecio}>{t.contadoTexto}</p>
                                        <p className={styles.terrenoPrecioM2}>{t.precioM2} por m²</p>
                                    </div>

                                    <div className={styles.terrenoDetalle}>
                                        <div className={styles.terrenoDetalleFila}>
                                            <span>Valor financiado</span>
                                            <span className={styles.terrenoDetalleValor}>{t.precioTexto}</span>
                                        </div>
                                        <div className={styles.terrenoDetalleFila}>
                                            <span>Pie</span>
                                            <span className={styles.terrenoDetalleValor}>{t.pie}</span>
                                        </div>
                                        <div className={styles.terrenoDetalleFila}>
                                            <span>Cuota mensual</span>
                                            <span className={styles.terrenoDetalleValor}>{t.cuota}</span>
                                        </div>
                                        <div className={styles.terrenoDetalleFila}>
                                            <span>Plazo</span>
                                            <span className={styles.terrenoDetalleValor}>{t.plazo}</span>
                                        </div>
                                    </div>

                                    <div className={styles.terrenoCta}>
                                        <Link
                                            href="#cotizar"
                                            className={`${styles.btnCard} crm-track-click`}
                                            data-crm-name={`Cotizar ${t.proyecto} ${t.superficie} - Terrenos Baratos`}
                                            data-crm-category="Cotizacion"
                                        >
                                            Cotizar este terreno
                                        </Link>
                                        <Link href={`/proyectos/${t.slug}`} className={styles.btnCardGhost}>
                                            Ver proyecto {t.proyecto}
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>

                    {/* Tabla comparativa: mismo dato en formato escaneable. Google
                        la lee bien y en móvil hace scroll horizontal sin romper la página. */}
                    <div className={styles.tablaWrap}>
                        <table className={styles.tabla}>
                            <caption>
                                Comparativa de precios: terrenos baratos en la playa del Litoral Central (El Tabo)
                            </caption>
                            <thead>
                                <tr>
                                    <th scope="col">Terreno</th>
                                    <th scope="col">Superficie</th>
                                    <th scope="col">Contado</th>
                                    <th scope="col">Financiado</th>
                                    <th scope="col">Pie</th>
                                    <th scope="col">Cuota</th>
                                    <th scope="col">Precio m²</th>
                                </tr>
                            </thead>
                            <tbody>
                                {TERRENOS.map((t) => (
                                    <tr key={t.id}>
                                        <th scope="row">{t.proyecto}</th>
                                        <td>{t.superficie}</td>
                                        <td className={styles.tablaPrecio}>{t.contadoTexto}</td>
                                        <td>{t.precioTexto}</td>
                                        <td>{t.pie}</td>
                                        <td>{t.cuota}</td>
                                        <td>{t.precioM2}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <p className={styles.preciosNota}>
                        Precios referenciales en pesos chilenos, vigentes a la fecha de publicación y sujetos a
                        disponibilidad de lotes. El precio por m² se calcula sobre el valor contado. Cotiza para
                        recibir la lista actualizada y los lotes que quedan libres en el plano.
                    </p>
                </div>
            </section>

            {/* ===================== QUÉ INCLUYE EL PRECIO ===================== */}
            <section className={styles.incluidoSection} id="incluye">
                <div className={styles.incluidoOverlay} />
                <div className={styles.incluidoInner}>
                    <header className={styles.sectionHeader}>
                        <div className={styles.kickerRow}>
                            <span className={styles.ruleLeft} />
                            <span className={styles.kicker}>Todo incluido en el precio</span>
                            <span className={styles.ruleRight} />
                        </div>
                        <h2 className={`${styles.sectionTitle} ${styles.sectionTitleLight}`}>
                            Barato, pero urbanizado y listo para construir
                        </h2>
                        <p className={`${styles.sectionDesc} ${styles.sectionDescLight}`}>
                            En los portales un terreno barato suele venir pelado: sin agua, sin luz y sin
                            urbanizar. Acá el valor publicado ya trae todo esto adentro, sin cobros aparte.
                        </p>
                    </header>

                    <div className={styles.incluidoGrid}>
                        {INCLUIDO.map((item, i) => (
                            <div key={item.titulo} className={styles.incluidoCard}>
                                <span className={styles.incluidoIcon}>{ICONOS_INCLUIDO[i]}</span>
                                <h3 className={styles.incluidoTitle}>{item.titulo}</h3>
                                <p className={styles.incluidoDesc}>{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===================== POR QUÉ SON BARATOS ===================== */}
            <section className={styles.porqueSection} id="por-que-baratos">
                <div className={styles.porqueInner}>
                    <header className={styles.sectionHeader}>
                        <div className={styles.kickerRow}>
                            <span className={styles.ruleLeft} />
                            <span className={styles.kicker}>La razón del precio</span>
                            <span className={styles.ruleRight} />
                        </div>
                        <h2 className={`${styles.sectionTitle} ${styles.sectionTitleDark}`}>
                            Por qué nuestros terrenos en la playa son más baratos
                        </h2>
                        <p className={`${styles.sectionDesc} ${styles.sectionDescDark}`}>
                            No es magia ni oferta de temporada: es cómo está armado el negocio. Estas son las
                            cuatro razones por las que el mismo terreno cuesta menos comprándolo con nosotros.
                        </p>
                    </header>

                    <div className={styles.porqueGrid}>
                        {POR_QUE_BARATO.map((item) => (
                            <div key={item.num} className={styles.porqueCard}>
                                <span className={styles.porqueNum}>{item.num}</span>
                                <div>
                                    <h3 className={styles.porqueTitle}>{item.titulo}</h3>
                                    <p className={styles.porqueDesc}>{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===================== UBICACIÓN + MAPA ===================== */}
            <section className={styles.ubicacionSection} id="ubicacion">
                <div className={styles.ubicacionInner}>
                    <header className={styles.sectionHeader}>
                        <div className={styles.kickerRow}>
                            <span className={styles.ruleLeft} />
                            <span className={styles.kicker}>Dónde están</span>
                            <span className={styles.ruleRight} />
                        </div>
                        <h2 className={`${styles.sectionTitle} ${styles.sectionTitleLight}`}>
                            Terrenos en El Tabo, a 8 minutos de la playa
                        </h2>
                        <p className={`${styles.sectionDesc} ${styles.sectionDescLight}`}>
                            Nuestros dos loteos están en la comuna de El Tabo, Región de Valparaíso, a unos 4 km
                            del borde costero y a poco más de una hora de Santiago por la Ruta 78. A minutos
                            tienes El Quisco, Isla Negra, Algarrobo, supermercados y terminal de buses.
                        </p>
                    </header>

                    <LocationMap />

                    {/* El mapa ya trae ambos proyectos con su propia URL de Google
                        Maps, pero escondidas en el popup del marcador. Acá quedan
                        las dos a la vista, cada una a su ficha. */}
                    <div className={styles.mapaLinks}>
                        <a
                            href="https://maps.app.goo.gl/gvsmU1zsa2phRiUD7"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${styles.mapaLink} crm-track-click`}
                            data-crm-name="Google Maps Lomas del Mar - Terrenos Baratos"
                            data-crm-category="Ubicacion"
                        >
                            <span className={styles.mapaPin} style={{ background: '#76d845' }} />
                            Lomas del Mar en Google Maps
                        </a>
                        <a
                            href="https://maps.app.goo.gl/h7gaaTCV1J4F2zCAA"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${styles.mapaLink} crm-track-click`}
                            data-crm-name="Google Maps Arena y Sol - Terrenos Baratos"
                            data-crm-category="Ubicacion"
                        >
                            <span className={styles.mapaPin} style={{ background: '#ffffff' }} />
                            Arena y Sol en Google Maps
                        </a>
                    </div>
                </div>
            </section>

            {/* Lugares cercanos: se reutiliza tal cual el bloque de la homepage. */}
            <NearbyPlaces />

            {/* Testimonios reales: se reutiliza tal cual el bloque de la homepage. */}
            <Testimonials />

            {/* ===================== FORMULARIO ===================== */}
            <section className={styles.formSection} id="cotizar">
                <div className={styles.formBgWrapper}>
                    <img
                        src="https://images.pexels.com/photos/34671904/pexels-photo-34671904.jpeg?auto=compress&cs=tinysrgb&w=2400"
                        alt="Costa del Litoral Central de Chile"
                        className={styles.formBgImage}
                        loading="lazy"
                    />
                </div>
                <div className={styles.formOverlay} />

                <div className={styles.formGrid}>
                    <div className={styles.formInfo}>
                        <h2 className={styles.formTitleBig}>
                            Pide la lista de precios de los terrenos disponibles
                        </h2>
                        <p className={styles.formDesc}>
                            Déjanos tus datos y te enviamos los valores actualizados, los tamaños y qué lotes
                            quedan libres en el plano de El Tabo. Sin costo y sin compromiso.
                        </p>
                        <div className={styles.trustList}>
                            <div className={styles.trustItem}>
                                <span className={styles.checkIcon}><CheckIcon /></span>
                                <span>Respuesta en menos de 24 horas</span>
                            </div>
                            <div className={styles.trustItem}>
                                <span className={styles.checkIcon}><CheckIcon /></span>
                                <span>Precios y disponibilidad reales, sin letra chica</span>
                            </div>
                            <div className={styles.trustItem}>
                                <span className={styles.checkIcon}><CheckIcon /></span>
                                <span>Visita al loteo gratuita y sin compromiso</span>
                            </div>
                            <div className={styles.trustItem}>
                                <span className={styles.checkIcon}><CheckIcon /></span>
                                <span>Financiamiento directo, sin banco y sin importar tu DICOM</span>
                            </div>
                        </div>
                    </div>

                    <CotizaForm
                        formId="form-cotizar-terrenos-baratos"
                        title="Cotiza tu terreno"
                        subtitle="Te enviamos precios y lotes disponibles al instante."
                        submitLabel="Cotizar ahora"
                    />
                </div>
            </section>

            {/* ===================== FAQ ===================== */}
            <section className={styles.faqSection} id="faq">
                <div className={styles.faqInner}>
                    <header className={styles.sectionHeader}>
                        <div className={styles.kickerRow}>
                            <span className={styles.ruleLeft} />
                            <span className={styles.kicker}>Preguntas frecuentes</span>
                            <span className={styles.ruleRight} />
                        </div>
                        <h2 className={`${styles.sectionTitle} ${styles.sectionTitleDark}`}>
                            Todo sobre los terrenos baratos en la playa del Litoral Central
                        </h2>
                        <p className={`${styles.sectionDesc} ${styles.sectionDescDark}`}>
                            Precios, metro cuadrado, financiamiento y distancia a la playa. Las dudas que nos
                            llegan todos los días, respondidas.
                        </p>
                    </header>

                    <FaqAccordion />
                </div>
            </section>

            <HomeNewsletter />
        </>
    )
}
