import { NextRequest } from 'next/server'
import { horaChile, leadsConGclid, rechazoDeDescarga, respuestaCsv } from '@/lib/google-ads-feed'

/**
 * Archivo de conversiones para la conexión HTTPS del Administrador de datos de
 * Google Ads, que descarga esta URL una vez al día. Ese importador exige que
 * la URL termine en .csv, que la primera fila sea el encabezado y que la hora
 * traiga la zona. La acción de conversión ("Lead web (GCLID)") se elige en la
 * conexión, no va en el archivo. El id del lead sirve para que Google no cuente
 * dos veces el mismo lead, porque cada descarga repite los últimos 60 días.
 * Ver src/lib/google-ads-feed.ts.
 */

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const rechazo = rechazoDeDescarga(request)
    if (rechazo) return rechazo

    const leads = await leadsConGclid()

    return respuestaCsv([
        'gclid,conversion_time,transaction_id',
        ...leads.map(l => `${l.gclid},${horaChile(l.createdAt, true)},${l.id}`),
    ])
}
