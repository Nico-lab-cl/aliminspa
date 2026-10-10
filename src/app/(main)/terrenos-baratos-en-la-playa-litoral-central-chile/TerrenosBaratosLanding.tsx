import Link from 'next/link'
import Image from 'next/image'
import { SITE } from '@/lib/constants'
import type { VarianteLanding } from '@/lib/landing-variante'
import MetaTrackPageView from '@/components/analytics/MetaTrackPageView'
import LocationMap from '@/components/sections/LocationMap'
import NearbyPlaces from '@/components/sections/NearbyPlaces'
import Testimonials from '@/components/sections/Testimonials'
import HomeNewsletter from '@/components/sections/HomeNewsletter'
import CotizaForm from './CotizaForm'
import FaqAccordion from './FaqAccordion'
import HeroVideo from './HeroVideo'
import { TERRENOS, INCLUIDO, POR_QUE_BARATO, PRECIO_DESDE, PIE_DESDE, CUOTA_DESDE } from './terrenos'
import { ICONOS_INCLUIDO } from './iconos'
import styles from './page.module.css'

const CheckIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#76d845" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
)

/**
 * Contenido de la landing de terrenos baratos. Lo usan la página pública y
 * /google/terrenos-baratos-en-la-playa; con `variante` cambian el H1 y la etiqueta del lead.
 */
export default function TerrenosBaratosLanding({ variante }: { variante?: VarianteLanding } = {}) {
    // En /google el formulario va corto (nombre, correo, teléfono y terreno):
    // quien llega del anuncio ya viene de Google y la campaña es solo para la RM.
    const formVariante = variante
        ? {
              sufijoEtiqueta: variante.sufijoLead,
              utmPorDefecto: variante.utm,
              nombrePagina: 'Terrenos Baratos Litoral Central - Google',
              corto: true,
          }
        : {}
    const whatsappUrl = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
        'Hola, vi los terrenos baratos en la playa del Litoral Central en aliminspa.cl y quiero la lista de precios 👋'
    )}`

    return (
        <>
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
                            {variante ? (
                                <>
                                    {variante.h1.texto}{' '}
                                    <span className={styles.highlight}>{variante.h1.destacado}</span>
                                </>
                            ) : (
                                <>
                                    Terrenos baratos en la playa del{' '}
                                    <span className={styles.highlight}>Litoral Central</span> de Chile
                                </>
                            )}
                        </h1>

                        <p className={`${styles.heroSubtitle} ${styles.mOcultar}`}>
                            Lotes urbanizados en El Tabo{' '}
                            <strong className={styles.heroSubtitleStrong}>desde {PRECIO_DESDE}</strong>, a 8 y 10 minutos
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
                        {...formVariante}
                    />
                </div>
            </section>

            {/* ===================== BREADCRUMB ===================== */}
            {/* En /google no: son enlaces que sacan al visitante de la landing. */}
            {!variante && (
            <nav className={styles.breadcrumb} aria-label="Ruta de navegación">
                <div className={styles.breadcrumbInner}>
                    <Link href="/">Inicio</Link>
                    <span aria-hidden="true">›</span>
                    <Link href="/venta-de-terrenos-litoral-central">Venta de terrenos Litoral Central</Link>
                    <span aria-hidden="true">›</span>
                    <span className={styles.breadcrumbCurrent}>Terrenos baratos en la playa</span>
                </div>
            </nav>
            )}

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
                        <p className={`${styles.sectionDesc} ${styles.sectionDescDark} ${styles.mOcultar}`}>
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
                                {/* La foto lleva al formulario: en Clarity era lo más tocado de
                                    la página (19% de los toques) y no hacía nada. */}
                                <Link
                                    href="#cotizar"
                                    className={`${styles.terrenoImgWrap} crm-track-click`}
                                    data-crm-name={`Foto ${t.proyecto} ${t.superficie} - Terrenos Baratos`}
                                    data-crm-category="Cotizacion"
                                    aria-label={`Cotizar el terreno de ${t.superficie} en ${t.proyecto}`}
                                >
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
                                </Link>

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
                                        {/* En /google este enlace sacaba al visitante de la landing. */}
                                        {!variante && (
                                            <Link href={`/proyectos/${t.slug}`} className={styles.btnCardGhost}>
                                                Ver proyecto {t.proyecto}
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>

                    {/* Tabla comparativa: mismo dato en formato escaneable. Google
                        la lee bien y en móvil hace scroll horizontal sin romper la página. */}
                    <div className={`${styles.tablaWrap} ${styles.mOcultar}`}>
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

                    <p className={`${styles.preciosNota} ${styles.mOcultar}`}>
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
                        <p className={`${styles.sectionDesc} ${styles.sectionDescLight} ${styles.mOcultar}`}>
                            En los portales un terreno barato suele venir pelado: sin agua, sin luz y sin
                            urbanizar. Acá el valor publicado ya trae todo esto adentro, sin cobros aparte.
                        </p>
                    </header>

                    <div className={styles.incluidoGrid}>
                        {INCLUIDO.map((item, i) => (
                            <div key={item.titulo} className={styles.incluidoCard}>
                                <span className={styles.incluidoIcon}>{ICONOS_INCLUIDO[i]}</span>
                                <h3 className={styles.incluidoTitle}>{item.titulo}</h3>
                                <p className={`${styles.incluidoDesc} ${styles.mOcultar}`}>{item.desc}</p>
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
                        <p className={`${styles.sectionDesc} ${styles.sectionDescDark} ${styles.mOcultar}`}>
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
                                    <p className={`${styles.porqueDesc} ${styles.mOcultar}`}>{item.desc}</p>
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
                            Terrenos en El Tabo, a minutos de la playa
                        </h2>
                        <p className={`${styles.sectionDesc} ${styles.sectionDescLight} ${styles.mOcultar}`}>
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
            <div className={styles.mOcultar}>
                <NearbyPlaces />
            </div>

            {/* Testimonios reales: se reutiliza tal cual el bloque de la homepage. */}
            <div className={styles.testimoniosCompactos}>
                <Testimonials />
            </div>

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
                        <p className={`${styles.formDesc} ${styles.mOcultar}`}>
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
                        {...formVariante}
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
                        <p className={`${styles.sectionDesc} ${styles.sectionDescDark} ${styles.mOcultar}`}>
                            Precios, metro cuadrado, financiamiento y distancia a la playa. Las dudas que nos
                            llegan todos los días, respondidas.
                        </p>
                    </header>

                    <FaqAccordion />
                </div>
            </section>

            {/* El newsletter compite con el formulario: en /google no va y en celular se oculta. */}
            {!variante && (
                <div className={styles.mOcultar}>
                    <HomeNewsletter />
                </div>
            )}
        </>
    )
}
