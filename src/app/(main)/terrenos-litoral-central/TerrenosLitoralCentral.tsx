import Link from 'next/link'
import Image from 'next/image'
import { SITE } from '@/lib/constants'
import MetaTrackPageView from '@/components/analytics/MetaTrackPageView'
import CotizaForm from '../terrenos-baratos-en-la-playa-litoral-central-chile/CotizaForm'
import { TERRENOS } from '../terrenos-baratos-en-la-playa-litoral-central-chile/terrenos'
import { COMUNAS, FACTORES_PRECIO, CHECKLIST, FAQS } from './contenido'
import styles from './page.module.css'

// Nombre estable de la página para Pixel y CRM (ver CotizaForm).
const NOMBRE_PAGINA = 'Terrenos Litoral Central - SEO'

const INDICE = [
    { id: 'comunas', texto: 'Comunas del Litoral Central' },
    { id: 'precios', texto: 'Cuánto cuesta un terreno' },
    { id: 'revisar', texto: 'Qué revisar antes de comprar' },
    { id: 'pagar', texto: 'Cómo pagarlo' },
    { id: 'proyectos', texto: 'Nuestros terrenos en El Tabo' },
    { id: 'faq', texto: 'Preguntas frecuentes' },
]

/**
 * Pillar page del cluster "terrenos en la playa del Litoral Central". A
 * diferencia de la landing de terrenos baratos (intención de precio), esta es
 * una guía: explica la zona comuna por comuna, cómo se forma el precio y qué
 * revisar, y reparte enlaces hacia las páginas hijas y los proyectos.
 */
export default function TerrenosLitoralCentral() {
    const whatsappUrl = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
        'Hola, vi la guía de terrenos en el Litoral Central en aliminspa.cl y quiero precios 👋'
    )}`

    return (
        <>
            <MetaTrackPageView
                eventName="ViewContent"
                customData={{ content_name: NOMBRE_PAGINA, content_category: 'Real Estate' }}
            />

            {/* ===================== HERO ===================== */}
            <section className={styles.hero} id="inicio">
                <div className={styles.heroInner}>
                    <nav className={styles.breadcrumb} aria-label="Ruta de navegación">
                        <Link href="/">Inicio</Link>
                        <span aria-hidden="true">›</span>
                        <span className={styles.breadcrumbCurrent}>Terrenos en el Litoral Central</span>
                    </nav>

                    <span className={styles.kicker}>Guía 2026 · Región de Valparaíso</span>
                    <h1 className={styles.h1}>
                        Terrenos en la playa del <span className={styles.highlight}>Litoral Central</span>: guía por
                        comuna y precios
                    </h1>
                    <p className={styles.lead}>
                        En el Litoral Central un terreno urbano a minutos de la playa parte en{' '}
                        <strong>$35.000.000 al contado</strong>: 200 m² en El Tabo, con rol propio, agua potable y
                        luz. Acá tienes las comunas de la costa, cuánto cuesta un terreno, qué revisar antes de
                        comprar y cómo pagarlo sin banco.
                    </p>

                    <div className={styles.ctas}>
                        <Link
                            href="#cotizar"
                            className={`${styles.btnPrimary} crm-track-click`}
                            data-crm-name="Cotizar - Hero Pillar Litoral Central"
                            data-crm-category="Cotizacion"
                        >
                            Ver precios y lotes disponibles
                        </Link>
                        <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${styles.btnGhost} crm-track-click`}
                            data-crm-name="WhatsApp - Hero Pillar Litoral Central"
                            data-crm-category="Cotizacion"
                        >
                            Preguntar por WhatsApp
                        </a>
                    </div>

                    <nav className={styles.indice} aria-label="En esta guía">
                        <span className={styles.indiceTitulo}>En esta guía</span>
                        <ol>
                            {INDICE.map((item) => (
                                <li key={item.id}>
                                    <a href={`#${item.id}`}>{item.texto}</a>
                                </li>
                            ))}
                        </ol>
                    </nav>
                </div>
            </section>

            {/* ===================== COMUNAS ===================== */}
            <section className={styles.seccion} id="comunas">
                <div className={styles.inner}>
                    <h2 className={styles.h2}>Las comunas del Litoral Central, de norte a sur</h2>
                    <p className={styles.parrafo}>
                        El Litoral Central es la costa de la Región de Valparaíso más cercana a Santiago. Lo forman
                        seis comunas; nuestros terrenos están en El Tabo, al centro, a minutos de El Quisco, Isla
                        Negra y Algarrobo.
                    </p>

                    <div className={styles.comunasGrid}>
                        {COMUNAS.map((c) => (
                            <article
                                key={c.id}
                                id={`comuna-${c.id}`}
                                className={`${styles.tarjeta} ${c.local ? styles.tarjetaLocal : ''}`}
                            >
                                <span className={`${styles.etiqueta} ${c.local ? styles.etiquetaLocal : ''}`}>
                                    {c.etiqueta}
                                </span>
                                <h3 className={styles.h3}>
                                    {c.href ? <Link href={c.href}>Terrenos en {c.nombre}</Link> : c.nombre}
                                </h3>
                                <p className={styles.tarjetaTexto}>{c.texto}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===================== PRECIOS ===================== */}
            <section className={`${styles.seccion} ${styles.seccionBlanca}`} id="precios">
                <div className={styles.inner}>
                    <h2 className={styles.h2}>Cuánto cuesta un terreno en la playa del Litoral Central</h2>
                    <p className={styles.parrafo}>
                        Estos son nuestros precios publicados en El Tabo. Son terrenos urbanos, con la subdivisión
                        aprobada por la DOM, y el valor ya incluye rol propio, agua potable y luz.
                    </p>

                    <div className={styles.tablaWrap}>
                        <table className={styles.tabla}>
                            <caption>Precios de terrenos en El Tabo, Litoral Central</caption>
                            <thead>
                                <tr>
                                    <th scope="col">Proyecto</th>
                                    <th scope="col">Superficie</th>
                                    <th scope="col">Contado</th>
                                    <th scope="col">Precio m²</th>
                                    <th scope="col">Crédito directo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {TERRENOS.map((t) => (
                                    <tr key={t.id}>
                                        <th scope="row">
                                            <Link href={`/proyectos/${t.slug}`}>{t.proyecto}</Link>
                                        </th>
                                        <td>{t.superficie}</td>
                                        <td className={styles.tablaPrecio}>{t.contadoTexto}</td>
                                        <td>{t.precioM2}</td>
                                        <td>
                                            Pie {t.pie} + {t.plazo.toLowerCase()} de {t.cuota}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className={styles.nota}>
                        &quot;Desde $5.500.000&quot; es el pie del terreno de 200 m² en Lomas del Mar, no el precio
                        total. Precios en pesos chilenos, sujetos a disponibilidad de lotes. ¿Buscas lo más
                        económico? Mira los{' '}
                        <Link href="/terrenos-baratos-en-la-playa-litoral-central-chile">
                            terrenos baratos en la playa del Litoral Central
                        </Link>
                        .
                    </p>

                    <h3 className={styles.h3Seccion}>Qué hace subir o bajar el precio</h3>
                    <div className={styles.factoresGrid}>
                        {FACTORES_PRECIO.map((f) => (
                            <div key={f.titulo} className={styles.tarjeta}>
                                <h4 className={styles.h4}>{f.titulo}</h4>
                                <p className={styles.tarjetaTexto}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===================== QUÉ REVISAR ===================== */}
            <section className={styles.seccion} id="revisar">
                <div className={styles.inner}>
                    <h2 className={styles.h2}>Qué revisar antes de comprar un terreno en la costa</h2>
                    <p className={styles.parrafo}>
                        Cuatro cosas que conviene tener claras antes de pagar el pie, sea con nosotros o con
                        cualquier vendedor.
                    </p>
                    <ol className={styles.checklist}>
                        {CHECKLIST.map((c) => (
                            <li key={c.titulo} className={styles.tarjeta}>
                                <h3 className={styles.h3}>{c.titulo}</h3>
                                <p className={styles.tarjetaTexto}>{c.desc}</p>
                                <Link href={c.href} className={styles.enlaceFlecha}>
                                    {c.enlace} →
                                </Link>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            {/* ===================== CÓMO PAGAR ===================== */}
            <section className={`${styles.seccion} ${styles.seccionBlanca}`} id="pagar">
                <div className={styles.inner}>
                    <h2 className={styles.h2}>Cómo pagar un terreno en la playa sin banco</h2>
                    <div className={styles.pagoGrid}>
                        <div className={styles.tarjeta}>
                            <h3 className={styles.h3}>Al contado</h3>
                            <p className={styles.tarjetaTexto}>
                                Pagas el total y firmas la compraventa en notaría. Es el precio más bajo: desde
                                $35.000.000 por 200 m².
                            </p>
                        </div>
                        <div className={`${styles.tarjeta} ${styles.tarjetaLocal}`}>
                            <h3 className={styles.h3}>Crédito directo Alimin</h3>
                            <p className={styles.tarjetaTexto}>
                                Pagas un pie y el saldo en cuotas fijas en pesos, sin UF, sin banco, sin aval y sin
                                evaluación bancaria. Sirve aunque estés en DICOM. Ejemplo: 200 m² en Lomas del Mar
                                con $5.500.000 de pie y 60 cuotas de $550.000.
                            </p>
                            <Link href="/credito" className={styles.enlaceFlecha}>
                                Simula tu crédito →
                            </Link>
                        </div>
                    </div>
                    <p className={styles.parrafo}>
                        Para comprar necesitas tu cédula de identidad vigente y el pago del pie (o del total si es al
                        contado).
                    </p>
                </div>
            </section>

            {/* ===================== PROYECTOS ===================== */}
            <section className={styles.seccion} id="proyectos">
                <div className={styles.inner}>
                    <h2 className={styles.h2}>Nuestros terrenos en El Tabo</h2>
                    <p className={styles.parrafo}>
                        Los dos proyectos están en la comuna de El Tabo, a unos 4 km del borde costero y a poco más
                        de una hora de Santiago por la Ruta 78.
                    </p>
                    <div className={styles.proyectosGrid}>
                        {[TERRENOS.find((t) => t.id === 'lomas-200'), TERRENOS.find((t) => t.id === 'arena-200')].map(
                            (t) =>
                                t && (
                                    <Link
                                        key={t.id}
                                        href={`/proyectos/${t.slug}`}
                                        className={`${styles.proyecto} crm-track-click`}
                                        data-crm-name={`Ver ${t.proyecto} - Pillar Litoral Central`}
                                        data-crm-category="Proyecto"
                                    >
                                        <div className={styles.proyectoImg}>
                                            <Image
                                                src={t.imagen}
                                                alt={`Terrenos en ${t.proyecto}, El Tabo, Litoral Central`}
                                                fill
                                                sizes="(max-width: 720px) 100vw, 50vw"
                                            />
                                        </div>
                                        <div className={styles.proyectoBody}>
                                            <h3 className={styles.h3}>{t.proyecto}</h3>
                                            <p className={styles.tarjetaTexto}>
                                                A {t.proyecto === 'Arena y Sol' ? 8 : 10} minutos de la playa ·{' '}
                                                {t.proyecto === 'Arena y Sol' ? '200 m²' : '200 y 390 m²'} · desde{' '}
                                                {t.contadoTexto}
                                            </p>
                                            <span className={styles.enlaceFlecha}>Ver proyecto →</span>
                                        </div>
                                    </Link>
                                )
                        )}
                    </div>
                </div>
            </section>

            {/* ===================== FORMULARIO ===================== */}
            <section className={`${styles.seccion} ${styles.seccionBlanca}`} id="cotizar">
                <div className={`${styles.inner} ${styles.formGrid}`}>
                    <div>
                        <h2 className={styles.h2}>Pide los precios y los lotes disponibles</h2>
                        <p className={styles.parrafo}>
                            Te enviamos la lista actualizada y qué terrenos quedan libres en el plano. Un asesor te
                            contacta en menos de 24 horas.
                        </p>
                    </div>
                    <CotizaForm
                        formId="form-pillar-litoral-central"
                        title="Cotiza tu terreno"
                        subtitle="Precios, tamaños y lotes disponibles. Sin costo."
                        submitLabel="Cotizar ahora"
                        etiquetaRespaldo={NOMBRE_PAGINA}
                        nombrePagina={NOMBRE_PAGINA}
                    />
                </div>
            </section>

            {/* ===================== FAQ ===================== */}
            {/* <details> en vez de acordeón con estado: la respuesta va siempre en el
                HTML y la página sigue siendo un componente de servidor. */}
            <section className={styles.seccion} id="faq">
                <div className={styles.inner}>
                    <h2 className={styles.h2}>Preguntas frecuentes sobre terrenos en el Litoral Central</h2>
                    <div className={styles.faqList}>
                        {FAQS.map((f, i) => (
                            <details key={f.q} className={styles.faqItem} open={i === 0}>
                                <summary className={styles.faqPregunta}>
                                    <h3>{f.q}</h3>
                                </summary>
                                <p className={styles.faqRespuesta}>{f.a}</p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>
        </>
    )
}
