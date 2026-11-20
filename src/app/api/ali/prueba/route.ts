import { NextRequest, NextResponse } from 'next/server'
import { aliHabilitada } from '@/lib/ali/motor'
import { conversarRedes, validarEntrada } from '@/lib/ali/redes'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Chat de prueba de Ali (página /probar-ali, 16-11-2026): cualquiera con el
 * enlace conversa con la misma Ali de Instagram, Facebook y WhatsApp, pero en
 * modo prueba. No crea leads ni escribe en el CRM (conversarRedes no lo hace:
 * eso lo hace el CRM móvil con lo que devuelve), no avisa a los asesores
 * aunque Ali "derive", y agendar_visita solo valida el horario sin guardar.
 * Tampoco reporta uso al CRM web, para no ensuciar las métricas de los canales.
 *
 * ALI_PRUEBA_ACTIVA=false la apaga. Límite por IP para que nadie la use de
 * chat gratis: cada respuesta cuesta una llamada a Claude.
 */

const LIMITE_POR_HORA = 60
const usos = new Map<string, number[]>()

function dentroDelLimite(ip: string) {
    const ahora = Date.now()
    const recientes = (usos.get(ip) || []).filter(t => ahora - t < 3_600_000)
    if (recientes.length >= LIMITE_POR_HORA) {
        usos.set(ip, recientes)
        return false
    }
    recientes.push(ahora)
    usos.set(ip, recientes)
    if (usos.size > 5000) usos.forEach((v, k) => !v.some(t => ahora - t < 3_600_000) && usos.delete(k))
    return true
}

export async function POST(request: NextRequest) {
    if ((process.env.ALI_PRUEBA_ACTIVA || '').trim().toLowerCase() === 'false' || !aliHabilitada()) {
        return NextResponse.json({ error: 'El chat de prueba está apagado.' }, { status: 503 })
    }
    const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'sin-ip'
    if (!dentroDelLimite(ip)) {
        return NextResponse.json({ error: 'Llegaste al límite de mensajes de prueba por hora. Intenta más tarde.' }, { status: 429 })
    }

    let json: Record<string, unknown>
    try {
        json = await request.json()
    } catch {
        return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    const canal = json.canal === 'facebook' || json.canal === 'whatsapp' ? json.canal : 'instagram'
    const id = typeof json.id === 'string' ? json.id.replace(/[^a-z0-9-]/gi, '').slice(0, 40) : ''
    const entrada = validarEntrada({
        canal,
        via: 'dm',
        conversacionId: `prueba-${id || 'anonima'}`,
        publicacion: null,
        cliente: json.cliente,
        mensajes: json.mensajes,
        memoria: null,
        agente: null,
    })
    if (!entrada) return NextResponse.json({ error: 'La conversación no calza con el formato' }, { status: 400 })
    // En WhatsApp real el CRM ya trae el teléfono (es el número que escribe) y
    // Ali no lo pide: en la prueba va uno ficticio para que pueda agendar.
    if (canal === 'whatsapp' && !entrada.cliente.telefono) entrada.cliente.telefono = '+56900000000'
    // Solo texto: en la prueba no se aceptan fotos de afuera.
    entrada.mensajes = entrada.mensajes.map(m => ({ ...m, imagenUrl: null })).filter(m => m.texto)
    if (!entrada.mensajes.length || entrada.mensajes[entrada.mensajes.length - 1].de !== 'cliente') {
        return NextResponse.json({ error: 'Falta tu mensaje' }, { status: 400 })
    }

    try {
        const r = await conversarRedes(entrada, request, { prueba: true })
        return NextResponse.json({
            burbujas: r.burbujas,
            contacto: r.contacto,
            derivacion: r.derivacion,
            visita: r.visita,
            documentos: r.documentos,
            silencio: r.silencio,
        })
    } catch (error) {
        console.error(`[ali:prueba] No se pudo responder ${entrada.conversacionId}:`, error)
        return NextResponse.json({ error: 'Ali no pudo responder. Intenta de nuevo.' }, { status: 502 })
    }
}
