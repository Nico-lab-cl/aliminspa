import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PROYECTOS_RESERVA, clp, lotesLibres, numeroDeLote, refLote } from '@/lib/reservas'
import { leerLoteLomas, lotesLibresLomas, refLomas } from '@/lib/reservas-lomas'
import ReservaForm, { type LoteOpcion } from './ReservaForm'
import styles from '../reservar.module.css'

// Reserva en línea con Webpay (21-11-2026). Fuera del grupo (main), como
// /cotizar: sin menú ni footer, el único objetivo es reservar. Noindex: se
// llega desde el enlace que manda Ali o un asesor, no desde Google.
//   - arena-y-sol: lotes del plano y Webpay de este sitio (lib/reservas.ts).
//   - lomas-del-mar: lotes, monto y Webpay de aliminlomasdelmar.com
//     (lib/reservas-lomas.ts).

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: { absolute: 'Reserva tu terreno | Alimin' },
    robots: { index: false, follow: false },
}

interface Datos {
    nombre: string
    resumen: string
    lotes: LoteOpcion[]
    loteInicial: string | null
    noDisponible: string | null
    error?: string
}

async function datosArena(slug: string, lote: unknown): Promise<Datos | null> {
    const p = PROYECTOS_RESERVA[slug]
    if (!p) return null
    const libres = await lotesLibres(slug)
    const pedido = numeroDeLote(lote)
    const inicial = pedido && libres.some(l => l.n === pedido) ? refLote(p, pedido) : null
    return {
        nombre: p.nombre,
        resumen: p.resumen,
        lotes: libres.map(l => ({ ref: l.ref, corto: l.ref, etiqueta: `Lote ${l.ref}`, monto: p.monto })),
        loteInicial: inicial,
        noDisponible: pedido && !inicial ? refLote(p, pedido) : null,
    }
}

async function datosLomas(lote: unknown): Promise<Datos> {
    const base = {
        nombre: 'Lomas del Mar',
        resumen:
            'Terrenos de 200 y 390 m² en El Tabo, a 10 minutos de la playa · crédito directo en pesos, sin banco ni aval',
    }
    try {
        const libres = await lotesLibresLomas()
        const pedido = leerLoteLomas(lote)
        const ref = pedido?.etapa ? refLomas(pedido.etapa, pedido.numero) : null
        const inicial = ref && libres.some(l => l.ref === ref) ? ref : null
        return {
            ...base,
            lotes: libres.map(l => ({
                ref: l.ref,
                corto: l.numero,
                etiqueta: `${l.etiqueta}${l.area ? ` (${Math.round(l.area)} m²)` : ''}`,
                grupo: `Etapa ${l.etapa}`,
                monto: l.reserva,
            })),
            loteInicial: inicial,
            noDisponible: ref && !inicial ? ref.replace(/^E(\d)-/, 'Etapa $1 · Lote ') : null,
        }
    } catch (error) {
        console.error('[reservar] No se pudieron leer los lotes de Lomas del Mar:', error)
        return { ...base, lotes: [], loteInicial: null, noDisponible: null, error: 'No pudimos cargar los lotes en este momento. Intenta de nuevo en unos minutos.' }
    }
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
    const d = slug === 'lomas-del-mar' ? await datosLomas(q.lote) : await datosArena(slug, q.lote)
    if (!d) notFound()

    const texto = (v: string | string[] | undefined) => (typeof v === 'string' ? v : undefined)
    const montos = [...new Set(d.lotes.map(l => l.monto))]
    const monto = montos.length === 1 ? clp(montos[0]) : 'el monto de reserva de tu lote'

    return (
        <main className={styles.pagina}>
            <section className={styles.contenedor}>
                <header className={styles.cabecera}>
                    <p className={styles.antetitulo}>Reserva en línea · Webpay</p>
                    <h1 className={styles.titulo}>Reserva tu terreno en {d.nombre}</h1>
                    <p className={styles.bajada}>{d.resumen}</p>
                </header>

                {q.cancelada ? (
                    <p className={styles.aviso}>Anulaste el pago en Webpay. El lote quedó libre: puedes intentarlo de nuevo.</p>
                ) : null}
                {d.noDisponible ? (
                    <p className={styles.aviso}>{d.noDisponible} ya no está disponible. Elige otro de la lista.</p>
                ) : null}
                {d.error ? <p className={styles.aviso}>{d.error}</p> : null}

                <div className={styles.columnas}>
                    <div className={styles.tarjeta}>
                        <ReservaForm
                            proyecto={{ slug, nombre: d.nombre }}
                            lotes={d.lotes}
                            loteInicial={d.loteInicial}
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
                                Pagas <b>{monto}</b> con Webpay y el lote queda reservado a tu nombre.
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
