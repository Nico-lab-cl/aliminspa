import { readFile } from 'fs/promises'
import sharp from 'sharp'
import { archivoVigente, documentoPorId } from '@/lib/ali/documentos'

export const dynamic = 'force-dynamic'

/**
 * /documentos/<id>: el documento vigente de la lista de Ali
 * (src/lib/ali/documentos.ts). Es la URL que el CRM le pasa a Meta para
 * mandar el adjunto, así que siempre es la misma aunque el archivo cambie.
 * Las imágenes salen en JPG (Messenger, Instagram y WhatsApp no aceptan WEBP
 * como adjunto); los PDF, tal cual, con un nombre legible.
 */

const jpgs = new Map<string, { ruta: string; buf: Buffer }>()

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const doc = documentoPorId(id)
    if (!doc) return new Response('No existe', { status: 404 })
    const ruta = await archivoVigente(doc)
    if (!ruta) return new Response('No disponible', { status: 404 })

    const cabeceras = { 'cache-control': 'public, max-age=600' }
    if (doc.tipo === 'pdf') {
        const buf = await readFile(ruta)
        return new Response(new Uint8Array(buf), {
            headers: {
                ...cabeceras,
                'content-type': 'application/pdf',
                'content-disposition': `inline; filename="${doc.nombre} - Alimin.pdf"`,
            },
        })
    }

    let jpg = jpgs.get(doc.id)
    if (!jpg || jpg.ruta !== ruta) {
        // Hasta 2048 px de ancho: se ve nítido en el celular y pesa poco.
        const buf = await sharp(ruta).flatten({ background: '#ffffff' }).resize({ width: 2048, withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer()
        jpg = { ruta, buf }
        jpgs.set(doc.id, jpg)
    }
    return new Response(new Uint8Array(jpg.buf), {
        headers: { ...cabeceras, 'content-type': 'image/jpeg', 'content-disposition': `inline; filename="${doc.nombre} - Alimin.jpg"` },
    })
}
