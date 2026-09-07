import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'

/**
 * Guarda el calce de la panorámica del dron con el terreno.
 *
 * Es una herramienta interna: escribe public/lomas3d/vuelo.json desde el modo
 * de calce de /agendar-visita. Solo existe en desarrollo — en producción
 * responde 404, porque una ruta que escribe archivos del servidor no tiene
 * nada que hacer en el sitio público.
 */
export async function POST(request: NextRequest) {
    if (process.env.NODE_ENV === 'production') {
        return new NextResponse(null, { status: 404 })
    }

    let body: unknown
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    const { x, z, alt, yaw } = (body ?? {}) as Record<string, unknown>
    const numeros = { x, z, alt, yaw }

    for (const [campo, valor] of Object.entries(numeros)) {
        if (typeof valor !== 'number' || !Number.isFinite(valor)) {
            return NextResponse.json(
                { error: `El campo "${campo}" tiene que ser un número` },
                { status: 400 }
            )
        }
    }

    const datos = {
        _comentario:
            'Calce de la panoramica del dron con el terreno. Lo escribe el modo de calce en /agendar-visita?calce=1. x y z en metros desde el origen del loteo, alt en metros sobre el suelo, yaw en grados.',
        // Guardar el calce es justamente la señal de que quedó calibrado: a
        // partir de acá la vista del dron es la que abre el mapa.
        calibrado: true,
        x: numeros.x as number,
        z: numeros.z as number,
        alt: numeros.alt as number,
        yaw: numeros.yaw as number,
    }

    const destino = path.join(process.cwd(), 'public/lomas3d/vuelo.json')
    await writeFile(destino, JSON.stringify(datos, null, 2) + '\n', 'utf8')

    return NextResponse.json({ ok: true, guardadoEn: 'public/lomas3d/vuelo.json', ...datos })
}
