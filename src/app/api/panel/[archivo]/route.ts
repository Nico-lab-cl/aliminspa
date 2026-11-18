import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { csv, fechaChile, haceDias, origenDe, rechazoDelPanel, visitasDesde } from '@/lib/panel'

/**
 * Datos para el panel de Looker Studio, como CSV con cifras sumadas (sin
 * nombres, correos ni teléfonos). Los descarga la hoja de Google con
 * scripts/panel-looker/actualizar-panel.gs, con "Authorization: Bearer PANEL_KEY".
 *
 *   /api/panel/visitas.csv  contador propio sin cookies, por día y página
 *   /api/panel/leads.csv    leads de los formularios del sitio, por día y origen
 *   /api/panel/meta.csv     gasto y resultados de Meta Ads, por día y campaña
 */

export const dynamic = 'force-dynamic'

const DIAS = 400

export async function GET(request: NextRequest, { params }: { params: Promise<{ archivo: string }> }) {
    const rechazo = rechazoDelPanel(request)
    if (rechazo) return rechazo

    const { archivo } = await params
    try {
        if (archivo === 'visitas.csv') return await visitas()
        if (archivo === 'leads.csv') return await leads()
        if (archivo === 'meta.csv') return await meta()
    } catch (error) {
        console.error(`[panel] Falló ${archivo}:`, error)
        return new NextResponse('Error', { status: 500 })
    }
    return new NextResponse('Not found', { status: 404 })
}

async function visitas() {
    const filas = await visitasDesde(haceDias(DIAS))
    return csv(
        ['fecha', 'pagina', 'origen', 'fuente', 'medio', 'campana', 'dispositivo', 'vistas', 'entradas'],
        filas.map((f) => [
            f.fecha.toISOString().slice(0, 10),
            f.ruta,
            f.origen,
            f.fuente,
            f.medio,
            f.campana,
            f.dispositivo,
            f.vistas,
            f.entradas,
        ])
    )
}

/** Pruebas internas que no son leads reales (como el "PRUEBA" del 10-oct). */
const ES_PRUEBA = /\b(prueba|test|testing)\b/i

async function leads() {
    const desde = new Date(Date.now() - DIAS * 24 * 60 * 60 * 1000)
    const filas = await prisma.lead.findMany({
        where: { createdAt: { gte: desde } },
        // nombre y email solo para descartar pruebas; no salen en el archivo.
        select: {
            nombre: true,
            email: true,
            proyecto: true,
            fuente: true,
            como_conocio: true,
            utm_source: true,
            utm_medium: true,
            utm_campaign: true,
            gclid: true,
            gbraid: true,
            wbraid: true,
            createdAt: true,
        },
    })

    const suma = new Map<string, number>()
    for (const l of filas) {
        if (ES_PRUEBA.test(l.nombre) || ES_PRUEBA.test(l.email)) continue
        const { origen } =
            l.fuente === 'google-formulario'
                ? { origen: 'Google Ads' }
                : origenDe({
                      utm_source: l.utm_source,
                      utm_medium: l.utm_medium,
                      clicGoogle: Boolean(l.gclid || l.gbraid || l.wbraid),
                  })
        const clave = JSON.stringify([
            fechaChile(l.createdAt),
            origen,
            l.proyecto || '',
            l.fuente || '',
            (l.utm_source || '').toLowerCase(),
            (l.utm_medium || '').toLowerCase(),
            l.utm_campaign || '',
            l.como_conocio || '',
        ])
        suma.set(clave, (suma.get(clave) || 0) + 1)
    }

    const salida = [...suma.entries()].map(([clave, n]) => [...(JSON.parse(clave) as string[]), n]).sort((a, b) => String(a[0]).localeCompare(String(b[0])))
    return csv(['fecha', 'origen', 'proyecto', 'formulario', 'utm_source', 'utm_medium', 'utm_campaign', 'como_conocio', 'leads'], salida)
}

/* ------------------------------------------------------------------ Meta */

const META_API = 'https://graph.facebook.com/v21.0'
/** Misma cuenta por defecto que el CRM (CRM-Alimin/src/lib/resumenesWhatsapp.ts). */
const CUENTA_META_POR_DEFECTO = '343467944575694'

const ACCIONES = {
    leads_formulario: ['onsite_conversion.lead_grouped', 'leadgen_grouped', 'lead'],
    leads_web: ['offsite_conversion.fb_pixel_lead'],
    conversaciones: ['onsite_conversion.messaging_conversation_started_7d'],
}

type Accion = { action_type: string; value: string }

function accion(actions: Accion[] | undefined, nombres: string[]): number {
    for (const n of nombres) {
        const a = (actions || []).find((x) => x.action_type === n)
        if (a) return Number(a.value) || 0
    }
    return 0
}

let cacheMeta: { hasta: number; respuesta: string } | null = null

async function meta() {
    if (cacheMeta && cacheMeta.hasta > Date.now()) {
        return new NextResponse(cacheMeta.respuesta, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Cache-Control': 'no-store' } })
    }

    const token = process.env.META_ADS_TOKEN
    if (!token) return new NextResponse('Falta META_ADS_TOKEN', { status: 503 })
    const cuenta = process.env.META_AD_ACCOUNT_ID || CUENTA_META_POR_DEFECTO

    const rango = encodeURIComponent(JSON.stringify({ since: haceDias(DIAS), until: fechaChile() }))
    let url: string | null =
        `${META_API}/act_${cuenta}/insights?level=campaign&time_increment=1&time_range=${rango}&limit=500` +
        `&fields=campaign_id,campaign_name,objective,spend,impressions,reach,inline_link_clicks,actions` +
        `&access_token=${encodeURIComponent(token)}`

    const filas: unknown[][] = []
    for (let pagina = 0; url && pagina < 100; pagina++) {
        const r: Response = await fetch(url, { cache: 'no-store' })
        const datos = await r.json()
        if (!r.ok || datos.error) throw new Error(`Meta respondió ${r.status}: ${datos.error?.message || 'sin detalle'}`)
        for (const f of datos.data || []) {
            filas.push([
                f.date_start,
                f.campaign_id,
                f.campaign_name,
                f.objective || '',
                Number(f.spend) || 0,
                Number(f.impressions) || 0,
                Number(f.reach) || 0,
                Number(f.inline_link_clicks) || 0,
                accion(f.actions, ACCIONES.leads_formulario),
                accion(f.actions, ACCIONES.leads_web),
                accion(f.actions, ACCIONES.conversaciones),
            ])
        }
        url = datos.paging?.next || null
    }

    const respuesta = csv(
        ['fecha', 'campana_id', 'campana', 'objetivo', 'gasto', 'impresiones', 'alcance', 'clics_enlace', 'leads_formulario', 'leads_web', 'conversaciones'],
        filas
    )
    cacheMeta = { hasta: Date.now() + 60 * 60 * 1000, respuesta: await respuesta.clone().text() }
    return respuesta
}
