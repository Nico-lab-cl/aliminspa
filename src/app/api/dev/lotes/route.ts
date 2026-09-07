import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'

/**
 * Guarda los lotes dibujados a mano sobre el mapa.
 *
 * Escribe public/lomas3d/lotes-editados.json desde el editor de
 * /agendar-visita?editor=1. El visor carga ese archivo en vez de los polígonos
 * del repo, que quedan intactos en mapa-data.json.
 *
 * Solo existe en desarrollo: en producción responde 404, porque una ruta que
 * escribe archivos del servidor no tiene nada que hacer en el sitio público.
 */
export async function POST(request: NextRequest) {
    if (process.env.NODE_ENV === 'production') {
        return new NextResponse(null, { status: 404 })
    }

    let body: { dimension?: unknown; lotes?: unknown }
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    const lotes = body?.lotes
    if (!Array.isArray(lotes) || lotes.length === 0) {
        return NextResponse.json({ error: 'No llegó ningún lote' }, { status: 400 })
    }

    // Se valida lo que el visor necesita sí o sí para dibujar y para poder
    // agendar sobre un lote: sin polígono no hay malla, sin número ni etapa no
    // hay ficha ni etiqueta en la reserva.
    for (const [i, l] of lotes.entries()) {
        const lote = l as Record<string, unknown>
        const p = lote.p
        if (!Array.isArray(p) || p.length < 3 || p.some(q => !Array.isArray(q) || q.length !== 2 || q.some(v => typeof v !== 'number' || !Number.isFinite(v)))) {
            return NextResponse.json(
                { error: `El lote ${i + 1} no trae un polígono válido` },
                { status: 400 }
            )
        }
        if (typeof lote.n !== 'number' || typeof lote.stage !== 'number') {
            return NextResponse.json(
                { error: `El lote ${i + 1} no trae número y etapa` },
                { status: 400 }
            )
        }
    }

    const datos = {
        _comentario:
            'Lotes colocados a mano desde /agendar-visita?editor=1. Mandan sobre los poligonos de mapa-data.json, que quedan intactos.',
        actualizado: new Date().toISOString(),
        dimension: body.dimension ?? null,
        lotes,
    }

    const destino = path.join(process.cwd(), 'public/lomas3d/lotes-editados.json')
    await writeFile(destino, JSON.stringify(datos, null, 2) + '\n', 'utf8')

    return NextResponse.json({
        ok: true,
        guardadoEn: 'public/lomas3d/lotes-editados.json',
        lotes: lotes.length,
    })
}
