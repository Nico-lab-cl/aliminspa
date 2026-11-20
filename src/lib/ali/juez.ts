import { createHash, timingSafeEqual } from 'crypto'
import Anthropic from '@anthropic-ai/sdk'
import { INSTRUCCIONES_ALI, INSTRUCCIONES_REDES } from './conocimiento'
import { bloqueRemoto, configRemota } from './config-remota'
import { HERRAMIENTAS } from './herramientas'

/**
 * La ficha de Ali y el juez que la usa (Fase 2 del roadmap, 20-11-2026).
 *
 * Problema que resuelve: el juez de la revisión semanal tenía su propia copia
 * de los datos de Alimin, más corta que la de Ali, y marcaba como "dato que no
 * está" cosas que Ali sí tiene en su ficha (por ejemplo, que en la etapa 1 de
 * Lomas del Mar ya no quedan terrenos de 390 m², feedback de Marcela). Desde
 * ahora hay una sola fuente: lo mismo que lee Ali (conocimiento.ts más la
 * config aprobada en el CRM web) es lo que leen los jueces.
 *
 *   GET  /api/ali/ficha → la ficha, para el juez semanal del CRM web.
 *   POST /api/ali/juez  → califica una respuesta de Ali contra lo que debía hacer
 *                         (scripts/casos-ali.mjs).
 * Ambos con x-ia-secret = IA_SECRET.
 */

const MODELO_JUEZ = 'claude-haiku-5-5'

/** Instrucciones completas que sigue Ali en redes y WhatsApp, tal como las lee ella. */
export async function fichaDeAli() {
    const remota = await configRemota().catch(() => null)
    const config = remota?.agente.activo ? remota : null
    const extra = config ? bloqueRemoto(config, HERRAMIENTAS.map(h => h.name)) : null
    const texto = [INSTRUCCIONES_ALI, extra, INSTRUCCIONES_REDES].filter(Boolean).join('\n\n')
    const version = createHash('sha1').update(texto).digest('hex').slice(0, 10)
    return { texto, version }
}

export function secretoValido(recibido: string | null) {
    const esperado = process.env.IA_SECRET
    if (!esperado || !recibido) return false
    const a = Buffer.from(esperado)
    const b = Buffer.from(recibido)
    return a.length === b.length && timingSafeEqual(a, b)
}

export interface MensajeCaso {
    de: 'cliente' | 'ali' | 'asesor'
    texto: string
}

export interface Veredicto {
    nota: number
    criterios: { debe: string; cumple: boolean; motivo: string }[]
    comentario: string
}

const HERRAMIENTA_VEREDICTO: Anthropic.Tool = {
    name: 'veredicto',
    description: 'Entrega la calificación de la respuesta de Ali.',
    input_schema: {
        type: 'object',
        properties: {
            nota: { type: 'integer', description: 'De 0 a 100: qué tan buena fue la respuesta de Ali para este momento de la conversación.' },
            criterios: {
                type: 'array',
                description: 'Uno por cada punto de la lista "Lo que debía hacer", en el mismo orden.',
                items: {
                    type: 'object',
                    properties: {
                        debe: { type: 'string' },
                        cumple: { type: 'boolean' },
                        motivo: { type: 'string', description: 'Una frase.' },
                    },
                    required: ['debe', 'cumple', 'motivo'],
                },
            },
            comentario: { type: 'string', description: 'Una frase sobre la respuesta en general.' },
        },
        required: ['nota', 'criterios', 'comentario'],
    },
}

let cliente: Anthropic | null = null
function anthropic() {
    if (!cliente) cliente = new Anthropic()
    return cliente
}

/**
 * Califica la respuesta de Ali al último mensaje del cliente, con la ficha de
 * Ali como única verdad sobre Alimin y una lista de lo que debía hacer.
 */
export async function juzgarRespuesta(p: {
    canal: string
    conversacion: MensajeCaso[]
    respuesta: string[]
    silencio: boolean
    debe: string[]
}): Promise<Veredicto> {
    const ficha = await fichaDeAli()
    const sistema = `Eres el revisor de calidad de Ali, la asistente virtual de Alimin. Calificas UNA respuesta de Ali: la que dio al último mensaje del cliente.

Abajo están las instrucciones completas que sigue Ali. Son la única verdad sobre Alimin y sobre cómo debe atender: un dato que está ahí NO es inventado, y una regla que está ahí es la que manda.
Ali tiene además herramientas que consultan datos reales (lotes disponibles, horarios de visita): lo que viene de ellas tampoco es inventado.

Cómo calificas
- Para cada punto de "Lo que debía hacer", di si la respuesta lo cumple y por qué, en una frase.
- La nota es de 0 a 100 para la respuesta completa: 90 o más si atendió como dicen sus instrucciones; menos de 60 si falló un punto importante o dijo algo que contradice sus instrucciones.
- Si la respuesta es "(Ali no respondió, a propósito)", calificas si en ese momento lo correcto era no responder.

# Instrucciones de Ali (versión ${ficha.version})
${ficha.texto}`

    const conversacion = p.conversacion
        .map(m => `${m.de === 'cliente' ? 'Cliente' : m.de === 'asesor' ? 'Asesor' : 'Ali'}: ${m.texto}`)
        .join('\n')
    // Cada burbuja numerada: una burbuja puede traer líneas en blanco por dentro
    // y sin número el juez las contaba como mensajes aparte.
    const burbujas = p.respuesta.filter(b => !b.startsWith('[Nota para el juez'))
    const notas = p.respuesta.filter(b => b.startsWith('[Nota para el juez'))
    const respuesta =
        p.silencio && !burbujas.length
            ? '(Ali no respondió, a propósito)'
            : [...burbujas.map((b, i) => `[Mensaje ${i + 1} de ${burbujas.length}]\n${b}`), ...notas].join('\n\n')
    const debe = p.debe.length ? p.debe.map((d, i) => `${i + 1}. ${d}`).join('\n') : '1. Atender como dicen sus instrucciones.'

    const r = await anthropic().messages.create({
        model: MODELO_JUEZ,
        max_tokens: 1500,
        system: [{ type: 'text', text: sistema, cache_control: { type: 'ephemeral' } }],
        tools: [HERRAMIENTA_VEREDICTO],
        tool_choice: { type: 'tool', name: 'veredicto' },
        messages: [
            {
                role: 'user',
                content: `Canal: ${p.canal}\n\nConversación hasta el último mensaje del cliente:\n${conversacion}\n\nRespuesta de Ali:\n${respuesta}\n\nLo que debía hacer:\n${debe}`,
            },
        ],
    })
    const bloque = r.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
    if (!bloque) throw new Error('El juez no entregó veredicto')
    const v = bloque.input as Veredicto
    return {
        nota: Math.max(0, Math.min(100, Math.round(Number(v.nota) || 0))),
        criterios: Array.isArray(v.criterios) ? v.criterios : [],
        comentario: String(v.comentario || ''),
    }
}
