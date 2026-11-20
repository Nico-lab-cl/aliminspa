import { NextRequest, NextResponse } from 'next/server'
import { juzgarRespuesta, secretoValido, type MensajeCaso } from '@/lib/ali/juez'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Juez de los casos de prueba (scripts/casos-ali.mjs, Fase 2): califica una
 * respuesta de Ali con su propia ficha y la lista de lo que debía hacer.
 * Solo con x-ia-secret = IA_SECRET.
 * POST { canal, conversacion: [{de, texto}], respuesta: string[], silencio, debe: string[] }
 *   → { nota, criterios: [{debe, cumple, motivo}], comentario }
 */
export async function POST(request: NextRequest) {
    if (!secretoValido(request.headers.get('x-ia-secret'))) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    let j: Record<string, unknown>
    try {
        j = await request.json()
    } catch {
        return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }
    const texto = (v: unknown, max = 4000) => (typeof v === 'string' ? v.slice(0, max) : '')
    const conversacion: MensajeCaso[] = (Array.isArray(j.conversacion) ? j.conversacion : [])
        .slice(-60)
        .map(m => m as Record<string, unknown>)
        .filter(m => m.de === 'cliente' || m.de === 'ali' || m.de === 'asesor')
        .map(m => ({ de: m.de as MensajeCaso['de'], texto: texto(m.texto) }))
    const respuesta = (Array.isArray(j.respuesta) ? j.respuesta : []).map(r => texto(r)).filter(Boolean).slice(0, 6)
    const debe = (Array.isArray(j.debe) ? j.debe : []).map(d => texto(d, 400)).filter(Boolean).slice(0, 10)
    if (!conversacion.length) return NextResponse.json({ error: 'Falta la conversación' }, { status: 400 })

    try {
        return NextResponse.json(
            await juzgarRespuesta({ canal: texto(j.canal, 20) || 'instagram', conversacion, respuesta, silencio: Boolean(j.silencio), debe })
        )
    } catch (error) {
        console.error('[ali:juez] No se pudo calificar:', error)
        return NextResponse.json({ error: 'El juez no pudo calificar' }, { status: 502 })
    }
}
