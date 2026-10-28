import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Lo que comparten los dos archivos de conversiones para Google Ads
 * (/api/google-ads/conversiones y /api/google-ads/conversiones.csv).
 *
 * Google Ads descarga el archivo una vez al día con usuario y contraseña, y
 * suma como conversión importada cada lead del sitio que trajo gclid. Así
 * cuenta también los leads de quienes no aceptaron cookies de marketing.
 * Solo viajan el gclid, la hora y el id interno del lead: ni nombre, ni
 * correo ni teléfono.
 *
 * Variables de entorno: GOOGLE_ADS_FEED_USER / GOOGLE_ADS_FEED_PASSWORD (las
 * mismas que se cargan en Google Ads; sin ellas las rutas responden 404).
 */

/** Google acepta clics de hasta 90 días; 60 deja margen. */
const DIAS = 60

/** Devuelve la respuesta de error si la descarga no está autorizada, o null si puede seguir. */
export function rechazoDeDescarga(request: NextRequest): NextResponse | null {
    const usuario = process.env.GOOGLE_ADS_FEED_USER
    const clave = process.env.GOOGLE_ADS_FEED_PASSWORD
    if (!usuario || !clave) return new NextResponse('Not found', { status: 404 })

    const auth = request.headers.get('authorization') || ''
    const [u, ...resto] = auth.startsWith('Basic ')
        ? Buffer.from(auth.slice(6), 'base64').toString('utf8').split(':')
        : ['']
    if (u === usuario && resto.join(':') === clave) return null

    return new NextResponse('Unauthorized', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="conversiones"' },
    })
}

/** Leads del sitio con gclid de los últimos 60 días, del más antiguo al más nuevo. */
export function leadsConGclid() {
    return prisma.lead.findMany({
        // Los del formulario de Google (fuente google-formulario) ya los cuenta Google.
        where: { gclid: { not: null }, fuente: 'web', createdAt: { gte: new Date(Date.now() - DIAS * 24 * 60 * 60 * 1000) } },
        select: { id: true, gclid: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
    })
}

/**
 * Hora de Chile como "2026-10-27 15:04:05", o "2026-10-27 15:04:05-03:00" con
 * `conZona` (el Administrador de datos exige la zona en cada fila).
 */
export function horaChile(fecha: Date, conZona = false) {
    const partes = Object.fromEntries(
        new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Santiago',
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hourCycle: 'h23',
            timeZoneName: 'longOffset',
        }).formatToParts(fecha).map(p => [p.type, p.value])
    )
    const hora = `${partes.year}-${partes.month}-${partes.day} ${partes.hour}:${partes.minute}:${partes.second}`
    if (!conZona) return hora
    const zona = String(partes.timeZoneName).replace('GMT', '') || '+00:00'
    return hora + zona
}

export function respuestaCsv(filas: string[]) {
    return new NextResponse(filas.join('\n') + '\n', {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Cache-Control': 'no-store',
        },
    })
}
