import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Archivo de conversiones para la carga programada de Google Ads
 * (Herramientas → Conversiones → Cargas → Programaciones, origen HTTPS).
 *
 * Google Ads descarga esta URL una vez al día con usuario y contraseña, y
 * suma como conversión importada cada lead del sitio que trajo gclid. Así
 * cuenta también los leads de quienes no aceptaron cookies de marketing.
 * Si una fila ya se subió, Google la reconoce como repetida y no la cuenta
 * dos veces, por eso se manda la ventana completa en cada descarga.
 *
 * Solo van el gclid, el nombre de la conversión y la hora: ni nombre, ni
 * correo ni teléfono.
 *
 * Variables de entorno:
 * - GOOGLE_ADS_FEED_USER / GOOGLE_ADS_FEED_PASSWORD: las mismas que se cargan
 *   en la programación de Google Ads. Sin ellas la ruta responde 404.
 * - GOOGLE_ADS_IMPORT_CONVERSION: nombre exacto de la acción de conversión
 *   importada en Google Ads (por defecto "Lead web (GCLID)").
 */

export const dynamic = 'force-dynamic'

/** Google acepta clics de hasta 90 días; 60 deja margen. */
const DIAS = 60

function autorizado(request: NextRequest, usuario: string, clave: string) {
    const auth = request.headers.get('authorization') || ''
    if (!auth.startsWith('Basic ')) return false
    const [u, ...resto] = Buffer.from(auth.slice(6), 'base64').toString('utf8').split(':')
    return u === usuario && resto.join(':') === clave
}

/** "2026-10-27 15:04:05" en hora de Chile, que es la zona declarada en el archivo. */
function horaChile(fecha: Date) {
    const partes = Object.fromEntries(
        new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Santiago',
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hourCycle: 'h23',
        }).formatToParts(fecha).map(p => [p.type, p.value])
    )
    return `${partes.year}-${partes.month}-${partes.day} ${partes.hour}:${partes.minute}:${partes.second}`
}

export async function GET(request: NextRequest) {
    const usuario = process.env.GOOGLE_ADS_FEED_USER
    const clave = process.env.GOOGLE_ADS_FEED_PASSWORD
    if (!usuario || !clave) return new NextResponse('Not found', { status: 404 })
    if (!autorizado(request, usuario, clave)) {
        return new NextResponse('Unauthorized', {
            status: 401,
            headers: { 'WWW-Authenticate': 'Basic realm="conversiones"' },
        })
    }

    const conversion = process.env.GOOGLE_ADS_IMPORT_CONVERSION || 'Lead web (GCLID)'
    const desde = new Date(Date.now() - DIAS * 24 * 60 * 60 * 1000)

    const leads = await prisma.lead.findMany({
        // Los del formulario de Google (fuente google-formulario) ya los cuenta Google.
        where: { gclid: { not: null }, fuente: 'web', createdAt: { gte: desde } },
        select: { gclid: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
    })

    const filas = [
        'Parameters:TimeZone=America/Santiago',
        'Google Click ID,Conversion Name,Conversion Time',
        ...leads.map(l => `${l.gclid},${conversion},${horaChile(l.createdAt)}`),
    ]

    return new NextResponse(filas.join('\n') + '\n', {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Cache-Control': 'no-store',
        },
    })
}
