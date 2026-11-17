import type Anthropic from '@anthropic-ai/sdk'
import type { NextRequest } from 'next/server'
import { TIMEZONE } from '@/lib/booking-rules'
import { INSTRUCCIONES_ALI, INSTRUCCIONES_REDES } from './conocimiento'
import { bloqueRemoto, configRemota, herramientasApagadas } from './config-remota'
import {
    HERRAMIENTAS,
    HERRAMIENTA_ENVIAR_DOCUMENTO,
    HERRAMIENTA_GUARDAR_CONTACTO,
    type ContactoAli,
    type ContextoHerramientas,
} from './herramientas'
import { correrModelo, partirEnBloques } from './motor'
import { modoCierre } from './cierre'
import type { DocumentoParaEnviar } from './documentos'

/**
 * Mensajes para IG/FB. Una línea con ✅ nunca sale sola (va pegada a su
 * título) y un enlace suelto va con la frase de antes: el modelo a veces deja
 * líneas en blanco ahí y se mandaban como mensajes separados (prueba del
 * 12-11-2026). Máximo 3 mensajes, con la pregunta final aparte.
 */
export function burbujasRedes(texto: string) {
    const unidas: string[] = []
    for (const p of partirEnBloques(texto)) {
        const anterior = unidas[unidas.length - 1]
        const pegada = p.startsWith('✅') || /^(lo puedes ver aquí|aquí|acá)?\s*https?:\/\/\S+$/i.test(p)
        if (anterior !== undefined && pegada) {
            unidas[unidas.length - 1] = `${anterior}\n${p}`
        } else {
            unidas.push(p)
        }
    }
    if (unidas.length <= 3) return unidas
    return [unidas[0], unidas.slice(1, -1).join('\n\n'), unidas[unidas.length - 1]]
}

/**
 * Ali en Instagram y Facebook.
 *
 * El CRM móvil recibe el webhook de Meta, arma la conversación y llama a
 * /api/ali/redes; acá corre el mismo motor del chat web (misma ficha, mismas
 * herramientas, misma config aprobada del CRM web) más INSTRUCCIONES_REDES y
 * la herramienta guardar_contacto. No escribe en el CRM: devuelve lo que hay
 * que mandar y los datos que juntó, y el CRM envía, guarda y crea el lead.
 */

export type CanalRedes = 'instagram' | 'facebook' | 'whatsapp'

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
    /**
     * Lo que el CRM sabe de la persona antes de esta conversación: ficha del
     * lead, movimientos del pipeline y lo que habló antes aquí y en otros
     * canales (lib/memoriaLead.ts del CRM móvil). Texto para Ali, no para el cliente.
     */
    memoria: string | null
    /** "cierre" si ya llegó a la visita y no reservó (lo decide el CRM móvil). Sin dato, Ali. */
    agente: string | null
}

export interface RespuestaRedes {
    burbujas: string[]
    contacto: ContactoAli | null
    derivacion: { motivo: string; resumen: string } | null
    visita: { proyecto: string; fecha: string; hora: string } | null
    /** Archivos que Ali eligió mandar después de sus mensajes (enviar_documento). */
    documentos: DocumentoParaEnviar[]
    /** Respuesta pública bajo el comentario, sin precios (solo vía comentario). */
    publica: string | null
}

/* ── Respuesta pública bajo el comentario ────────────────────────────── */

const PUBLICAS = [
    '¡Hola! Te escribimos por interno con toda la información 📩',
    '¡Hola! Revisa tus mensajes, ahí te dejamos todo el detalle 😊',
    '¡Gracias por comentar! Te mandamos la info por mensaje privado 📩',
]

/**
 * Lo que va en público bajo el comentario: SIN precios ni datos, solo que le
 * escribimos por interno (Marcela, 16-11-2026; reemplaza el "digamos los
 * precios como son" del 11-11). Con los valores en el muro la gente no
 * pregunta, la conversación se corta antes de explicar cómo entregamos los
 * proyectos y la publicación pierde comentarios. Los precios van solo por
 * privado.
 */
export function respuestaPublica(): string {
    return PUBLICAS[Math.floor(Math.random() * PUBLICAS.length)]
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
    if (j.canal !== 'instagram' && j.canal !== 'facebook' && j.canal !== 'whatsapp') return null
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
        memoria: texto(j.memoria, 8000) || null,
        agente: j.agente === 'cierre' || j.agente === 'cierre_prueba' ? j.agente : null,
    }
}

type FotoBase64 = Anthropic.Base64ImageSource

const TIPOS_FOTO = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const
/** Límite de la API de Anthropic para una imagen. */
const MAX_BYTES_FOTO = 5 * 1024 * 1024

/**
 * Las fotos del cliente las descarga el sitio y van en base64. Antes iban como
 * URL de Meta y, si Anthropic no podía bajarla (por ejemplo el 👍 de Messenger,
 * que llega como imagen), fallaba la respuesta completa y el cliente quedaba
 * sin respuesta (Tomas Pineda, 16-11-2026). Una foto que no se puede bajar
 * queda como "[El cliente mandó una foto]" y Ali responde igual.
 */
async function descargarFotos(entrada: EntradaRedes): Promise<Map<number, FotoBase64>> {
    const indices = entrada.mensajes
        .map((m, i) => ({ m, i }))
        .filter(({ m }) => m.de === 'cliente' && m.imagenUrl)
        .slice(-MAX_FOTOS)
    const fotos = new Map<number, FotoBase64>()
    await Promise.all(
        indices.map(async ({ m, i }) => {
            try {
                const res = await fetch(m.imagenUrl as string, { signal: AbortSignal.timeout(8000), cache: 'no-store' })
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                const tipo = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
                if (!(TIPOS_FOTO as readonly string[]).includes(tipo)) throw new Error(`tipo ${tipo || 'desconocido'}`)
                const buf = Buffer.from(await res.arrayBuffer())
                if (!buf.length || buf.length > MAX_BYTES_FOTO) throw new Error(`tamaño ${buf.length}`)
                fotos.set(i, { type: 'base64', media_type: tipo as FotoBase64['media_type'], data: buf.toString('base64') })
            } catch (error) {
                console.error(`[ali:redes] No se pudo bajar una foto de ${entrada.conversacionId}:`, error instanceof Error ? error.message : error)
            }
        })
    )
    return fotos
}

/** Historial en el formato de la API: turnos alternados, la conversación parte con el cliente. */
function historial(entrada: EntradaRedes, fotos: Map<number, FotoBase64>): Anthropic.MessageParam[] {
    const mensajes: Anthropic.MessageParam[] = []
    entrada.mensajes.forEach((m, i) => {
        const rol = m.de === 'cliente' ? 'user' : 'assistant'
        const bloques: Anthropic.ContentBlockParam[] = []
        if (m.de === 'cliente') {
            const foto = fotos.get(i)
            if (foto) {
                bloques.push({ type: 'image', source: foto })
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
    const red = entrada.canal === 'instagram' ? 'Instagram' : entrada.canal === 'whatsapp' ? 'WhatsApp' : 'Facebook'
    const { nombre, telefono, email } = entrada.cliente
    const faltan = [!nombre && 'nombre', !telefono && 'teléfono', !email && 'correo'].filter(Boolean)
    // El brochure automático del primer contacto llega marcado: no cuenta como
    // que Ali ya se presentó (Nicolás, 12-11-2026: brochure primero, Ali después).
    const esBrochure = (m: MensajeRedes) => m.de === 'ali' && /^\[Mensaje automático/.test(m.texto)
    const yaMandoBrochure = entrada.mensajes.some(esBrochure)
    const primerMensaje = !entrada.mensajes.some(m => m.de === 'ali' && !esBrochure(m))

    return [
        `Ahora en Chile: ${ahora} (hoy es ${hoyISO}).`,
        entrada.canal === 'whatsapp'
            ? 'Canal: WhatsApp, al número de Alimin que atiendes tú. Ya tienes su teléfono (es el número desde el que escribe): nunca se lo pidas. Pídele el nombre y, cuando quiera agendar, el correo para coordinar la visita. Todo lo de Instagram y Facebook vale igual aquí, salvo lo del brochure y los comentarios.'
            : `Canal: mensaje privado de ${red}${entrada.via === 'comentario' ? ', a partir de un comentario en una publicación' : ''}.`,
        entrada.publicacion
            ? entrada.canal === 'whatsapp'
                ? `Llegó desde un anuncio de Meta: "${entrada.publicacion}". Úsalo para orientar la conversación hacia ese proyecto.`
                : `Publicación comentada: "${entrada.publicacion}"`
            : null,
        `Datos que ya tienes del cliente: nombre ${nombre || '(no lo sabes)'}, teléfono ${telefono ? 'sí' : 'no'}, correo ${email ? 'sí' : 'no'}.`,
        faltan.length ? `Te falta: ${faltan.join(', ')}.` : 'Ya tienes todos sus datos: no se los vuelvas a pedir.',
        yaMandoBrochure
            ? 'Al principio de la conversación salió un mensaje automático con el brochure, los precios y el enlace: no lo repitas, responde lo que la persona pregunta ahora.'
            : null,
        primerMensaje && !entrada.memoria ? 'Es tu primer mensaje en esta conversación: preséntate y pregúntale su nombre.' : null,
        primerMensaje && entrada.memoria
            ? `Es tu primer mensaje de hoy, pero esta persona ya habló antes con nosotros (mira la memoria abajo). ${nombre ? 'Salúdala por su nombre y no se lo vuelvas a pedir.' : 'Preséntate corto y pregúntale su nombre.'} Retoma desde lo que pregunta ahora.`
            : null,
        entrada.memoria ? `\n# Memoria del CRM sobre esta persona (solo para ti)\n${entrada.memoria}` : null,
    ]
        .filter(Boolean)
        .join('\n')
}

/**
 * Corre a Ali sobre una conversación de redes y devuelve lo que hay que mandar.
 * Con `prueba` (página /probar-ali) la agenda queda simulada y no se reporta
 * uso al CRM web ni se avisa a la Oficina IA.
 */
export async function conversarRedes(
    entrada: EntradaRedes,
    request: NextRequest,
    opciones: { prueba?: boolean } = {}
): Promise<RespuestaRedes> {
    const nombres = HERRAMIENTAS.map(h => h.name)
    const [remota, cierre] = await Promise.all([configRemota(), modoCierre(entrada.agente, nombres)])
    const config = remota?.agente.activo ? remota : null
    const apagadas = [...(config ? herramientasApagadas(config) : []), ...cierre.apagadas]
    const tools = [...HERRAMIENTAS.filter(h => !apagadas.includes(h.name)), HERRAMIENTA_GUARDAR_CONTACTO, HERRAMIENTA_ENVIAR_DOCUMENTO]
    const extra = config ? bloqueRemoto(config, nombres) : null

    // Mismo prefijo que el chat web (ficha + config aprobada) para compartir el
    // caché; lo de redes va después.
    const system: Anthropic.TextBlockParam[] = [
        { type: 'text', text: INSTRUCCIONES_ALI, cache_control: { type: 'ephemeral' } },
        ...(extra ? [{ type: 'text' as const, text: extra, cache_control: { type: 'ephemeral' as const } }] : []),
        { type: 'text', text: INSTRUCCIONES_REDES, cache_control: { type: 'ephemeral' } },
        // Si la persona ya llegó a la visita y el Cierre está encendido.
        ...cierre.bloques,
        { type: 'text', text: datosDelMomento(entrada) },
    ]

    const ctx: ContextoHerramientas = {
        cliente: { ...entrada.cliente },
        request,
        derivacion: null,
        canal: entrada.canal,
        contacto: null,
        visita: null,
        documentos: [],
        simulacion: Boolean(opciones.prueba) || process.env.ALI_REDES_SIMULACION === 'true',
    }

    const publica = entrada.via === 'comentario' ? respuestaPublica() : null

    const mensajes = historial(entrada, await descargarFotos(entrada))
    if (!mensajes.length) return { burbujas: [], contacto: null, derivacion: null, visita: null, documentos: [], publica }

    let final = await correrModelo({
        system,
        mensajes,
        tools,
        herramientas: ctx,
        conversacionId: entrada.conversacionId,
        canal: entrada.canal,
        agente: cierre.agente,
        etiquetaConfig: cierre.version ?? config?.version ?? null,
        prueba: opciones.prueba,
    })
    if (!final && ctx.derivacion) final = 'Ya le avisé a un asesor y te responde por este mismo chat a la brevedad 🙌'

    return {
        burbujas: final ? burbujasRedes(final) : [],
        contacto: ctx.contacto ?? null,
        derivacion: ctx.derivacion,
        visita: ctx.visita ?? null,
        documentos: ctx.documentos ?? [],
        publica,
    }
}
