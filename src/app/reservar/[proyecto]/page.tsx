import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PROYECTOS_RESERVA, clp, lotesLibres, numeroDeLote, refLote } from '@/lib/reservas'
import ReservaForm from './ReservaForm'
import styles from '../reservar.module.css'

// Reserva en línea con Webpay (21-11-2026). Fuera del grupo (main), como
// /cotizar: sin menú ni footer, el único objetivo es reservar. Noindex: se
// llega desde el enlace que manda Ali o un asesor, no desde Google.

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: { absolute: 'Reserva tu terreno | Alimin' },
    robots: { index: false, follow: false },
}

export default async function ReservarPage({
    params,
    searchParams,
}: {
    params: Promise<{ proyecto: string }>
    searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
    const { proyecto: slug } = await params
    const q = await searchParams
    const proyecto = PROYECTOS_RESERVA[slug]
    if (!proyecto) notFound()

    const lotes = await lotesLibres(slug)
    const pedido = numeroDeLote(q.lote)
    const loteInicial = pedido && lotes.some(l => l.n === pedido) ? refLote(proyecto, pedido) : null
    const loteNoDisponible = pedido && !loteInicial ? refLote(proyecto, pedido) : null
    const texto = (v: string | string[] | undefined) => (typeof v === 'string' ? v : undefined)

    return (
        <main className={styles.pagina}>
            <section className={styles.contenedor}>
                <header className={styles.cabecera}>
                    <p className={styles.antetitulo}>Reserva en línea · Webpay</p>
                    <h1 className={styles.titulo}>Reserva tu terreno en {proyecto.nombre}</h1>
                    <p className={styles.bajada}>{proyecto.resumen}</p>
                </header>

                {q.cancelada ? (
                    <p className={styles.aviso}>Anulaste el pago en Webpay. El lote quedó libre: puedes intentarlo de nuevo.</p>
                ) : null}
                {loteNoDisponible ? (
                    <p className={styles.aviso}>El lote {loteNoDisponible} ya no está disponible. Elige otro de la lista.</p>
                ) : null}

                <div className={styles.columnas}>
                    <div className={styles.tarjeta}>
                        <ReservaForm
                            proyecto={{ slug, nombre: proyecto.nombre, monto: proyecto.monto }}
                            lotes={lotes.map(l => l.ref)}
                            loteInicial={loteInicial}
                            origen={texto(q.origen) || null}
                            utm={{
                                utm_source: texto(q.utm_source) || null,
                                utm_medium: texto(q.utm_medium) || null,
                                utm_campaign: texto(q.utm_campaign) || null,
                            }}
                        />
                    </div>

                    <aside className={styles.tarjeta}>
                        <h2 className={styles.subtitulo}>Cómo funciona</h2>
                        <ol className={styles.pasos}>
                            <li>
                                Pagas <b>{clp(proyecto.monto)}</b> con Webpay y el lote queda reservado a tu nombre.
                            </li>
                            <li>Un asesor de Alimin te contacta para acompañarte en los próximos pasos.</li>
                            <li>
                                Tienes <b>10 días corridos</b> para pagar el pie y firmar la promesa de compraventa. Al firmar se pagan $350.000
                                de gastos operacionales.
                            </li>
                            <li>Te creamos un acceso al portal de pagos, donde ves tu terreno, tus pagos, tus documentos y los avances del proyecto.</li>
                            <li>Puedes visitar el proyecto cuando quieras.</li>
                        </ol>
                        <p className={styles.nota}>La reserva no se devuelve si decides no seguir: así lo indica el contrato de reserva.</p>
                    </aside>
                </div>
            </section>
        </main>
    )
}
