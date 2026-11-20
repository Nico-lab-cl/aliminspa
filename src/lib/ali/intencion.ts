import Anthropic from '@anthropic-ai/sdk'
import { reportarUso } from './config-remota'

/**
 * Fase 3 del roadmap (20-11-2026): Ali entiende qué le escribieron ANTES de
 * responder.
 *
 * Problema: la ficha de Ali tiene ~32.000 caracteres de reglas y Haiku, al
 * responder, a veces aplica la que no era. El 20-11 tomó un "Gracias" + el
 * nombre como despedida, a una clienta de postventa molesta le preguntó dos
 * veces si quería que la contactaran (quedó con un "??") y a diez preguntas
 * juntas las respondió en un párrafo de 400 caracteres.
 *
 * Solución: una llamada corta a Haiku, con herramienta forzada, que solo
 * clasifica el último mensaje del cliente. Con eso redes.ts le agrega a Ali
 * una guía corta para ESE tipo de mensaje (GUIAS, abajo), que pesa más que
 * buscar la regla entre todas. Si el clasificador falla o se demora, Ali
 * responde igual que antes, sin guía.
 *
 * Costo: ~1.500 tokens de entrada y ~80 de salida por mensaje (menos de
 * US$0,002). Se reporta al CRM web como uso de Ali.
 */

const MODELO = 'claude-haiku-5-5'
const TIMEOUT_MS = 8000

export const TIPOS = [
    'saludo',
    'consulta',
    'varias_preguntas',
    'da_datos',
    'cierre',
    'objecion_precio',
    'duda_o_desconfianza',
    'quiere_visitar',
    'quiere_reservar',
    'pide_persona',
    'postventa',
    'reclamo',
    'confusion',
    'fuera_de_tema',
] as const
export type TipoMensaje = (typeof TIPOS)[number]

export interface Intencion {
    tipo: TipoMensaje
    /** La persona le habla a Ali como si fuera otra persona (por ejemplo, un asesor por su nombre). */
    cree_que_es_otra_persona: boolean
    /** Nombre que la persona dio en sus últimos mensajes, si lo dio. */
    nombre: string | null
    /** Lo que pregunta o pide, en pocas palabras (para los registros y la guía). */
    resumen: string
}

const DESCRIPCION_TIPOS = `- saludo: solo saluda o escribe "info", "hola", "precio?" sin decir de qué, o algo igual de general. También si pregunta si lo escuchas o si te llegó su audio ("¿me escuchas?").
- consulta: una o dos preguntas concretas (precio, ubicación, cuotas, qué incluye, entrega, agua, luz, escritura, visita…).
- varias_preguntas: tres o más preguntas o temas en el mismo mensaje o en mensajes seguidos.
- da_datos: contesta lo que Ali le preguntó (su nombre, su correo, un día u horario, para qué lo quiere, qué proyecto o qué tamaño le interesa) sin hacer una pregunta nueva. Un "gracias" junto a su nombre es da_datos, no cierre.
- cierre: solo agradece o acusa recibo ("gracias", "ok", "ya lo vi", "perfecto"), o es solo emojis o un sticker, sin pregunta ni dato.
- objecion_precio: dice que es caro, que no le alcanza o que no tiene el pie.
- duda_o_desconfianza: desconfía ("¿es estafa?", "¿son reales?"), le parece lejos, duda de los papeles o de la empresa, o pone otra objeción que no es el precio.
- quiere_visitar: quiere ir a ver los terrenos, pregunta por horarios de visita o elige un horario.
- quiere_reservar: quiere reservar, apartar, pagar el pie o cerrar la compra.
- pide_persona: pide hablar con una persona, un asesor o un ejecutivo, o que la llamen.
- postventa: YA COMPRÓ (lo dice, o la memoria del CRM dice que ya es cliente) y pregunta o reclama por su terreno, sus pagos, la escritura, el cierre, los abogados o la entrega.
- reclamo: está molesta o reclama por la atención, y no es postventa.
- confusion: no entendió lo último que le dijo Ali ("?", "??", "no entiendo", "¿qué?", "¿cómo así?").
- fuera_de_tema: spam, publicidad, ofrece servicios, busca trabajo o escribe algo que no tiene que ver con comprar un terreno.`

const HERRAMIENTA: Anthropic.Tool = {
    name: 'clasificar',
    description: 'Clasifica el último mensaje del cliente.',
    input_schema: {
        type: 'object',
        properties: {
            tipo: { type: 'string', enum: [...TIPOS], description: 'El tipo que mejor describe lo que el cliente necesita ahora.' },
            cree_que_es_otra_persona: {
                type: 'boolean',
                description: 'true si le habla a Ali como si fuera otra persona, por ejemplo la saluda con el nombre de un asesor ("Hola, Bárbara").',
            },
            nombre: { type: ['string', 'null'], description: 'El nombre de pila que el cliente dio en sus últimos mensajes, o null.' },
            resumen: { type: 'string', description: 'Qué pregunta o pide, en menos de 15 palabras.' },
        },
        required: ['tipo', 'cree_que_es_otra_persona', 'nombre', 'resumen'],
    },
}

const SISTEMA = `Clasificas mensajes que le llegan a Ali, la asistente virtual de Alimin, una inmobiliaria que vende terrenos en El Tabo (Chile), por Instagram, Facebook, WhatsApp y el chat de su página web. No respondes al cliente: solo dices qué tipo de mensaje es su ÚLTIMO mensaje (o sus últimos mensajes seguidos, si mandó varios), mirando la conversación para entenderlo.

Tipos
${DESCRIPCION_TIPOS}

Si calzan dos, elige el que más cambia lo que Ali tiene que hacer: postventa, pide_persona, quiere_reservar y confusion pesan más que el resto; varias_preguntas pesa más que consulta; da_datos con una pregunta nueva es consulta.`

let cliente: Anthropic | null = null
function anthropic() {
    if (!cliente) cliente = new Anthropic()
    return cliente
}

export interface MensajeParaClasificar {
    de: 'cliente' | 'ali' | 'asesor'
    texto: string
}

/** Clasifica el último mensaje del cliente. Devuelve null si falla o se demora: Ali sigue sin guía. */
export async function clasificarMensaje(p: {
    mensajes: MensajeParaClasificar[]
    memoria?: string | null
    conversacionId: string
    canal: string
    prueba?: boolean
}): Promise<Intencion | null> {
    const ultimos = p.mensajes.slice(-10)
    const conversacion = ultimos
        .map(m => `${m.de === 'cliente' ? 'Cliente' : m.de === 'asesor' ? 'Asesor' : 'Ali'}: ${m.texto.slice(0, 1200)}`)
        .join('\n')
    const memoria = p.memoria ? `\n\nMemoria del CRM sobre esta persona (resumen):\n${p.memoria.slice(0, 800)}` : ''
    try {
        const r = await anthropic().messages.create(
            {
                model: MODELO,
                max_tokens: 300,
                system: [{ type: 'text', text: SISTEMA, cache_control: { type: 'ephemeral' } }],
                tools: [HERRAMIENTA],
                tool_choice: { type: 'tool', name: 'clasificar' },
                messages: [{ role: 'user', content: `Conversación (lo último es lo que hay que clasificar):\n${conversacion}${memoria}` }],
            },
            { timeout: TIMEOUT_MS, maxRetries: 0 }
        )
        if (!p.prueba) {
            reportarUso({
                conversacionId: p.conversacionId,
                canal: p.canal,
                modelo: MODELO,
                input_tokens: r.usage.input_tokens,
                output_tokens: r.usage.output_tokens,
                cache_read_input_tokens: r.usage.cache_read_input_tokens,
                cache_creation_input_tokens: r.usage.cache_creation_input_tokens,
            })
        }
        const bloque = r.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
        const x = (bloque?.input || {}) as Partial<Intencion>
        if (!x.tipo || !(TIPOS as readonly string[]).includes(x.tipo)) return null
        return {
            tipo: x.tipo,
            cree_que_es_otra_persona: Boolean(x.cree_que_es_otra_persona),
            nombre: typeof x.nombre === 'string' && x.nombre.trim() ? x.nombre.trim() : null,
            resumen: String(x.resumen || '').slice(0, 200),
        }
    } catch (error) {
        console.warn(`[ali:${p.canal}] No pude clasificar el mensaje: ${(error as Error).message}`)
        return null
    }
}

/**
 * Lo que Ali tiene que hacer con cada tipo de mensaje. Corto a propósito: es
 * un recordatorio de la sección de la ficha que aplica, no una ficha nueva.
 */
const GUIAS: Record<TipoMensaje, string> = {
    saludo: 'Solo saludó o pidió información general. Si no te has presentado, hazlo con "Hola, soy Ali, del equipo de Alimin 👋" (con el 👋, nunca "asistente virtual") y pregúntale su nombre y qué le interesa saber (precio, ubicación, cómo son). Nada de precios ni listas todavía.',
    consulta: 'Hizo una pregunta concreta. Respóndela directo, con lista ✅ si son 2 o más datos. Si es el precio, en el mensaje siguiente va la lista de lo que viene con el terreno (las 5 líneas de tu ficha), si no salió antes, y cierras con "¿Te sirve más pagarlo al contado o en cuotas?" sin pedirle el nombre todavía. Si no es el precio y no sabes su nombre, pregúntaselo al final ("¿con quién tengo el gusto?").',
    varias_preguntas:
        'Hizo muchas preguntas juntas. Respóndelas en listas cortas con ✅ agrupadas por tema (precio y crédito en una, qué incluye en otra), máximo 3 mensajes y ningún párrafo. Lo que no alcance, ofrécelo en la pregunta final.',
    da_datos:
        'Te está respondiendo lo que le preguntaste: no es una despedida. Si te dio su nombre, salúdala por su nombre. Si tenía una pregunta pendiente, respóndela ahora. Si eligió una opción que le mostraste (un proyecto o un tamaño), eso es pedirte más de esa opción: dale en lista con ✅ lo que todavía no le diste de ella (qué incluye, entrega aproximada) y recién después invítala a la visita; nunca solo "perfecto". Si no, hazle una pregunta abierta corta. No repitas datos que ya le diste.',
    // La parte de "qué hacer" depende de tu último mensaje: la arma guiaDeIntencion.
    cierre: 'Solo agradeció, acusó recibo o reaccionó. Nada de precios, listas, datos nuevos ni preguntas.',
    objecion_precio:
        'Le parece caro o no le alcanza. Valida en una frase y muéstrale una sola vez la opción más accesible (Lomas del Mar 200 m² con crédito directo, precio completo con el total). Si ya se la mostraste o igual no le acomoda, despídete con amabilidad, sin insistir.',
    duda_o_desconfianza:
        'Tiene una duda de fondo o desconfía. Responde con datos ciertos de tu ficha, en pocas frases y sin discutir, e invítala a conocer los terrenos en persona, que es lo que más tranquiliza.',
    quiere_visitar: 'Quiere visitar. Sigue el flujo de agenda: proyecto, horarios disponibles con la herramienta y los datos que te falten para agendar. No le mandes enlaces de agenda.',
    quiere_reservar: 'Quiere reservar o pagar. Felicítala en una frase y deriva con derivar_a_asesor (motivo "quiere reservar", con proyecto y lote si los dijo). Dile que su asesor le escribe por este chat.',
    pide_persona: 'Pide hablar con una persona. Deriva con derivar_a_asesor y dile en una frase que un asesor le responde por este mismo chat.',
    postventa:
        'Ya es cliente y esto es postventa. Deriva AHORA con derivar_a_asesor, sin preguntarle antes. Reconoce lo que le pasa en una frase y dile que ya le avisaste al equipo de postventa y que le escriben por este mismo chat. No le vendas nada ni le pidas datos.',
    reclamo:
        'Está molesta. Reconoce lo que le pasa en una frase, sin excusas largas, ayúdala con lo que sepas y ofrécele una sola vez que una persona del equipo lo revise; si ya se lo ofreciste o insiste, deriva.',
    confusion:
        'No entendió tu último mensaje. No lo repitas igual ni pidas perdón largo: dilo distinto en una frase simple. Si le habías ofrecido algo que necesita (por ejemplo, que la contacte una persona), hazlo ahora.',
    fuera_de_tema:
        'No tiene que ver con comprar un terreno. Un solo mensaje de una o dos frases: amable, dile que por aquí atiendes consultas de los terrenos de Alimin. No te presentes con lista, no le pidas el nombre ni datos y no derives.',
}

/**
 * En el chat web la persona ya dejó nombre, teléfono y correo en el
 * formulario, y ahí no van listas con ✅ ni el "Sin enlaces" de redes: estas
 * guías reemplazan a las de arriba para el canal web.
 */
const GUIAS_WEB: Partial<Record<TipoMensaje, string>> = {
    saludo: 'Solo saludó o pidió información general. Salúdala por su nombre si lo tienes y pregúntale qué le interesa saber (precio, ubicación, cómo son). Nada de precios todavía.',
    consulta: 'Hizo una pregunta concreta. Respóndela directo y breve, 1 a 3 frases por mensaje. Si es el precio, súmale en una frase lo que viene con el terreno, si no salió antes.',
    varias_preguntas:
        'Hizo muchas preguntas juntas. Responde lo principal en mensajes breves (máximo 3, ningún párrafo largo) y ofrécele lo demás en la pregunta final.',
    quiere_visitar: 'Quiere visitar. Sigue el flujo de agenda con tus herramientas: proyecto, horarios disponibles y agendar.',
    fuera_de_tema: 'No tiene que ver con comprar un terreno. Un solo mensaje de una o dos frases, amable: por aquí atiendes consultas de los terrenos de Alimin. No derives.',
}

/** Tipos en los que Ali NO debe pedir el nombre aunque sea su primer mensaje. */
export const SIN_PEDIR_NOMBRE: TipoMensaje[] = ['cierre', 'fuera_de_tema', 'postventa', 'pide_persona', 'quiere_reservar', 'reclamo', 'confusion']

/**
 * Qué hacer con un cierre, según lo último que escribió Ali (lo decide el
 * código, no el modelo: el 20-11 Ali se quedó callada ante un sticker aunque
 * su último mensaje era una pregunta).
 */
/**
 * El mensaje de Ali hizo una pregunta, en cualquier parte (no solo al final:
 * "¿Con quién tengo el gusto? Así te cuento el precio." también cuenta). Una
 * despedida nunca lleva "?".
 */
export function terminaEnPregunta(texto: string | null) {
    return Boolean(texto && texto.includes('?'))
}

/** Despedida fija para cuando Ali calló sin deber (su último mensaje era una pregunta). */
export const DESPEDIDA_CORTA = 'Perfecto 😊 Cualquier duda me escribes por aquí'

function guiaDeCierre(ultimoDeAli: string | null, web: boolean) {
    if (!ultimoDeAli) {
        return web
            ? 'Todavía no le has escrito: un solo mensaje de una línea, cálido, ofreciendo ayuda con dudas puntuales.'
            : 'Todavía no te presentas: un solo mensaje, en una línea y sin línea en blanco, te presentas y ofreces ayuda con dudas puntuales. Sin pedirle el nombre.'
    }
    if (terminaEnPregunta(ultimoDeAli)) {
        return 'Tu último mensaje le hacía una pregunta: SÍ respondes, con una sola línea cálida de despedida, sin repetir la pregunta.'
    }
    return 'Tu último mensaje ya fue un cierre sin pregunta: no respondas, escribe únicamente [SIN_RESPUESTA].'
}

/**
 * Bloque para "datos del momento": qué es el mensaje y qué hacer con él.
 * `ultimoDeAli`: el último mensaje que escribió Ali (sin contar el brochure automático), o null.
 */
export function guiaDeIntencion(i: Intencion | null, ultimoDeAli: string | null = null, canal = 'instagram'): string | null {
    if (!i) return null
    const web = canal === 'web'
    return [
        `# Qué es su último mensaje (clasificado antes de responder)`,
        `Tipo: ${i.tipo}${i.resumen ? `. ${i.resumen}` : ''}`,
        (web && GUIAS_WEB[i.tipo]) || GUIAS[i.tipo],
        i.tipo === 'cierre' ? guiaDeCierre(ultimoDeAli, web) : null,
        i.cree_que_es_otra_persona ? 'Te habla como si fueras otra persona: aclárale en una frase que eres Ali, del equipo de Alimin.' : null,
        'Si al leer la conversación ves que el tipo no calza, atiende según tu ficha.',
    ]
        .filter(Boolean)
        .join('\n')
}
