import { readdir } from 'fs/promises'
import path from 'path'
import { SITE } from '@/lib/constants'

/**
 * Documentos que Ali puede mandar por Instagram, Facebook y WhatsApp
 * (17-11-2026): brochures, planos y ebooks. Solo los de esta lista; Ali nunca
 * arma un enlace por su cuenta.
 *
 * Siempre sale la versión más nueva: cada documento se busca en su carpeta de
 * /public por su nombre base, y si hay varios con fecha en el nombre
 * (plano-arena-y-sol-2026-08-24.webp, plano-arena-y-sol-2026-12-01.webp…) gana
 * la fecha más reciente. Para actualizar un plano basta con subir el archivo
 * nuevo con la fecha del día en el nombre; no hay que tocar código.
 *
 * Se mandan por /documentos/<id> (src/app/documentos/[id]/route.ts), una URL
 * fija que entrega el archivo vigente; las imágenes salen en JPG, que es lo que
 * aceptan Messenger, Instagram y WhatsApp.
 */

export type TipoDocumento = 'pdf' | 'imagen'

interface DefinicionDocumento {
    id: string
    /** Como lo ve el cliente (y nombre del archivo que descarga). */
    nombre: string
    /** Para Ali: cuándo mandarlo. */
    descripcion: string
    tipo: TipoDocumento
    /** Carpeta dentro de /public. */
    carpeta: string
    /** Nombre base del archivo, sin fecha ni extensión. */
    base: string
    extensiones: string[]
}

const IMAGEN = ['.webp', '.jpg', '.jpeg', '.png']

export const DOCUMENTOS: DefinicionDocumento[] = [
    {
        id: 'plano_lomas_del_mar',
        nombre: 'Plano Lomas del Mar',
        descripcion: 'Plano de loteo de Lomas del Mar con los lotes vendidos marcados. Cuando pidan el plano, ver los lotes o cuáles quedan.',
        tipo: 'imagen',
        carpeta: 'assets/venta-terrenos',
        base: 'plano-lomas-del-mar',
        extensiones: IMAGEN,
    },
    {
        id: 'plano_arena_y_sol',
        nombre: 'Plano Arena y Sol',
        descripcion: 'Plano de loteo de Arena y Sol con los lotes vendidos marcados. Cuando pidan el plano, ver los lotes o cuáles quedan.',
        tipo: 'imagen',
        carpeta: 'assets/venta-terrenos',
        base: 'plano-arena-y-sol',
        extensiones: IMAGEN,
    },
    {
        id: 'brochure_lomas_del_mar',
        nombre: 'Brochure Lomas del Mar',
        descripcion: 'Brochure completo de Lomas del Mar (PDF). Cuando pidan el brochure, más información o algo para revisar con calma.',
        tipo: 'pdf',
        carpeta: 'brochures',
        base: 'lomas-del-mar',
        extensiones: ['.pdf'],
    },
    {
        id: 'brochure_arena_y_sol',
        nombre: 'Brochure Arena y Sol',
        descripcion: 'Brochure completo de Arena y Sol (PDF). Cuando pidan el brochure, más información o algo para revisar con calma.',
        tipo: 'pdf',
        carpeta: 'brochures',
        base: 'arena-y-sol',
        extensiones: ['.pdf'],
    },
    {
        id: 'ebook_preguntas_frecuentes',
        nombre: 'Preguntas frecuentes Alimin',
        descripcion: 'Ebook con las preguntas frecuentes de los proyectos (PDF). Cuando tenga varias dudas generales o quiera leer con calma.',
        tipo: 'pdf',
        carpeta: 'ebooks/pdf',
        base: 'preguntas-frecuentes',
        extensiones: ['.pdf'],
    },
    {
        id: 'ebook_terreno_urbano_o_parcela',
        nombre: 'Terreno urbano o parcela rural',
        descripcion: 'Ebook que explica la diferencia entre un terreno urbano y una parcela rural (PDF). Cuando pregunte por el uso de suelo, si son parcelas o si se puede construir.',
        tipo: 'pdf',
        carpeta: 'ebooks/pdf',
        base: 'terreno-urbano-o-parcela-rural',
        extensiones: ['.pdf'],
    },
]

const ORIGEN = (process.env.ALI_SITE_ORIGIN || SITE.url).replace(/\/$/, '')
const FECHA = /-(\d{4}-\d{2}-\d{2})$/

export function documentoPorId(id: string) {
    return DOCUMENTOS.find(d => d.id === id) || null
}

/** URL fija que el CRM le pasa a Meta: siempre entrega la versión vigente. */
export function urlDocumento(id: string) {
    return `${ORIGEN}/documentos/${id}`
}

const cache = new Map<string, { ruta: string | null; vence: number }>()

/**
 * Ruta en disco del archivo vigente: el más nuevo por fecha en el nombre; sin
 * fecha cuenta como el más viejo. null si no hay ninguno.
 */
export async function archivoVigente(doc: DefinicionDocumento): Promise<string | null> {
    const guardado = cache.get(doc.id)
    if (guardado && Date.now() < guardado.vence) return guardado.ruta
    const carpeta = path.join(process.cwd(), 'public', doc.carpeta)
    let ruta: string | null = null
    try {
        const candidatos = (await readdir(carpeta))
            .map(nombre => {
                const ext = path.extname(nombre).toLowerCase()
                const sinExt = nombre.slice(0, -ext.length)
                if (!doc.extensiones.includes(ext)) return null
                const fecha = sinExt.match(FECHA)?.[1] ?? ''
                const base = fecha ? sinExt.slice(0, -fecha.length - 1) : sinExt
                return base === doc.base ? { nombre, fecha } : null
            })
            .filter((c): c is { nombre: string; fecha: string } => c !== null)
            .sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0))
        if (candidatos.length) ruta = path.join(carpeta, candidatos[0].nombre)
    } catch (error) {
        console.error(`[ali:documentos] No se pudo leer ${carpeta}:`, error)
    }
    cache.set(doc.id, { ruta, vence: Date.now() + 10 * 60 * 1000 })
    return ruta
}

/** Lo que Ali deja para que el CRM lo mande después de sus mensajes. */
export interface DocumentoParaEnviar {
    id: string
    nombre: string
    tipo: TipoDocumento
    url: string
}
