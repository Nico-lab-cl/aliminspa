import type Anthropic from '@anthropic-ai/sdk'
import type { NextRequest } from 'next/server'
import { TIMEZONE } from '@/lib/booking-rules'
import { PROJECTS } from '@/lib/constants'
import { INSTRUCCIONES_ALI, INSTRUCCIONES_REDES } from './conocimiento'
import { bloqueRemoto, configRemota, herramientasApagadas } from './config-remota'
import {
    HERRAMIENTAS,
    HERRAMIENTA_GUARDAR_CONTACTO,
    type ContactoAli,
    type ContextoHerramientas,
} from './herramientas'
import { correrModelo, enBurbujas } from './motor'

/**
 * Ali en Instagram y Facebook.
 *
 * El CRM móvil recibe el webhook de Meta, arma la conversación y llama a
 * /api/ali/redes; acá corre el mismo motor del chat web (misma ficha, mismas
 * herramientas, misma config aprobada del CRM web) más INSTRUCCIONES_REDES y
 * la herramienta guardar_contacto. No escribe en el CRM: devuelve lo que hay
 * que mandar y los datos que juntó, y el CRM envía, guarda y crea el lead.
 */

export type CanalRedes = 'instagram' | 'facebook'

export interface MensajeRedes {
    de: 'cliente' | 'ali' | 'asesor'
    texto: string
    /** URL de la foto que mandó el cliente (adjunto de Meta). */
    imagenUrl?: string | null
}

export interface EntradaRedes {
    canal: CanalRedes
    conversacionId: string
    via: 'comentario' | 'dm'
    /** Texto de la publicación comentada, si viene de un comentario. */
    publicacion: string | null
    cliente: { nombre: string | null; telefono: string | null; email: string | null }
    mensajes: MensajeRedes[]
}

export interface RespuestaRedes {
    burbujas: string[]
    contacto: ContactoAli | null
    derivacion: { motivo: string; resumen: string } | null
    visita: { proyecto: string; fecha: string; hora: string } | null
    /** Respuesta pública bajo el comentario, con los precios reales (solo vía comentario). */
    publica: string | null
}

/* ── Respuesta pública con precios ───────────────────────────────────── */

const pesos = (v: string) => (v.trim().startsWith('$') ? v.trim() : `$${v.trim()}`)
const aNumero = (v: string) => Number(v.replace(/\D/g, ''))

/** "200 m²: $35.000.000 al contado o pie de $5.500.000 + 60 cuotas de $550.000 ($37.990.000 en total)". */
function lineaDePrecio(o: { terreno: string; pie: string; cuotaReferencial: string; valorTotal: string; pagoContado: string; plazo?: string }) {
    // Arena y Sol no trae el plazo en constants.ts: se calcula con (total - pie) / cuota.
    const cuotas = o.plazo
        ? o.plazo.replace(/\D/g, '')
        : String(Math.round((aNumero(o.valorTotal) - aNumero(o.pie)) / aNumero(o.cuotaReferencial)))
    return `${o.terreno}: ${pesos(o.pagoContado)} al contado o pie de ${pesos(o.pie)} + ${cuotas} cuotas de ${pesos(o.cuotaReferencial)} (${pesos(o.valorTotal)} en total)`
}

/**
 * Lo que va en público bajo el comentario (decisión de Nicolás, 11-11-2026:
 * "digamos los precios como son"). Sale de PROJECTS en constants.ts, la
 * misma fuente que las tarjetas de precios del sitio: no hay otra copia.
 */
export function respuestaPublica(texto: string): string {
    const t = texto.toLowerCase()
    const lomas = PROJECTS.find(p => p.id === 'lomas-del-mar')
    const arena = PROJECTS.find(p => p.id === 'arena-y-sol')
    const habla = { lomas: /lomas/.test(t), arena: /arena/.test(t) }
    const proyectos = [
        lomas && (habla.lomas || !habla.arena) ? lomas : null,
        arena && (habla.arena || !habla.lomas) ? arena : null,
    ].filter((p): p is NonNullable<typeof p> => Boolean(p))

    const partes = proyectos.map(p => `${p.name}: ${p.financing.options.map(lineaDePrecio).join('. ')}.`)
    return `${partes.join(' ')} Te escribimos por interno con todo el detalle 📩`
}

const MAX_MENSAJES = 40
const MAX_TEXTO = 2000
/** Fotos más recientes que ve el modelo; las anteriores van como texto. */
const MAX_FOTOS = 2

const texto = (v: unknown, max = MAX_TEXTO) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

/** Revisa y recorta lo que manda el CRM. Devuelve null si no calza. */
export function validarEntrada(json: unknown): EntradaRedes | null {
    if (!json || typeof json !== 'object') return null
    const j = json as Record<string, unknown>
    if (j.canal !== 'instagram' && j.canal !== 'facebook') return null
    if (j.via !== 'comentario' && j.via !== 'dm') return null
    const conversacionId = texto(j.conversacionId, 120)
    if (!conversacionId || !Array.isArray(j.mensajes)) return null

    const c = (j.cliente && typeof j.cliente === 'object' ? j.cliente : {}) as Record<string, unknown>
    const mensajes: MensajeRedes[] = []
    for (const m of j.mensajes.slice(-MAX_MENSAJES)) {
        if (!m || typeof m !== 'object') continue
        const x = m as Record<string, unknown>
        if (x.de !== 'cliente' && x.de !== 'ali' && x.de !== 'asesor') continue
        const t = texto(x.texto)
        const imagenUrl = typeof x.imagenUrl === 'string' && /^https:\/\//.test(x.imagenUrl) ? x.imagenUrl : null
        if (!t && !imagenUrl) continue
        mensajes.push({ de: x.de, texto: t, imagenUrl })
    }
    if (!mensajes.length) return null

    return {
        canal: j.canal,
        via: j.via,
        conversacionId,
        publicacion: texto(j.publicacion, 800) || null,
        cliente: {
            nombre: texto(c.nombre, 80) || null,
            telefono: texto(c.telefono, 25) || null,
            email: texto(c.email, 120) || null,
        },
        mensajes,
    }
}

/** Historial en el formato de la API: turnos alternados, la conversación parte con el cliente. */
function historial(entrada: EntradaRedes): Anthropic.MessageParam[] {
    const fotos = entrada.mensajes
        .map((m, i) => ({ m, i }))
        .filter(({ m }) => m.de === 'cliente' && m.imagenUrl)
        .slice(-MAX_FOTOS)
        .map(({ i }) => i)

    const mensajes: Anthropic.MessageParam[] = []
    entrada.mensajes.forEach((m, i) => {
        const rol = m.de === 'cliente' ? 'user' : 'assistant'
        const bloques: Anthropic.ContentBlockParam[] = []
        if (m.de === 'cliente') {
            if (m.imagenUrl && fotos.includes(i)) {
                bloques.push({ type: 'image', source: { type: 'url', url: m.imagenUrl } })
            } else if (m.imagenUrl) {
                bloques.push({ type: 'text', text: '[El cliente mandó una foto]' })
            }
            if (/^\[audio\]$/i.test(m.texto)) {
                bloques.push({ type: 'text', text: '[El cliente mandó un audio]' })
            } else if (m.texto && !/^\[imagen\]$/i.test(m.texto)) {
                bloques.push({ type: 'text', text: m.texto })
            }
        } else if (m.texto) {
            // Lo que escribió un asesor queda como turno del equipo, marcado,
            // para que Ali no repita ni contradiga lo que ya se dijo.
            bloques.push({ type: 'text', text: m.de === 'asesor' ? `[Mensaje de un asesor del equipo] ${m.texto}` : m.texto })
        }
        if (!bloques.length) return

        const anterior = mensajes[mensajes.length - 1]
        if (anterior && anterior.role === rol) {
            ;(anterior.content as Anthropic.ContentBlockParam[]).push(...bloques)
        } else {
            mensajes.push({ role: rol, content: bloques })
        }
    })
    while (mensajes.length && mensajes[0].role === 'assistant') mensajes.shift()
    return mensajes
}

function datosDelMomento(entrada: EntradaRedes) {
    const ahora = new Date().toLocaleString('es-CL', {
        timeZone: TIMEZONE,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
    const hoyISO = new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE })
    const red = entrada.canal === 'instagram' ? 'Instagram' : 'Facebook'
    const { nombre, telefono, email } = entrada.cliente
    const faltan = [!nombre && 'nombre', !telefono && 'teléfono', !email && 'correo'].filter(Boolean)
    const primerMensaje = !entrada.mensajes.some(m => m.de === 'ali')

    return [
        `Ahora en Chile: ${ahora} (hoy es ${hoyISO}).`,
        `Canal: mensaje privado de ${red}${entrada.via === 'comentario' ? ', a partir de un comentario en una publicación' : ''}.`,
        entrada.publicacion ? `Publicación comentada: "${entrada.publicacion}"` : null,
        `Datos que ya tienes del cliente: nombre ${nombre || '(no lo sabes)'}, teléfono ${telefono ? 'sí' : 'no'}, correo ${email ? 'sí' : 'no'}.`,
        faltan.length ? `Te falta: ${faltan.join(', ')}.` : 'Ya tienes todos sus datos: no se los vuelvas a pedir.',
        primerMensaje ? 'Es tu primer mensaje en esta conversación.' : null,
    ]
        .filter(Boolean)
        .join('\n')
}

/** Corre a Ali sobre una conversación de redes y devuelve lo que hay que mandar. */
export async function conversarRedes(entrada: EntradaRedes, request: NextRequest): Promise<RespuestaRedes> {
    const remota = await configRemota()
    const config = remota?.agente.activo ? remota : null
    const apagadas = config ? herramientasApagadas(config) : []
    const tools = [...HERRAMIENTAS.filter(h => !apagadas.includes(h.name)), HERRAMIENTA_GUARDAR_CONTACTO]
    const extra = config ? bloqueRemoto(config, HERRAMIENTAS.map(h => h.name)) : null

    // Mismo prefijo que el chat web (ficha + config aprobada) para compartir el
    // caché; lo de redes va después.
    const system: Anthropic.TextBlockParam[] = [
        { type: 'text', text: INSTRUCCIONES_ALI, cache_control: { type: 'ephemeral' } },
        ...(extra ? [{ type: 'text' as const, text: extra, cache_control: { type: 'ephemeral' as const } }] : []),
        { type: 'text', text: INSTRUCCIONES_REDES, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: datosDelMomento(entrada) },
    ]

    const ctx: ContextoHerramientas = {
        cliente: { ...entrada.cliente },
        request,
        derivacion: null,
        canal: entrada.canal,
        contacto: null,
        visita: null,
        simulacion: process.env.ALI_REDES_SIMULACION === 'true',
    }

    const ultimoDelCliente = [...entrada.mensajes].reverse().find(m => m.de === 'cliente')?.texto || ''
    const publica = entrada.via === 'comentario' ? respuestaPublica(`${entrada.publicacion || ''} ${ultimoDelCliente}`) : null

    const mensajes = historial(entrada)
    if (!mensajes.length) return { burbujas: [], contacto: null, derivacion: null, visita: null, publica }

    let final = await correrModelo({
        system,
        mensajes,
        tools,
        herramientas: ctx,
        conversacionId: entrada.conversacionId,
        canal: entrada.canal,
        etiquetaConfig: config?.version ?? null,
    })
    if (!final && ctx.derivacion) final = 'Ya le avisé a un asesor y te responde por este mismo chat a la brevedad 🙌'

    return {
        burbujas: final ? enBurbujas(final) : [],
        contacto: ctx.contacto ?? null,
        derivacion: ctx.derivacion,
        visita: ctx.visita ?? null,
        publica,
    }
}
