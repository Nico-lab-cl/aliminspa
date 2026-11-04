import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SITE } from '@/lib/constants'
import { EBOOKS, LISTA_EBOOKS, type EbookSlug } from '@/lib/ebooks'
import { BreadcrumbSchema } from '@/components/seo/JsonLd'
import EbookForm from '@/components/ebooks/EbookForm'
import styles from '@/components/ebooks/Ebooks.module.css'

interface Props {
    params: Promise<{ slug: string }>
}

export function generateStaticParams() {
    return LISTA_EBOOKS.map((e) => ({ slug: e.slug }))
}

export const dynamicParams = false

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params
    const ebook = EBOOKS[slug as EbookSlug]
    if (!ebook) return {}
    const url = `${SITE.url}/ebooks/${ebook.slug}`
    return {
        title: ebook.metaTitulo,
        description: ebook.metaDescripcion,
        alternates: { canonical: url },
        openGraph: {
            title: ebook.metaTitulo,
            description: ebook.metaDescripcion,
            url,
            siteName: SITE.name,
            type: 'website',
            images: [{ url: `${SITE.url}${ebook.portada}`, alt: ebook.portadaAlt }],
        },
    }
}

export default async function EbookPage({ params }: Props) {
    const { slug } = await params
    const ebook = EBOOKS[slug as EbookSlug]
    if (!ebook) notFound()
    const otro = LISTA_EBOOKS.find((e) => e.slug !== ebook.slug)!

    return (
        <section className={styles.pagina}>
            <BreadcrumbSchema
                items={[
                    { name: 'Inicio', url: SITE.url },
                    { name: ebook.titulo, url: `${SITE.url}/ebooks/${ebook.slug}` },
                ]}
            />
            <div className={styles.contenedor}>
                <div className={styles.intro}>
                    <p className={styles.antetitulo}>Guía gratis · {ebook.antetitulo}</p>
                    <h1>{ebook.titulo}</h1>
                    <p className={styles.bajada}>{ebook.bajada}</p>
                    <ul className={styles.etiquetas} aria-label="Temas de la guía">
                        {ebook.etiquetas.map((t) => (
                            <li key={t}>{t}</li>
                        ))}
                    </ul>

                    <div className={styles.portada}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={ebook.portada} alt={ebook.portadaAlt} width={794} height={1123} />
                        <div className={styles.portadaTexto}>
                            <small>Guía gratuita</small>
                            <strong>{ebook.titulo}</strong>
                        </div>
                    </div>

                    <div className={styles.indice}>
                        <h2>Qué vas a encontrar</h2>
                        <ol>
                            {ebook.indice.map((c) => (
                                <li key={c.titulo}>
                                    <strong>{c.titulo}</strong>
                                    {c.detalle && <span>{c.detalle}</span>}
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>

                <div className={styles.tarjetaForm} id="descargar">
                    <h2>Descárgala gratis</h2>
                    <p>Déjanos tus datos y la descargas al tiro. {ebook.paginas} páginas, en PDF.</p>
                    <EbookForm ebook={ebook} ubicacion="pagina" />
                </div>
            </div>

            <p className={styles.otro}>
                También te puede servir: <Link href={`/ebooks/${otro.slug}`}>{otro.titulo}</Link>
            </p>
        </section>
    )
}
