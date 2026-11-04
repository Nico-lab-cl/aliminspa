/**
 * Los dos ebooks de Alimin (lead magnet, octubre 2026). El contenido de cada
 * página sale del propio ebook (lienzo "Ebooks Alimin"): si el PDF cambia,
 * actualizar aquí el índice.
 *
 * Al descargarlo, el lead entra al CRM con origen "Ebook": no va a la rueda de
 * asesores, y si aceptó recibir novedades, el CRM web le manda la secuencia del
 * ebook (EBOOK_SUELO / EBOOK_PREGUNTAS). `slug` es también el valor que espera
 * esa secuencia en el evento EBOOK_DOWNLOAD: no cambiarlo sin cambiar
 * lib/email_sequences.ts del CRM web.
 */

export type EbookSlug = 'terreno-urbano-o-parcela-rural' | 'preguntas-frecuentes'

export interface Ebook {
    slug: EbookSlug
    titulo: string
    /** Lo que se ve sobre el título en la portada. */
    antetitulo: string
    bajada: string
    /** Para el popup: una línea que conecta con lo que el visitante está leyendo. */
    gancho: string
    etiquetas: string[]
    indice: { titulo: string; detalle?: string }[]
    paginas: number
    pdf: string
    portada: string
    portadaAlt: string
    metaTitulo: string
    metaDescripcion: string
}

export const EBOOKS: Record<EbookSlug, Ebook> = {
    'terreno-urbano-o-parcela-rural': {
        slug: 'terreno-urbano-o-parcela-rural',
        titulo: 'Terreno urbano o parcela rural',
        antetitulo: 'Antes de mirar el precio',
        bajada: 'Por qué no cuestan lo mismo y qué estás comprando de verdad cuando eliges un terreno.',
        gancho: '¿Viste parcelas mucho más baratas? Esta guía explica por qué no cuestan lo mismo.',
        etiquetas: ['Uso de suelo', 'Rol propio', 'Checklist de compra'],
        indice: [
            { titulo: 'Los tres tipos de suelo en Chile', detalle: 'Qué permite cada uno y por qué eso cambia el precio.' },
            { titulo: 'Qué es el rol propio', detalle: 'El dato que tienes que pedir antes que cualquier otro.' },
            { titulo: 'Los riesgos de comprar sin rol', detalle: 'Lo que pasa cuando compras un porcentaje y no un terreno.' },
            { titulo: 'Una lista para revisar', detalle: 'Seis documentos y pasos antes de pagar por cualquier terreno.' },
        ],
        paginas: 11,
        pdf: '/ebooks/pdf/terreno-urbano-o-parcela-rural.pdf',
        portada: '/images/hero/hero-bg.webp',
        portadaAlt: 'Vista aérea de terrenos en El Tabo',
        metaTitulo: 'Guía gratis: terreno urbano o parcela rural',
        metaDescripcion:
            'Descarga gratis la guía de Alimin: los tres tipos de suelo en Chile, qué es el rol propio, los riesgos de comprar sin rol y una lista para revisar antes de pagar.',
    },
    'preguntas-frecuentes': {
        slug: 'preguntas-frecuentes',
        titulo: 'Las preguntas que todos nos hacen',
        antetitulo: 'Preguntas frecuentes',
        bajada: 'Cuánto cuesta, si se puede construir y cuándo se entrega: respuestas claras antes de visitar tu terreno.',
        gancho: 'Precio, cómo se paga, si se puede construir y más: todo en una guía corta.',
        etiquetas: ['Precio', 'Construcción', 'Entrega'],
        indice: [
            { titulo: '¿Cuánto cuesta un terreno?' },
            { titulo: '¿Cómo se paga?' },
            { titulo: '¿Por qué cuesta lo que cuesta?' },
            { titulo: '¿Se puede construir?' },
            { titulo: '¿Cuándo me entregan el terreno?' },
            { titulo: '¿Me sirve si estoy en DICOM?' },
            { titulo: '¿Qué necesito para comprar?' },
            { titulo: '¿Dónde están los terrenos?' },
            { titulo: '¿Puedo visitar antes de comprar?' },
        ],
        paginas: 10,
        pdf: '/ebooks/pdf/preguntas-frecuentes.pdf',
        portada: '/images/arena_y_sol/hero-desktop-new.webp',
        portadaAlt: 'Terrenos del proyecto Arena y Sol en El Tabo',
        metaTitulo: 'Guía gratis: las preguntas que todos nos hacen',
        metaDescripcion:
            'Descarga gratis la guía de Alimin con las respuestas a lo que más nos preguntan: precio, cómo se paga, si se puede construir, entrega, DICOM, requisitos y visitas.',
    },
}

export const LISTA_EBOOKS = Object.values(EBOOKS)

/**
 * Qué ebook recomendar en cada página. Lo legal (rol propio, parcelas, loteos,
 * verificar un terreno) y las páginas de precio bajo llevan al de uso de suelo:
 * ahí la duda es "¿por qué tan barato / es seguro?". El resto, al de preguntas.
 * Una ruta que no está aquí no muestra el popup.
 */
const POPUP_SUELO = [
    '/terrenos-litoral-central',
    '/terrenos-baratos-en-la-playa-litoral-central-chile',
    '/blog/que-es-el-rol-propio-y-por-que-es-vital',
    '/blog/que-es-loteo-irregular-brujo',
    '/blog/como-verificar-legalidad-terreno-antes-de-comprar',
    '/blog/guia-definitiva-comprar-terreno-litoral-central',
    '/blog/5-ventajas-de-invertir-en-terrenos-urbanizados',
    '/blog/certificacion-agua-seremi-salud',
]

const POPUP_PREGUNTAS = [
    '/',
    '/proyectos',
    '/proyectos/lomas-del-mar',
    '/proyectos/arena-y-sol',
    '/credito',
    '/blog',
    '/blog/comprar-terreno-financiamiento-directo-dicom',
    '/quienes-somos',
    '/asesores',
]

export function ebookParaRuta(ruta: string): EbookSlug | null {
    const r = ruta.replace(/\/+$/, '') || '/'
    if (POPUP_SUELO.includes(r)) return 'terreno-urbano-o-parcela-rural'
    if (POPUP_PREGUNTAS.includes(r)) return 'preguntas-frecuentes'
    // Artículos nuevos del blog: el de preguntas, que sirve para cualquiera.
    if (r.startsWith('/blog/')) return 'preguntas-frecuentes'
    return null
}
