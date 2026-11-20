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
import { HERRAMIENTAS, ejecutarHerramienta, type CanalAli, type ContextoHerramientas } from './herramientas'
import { bloqueRemoto, configRemota, herramientasApagadas, reportarUso, type AgenteChat } from './config-remota'
import { modoCierre } from './cierre'
import { fraseDeRespuesta, oficinaDice, oficinaTrabaja } from './oficina'
import { afirmacionesProhibidas, LO_QUE_VIENE, modismos, precioIncompleto, problemasDeFormato, sinModismos } from './guardia'
import { clasificarMensaje, DESPEDIDA_CORTA, guiaDeIntencion, terminaEnPregunta, type Intencion } from './intencion'

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
/** El CRM deja así los audios que transcribió (lib/transcribir.ts del CRM móvil). */
const esAudioTranscrito = (texto?: string | null) => /^🎤 \(audio\)/.test(texto || '')

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
export function enBurbujas(texto: string) {
    const partes = partirEnBloques(texto)
    if (partes.length <= 3) return partes
    return [...partes.slice(0, 2), partes.slice(2).join('\n\n')]
}

/**
 * La respuesta sin markdown y sin dos puntos, partida en los bloques que el
 * modelo separó con una línea en blanco. Los dos puntos hacen que suene a
 * ficha y no a persona (Nicolás, 12-11-2026): "Arena y Sol: entrega
 * inmediata" queda "Arena y Sol, entrega inmediata" y un título que termina
 * en ":" queda sin ellos. Los enlaces (https://) y las horas (16:00) no se tocan.
 */
export function partirEnBloques(texto: string) {
    const limpio = texto
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/(^|\s)\*(\S.*?\S|\S)\*(?=\s|$)/g, '$1$2')
        .replace(/^#+\s*/gm, '')
        .replace(/\s*:[ \t]*$/gm, '')
        .replace(/:[ \t]+(?=\S)/g, ', ')
        .trim()
    return limpio.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
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

    // Audios y videos que Ali no puede entender. Los audios llegan transcritos
    // desde el CRM ("🎤 (audio) …", 19-11-2026) y esos los responde como texto;
    // si un audio no se pudo transcribir o es un video, se resuelve sin el
    // modelo para que nunca invente lo que dice: pide que se lo escriban
    // (Nicolás, 15-11-2026: derivar solo si piden una persona).
    if (sinResponder.some(m => m.adjunto && m.adjunto.tipo !== 'image' && !esAudioTranscrito(m.texto))) {
        const texto = yaDerivada
            ? 'No puedo escuchar audios ni ver videos por aquí 🙈 El asesor que va a tomar tu conversación lo revisa y te responde.'
            : 'No puedo escuchar audios ni ver videos por aquí 🙈 ¿Me lo puedes escribir? Así te ayudo enseguida.'
        await dormir(tiempoDeEscritura(texto))
        await publicarMensajeAli(sesion, texto, null)
        return
    }

    const herramientas: ContextoHerramientas = {
        cliente: contexto.cliente,
        request: turno.request,
        derivacion: null,
    }

    let texto: string
    try {
        const r = await conversar(contexto, herramientas, sesion)
        if (r.silencio) {
            console.log(`[ali] Sin respuesta a propósito en ${sesion.conversationId} (solo volvió a agradecer)`)
            return
        }
        texto = r.texto
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
function datosDelMomento(contexto: ContextoAli, intencion: Intencion | null) {
    const ultimoDeAli = [...contexto.mensajes].reverse().find(m => m.de === 'ali')?.texto ?? null
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
        contexto.memoria
            ? `\n# Memoria del CRM sobre esta persona (solo para ti)\n${contexto.memoria.slice(0, 8000)}`
            : null,
        intencion ? `\n${guiaDeIntencion(intencion, ultimoDeAli, 'web')}` : null,
    ]
        .filter(Boolean)
        .join('\n')
}

/** Arma el historial en el formato de la API, con las fotos más recientes. */
async function historial(contexto: ContextoAli, sesion: ChatSession | null) {
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
            if (fotos.includes(m.id) && sesion) {
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
            } else if (!esAudioTranscrito(m.texto)) {
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
export async function conversar(
    contexto: ContextoAli,
    herramientas: ContextoHerramientas,
    sesion: ChatSession | null,
    opciones: { conversacionId?: string; prueba?: boolean } = {}
) {
    const nombres = HERRAMIENTAS.map(h => h.name)
    const conversacionId = sesion?.conversationId || opciones.conversacionId || 'sin-id'
    // Fase 3: qué es el último mensaje, en paralelo con lo demás (intencion.ts).
    const [mensajes, remota, cierre, intencion] = await Promise.all([
        historial(contexto, sesion),
        configRemota(),
        modoCierre(contexto.agente, nombres),
        clasificarMensaje({
            mensajes: contexto.mensajes.map(m => ({ de: m.de, texto: m.texto || (m.adjunto ? `[${m.adjunto.tipo}]` : '') })),
            memoria: contexto.memoria,
            conversacionId,
            canal: 'web',
            prueba: opciones.prueba,
        }),
    ])
    if (intencion) {
        console.log(`[ali${opciones.prueba ? ':prueba' : ''}] mensaje tipo ${intencion.tipo}${intencion.cree_que_es_otra_persona ? ' (cree que es otra persona)' : ''}: ${intencion.resumen}`)
    }

    // La config del CRM web solo cuenta si el equipo dejó el agente activo;
    // si no, o si no llegó, Ali sigue con lo local tal cual.
    const config = remota?.agente.activo ? remota : null
    const apagadas = [...(config ? herramientasApagadas(config) : []), ...cierre.apagadas]
    const herramientasActivas = HERRAMIENTAS.filter(h => !apagadas.includes(h.name))
    const extra = config ? bloqueRemoto(config, nombres) : null

    const system: Anthropic.TextBlockParam[] = [
        { type: 'text', text: INSTRUCCIONES_ALI, cache_control: { type: 'ephemeral' } },
        ...(extra ? [{ type: 'text' as const, text: extra, cache_control: { type: 'ephemeral' as const } }] : []),
        // Si la persona ya llegó a la visita y el Cierre está encendido.
        ...cierre.bloques,
        { type: 'text', text: datosDelMomento(contexto, intencion) },
    ]

    const final = await correrModelo({
        system,
        mensajes,
        tools: herramientasActivas,
        herramientas,
        conversacionId,
        canal: 'web',
        agente: cierre.agente,
        etiquetaConfig: cierre.version ?? config?.version ?? null,
        prueba: opciones.prueba,
    })
    // Ali eligió no responder: la persona solo volvió a agradecer después de que se despidió.
    // Si su último mensaje era una pregunta, no puede callar: despedida fija.
    const ultimoDeAli = [...contexto.mensajes].reverse().find(m => m.de === 'ali')?.texto ?? null
    const quiereCallar = /^\s*\[SIN_RESPUESTA\]\s*$/i.test(final) && !herramientas.derivacion
    const silencio = quiereCallar && !terminaEnPregunta(ultimoDeAli)
    const texto = quiereCallar && !silencio ? DESPEDIDA_CORTA : final.replace(/\[SIN_RESPUESTA\]/gi, '').trim()
    return { texto, intencion, silencio }
}

/**
 * Chat web en modo prueba (/api/ali/prueba con canal "web", banco de pruebas):
 * misma Ali que el chat de aliminspa.cl, sin sesión ni CRM; agendar solo valida.
 */
export async function conversarWebPrueba(
    entrada: { mensajes: { de: 'cliente' | 'ali'; texto: string }[]; cliente: { nombre: string | null; telefono: string | null; email: string | null }; id: string },
    request: NextRequest
) {
    const contexto: ContextoAli = {
        activa: true,
        derivadaAt: null,
        mensajes: entrada.mensajes.map((m, i) => ({ id: `p${i}`, texto: m.texto, de: m.de, derivacion: false, createdAt: '', adjunto: null })),
        cliente: { ...entrada.cliente, interes: null },
        asesorAsignado: null,
        memoria: null,
        agente: null,
    }
    const herramientas: ContextoHerramientas = { cliente: entrada.cliente, request, derivacion: null, simulacion: true, canal: 'web' }
    const r = await conversar(contexto, herramientas, null, { conversacionId: `prueba-web-${entrada.id}`, prueba: true })
    return {
        burbujas: r.texto ? enBurbujas(r.texto) : [],
        derivacion: herramientas.derivacion,
        visita: herramientas.visita ?? null,
        silencio: r.silencio,
        intencion: r.intencion,
    }
}

/**
 * El ciclo con Claude: pide respuesta, ejecuta las herramientas que pida y
 * repite hasta tener el texto final. Lo usan el chat web y las redes.
 */
export async function correrModelo(p: {
    system: Anthropic.TextBlockParam[]
    mensajes: Anthropic.MessageParam[]
    tools: Anthropic.Tool[]
    herramientas: ContextoHerramientas
    conversacionId: string
    canal: CanalAli
    /** Ali (atracción) por defecto, o Cierre: se registra aparte en el CRM web. */
    agente?: AgenteChat
    etiquetaConfig: string | null
    /** Página de prueba (/probar-ali): no reporta uso al CRM web ni avisa a la Oficina IA. */
    prueba?: boolean
}) {
    const { system, mensajes, herramientas } = p
    const textoDe = (content: Anthropic.ContentBlock[]) =>
        content
            .filter((b): b is Anthropic.TextBlock => b.type === 'text')
            .map(b => b.text)
            .join('\n\n')
            .trim()
    // A veces el modelo escribe la respuesta junto con la llamada a una
    // herramienta (guardar_contacto) y, con el resultado, termina sin texto.
    // Sin esto la persona se quedaba sin respuesta (prueba del 12-11-2026).
    let textoAnterior = ''
    /** Veces que guardia.ts le pidió reescribir (máximo 2). */
    let correcciones = 0
    /** La lista de lo que viene con el terreno ya salió antes en la conversación. */
    const yaDijoLoQueViene = mensajes.some(
        m =>
            m.role === 'assistant' &&
            (typeof m.content === 'string'
                ? LO_QUE_VIENE.test(m.content)
                : m.content.some(b => b.type === 'text' && LO_QUE_VIENE.test(b.text)))
    )
    // Oficina IA: el personaje se pone a trabajar (sin datos del cliente).
    const agenteOficina = p.agente === 'cierre' ? 'cierre' : 'ali'
    if (!p.prueba) oficinaTrabaja(agenteOficina, p.canal)
    for (let vuelta = 0; vuelta < MAX_VUELTAS; vuelta++) {
        const respuesta = await anthropic().messages.create({
            model: MODELO,
            max_tokens: 4096,
            system,
            tools: p.tools,
            messages: mensajes,
        })

        const uso = respuesta.usage
        if (!p.prueba) reportarUso({
            conversacionId: p.conversacionId,
            canal: p.canal,
            agente: p.agente,
            modelo: MODELO,
            input_tokens: uso.input_tokens,
            output_tokens: uso.output_tokens,
            cache_read_input_tokens: uso.cache_read_input_tokens,
            cache_creation_input_tokens: uso.cache_creation_input_tokens,
        })
        console.log(
            `[ali${p.prueba ? ':prueba' : ''}${p.canal === 'web' ? '' : `:${p.canal}`}${p.agente === 'cierre' ? ':cierre' : ''}] vuelta ${vuelta + 1}: ${respuesta.stop_reason} · entrada ${uso.input_tokens} (caché ${uso.cache_read_input_tokens ?? 0}) · salida ${uso.output_tokens}${p.etiquetaConfig ? ` · config ${p.etiquetaConfig}` : ''}`
        )

        if (respuesta.stop_reason !== 'tool_use') {
            const texto = textoDe(respuesta.content) || textoAnterior
            // Promesas que no se pueden hacer y respuestas demasiado largas
            // (guardia.ts): Ali reescribe una sola vez.
            // Hasta dos reescrituras: al acortar a veces vuelve un "✅ Rol propio"
            // o, al corregir un precio, queda un párrafo largo.
            const malas = correcciones < 2 ? afirmacionesProhibidas(texto) : []
            const forma = correcciones < 2 ? problemasDeFormato(texto, p.canal) : []
            const jerga = correcciones < 2 ? modismos(texto) : []
            const precio = correcciones < 2 ? precioIncompleto(texto, yaDijoLoQueViene, p.canal) : []
            // Anuncia el plano sin haber llamado a enviar_documento: la persona
            // se quedaba esperando un archivo que nunca llegaba (banco del 20-11).
            const sinArchivo =
                correcciones < 2 &&
                p.tools.some(t => t.name === 'enviar_documento') &&
                !herramientas.documentos?.length &&
                anunciaPlano(texto)
            if ((malas.length || forma.length || jerga.length || precio.length || sinArchivo) && vuelta < MAX_VUELTAS - 1) {
                correcciones++
                console.warn(`[ali${p.canal === 'web' ? '' : `:${p.canal}`}] Reescribe: ${[...malas, ...forma, ...jerga, ...precio, ...(sinArchivo ? ['anuncia el plano sin enviarlo'] : [])].join(' | ')}`)
                if (sinArchivo && !malas.length && !forma.length && !jerga.length && !precio.length) {
                    mensajes.push({ role: 'assistant', content: respuesta.content.length ? respuesta.content : [{ type: 'text', text: texto }] })
                    mensajes.push({
                        role: 'user',
                        content: '[Revisión interna antes de enviar, no es un mensaje del cliente] Le dices que le mandas el plano, pero no usaste enviar_documento, así que no le llegaría. Llama ahora a enviar_documento con el plano de su proyecto y después escribe de nuevo tu respuesta completa (si el plano ya se lo mandaste antes en la conversación, no lo anuncies). No menciones esta revisión.',
                    })
                    continue
                }
                const partes = [
                    malas.length ? `Tiene afirmaciones que no son ciertas:\n- ${malas.join('\n- ')}` : '',
                    forma.length ? `Está demasiado larga para un chat:\n- ${forma.join('\n- ')}` : '',
                    precio.length ? `Al precio le falta algo:\n- ${precio.join('\n- ')}` : '',
                    sinArchivo ? 'Le dices que le mandas el plano, pero no usaste enviar_documento: llámalo con el plano de su proyecto antes de responder (si ya se lo mandaste antes, no lo anuncies).' : '',
                    jerga.length ? `Usa modismos que Ali nunca usa (${jerga.map(j => `"${j}"`).join(', ')}): escribe en un español cercano pero cuidado, por ejemplo "de inmediato" en vez de "al tiro".` : '',
                ].filter(Boolean)
                mensajes.push({ role: 'assistant', content: respuesta.content.length ? respuesta.content : [{ type: 'text', text: texto }] })
                mensajes.push({
                    role: 'user',
                    content: `[Revisión interna antes de enviar, no es un mensaje del cliente] Tu respuesta tiene que corregirse.\n${partes.join('\n')}\nEscribe de nuevo tu respuesta completa para el cliente, ${precio.length ? 'con lo que falta, sin párrafos' : 'con los mismos datos, más breve y ordenada'}, siguiendo "Cómo se ven tus mensajes": las listas con ✅ se mantienen. No menciones esta revisión.`,
                })
                continue
            }
            if (!p.prueba) oficinaDice(agenteOficina, fraseDeRespuesta(p.canal, herramientas))
            return sinModismos(texto)
        }

        textoAnterior = textoDe(respuesta.content) || textoAnterior
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

/**
 * Ali afirma que manda el plano ahora ("Te mando el plano con los lotes que
 * quedan 👇"). No cuenta el ofrecimiento: "¿Me dejas tu correo? Así te mando
 * el plano" o "si quieres, te mando el plano".
 */
export function anunciaPlano(texto: string): boolean {
    const frases = texto.split(/(?<=[.!?\n👇])\s*/)
    return frases.some(
        f =>
            !f.includes('?') &&
            !/^(y )?(así|si |para |cuando |apenas )/i.test(f.trim()) &&
            /\b(te|le)\s+(mando|env[ií]o|dejo|paso|comparto|adjunto)\b[^.\n]{0,40}\bplanos?\b|\b(ah[ií]|aqu[ií]) (te )?va el plano/i.test(f)
    )
}
