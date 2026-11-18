import { NextRequest, NextResponse } from 'next/server'
import { ChatConfigError, ChatUpstreamError, transcribirAudioEnCrm } from '@/lib/web-chat'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Audio del chat de prueba de Ali (19-11-2026): se transcribe con el CRM (que
 * tiene la clave de OpenAI) y el navegador manda el texto como mensaje
 * "🎤 (audio) …", igual que llegan los audios de Instagram, Facebook y el chat
 * web. No se guarda el audio.
 */

const LIMITE_POR_HORA = 30
const usos = new Map<string, number[]>()
const MAX_BYTES = 12 * 1024 * 1024

function dentroDelLimite(ip: string) {
    const ahora = Date.now()
    const recientes = (usos.get(ip) || []).filter(t => ahora - t < 3_600_000)
    if (recientes.length >= LIMITE_POR_HORA) return false
    recientes.push(ahora)
    usos.set(ip, recientes)
    if (usos.size > 5000) usos.forEach((v, k) => !v.some(t => ahora - t < 3_600_000) && usos.delete(k))
    return true
}

export async function POST(request: NextRequest) {
    const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'sin-ip'
    if (!dentroDelLimite(ip)) {
        return NextResponse.json({ error: 'Llegaste al límite de audios de prueba por hora.' }, { status: 429 })
    }
    let archivo: FormDataEntryValue | null
    try {
        archivo = (await request.formData()).get('file')
    } catch {
        return NextResponse.json({ error: 'Envío inválido' }, { status: 400 })
    }
    if (!(archivo instanceof File) || !archivo.size) return NextResponse.json({ error: 'No llegó el audio' }, { status: 400 })
    if (archivo.size > MAX_BYTES) return NextResponse.json({ error: 'El audio es muy largo' }, { status: 413 })

    try {
        return NextResponse.json({ texto: await transcribirAudioEnCrm(archivo) })
    } catch (error) {
        if (error instanceof ChatConfigError) return NextResponse.json({ error: 'Los audios no están disponibles' }, { status: 503 })
        if (error instanceof ChatUpstreamError) return NextResponse.json({ error: error.message }, { status: error.status })
        console.error('[ali:prueba] No se pudo transcribir el audio:', error)
        return NextResponse.json({ error: 'No se pudo transcribir el audio' }, { status: 502 })
    }
}
