import type { Metadata } from 'next'
import Link from 'next/link'
import { headers } from 'next/headers'
import { after } from 'next/server'
import { notFound } from 'next/navigation'
import { SITE } from '@/lib/constants'
import { BROCHURES, LISTA_BROCHURES, imagenesDe, type BrochureSlug } from '@/lib/brochures'
import { avisarBrochureAbierto } from '@/lib/brochures-server'
import BrochureMedicion from '@/components/brochures/BrochureMedicion'
import styles from './brochure.module.css'

/**
 * Brochure de un proyecto, para mandarlo por Instagram y Facebook.
 *
 * Es dinámica porque lee `r` (la conversación del CRM) para avisarle al
 * asesor que el cliente lo abrió. Ver lib/brochures-server.ts.
 */

interface Props {
    params: Promise<{ slug: string }>
    searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params
    const b = BROCHURES[slug as BrochureSlug]
    if (!b) return {}
    // El layout ya agrega "| Alimin Inmobiliaria".
    const titulo = `Brochure ${b.proyecto}`
    const url = `${SITE.url}/brochure/${b.slug}`
    return {
        title: titulo,
        description: b.bajada,
        alternates: { canonical: url },
        // Se llega por enlace directo desde un mensaje; no compite en Google
        // con las páginas de proyecto.
        robots: { index: false, follow: true },
        // La vista previa del enlace en Messenger e Instagram usa esta imagen.
        openGraph: {
            title: `${b.proyecto}: brochure`,
            description: b.bajada,
            url,
            siteName: SITE.name,
            type: 'website',
            images: [{ url: `${SITE.url}${b.portada}`, width: 1200, height: 675, alt: `Brochure ${b.proyecto}` }],
        },
    }
}

export default async function BrochurePage({ params, searchParams }: Props) {
    const { slug } = await params
    const b = BROCHURES[slug as BrochureSlug]
    if (!b) notFound()

    const q = await searchParams
    const ref = typeof q.r === 'string' ? q.r : undefined
    const ua = (await headers()).get('user-agent') || ''
    // Después de responder, para no demorar la página.
    after(() => avisarBrochureAbierto(ref, b.slug, ua))

    const paginas = imagenesDe(b)
    const otro = LISTA_BROCHURES.find((x) => x.slug !== b.slug)!

    return (
        <section className={styles.pagina}>
            <BrochureMedicion slug={b.slug} />

            <header className={styles.cabecera}>
                <p className={styles.antetitulo}>Brochure</p>
                <h1>{b.proyecto}</h1>
                <p className={styles.bajada}>{b.bajada}</p>
                <div className={styles.acciones}>
                    <Link href={b.agendar} className={styles.boton} data-medir="brochure_agendar">
                        Agendar visita
                    </Link>
                    <a href={b.pdf} className={styles.botonSecundario} download data-medir="brochure_pdf">
                        Descargar PDF
                    </a>
                </div>
            </header>

            <div className={styles.paginas}>
                {paginas.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        key={src}
                        src={src}
                        alt={`${b.proyecto}, página ${i + 1} de ${paginas.length}`}
                        width={1600}
                        height={900}
                        loading={i < 2 ? 'eager' : 'lazy'}
                        decoding="async"
                        className={styles.hoja}
                        {...(i === paginas.length - 1 ? { 'data-ultima-pagina': '' } : {})}
                    />
                ))}
            </div>

            <footer className={styles.cierre}>
                <h2>¿Te gustaría conocerlo en persona?</h2>
                <p>Agenda tu visita y un asesor te acompaña en el terreno.</p>
                <div className={styles.acciones}>
                    <Link href={b.agendar} className={styles.boton} data-medir="brochure_agendar">
                        Agendar visita
                    </Link>
                    <Link href={b.proyectoUrl} className={styles.botonSecundario}>
                        Ver el proyecto
                    </Link>
                </div>
                <p className={styles.otro}>
                    También tenemos <Link href={`/brochure/${otro.slug}`}>{otro.proyecto}</Link>.
                </p>
            </footer>
        </section>
    )
}
