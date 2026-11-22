import type { Metadata } from 'next'
import { SITE } from '@/lib/constants'
import { leerEnlacePago } from '@/lib/reservas-enlace'
import PagarBoton from './PagarBoton'
import styles from '../../reservar/reservar.module.css'

// Enlace de pago que manda Ali con los datos ya pedidos en el chat
// (lib/reservas-enlace.ts). La persona solo revisa, acepta y paga.

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: { absolute: 'Paga tu reserva | Alimin' },
    robots: { index: false, follow: false },
}

/** +56912345678 → +56 9 **** 5678: el enlace puede reenviarse. */
const celularOculto = (c: string) => c.replace(/^\+56(9)\d{4}(\d{4})$/, '+56 $1 **** $2')

export default async function PagarPage({
    params,
    searchParams,
}: {
    params: Promise<{ codigo: string }>
    searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
    const { codigo } = await params
    const q = await searchParams
    const d = await leerEnlacePago(codigo.slice(0, 40))
    const whatsapp = `https://wa.me/${SITE.whatsapp}`

    if (!d || d.vencido || d.r.estado === 'pagada' || d.r.estado === 'conflicto') {
        const titulo = !d
            ? 'Este enlace no existe'
            : d.r.estado === 'pagada'
              ? 'Esta reserva ya está pagada 🎉'
              : d.r.estado === 'conflicto'
                ? 'Revisamos tu pago'
                : 'Este enlace venció'
        return (
            <main className={styles.pagina}>
                <section className={styles.resultado}>
                    <h1 className={styles.titulo}>{titulo}</h1>
                    <p className={styles.bajada}>
                        {d?.r.estado === 'pagada'
                            ? `Te mandamos el comprobante a ${d.r.email}.`
                            : 'Escríbenos y te ayudamos con tu reserva.'}
                    </p>
                    <a className={styles.enlace} href={whatsapp}>
                        Escríbenos por WhatsApp
                    </a>
                </section>
            </main>
        )
    }

    const filas: [string, string][] = [
        ['Proyecto', d.proyecto],
        ['Lote', d.lote],
        ['Reserva', d.monto],
        ['Correo', d.r.email],
        ['Celular', celularOculto(d.r.celular)],
    ]

    return (
        <main className={styles.pagina}>
            <section className={styles.resultado}>
                <p className={styles.antetitulo}>Reserva lista para pagar</p>
                <h1 className={styles.titulo}>Hola, {d.r.nombre.split(' ')[0]} 👋</h1>
                <p className={styles.bajada}>Te dejamos la reserva lista. Solo pon tu RUT, acepta y pagas con Webpay.</p>
                {q.cancelada ? <p className={styles.aviso}>Anulaste el pago en Webpay. Puedes intentarlo de nuevo.</p> : null}
                <div className={styles.tarjeta} style={{ marginTop: 18 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
                        <tbody>
                            {filas.map(([k, v]) => (
                                <tr key={k}>
                                    <td style={{ padding: '6px 0', color: '#52606d' }}>{k}</td>
                                    <td style={{ padding: '6px 0', fontWeight: 700, textAlign: 'right' }}>{v}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <PagarBoton id={d.r.id} monto={d.monto} nombre={d.r.nombre} />
                    <p className={styles.ayuda}>
                        ¿Algún dato está mal? <a href={whatsapp}>Escríbenos</a> y te mandamos un enlace nuevo.
                    </p>
                </div>
            </section>
        </main>
    )
}
