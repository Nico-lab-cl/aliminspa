import { NextResponse } from 'next/server'
import { SITE } from '@/lib/constants'

/**
 * Enlace corto que manda la respuesta automática de Instagram y Facebook
 * (CRM, lib/respuestaAutomatica.ts): /b/<destino><red><vía><categoría><ref>.
 * Ejemplo: /b/liclf8f75795 → brochure de Lomas, Instagram, comentario,
 * categoría lomas, conversación f8f75795.
 *
 * Se expande aquí a la página con los utm completos, así Clarity y GA ven lo
 * mismo que con el enlace largo y el mensaje queda corto.
 */

const DESTINOS: Record<string, string> = {
    l: '/brochure/lomas-del-mar',
    a: '/brochure/arena-y-sol',
    v: '/agendar-visita',
}
const REDES: Record<string, string> = { i: 'instagram', f: 'facebook' }
const VIAS: Record<string, string> = { c: 'comentario', d: 'dm' }
const CATEGORIAS: Record<string, string> = {
    l: 'lomas', a: 'arena', g: 'general', v: 'visita', o: 'otro', x: 'ignorar',
}

const CODIGO = /^([lav])([if])([cd])([lagvox])([0-9a-f]{8})$/i

export async function GET(_req: Request, { params }: { params: Promise<{ codigo: string }> }) {
    const { codigo } = await params
    const m = CODIGO.exec(codigo || '')
    // Detrás del proxy req.url trae el host interno: se usa el dominio público.
    const base = new URL(SITE.url)
    if (!m) return NextResponse.redirect(new URL('/', base), 307)

    const [, destino, red, via, categoria, ref] = m
    const url = new URL(DESTINOS[destino.toLowerCase()], base)
    url.searchParams.set('utm_source', REDES[red.toLowerCase()])
    url.searchParams.set('utm_medium', 'social-auto')
    url.searchParams.set('utm_campaign', 'respuesta-automatica')
    url.searchParams.set('utm_content', VIAS[via.toLowerCase()])
    url.searchParams.set('utm_term', CATEGORIAS[categoria.toLowerCase()])
    // Solo el brochure avisa al asesor que se abrió.
    if (destino.toLowerCase() !== 'v') url.searchParams.set('r', ref.toLowerCase())

    return NextResponse.redirect(url, 307)
}
