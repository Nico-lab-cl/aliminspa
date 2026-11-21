import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { SITE } from '@/lib/constants'
import { PROYECTOS_RESERVA, clp, refLote } from '@/lib/reservas'
import styles from '../reservar.module.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: { absolute: 'Tu reserva | Alimin' },
    robots: { index: false, follow: false },
}

const MENSAJES: Record<string, { titulo: string; texto: string }> = {
    rechazada: {
        titulo: 'El pago no se aprobó',
        texto: 'Webpay rechazó el pago y no se hizo ningún cobro. El lote quedó libre: puedes intentarlo de nuevo con otra tarjeta.',
    },
    anulada: { titulo: 'Anulaste el pago', texto: 'No se hizo ningún cobro. Puedes intentarlo de nuevo cuando quieras.' },
    conflicto: {
        titulo: 'Ese lote se reservó justo antes',
        texto: 'Recibimos tu pago, pero otra persona terminó de reservar el mismo lote un momento antes. Postventa ya está avisado y te contacta para ofrecerte otro lote o devolverte el pago.',
    },
    error: {
        titulo: 'No pudimos confirmar el pago',
        texto: 'Si Webpay te hizo un cobro, escríbenos con tu folio y lo revisamos de inmediato.',
    },
}

export default async function ResultadoReserva({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
    const q = await searchParams
    const estado = typeof q.estado === 'string' ? q.estado : 'error'
    const folio = typeof q.folio === 'string' ? q.folio.slice(0, 20) : null
    const reserva = folio ? await prisma.reservaWeb.findUnique({ where: { folio } }).catch(() => null) : null
    const proyecto = reserva ? PROYECTOS_RESERVA[reserva.proyecto] : null
    const whatsapp = `https://wa.me/${SITE.whatsapp}`

    if (estado === 'ok' && reserva?.estado === 'pagada' && proyecto) {
        return (
            <main className={styles.pagina}>
                <section className={styles.resultado}>
                    <p className={styles.antetitulo}>Reserva confirmada</p>
                    <h1 className={styles.titulo}>¡Listo, {reserva.nombre.split(' ')[0]}! 🎉</h1>
                    <p className={styles.bajada}>
                        Reservaste el lote {refLote(proyecto, reserva.lote)} de {proyecto.nombre}. Te mandamos el comprobante a{' '}
                        {reserva.email}.
                    </p>
                    <div className={styles.tarjeta} style={{ marginTop: 20 }}>
                        <p>
                            <b>Monto:</b> {clp(reserva.monto)} · <b>Folio:</b> {reserva.folio}
                            {reserva.codigo_autorizacion ? (
                                <>
                                    {' '}
                                    · <b>Autorización:</b> {reserva.codigo_autorizacion}
                                </>
                            ) : null}
                        </p>
                        <ol className={styles.pasos}>
                            <li>Un asesor de Alimin te contacta para acompañarte en los próximos pasos.</li>
                            <li>Tienes 10 días corridos para pagar el pie y firmar la promesa de compraventa.</li>
                            <li>Te creamos un acceso al portal de pagos con tu terreno, tus pagos, tus documentos y los avances del proyecto.</li>
                            <li>Puedes visitar el proyecto cuando quieras.</li>
                        </ol>
                    </div>
                </section>
            </main>
        )
    }

    const m = MENSAJES[estado] || MENSAJES.error
    const reintentar = reserva && proyecto && estado !== 'conflicto' ? `/reservar/${reserva.proyecto}?lote=${refLote(proyecto, reserva.lote)}` : null

    return (
        <main className={styles.pagina}>
            <section className={styles.resultado}>
                <h1 className={styles.titulo}>{m.titulo}</h1>
                <p className={styles.bajada}>{m.texto}</p>
                {folio ? <p className={styles.ayuda}>Folio: {folio}</p> : null}
                {reintentar ? (
                    <a className={styles.enlace} href={reintentar}>
                        Intentar de nuevo
                    </a>
                ) : null}
                <div>
                    <a className={styles.enlace} href={whatsapp}>
                        Escríbenos por WhatsApp
                    </a>
                </div>
            </section>
        </main>
    )
}
