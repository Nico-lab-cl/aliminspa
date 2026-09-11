import { NextRequest, NextResponse } from 'next/server'
import { writeFile, readFile } from 'fs/promises'
import path from 'path'

/**
 * Guarda la numeración de los lotes del plano cenital.
 *
 * Escribe public/lomas3d/plano-lotes.json desde el editor de
 * /agendar-visita?plano=1&editor=1. Solo llegan los campos que se editan
 * —número, etapa, estado y zona—; la geometría de cada lote la pone
 * scripts/importar-plano-cenital.js y no se toca desde el navegador.
 *
 * Solo existe en desarrollo: en producción responde 404, porque una ruta que
 * escribe archivos del servidor no tiene nada que hacer en el sitio público.
 */

const ZONAS = ['lote', 'estacionamiento', 'sanitario', 'areaverde', 'vendido', 'reservado', 'descartado']

interface Edicion {
    id: number
    n: number | null
    stage: number | null
    sold: boolean
    tipo: string
    area: number | null
}

export async function POST(request: NextRequest) {
    if (process.env.NODE_ENV === 'production') {
        return new NextResponse(null, { status: 404 })
    }

    let body: { lotes?: unknown }
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    const entrada = body?.lotes
    if (!Array.isArray(entrada) || entrada.length === 0) {
        return NextResponse.json({ error: 'No llegó ningún lote' }, { status: 400 })
    }

    const cambios = new Map<number, Edicion>()
    for (const [i, l] of entrada.entries()) {
        const o = l as Record<string, unknown>
        if (typeof o.id !== 'number' || !Number.isInteger(o.id) || o.id < 1) {
            return NextResponse.json({ error: `El lote ${i + 1} no trae id` }, { status: 400 })
        }
        const n = o.n == null ? null : Number(o.n)
        if (n !== null && (!Number.isInteger(n) || n < 1 || n > 999)) {
            return NextResponse.json({ error: `Número inválido en el lote ${o.id}` }, { status: 400 })
        }
        const stage = o.stage == null ? null : Number(o.stage)
        if (stage !== null && (!Number.isInteger(stage) || stage < 1 || stage > 9)) {
            return NextResponse.json({ error: `Etapa inválida en el lote ${o.id}` }, { status: 400 })
        }
        const tipo = typeof o.tipo === 'string' ? o.tipo : 'lote'
        if (!ZONAS.includes(tipo)) {
            return NextResponse.json({ error: `Zona desconocida en el lote ${o.id}` }, { status: 400 })
        }
        const area = o.area == null ? null : Number(o.area)
        if (area !== null && (!Number.isFinite(area) || area <= 0)) {
            return NextResponse.json({ error: `Superficie inválida en el lote ${o.id}` }, { status: 400 })
        }
        cambios.set(o.id, { id: o.id, n, stage, sold: !!o.sold, tipo, area })
    }

    /* Dos lotes con el mismo número dentro de una etapa es un error que se
       paga caro: el visitante agenda sobre uno y la reserva queda en el otro. */
    const vistos = new Map<string, number>()
    for (const c of cambios.values()) {
        if (c.tipo !== 'lote' || c.n == null || c.stage == null) continue
        const k = `${c.stage}-${c.n}`
        const antes = vistos.get(k)
        if (antes != null) {
            return NextResponse.json(
                { error: `El número ${c.n} de la etapa ${c.stage} está repetido (lotes ${antes} y ${c.id})` },
                { status: 400 })
        }
        vistos.set(k, c.id)
    }

    const archivo = path.join(process.cwd(), 'public/lomas3d/plano-lotes.json')
    let datos: { lotes: Record<string, unknown>[]; provisional?: boolean }
    try {
        datos = JSON.parse(await readFile(archivo, 'utf8'))
    } catch {
        return NextResponse.json({ error: 'No se pudo leer plano-lotes.json' }, { status: 500 })
    }

    let tocados = 0
    for (const l of datos.lotes) {
        const c = cambios.get(l.id as number)
        if (!c) continue
        l.n = c.n
        l.stage = c.stage
        l.sold = c.sold
        l.tipo = c.tipo
        l.area = c.area
        tocados++
    }

    // Queda de propuesta mientras algún lote siga sin número ni zona resuelta.
    datos.provisional = datos.lotes.some(l =>
        (l.tipo ?? 'lote') === 'lote' && (l.n == null || l.stage == null))

    await writeFile(archivo, JSON.stringify(datos, null, 1), 'utf8')
    return NextResponse.json({ ok: true, tocados, provisional: datos.provisional })
}
