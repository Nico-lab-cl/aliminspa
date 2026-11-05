/**
 * Brochures de los proyectos, para mandarlos por Instagram y Facebook.
 *
 * La respuesta automática del CRM (comentarios y primer DM) manda el enlace a
 * /brochure/<slug> y no al PDF directo: un PDF no carga Clarity ni Analytics,
 * y la página sí. Las páginas del PDF están también como imágenes porque en el
 * celular (Android sobre todo) un PDF incrustado no se ve.
 *
 * Los archivos viven en public/brochures. Para cambiar un brochure: reemplazar
 * el PDF, regenerar las imágenes (NN.webp a 1600 px y portada.jpg a 1200 px) y
 * ajustar `paginas`.
 */

export type BrochureSlug = 'lomas-del-mar' | 'arena-y-sol'

export interface Brochure {
    slug: BrochureSlug
    proyecto: string
    bajada: string
    paginas: number
    pdf: string
    portada: string
    agendar: string
    proyectoUrl: string
}

export const BROCHURES: Record<BrochureSlug, Brochure> = {
    'lomas-del-mar': {
        slug: 'lomas-del-mar',
        proyecto: 'Lomas del Mar',
        bajada: 'Terrenos urbanizados de 200 m² y 390 m² en El Tabo, Región de Valparaíso.',
        paginas: 12,
        pdf: '/brochures/lomas-del-mar.pdf',
        portada: '/brochures/lomas-del-mar/portada.jpg',
        agendar: '/agendar-visita',
        proyectoUrl: '/proyectos/lomas-del-mar',
    },
    'arena-y-sol': {
        slug: 'arena-y-sol',
        proyecto: 'Arena y Sol',
        bajada: 'Últimos terrenos urbanizados de 200 m² en El Tabo, Región de Valparaíso.',
        paginas: 14,
        pdf: '/brochures/arena-y-sol.pdf',
        portada: '/brochures/arena-y-sol/portada.jpg',
        agendar: '/agendar-visita-arenas',
        proyectoUrl: '/proyectos/arena-y-sol',
    },
}

export const LISTA_BROCHURES = Object.values(BROCHURES)

export function imagenesDe(b: Brochure): string[] {
    return Array.from({ length: b.paginas }, (_, i) => `/brochures/${b.slug}/${String(i + 1).padStart(2, '0')}.webp`)
}
