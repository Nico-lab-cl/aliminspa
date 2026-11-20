import { NextRequest, NextResponse } from 'next/server'
import { aliHabilitada, conversarWebPrueba } from '@/lib/ali/motor'
import { secretoValido } from '@/lib/ali/juez'
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
    // El banco de pruebas (scripts/casos-ali.mjs) manda x-ia-secret: no cuenta para el límite.
    if (!secretoValido(request.headers.get('x-ia-secret')) && !dentroDelLimite(ip)) {
        return NextResponse.json({ error: 'Llegaste al límite de mensajes de prueba por hora. Intenta más tarde.' }, { status: 429 })
    }

    let json: Record<string, unknown>
    try {
        json = await request.json()
    } catch {
        return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    const id = typeof json.id === 'string' ? json.id.replace(/[^a-z0-9-]/gi, '').slice(0, 40) : ''

    // Chat web (20-11-2026): misma Ali que el chat de aliminspa.cl, sin sesión ni CRM.
    if (json.canal === 'web') {
        const mensajes = (Array.isArray(json.mensajes) ? json.mensajes : [])
            .slice(-40)
            .map(m => (m && typeof m === 'object' ? (m as Record<string, unknown>) : {}))
            .filter(m => (m.de === 'cliente' || m.de === 'ali') && typeof m.texto === 'string' && m.texto.trim())
            .map(m => ({ de: m.de as 'cliente' | 'ali', texto: String(m.texto).slice(0, 4000) }))
        if (!mensajes.length || mensajes[mensajes.length - 1].de !== 'cliente') {
            return NextResponse.json({ error: 'Falta tu mensaje' }, { status: 400 })
        }
        const c = (json.cliente && typeof json.cliente === 'object' ? json.cliente : {}) as Record<string, unknown>
        const dato = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 120) : null)
        // En la web la persona ya dejó sus datos en el formulario antes de escribir.
        const cliente = { nombre: dato(c.nombre) || 'Visitante', telefono: dato(c.telefono) || '+56900000000', email: dato(c.email) || 'prueba@ejemplo.cl' }
        try {
            return NextResponse.json(await conversarWebPrueba({ mensajes, cliente, id: id || 'anonima' }, request))
        } catch (error) {
            console.error('[ali:prueba] No se pudo responder (web):', error)
            return NextResponse.json({ error: 'Ali no pudo responder. Intenta de nuevo.' }, { status: 502 })
        }
    }

    const canal = json.canal === 'facebook' || json.canal === 'whatsapp' ? json.canal : 'instagram'
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
            intencion: r.intencion,
        })
    } catch (error) {
        console.error(`[ali:prueba] No se pudo responder ${entrada.conversacionId}:`, error)
        return NextResponse.json({ error: 'Ali no pudo responder. Intenta de nuevo.' }, { status: 502 })
    }
}
