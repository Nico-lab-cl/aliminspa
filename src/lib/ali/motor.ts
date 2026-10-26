import Anthropic from '@anthropic-ai/sdk'
import type { NextRequest } from 'next/server'
import {
    type ChatSession,
    type ContextoAli,
    contextoAli,
    leerAdjunto,
    publicarMensajeAli,
} from '@/lib/web-chat'
import { TIMEZONE } from '@/lib/booking-rules'
import { INSTRUCCIONES_ALI } from './conocimiento'
import { HERRAMIENTAS, ejecutarHerramienta, type ContextoHerramientas } from './herramientas'

/**
 * Ali atiende el chat web con Claude Haiku.
 *
 * Cuando el visitante escribe, el mensaje se guarda en el CRM como siempre y
 * acá se programa una respuesta. La respuesta corre fuera de la petición del
 * visitante: espera un momento por si manda varios mensajes seguidos, lee la
 * conversación desde el CRM, le pregunta a Claude y publica lo que conteste
 * con pausas de escritura, para que se lea como una persona escribiendo.
 *
 * El estado de cada conversación vive en memoria. Alcanza porque el sitio
 * corre en una sola instancia, igual que los límites de frecuencia del CRM.
 * Si se reinicia el servidor a mitad de una respuesta, esa respuesta se
 * pierde y Ali contesta en el siguiente mensaje del visitante.
 */

const MODELO = 'claude-haiku-5-5'

/** Espera tras el último mensaje del visitante, por si viene escribiendo varios seguidos. */
const ESPERA_RAFAGA_MS = 1500
/** Vueltas máximas de herramientas por respuesta, para que un error nunca quede girando. */
const MAX_VUELTAS = 6
/** Fotos más recientes que se le muestran al modelo; las anteriores van como texto. */
const MAX_FOTOS = 2

const TIPOS_DE_IMAGEN = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])

let cliente: Anthropic | null = null

/** Ali está encendida si hay API key. ALI_ACTIVA=false la apaga sin desplegar. */
export function aliHabilitada() {
    return Boolean(process.env.ANTHROPIC_API_KEY) && process.env.ALI_ACTIVA !== 'false'
}

function anthropic() {
    if (!cliente) cliente = new Anthropic()
    return cliente
}

/* ── Turnos por conversación ─────────────────────────────────────── */

interface Turno {
    temporizador: ReturnType<typeof setTimeout> | null
    corriendo: boolean
    /** Llegó otro mensaje mientras Ali respondía: hay que volver a pasar. */
    pendiente: boolean
    escribiendo: boolean
    sesion: ChatSession
    request: NextRequest
}

const turnos = new Map<string, Turno>()

/** Para el widget: ¿Ali está escribiendo en esta conversación? */
export function aliEscribiendo(conversationId: string) {
    return turnos.get(conversationId)?.escribiendo ?? false
}

/** Programa una respuesta de Ali al último mensaje del visitante. */
export function programarAli(sesion: ChatSession, request: NextRequest) {
    if (!aliHabilitada()) return

    const turno: Turno = turnos.get(sesion.conversationId) ?? {
        temporizador: null,
        corriendo: false,
        pendiente: false,
        escribiendo: false,
        sesion,
        request,
    }
    turno.sesion = sesion
    turno.request = request
    turnos.set(sesion.conversationId, turno)

    if (turno.corriendo) {
        turno.pendiente = true
        return
    }

    if (turno.temporizador) clearTimeout(turno.temporizador)
    turno.temporizador = setTimeout(() => correr(turno), ESPERA_RAFAGA_MS)
}

async function correr(turno: Turno) {
    turno.temporizador = null
    turno.corriendo = true
    turno.pendiente = false

    try {
        await responder(turno)
    } catch (error) {
        console.error('[ali] Error respondiendo:', error)
    } finally {
        turno.corriendo = false
        turno.escribiendo = false

        if (turno.pendiente) {
            turno.pendiente = false
            turno.temporizador = setTimeout(() => correr(turno), ESPERA_RAFAGA_MS)
        } else {
            turnos.delete(turno.sesion.conversationId)
        }
    }
}

/* ── Respuesta ───────────────────────────────────────────────────── */

const dormir = (ms: number) => new Promise(resolve => setTimeout(resolve, Math.max(0, ms)))

/** Lo que tardaría una persona en escribir el mensaje: rápido, pero no instantáneo. */
function tiempoDeEscritura(texto: string) {
    return Math.min(6000, Math.max(1200, texto.length * 35))
}

/**
 * Parte la respuesta en mensajes. El modelo separa con una línea en blanco lo
 * que quiere mandar por separado; más de tres burbujas seguidas se lee como spam.
 */
function enBurbujas(texto: string) {
    const limpio = texto
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/(^|\s)\*(\S.*?\S|\S)\*(?=\s|$)/g, '$1$2')
        .replace(/^#+\s*/gm, '')
        .trim()

    const partes = limpio.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
    if (partes.length <= 3) return partes
    return [...partes.slice(0, 2), partes.slice(2).join('\n\n')]
}

async function responder(turno: Turno) {
    const { sesion } = turno
    const contexto = await contextoAli(sesion)
    if (!contexto.activa) return

    // Lo que el visitante escribió desde la última vez que habló Ali.
    const ultimoDeAli = contexto.mensajes.map(m => m.de).lastIndexOf('ali')
    const sinResponder = contexto.mensajes.slice(ultimoDeAli + 1)
    if (!sinResponder.length || sinResponder.some(m => m.de !== 'cliente')) return

    turno.escribiendo = true
    const inicio = Date.now()
    const yaDerivada = contexto.derivadaAt !== null

    // Audios y videos: Ali no los puede escuchar, así que entra un asesor.
    // Se resuelve sin el modelo para que nunca invente lo que dice un audio.
    if (sinResponder.some(m => m.adjunto && m.adjunto.tipo !== 'image')) {
        const texto = yaDerivada
            ? 'No puedo escuchar audios ni ver videos por aquí 🙈 El asesor que va a tomar tu conversación lo revisa y te responde.'
            : 'No puedo escuchar audios ni ver videos por aquí 🙈 Ya le avisé a un asesor para que lo revise y te responda por este mismo chat.'
        await dormir(tiempoDeEscritura(texto))
        await publicarMensajeAli(
            sesion,
            texto,
            yaDerivada
                ? null
                : {
                      motivo: 'Mandó un audio o video por el chat',
                      resumen: resumenCorto(contexto),
                  }
        )
        return
    }

    const herramientas: ContextoHerramientas = {
        cliente: contexto.cliente,
        request: turno.request,
        derivacion: null,
    }

    let texto: string
    try {
        texto = await conversar(contexto, herramientas, sesion)
    } catch (error) {
        console.error('[ali] Claude no respondió:', error)
        // Sin respuesta del modelo (caída, sin saldo) la persona no puede
        // quedar esperando: se avisa a los asesores una sola vez.
        if (yaDerivada) return
        const aviso = '¡Gracias por escribir! Te comunico con un asesor que te responde por aquí a la brevedad 🙌'
        await dormir(tiempoDeEscritura(aviso))
        await publicarMensajeAli(sesion, aviso, {
            motivo: 'Ali no pudo responder (error técnico)',
            resumen: resumenCorto(contexto),
        })
        return
    }

    if (!texto && herramientas.derivacion) {
        texto = 'Ya le avisé a un asesor y te responde por este mismo chat a la brevedad 🙌'
    }
    if (!texto) return

    const burbujas = enBurbujas(texto)
    for (let i = 0; i < burbujas.length; i++) {
        const espera = tiempoDeEscritura(burbujas[i]) - (i === 0 ? Date.now() - inicio : 0)
        await dormir(espera)

        const esLaUltima = i === burbujas.length - 1
        const guardado = await publicarMensajeAli(
            sesion,
            burbujas[i],
            esLaUltima ? herramientas.derivacion : null
        )
        // Un asesor tomó la conversación mientras Ali escribía: se calla.
        if (!guardado) return
    }
}

/** Para el aviso a los asesores cuando la derivación no la decide el modelo. */
function resumenCorto(contexto: ContextoAli) {
    return contexto.mensajes
        .filter(m => m.de === 'cliente' && m.texto)
        .slice(-3)
        .map(m => m.texto)
        .join(' / ')
        .slice(0, 500)
}

/** Fecha, hora y datos del cliente: van fuera del bloque cacheado. */
function datosDelMomento(contexto: ContextoAli) {
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

    return [
        `Ahora en Chile: ${ahora} (hoy es ${hoyISO}).`,
        `Cliente: ${contexto.cliente.nombre || 'sin nombre'}. Ya dejó su teléfono y correo en el chat.`,
        contexto.asesorAsignado ? `Asesor asignado en el CRM: ${contexto.asesorAsignado}.` : null,
        contexto.derivadaAt
            ? 'Ya derivaste esta conversación a un asesor. No vuelvas a derivar por el mismo tema; si preguntan, di que el asesor ya está avisado y le responde por este chat.'
            : null,
    ]
        .filter(Boolean)
        .join('\n')
}

/** Arma el historial en el formato de la API, con las fotos más recientes. */
async function historial(contexto: ContextoAli, sesion: ChatSession) {
    const fotos = contexto.mensajes
        .filter(m => m.de === 'cliente' && m.adjunto?.tipo === 'image' && TIPOS_DE_IMAGEN.has(m.adjunto.mimeType))
        .slice(-MAX_FOTOS)
        .map(m => m.id)

    const mensajes: Anthropic.MessageParam[] = []

    for (const m of contexto.mensajes) {
        if (m.de === 'asesor') continue
        const rol = m.de === 'cliente' ? 'user' : 'assistant'
        const bloques: Anthropic.ContentBlockParam[] = []

        if (m.adjunto && rol === 'user') {
            if (fotos.includes(m.id)) {
                try {
                    const { contenido, mimeType } = await leerAdjunto(sesion, m.adjunto.id)
                    bloques.push({
                        type: 'image',
                        source: {
                            type: 'base64',
                            media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                            data: Buffer.from(contenido).toString('base64'),
                        },
                    })
                } catch (error) {
                    console.error('[ali] No se pudo leer la foto:', error)
                    bloques.push({ type: 'text', text: '[El cliente mandó una foto que no se pudo abrir]' })
                }
            } else {
                const tipo = m.adjunto.tipo === 'image' ? 'una foto' : m.adjunto.tipo === 'audio' ? 'un audio' : 'un video'
                bloques.push({ type: 'text', text: `[El cliente mandó ${tipo}]` })
            }
        }
        if (m.texto) bloques.push({ type: 'text', text: m.texto })
        if (!bloques.length) continue

        // La API pide que los turnos se alternen: los mensajes seguidos de la
        // misma persona van juntos en un solo turno.
        const anterior = mensajes[mensajes.length - 1]
        if (anterior && anterior.role === rol) {
            ;(anterior.content as Anthropic.ContentBlockParam[]).push(...bloques)
        } else {
            mensajes.push({ role: rol, content: bloques })
        }
    }

    // El saludo inicial vive solo en el widget: la conversación siempre parte
    // con el cliente. Si quedó un turno de Ali al principio, se descarta.
    while (mensajes.length && mensajes[0].role === 'assistant') mensajes.shift()
    return mensajes
}

/**
 * Conversa con Claude, resolviendo las herramientas, y devuelve el texto final.
 * Se exporta para probar conversaciones sin pasar por el CRM.
 */
export async function conversar(contexto: ContextoAli, herramientas: ContextoHerramientas, sesion: ChatSession) {
    const mensajes = await historial(contexto, sesion)

    const system: Anthropic.TextBlockParam[] = [
        { type: 'text', text: INSTRUCCIONES_ALI, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: datosDelMomento(contexto) },
    ]

    for (let vuelta = 0; vuelta < MAX_VUELTAS; vuelta++) {
        const respuesta = await anthropic().messages.create({
            model: MODELO,
            max_tokens: 4096,
            system,
            tools: HERRAMIENTAS,
            messages: mensajes,
        })

        const uso = respuesta.usage
        console.log(
            `[ali] vuelta ${vuelta + 1}: ${respuesta.stop_reason} · entrada ${uso.input_tokens} (caché ${uso.cache_read_input_tokens ?? 0}) · salida ${uso.output_tokens}`
        )

        if (respuesta.stop_reason !== 'tool_use') {
            return respuesta.content
                .filter((b): b is Anthropic.TextBlock => b.type === 'text')
                .map(b => b.text)
                .join('\n\n')
                .trim()
        }

        mensajes.push({ role: 'assistant', content: respuesta.content })

        const llamadas = respuesta.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
        const resultados = await Promise.all(
            llamadas.map(async (llamada): Promise<Anthropic.ToolResultBlockParam> => {
                try {
                    const resultado = await ejecutarHerramienta(llamada.name, llamada.input, herramientas)
                    console.log(`[ali] ${llamada.name}`, JSON.stringify(llamada.input))
                    return { type: 'tool_result', tool_use_id: llamada.id, content: JSON.stringify(resultado) }
                } catch (error) {
                    console.error(`[ali] Falló ${llamada.name}:`, error)
                    return {
                        type: 'tool_result',
                        tool_use_id: llamada.id,
                        content: 'No se pudo completar en este momento.',
                        is_error: true,
                    }
                }
            })
        )
        mensajes.push({ role: 'user', content: resultados })
    }

    throw new Error('Ali superó el máximo de vueltas de herramientas')
}
