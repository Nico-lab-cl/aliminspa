import { NextRequest } from 'next/server'
import { horaChile, leadsConGclid, rechazoDeDescarga, respuestaCsv } from '@/lib/google-ads-feed'

/**
 * Archivo de conversiones en el formato de las cargas clásicas de Google Ads
 * (Objetivos → Conversiones → Cargas), con la zona horaria en la primera fila
 * y el nombre de la conversión en cada una. La carga programada del
 * Administrador de datos usa /api/google-ads/conversiones.csv. Ver
 * src/lib/google-ads-feed.ts.
 *
 * GOOGLE_ADS_IMPORT_CONVERSION: nombre exacto de la acción de conversión
 * importada (por defecto "Lead web (GCLID)").
 */

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const rechazo = rechazoDeDescarga(request)
    if (rechazo) return rechazo

    const conversion = process.env.GOOGLE_ADS_IMPORT_CONVERSION || 'Lead web (GCLID)'
    const leads = await leadsConGclid()

    return respuestaCsv([
        'Parameters:TimeZone=America/Santiago',
        'Google Click ID,Conversion Name,Conversion Time',
        ...leads.map(l => `${l.gclid},${conversion},${horaChile(l.createdAt)}`),
    ])
}
