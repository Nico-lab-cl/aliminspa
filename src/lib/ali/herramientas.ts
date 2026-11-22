import type Anthropic from '@anthropic-ai/sdk'
import type { NextRequest } from 'next/server'
import { SITE } from '@/lib/constants'
import { BLOG_POSTS } from '@/lib/blog-data'
import { getAvailability } from '@/lib/availability'
import { isSlotBookable, parseCalendarDate, toCalendarDateInChile, toChileInstant } from '@/lib/booking-rules'
import { agendarVisita } from '@/lib/agendar-visita'
import { ARENA_Y_SOL, LOMAS_DEL_MAR, type Proyecto } from '@/components/agenda3d/proyectos'
import { DOCUMENTOS, archivoVigente, documentoPorId, urlDocumento, type DocumentoParaEnviar } from './documentos'
import { PROYECTOS_RESERVA, clp, enlaceReserva, lotesLibres, lotesTomados, numeroDeLote, refLote } from '@/lib/reservas'
import { ENTREGA_ETAPA, leerLoteLomas, lotesLibresLomas, resolverLoteLomas } from '@/lib/reservas-lomas'
import { PROYECTO_LOMAS, prepararEnlacePago } from '@/lib/reservas-enlace'
import { normalizarCelular, CORREO_VALIDO } from '@/lib/reservas'

/**
 * Herramientas que Ali puede usar mientras conversa.
 *
 * Todo lo que consulta sale de las mismas fuentes que ve el visitante: los
 * planos de lotes de la agenda, el calendario del equipo y las páginas
 * publicadas. Ali no tiene un dato propio que se pueda desincronizar.
 */

/** De dónde se leen las páginas y los planos. En desarrollo apunta a localhost. */
const ORIGEN = (process.env.ALI_SITE_ORIGIN || SITE.url).replace(/\/$/, '')

const PROYECTOS_EN_VENTA: Record<string, Proyecto> = {
    'Lomas del Mar': LOMAS_DEL_MAR,
    'Arena y Sol': ARENA_Y_SOL,
}

export type CanalAli = 'web' | 'instagram' | 'facebook' | 'whatsapp'

export interface ContactoAli {
    nombre: string | null
    telefono: string | null
    email: string | null
    interes: string | null
}

export interface ContextoHerramientas {
    cliente: { nombre: string | null; telefono: string | null; email: string | null }
    request: NextRequest
    /** La pone derivar_a_asesor; el motor la publica junto con la respuesta. */
    derivacion: { motivo: string; resumen: string } | null
    /** Para probar conversaciones: agendar_visita valida pero no guarda nada. */
    simulacion?: boolean
    /** Por dónde conversa. Sin indicar, el chat web. */
    canal?: CanalAli
    /** Lo que dejó guardar_contacto en esta respuesta (solo redes). */
    contacto?: ContactoAli | null
    /** La visita que quedó agendada en esta respuesta, si quedó una. */
    visita?: { proyecto: string; fecha: string; hora: string } | null
    /** Lo que dejó enviar_documento en esta respuesta (solo redes). */
    documentos?: DocumentoParaEnviar[]
}

/**
 * Solo en Instagram y Facebook: ahí la persona no pasó por el formulario del
 * chat web, así que Ali pide los datos en la conversación y los guarda con
 * esta herramienta. El CRM crea o completa el lead con lo que devuelve.
 */
export const HERRAMIENTA_GUARDAR_CONTACTO: Anthropic.Tool = {
    name: 'guardar_contacto',
    description:
        'Guarda los datos que la persona te dio en la conversación: nombre, teléfono, correo y en una frase qué busca. Llámala cada vez que la persona te dé un dato nuevo. Deja vacío lo que no te dio; nunca inventes un dato.',
    input_schema: {
        type: 'object',
        properties: {
            nombre: { type: 'string', description: 'Nombre (y apellido si lo dio). Vacío si no lo dio.' },
            telefono: { type: 'string', description: 'Teléfono tal como lo escribió. Vacío si no lo dio.' },
            email: { type: 'string', description: 'Correo electrónico. Vacío si no lo dio.' },
            interes: {
                type: 'string',
                description: 'Qué busca en una frase, para el asesor: proyecto, tamaño, contado o crédito, para qué lo quiere.',
            },
        },
        required: ['nombre', 'telefono', 'email', 'interes'],
        additionalProperties: false,
    },
    strict: true,
}

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Celular chileno a +569XXXXXXXX; otros números se dejan con su + si tienen 8 a 15 dígitos. */
export function normalizarTelefono(valor: string): string | null {
    const digitos = valor.replace(/\D/g, '')
    if (/^9\d{8}$/.test(digitos)) return `+56${digitos}`
    if (/^569\d{8}$/.test(digitos)) return `+${digitos}`
    if (/^\d{8}$/.test(digitos)) return `+569${digitos}`
    if (valor.trim().startsWith('+') && digitos.length >= 8 && digitos.length <= 15) return `+${digitos}`
    return null
}

function guardarContacto(entrada: Record<string, string | undefined>, ctx: ContextoHerramientas) {
    const previo = ctx.contacto || { nombre: null, telefono: null, email: null, interes: null }
    const nombre = String(entrada.nombre || '').trim().slice(0, 80) || null
    const telefonoCrudo = String(entrada.telefono || '').trim()
    const emailCrudo = String(entrada.email || '').trim().toLowerCase()
    const telefono = telefonoCrudo ? normalizarTelefono(telefonoCrudo) : null
    const email = emailCrudo && CORREO.test(emailCrudo) && emailCrudo.length <= 120 ? emailCrudo : null
    const interes = String(entrada.interes || '').trim().slice(0, 300) || null

    const contacto: ContactoAli = {
        nombre: nombre || previo.nombre,
        telefono: telefono || previo.telefono,
        email: email || previo.email,
        interes: interes || previo.interes,
    }
    ctx.contacto = contacto
    // agendar_visita lee ctx.cliente: lo nuevo le sirve en esta misma respuesta.
    ctx.cliente = {
        nombre: contacto.nombre || ctx.cliente.nombre,
        telefono: contacto.telefono || ctx.cliente.telefono,
        email: contacto.email || ctx.cliente.email,
    }

    const avisos: string[] = []
    if (telefonoCrudo && !telefono) avisos.push('El teléfono no parece válido: confírmalo con la persona.')
    if (emailCrudo && !email) avisos.push('El correo no parece válido: confírmalo con la persona.')
    const faltan = [
        !ctx.cliente.nombre && 'nombre',
        !ctx.cliente.telefono && 'teléfono',
        !ctx.cliente.email && 'correo',
    ].filter(Boolean)
    return { ok: true, faltan, avisos }
}

/**
 * Solo en Instagram, Facebook y WhatsApp (17-11-2026): Ali manda planos,
 * brochures y ebooks como archivo adjunto. Solo de la lista de documentos.ts;
 * el CRM los manda después de los mensajes de Ali.
 */
export const HERRAMIENTA_ENVIAR_DOCUMENTO: Anthropic.Tool = {
    name: 'enviar_documento',
    description:
        'Manda un archivo a la persona por este chat, después de tus mensajes. Documentos disponibles:\n' +
        DOCUMENTOS.map(d => `- ${d.id}: ${d.descripcion}`).join('\n') +
        '\nÚsala cuando la persona pida el plano, el brochure o algo para leer, o cuando un documento responda mejor que un texto largo. Manda solo el del proyecto que le interesa. No pegues enlaces a estos archivos: el archivo llega solo. En tu mensaje di algo corto como "Te mando el plano 👇".',
    input_schema: {
        type: 'object',
        properties: {
            documento: { type: 'string', enum: DOCUMENTOS.map(d => d.id), description: 'Cuál documento mandar.' },
        },
        required: ['documento'],
        additionalProperties: false,
    },
    strict: true,
}

/** Máximo de archivos por respuesta, para no llenar el chat. */
const MAX_DOCUMENTOS = 3

async function enviarDocumento(id: string, ctx: ContextoHerramientas) {
    const doc = documentoPorId(id)
    if (!doc) return { error: 'Ese documento no existe. Usa uno de la lista.' }
    if (!(await archivoVigente(doc))) return { error: `${doc.nombre} no está disponible ahora. Responde sin mandarlo.` }
    const lista = (ctx.documentos ||= [])
    if (lista.some(d => d.id === id)) return { ok: true, nota: 'Ya estaba en camino.' }
    if (lista.length >= MAX_DOCUMENTOS) return { error: `Ya vas a mandar ${MAX_DOCUMENTOS} archivos en esta respuesta: no mandes más.` }
    lista.push({ id: doc.id, nombre: doc.nombre, tipo: doc.tipo, url: urlDocumento(doc.id) })
    return { ok: true, nota: `${doc.nombre} se manda como archivo después de tus mensajes. No pegues el enlace.` }
}

export const HERRAMIENTAS: Anthropic.Tool[] = [
    {
        name: 'lotes_disponibles',
        description:
            'Cuántos terrenos quedan disponibles en un proyecto y cuáles son, según el mapa de lotes de la agenda. Úsala cuando pregunten si quedan terrenos o cuáles hay.',
        input_schema: {
            type: 'object',
            properties: {
                proyecto: { type: 'string', enum: ['Lomas del Mar', 'Arena y Sol'] },
            },
            required: ['proyecto'],
            additionalProperties: false,
        },
        strict: true,
    },
    {
        name: 'horarios_disponibles',
        description:
            'Días y horas libres para una visita presencial, ya cruzados con el calendario del equipo. Devuelve fechas YYYY-MM-DD con sus horas HH:00, en hora de Chile.',
        input_schema: {
            type: 'object',
            properties: {
                desde: {
                    type: 'string',
                    description: 'Primer día a revisar, YYYY-MM-DD. Si no se indica, desde hoy.',
                },
                dias: {
                    type: 'integer',
                    description: 'Cuántos días revisar desde "desde". Entre 1 y 21; por omisión 7.',
                },
            },
            required: [],
            additionalProperties: false,
        },
    },
    {
        name: 'agendar_visita',
        description:
            'Agenda la visita presencial con los datos de contacto que la persona ya dejó en el chat. Llamarla solo después de que la persona confirmó proyecto, día y hora.',
        input_schema: {
            type: 'object',
            properties: {
                proyecto: { type: 'string', enum: ['Lomas del Mar', 'Arena y Sol'] },
                fecha: { type: 'string', description: 'Día de la visita, YYYY-MM-DD.' },
                hora: { type: 'string', description: 'Hora de inicio, HH:00 (por ejemplo 16:00).' },
                lote: {
                    type: 'string',
                    description:
                        'Lote que le interesa, si mencionó uno (por ejemplo "Etapa 3 · Lote 12" o "P61"). Vacío si no.',
                },
            },
            required: ['proyecto', 'fecha', 'hora'],
            additionalProperties: false,
        },
    },
    {
        name: 'derivar_a_asesor',
        description:
            'Avisa a los asesores (push en el CRM y mensaje al grupo de WhatsApp de leads) para que una persona tome la conversación. Úsala en los casos de derivación de tus instrucciones.',
        input_schema: {
            type: 'object',
            properties: {
                motivo: {
                    type: 'string',
                    description: 'Motivo en una frase corta, por ejemplo "Pide descuento por pago al contado".',
                },
                resumen: {
                    type: 'string',
                    description:
                        'Resumen de 1 a 3 frases de lo que conversaron, para el asesor. Sin teléfono ni correo.',
                },
            },
            required: ['motivo', 'resumen'],
            additionalProperties: false,
        },
        strict: true,
    },
    {
        name: 'link_reserva',
        description:
            'Da el enlace directo de pago de la reserva (Webpay) para el lote que eligió, y revisa que esté libre. Arena y Sol: lote como "P45". Lomas del Mar: etapa y lote, como "Etapa 1 · Lote 22"; si solo dijo el número, pásalo igual y la herramienta te dice si hay que preguntar la etapa. Devuelve también el monto de la reserva de ese lote. Úsala solo después de contarle las condiciones de la reserva (ver "Reservar el terreno").',
        input_schema: {
            type: 'object',
            properties: {
                proyecto: { type: 'string', enum: ['Lomas del Mar', 'Arena y Sol'] },
                lote: {
                    type: 'string',
                    description: 'Lote que eligió: "P45" en Arena y Sol, "Etapa 1 · Lote 22" en Lomas del Mar. Vacío si no eligió.',
                },
            },
            required: ['proyecto', 'lote'],
            additionalProperties: false,
        },
        strict: true,
    },
    {
        name: 'preparar_pago_reserva',
        description:
            'Deja la reserva lista para pagar con el nombre, correo y celular que ya tienes de la persona, y devuelve un enlace: ella solo pone su RUT, acepta y paga con Webpay. Es la forma normal de cerrar la reserva cuando ya eligió el lote y ya le contaste las condiciones. Nunca pidas el RUT por el chat. Si no tienes su nombre o correo, no los pidas para esto: la herramienta te dirá que uses link_reserva.',
        input_schema: {
            type: 'object',
            properties: {
                proyecto: { type: 'string', enum: ['Lomas del Mar', 'Arena y Sol'] },
                lote: { type: 'string', description: '"P45" en Arena y Sol, "Etapa 1 · Lote 22" en Lomas del Mar.' },
                nombre: { type: 'string', description: 'Su nombre, si te lo dio en este chat. Vacío para usar el que ya tienes.' },
                email: { type: 'string', description: 'Su correo, si te lo dio en este chat. Vacío para usar el que ya tienes.' },
            },
            required: ['proyecto', 'lote', 'nombre', 'email'],
            additionalProperties: false,
        },
        strict: true,
    },
    {
        name: 'buscar_en_sitio',
        description:
            'Busca en las páginas de aliminspa.cl (proyectos, preguntas frecuentes, quiénes somos, blog) y devuelve los fragmentos más relevantes con su ruta.',
        input_schema: {
            type: 'object',
            properties: {
                consulta: { type: 'string', description: 'Palabras clave de lo que se busca.' },
            },
            required: ['consulta'],
            additionalProperties: false,
        },
        strict: true,
    },
    {
        name: 'leer_pagina',
        description: 'Lee el texto de una página de aliminspa.cl a partir de su ruta, por ejemplo /proyectos/arena-y-sol.',
        input_schema: {
            type: 'object',
            properties: {
                ruta: { type: 'string', description: 'Ruta de la página, empezando con /.' },
            },
            required: ['ruta'],
            additionalProperties: false,
        },
        strict: true,
    },
]

/* ── Lotes ───────────────────────────────────────────────────────── */

interface LotePlano {
    n: number | null
    stage?: number | null
    sold: boolean
    tipo?: string | null
}

async function lotesDisponibles(proyectoNombre: string) {
    const proyecto = PROYECTOS_EN_VENTA[proyectoNombre]
    if (!proyecto) return { error: 'Proyecto desconocido. Los proyectos en venta son Lomas del Mar y Arena y Sol.' }

    // Lomas del Mar: lo que se puede reservar y cobrar es lo de la base de
    // aliminlomasdelmar.com (21-11-2026: el plano de la agenda decía 43 libres
    // en la etapa 2 y esa base, 25). Si no responde, el plano.
    if (proyecto.id === LOMAS_DEL_MAR.id) {
        try {
            const libres = await lotesLibresLomas()
            const porEtapa: Record<string, string[]> = {}
            for (const l of libres) (porEtapa[`Etapa ${l.etapa}`] ||= []).push(l.numero)
            return {
                proyecto: proyecto.nombre,
                disponibles: libres.length,
                disponiblesPorEtapa: Object.fromEntries(Object.entries(porEtapa).map(([e, ns]) => [e, ns.length])),
                lotesPorEtapa: porEtapa,
                nota: 'Un mismo número de lote puede estar en varias etapas: al reservar di siempre etapa y lote. La superficie exacta la confirma link_reserva o el asesor.',
                mapa: 'aliminspa.cl/agendar-visita',
            }
        } catch (error) {
            console.error('[ali] No se pudieron leer los lotes de aliminlomasdelmar.com, uso el plano:', error)
        }
    }

    const respuesta = await fetch(`${ORIGEN}${proyecto.plano.lotes}`, {
        signal: AbortSignal.timeout(8000),
        next: { revalidate: 300 },
    })
    if (!respuesta.ok) return { error: 'No se pudo leer el mapa de lotes en este momento.' }

    const { lotes } = (await respuesta.json()) as { lotes: LotePlano[] }
    // Lo reservado y pagado en aliminspa.cl/reservar todavía no figura en el
    // plano hasta que postventa lo marca: se descuenta acá.
    const tomados = PROYECTOS_RESERVA[proyecto.id] ? await lotesTomados(proyecto.id) : new Set<number>()
    const libres = lotes.filter(l => (l.tipo ?? 'lote') === 'lote' && !l.sold && l.n !== null && !tomados.has(l.n))

    const nombre = (l: LotePlano) =>
        proyecto.numeraLotes
            ? proyecto.tieneEtapas
                ? `Etapa ${l.stage} · Lote ${l.n}`
                : `Lote ${l.n}`
            : `${proyecto.refPrefijo ?? 'Ref-'}${l.n}`

    const porEtapa: Record<string, number> = {}
    if (proyecto.tieneEtapas) {
        for (const l of libres) {
            const etapa = `Etapa ${l.stage ?? '?'}`
            porEtapa[etapa] = (porEtapa[etapa] || 0) + 1
        }
    }

    return {
        proyecto: proyecto.nombre,
        disponibles: libres.length,
        ...(proyecto.tieneEtapas ? { disponiblesPorEtapa: porEtapa } : {}),
        lotes: libres.map(nombre),
        nota: 'La superficie exacta de cada lote la confirma el asesor en la visita.',
        mapa: proyecto.id === ARENA_Y_SOL.id ? 'aliminspa.cl/agendar-visita-arenas' : 'aliminspa.cl/agendar-visita',
    }
}

/* ── Reserva ─────────────────────────────────────────────────────── */

const SIN_LOTES_LOMAS =
    'No pude revisar los lotes de Lomas del Mar ahora. Dile que lo intentas de nuevo en un momento, o deriva con el motivo "quiere reservar".'

/**
 * Lomas del Mar: lotes, monto y Webpay de aliminlomasdelmar.com (21-11-2026,
 * Nicolás: "que me envíe el link de pago nomás", no el sitio general).
 */
async function linkReservaLomas(lote: string | undefined, origen: string) {
    let libres
    try {
        libres = await lotesLibresLomas()
    } catch {
        return { ok: false, error: SIN_LOTES_LOMAS }
    }
    const url = (ref?: string) => {
        const u = new URL('/reservar/lomas-del-mar', SITE.url)
        if (ref) u.searchParams.set('lote', ref)
        u.searchParams.set('origen', origen)
        return u.toString()
    }
    if (!leerLoteLomas(lote)) {
        return { ok: true, url: url(), monto: clp(libres[0]?.reserva ?? 500_000), como: 'En el enlace elige etapa y lote, deja sus datos (con RUT) y paga con Webpay.' }
    }
    const elegido = resolverLoteLomas(libres, lote)
    if (!elegido.ok) return { ok: false, error: elegido.error }
    const l = elegido.lote
    return {
        ok: true,
        url: url(l.ref),
        lote: l.etiqueta,
        superficie: l.area ? `${Math.round(l.area)} m²` : null,
        monto: clp(l.reserva),
        entrega: ENTREGA_ETAPA[l.etapa] ? `aproximadamente a ${ENTREGA_ETAPA[l.etapa]}` : null,
        como: 'En el enlace confirma sus datos (con RUT) y paga con Webpay, débito o crédito. El monto de la reserva es el de "monto".',
    }
}

async function linkReserva(entrada: { proyecto?: string; lote?: string }, ctx: ContextoHerramientas) {
    const condiciones =
        'Antes del enlace ya le dijiste, breve: el monto de la reserva (el de "monto"), que no se devuelve, 10 días corridos para pie y promesa, y los beneficios. Pega el enlace tal cual.'
    if (entrada.proyecto === 'Lomas del Mar') {
        return { ...(await linkReservaLomas(entrada.lote, `ali-${ctx.canal || 'web'}`)), nota: condiciones }
    }
    if (entrada.proyecto !== 'Arena y Sol') return { ok: false, error: 'Proyecto desconocido.' }

    const slug = ARENA_Y_SOL.id
    const p = PROYECTOS_RESERVA[slug]
    const libres = await lotesLibres(slug)
    if (!libres.length) {
        return { ok: false, error: 'No quedan lotes para reservar en línea en Arena y Sol. Deriva con el motivo "quiere reservar".' }
    }
    const n = numeroDeLote(entrada.lote)
    if (n && !libres.some(l => l.n === n)) {
        return {
            ok: false,
            error: `El lote ${refLote(p, n)} ya no está disponible. Ofrécele otro de estos: ${libres.map(l => l.ref).join(', ')}.`,
        }
    }
    const origen = `ali-${ctx.canal || 'web'}`
    return {
        ok: true,
        url: enlaceReserva(slug, n, origen),
        lote: n ? refLote(p, n) : null,
        monto: clp(p.monto),
        como: n
            ? 'En el enlace confirma sus datos (con RUT) y paga con Webpay, débito o crédito.'
            : 'En el enlace elige su lote, deja sus datos (con RUT) y paga con Webpay.',
        nota: condiciones,
    }
}

/**
 * El pago con los datos que Ali YA tiene del chat (nombre, correo, celular).
 * Devuelve aliminspa.cl/pagar/<id>: la persona solo escribe su RUT, acepta y
 * paga (lib/reservas-enlace.ts). El RUT nunca se pide por el chat (Nicolás,
 * 22-11-2026: "esos datos son muy personales para que los pida una IA"). Si a
 * Ali le falta el nombre o el correo, no los pide: usa link_reserva.
 */
async function prepararPago(entrada: { proyecto?: string; lote?: string; nombre?: string; email?: string }, ctx: ContextoHerramientas) {
    const nombre = String(entrada.nombre || ctx.cliente.nombre || '').trim().replace(/\s+/g, ' ').slice(0, 120)
    const email = String(entrada.email || ctx.cliente.email || '').trim().toLowerCase()
    const celular = normalizarCelular(ctx.cliente.telefono || '')
    if (!nombre || !email || !CORREO_VALIDO.test(email) || !celular) {
        return {
            ok: false,
            error: 'No tienes su nombre, correo y celular. No se los pidas por esto: usa link_reserva con el mismo lote y pega ese enlace (ahí deja sus datos).',
        }
    }

    let datos: { proyecto: string; lote: number; monto: number; etiqueta: string }
    if (entrada.proyecto === 'Lomas del Mar') {
        const libres = await lotesLibresLomas().catch(() => null)
        if (!libres) return { ok: false, error: SIN_LOTES_LOMAS }
        const elegido = resolverLoteLomas(libres, entrada.lote)
        if (!elegido.ok) return { ok: false, error: elegido.error }
        datos = { proyecto: PROYECTO_LOMAS, lote: elegido.lote.id, monto: elegido.lote.reserva, etiqueta: elegido.lote.etiqueta }
    } else if (entrada.proyecto === 'Arena y Sol') {
        const p = PROYECTOS_RESERVA[ARENA_Y_SOL.id]
        const n = numeroDeLote(entrada.lote)
        const libres = await lotesLibres(ARENA_Y_SOL.id)
        if (!n) return { ok: false, error: 'No dijo qué lote. Pregúntale cuál quiere.' }
        if (!libres.some(l => l.n === n)) {
            return { ok: false, error: `El lote ${refLote(p, n)} ya no está disponible. Ofrécele otro de estos: ${libres.map(l => l.ref).join(', ')}.` }
        }
        datos = { proyecto: ARENA_Y_SOL.id, lote: n, monto: p.monto, etiqueta: `Lote ${refLote(p, n)}` }
    } else {
        return { ok: false, error: 'Proyecto desconocido.' }
    }

    const url = ctx.simulacion
        ? `${SITE.url}/pagar/PRUEBA`
        : await prepararEnlacePago({ ...datos, nombre, email, celular, origen: `ali-${ctx.canal || 'web'}` })
    return {
        ok: true,
        url,
        lote: datos.etiqueta,
        monto: clp(datos.monto),
        a_nombre_de: nombre,
        como: 'Pega el enlace tal cual y dile en una frase que le dejaste la reserva lista con sus datos: lo abre, pone su RUT, acepta y paga con Webpay, débito o crédito. El lote se aparta cuando entra a pagar, así que conviene que lo haga pronto. El enlace dura 3 días.',
    }
}

/* ── Agenda ──────────────────────────────────────────────────────── */

async function horariosDisponibles(entrada: { desde?: string; dias?: number }) {
    const hoy = toCalendarDateInChile(new Date())
    const desde = (entrada.desde && parseCalendarDate(entrada.desde)) || hoy
    const dias = Math.min(Math.max(Math.trunc(entrada.dias || 7), 1), 21)

    const { days } = await getAvailability(desde, dias)
    return {
        dias: days.map(d => ({ fecha: d.date, horas: d.slots })),
        nota: days.length
            ? 'Solo estos bloques están libres. Ofrece 2 o 3 opciones, no la lista completa.'
            : 'No hay bloques libres en ese rango. Prueba con días posteriores.',
    }
}

async function agendar(
    entrada: { proyecto: string; fecha: string; hora: string; lote?: string },
    ctx: ContextoHerramientas
) {
    const proyecto = PROYECTOS_EN_VENTA[entrada.proyecto]
    if (!proyecto) return { ok: false, error: 'Proyecto desconocido.' }

    const { nombre, telefono, email } = ctx.cliente
    if (!nombre || !telefono || !email) {
        return {
            ok: false,
            error: 'Para agendar faltan datos: pide el nombre, el teléfono y el correo que falten, para coordinar la visita. Si no quiere darlos, no insistas.',
        }
    }

    const dia = parseCalendarDate(entrada.fecha)
    const hora = Number(String(entrada.hora).split(':')[0])
    if (!dia || !Number.isInteger(hora)) return { ok: false, error: 'Fecha u hora inválida.' }

    if (ctx.simulacion) {
        const horaTexto = `${String(hora).padStart(2, '0')}:00`
        if (!isSlotBookable(dia, horaTexto)) return { ok: false, error: 'Ese horario no se puede agendar.' }
        ctx.visita = { proyecto: proyecto.nombre, fecha: entrada.fecha, hora: horaTexto }
        return { ok: true, proyecto: proyecto.nombre, fecha: entrada.fecha, hora: horaTexto, mapa: proyecto.mapaLugar }
    }

    const origen =
        ctx.canal === 'instagram'
            ? 'Mensaje privado de Instagram con Ali'
            : ctx.canal === 'facebook'
              ? 'Mensaje privado de Facebook con Ali'
              : ctx.canal === 'whatsapp'
                ? 'WhatsApp con Ali'
                : 'Chat web con Ali'

    const resultado = await agendarVisita(
        {
            nombre,
            email,
            celular: telefono,
            proyecto: proyecto.nombre,
            fecha: toChileInstant(dia, hora).toISOString(),
            fechaLocal: entrada.fecha,
            hora: `${String(hora).padStart(2, '0')}:00`,
            lote: entrada.lote || null,
            modalidad: proyecto.modalidad,
        },
        ctx.request,
        {
            // Web: el visitante autorizó el contacto en la puerta de entrada del
            // chat. Redes: dio sus datos para coordinar la visita. Nada de
            // marketing: sin la cookie del navegador no sale el evento a Meta.
            consentimiento: { consentimiento_contacto: true, consentimiento_origen: origen },
        }
    )

    if (!resultado.ok) return { ok: false, error: resultado.error }
    ctx.visita = { proyecto: proyecto.nombre, fecha: entrada.fecha, hora: `${String(hora).padStart(2, '0')}:00` }
    return {
        ok: true,
        proyecto: proyecto.nombre,
        fecha: entrada.fecha,
        hora: `${String(hora).padStart(2, '0')}:00`,
        mapa: proyecto.mapaLugar,
    }
}

/* ── Páginas del sitio ───────────────────────────────────────────── */

/**
 * Páginas que Ali puede consultar. Quedan fuera a propósito /cyber y las
 * landings de promociones vencidas: Ali las leería como vigentes.
 */
const PAGINAS = [
    '/',
    '/proyectos',
    '/proyectos/lomas-del-mar',
    '/proyectos/arena-y-sol',
    '/proyectos/libertad-y-alegria',
    '/quienes-somos',
    '/asesores',
    // /venta-de-terrenos-litoral-central redirige (301) aquí desde nov-2026.
    '/terrenos-baratos-en-la-playa-litoral-central-chile',
    '/terrenos-litoral-central',
    '/ebooks/terreno-urbano-o-parcela-rural',
    '/ebooks/preguntas-frecuentes',
    '/blog',
    ...BLOG_POSTS.map(p => `/blog/${p.slug}`),
]

const VIGENCIA_CACHE_MS = 60 * 60 * 1000
const cachePaginas = new Map<string, { texto: string; leidaEn: number }>()

/** Texto legible de una página: sin scripts, estilos, menús ni etiquetas. */
function aTexto(html: string) {
    const cuerpo = html.match(/<main[\s\S]*<\/main>/i)?.[0] ?? html
    return cuerpo
        .replace(/<(script|style|noscript|svg|nav|footer)[\s\S]*?<\/\1>/gi, ' ')
        .replace(/<br\s*\/?>|<\/(p|div|li|h[1-6]|section)>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;|&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n\s*\n+/g, '\n')
        .trim()
}

async function textoDePagina(ruta: string): Promise<string | null> {
    const enCache = cachePaginas.get(ruta)
    if (enCache && Date.now() - enCache.leidaEn < VIGENCIA_CACHE_MS) return enCache.texto

    try {
        const respuesta = await fetch(`${ORIGEN}${ruta}`, { signal: AbortSignal.timeout(8000), cache: 'no-store' })
        if (!respuesta.ok) return null
        const texto = aTexto(await respuesta.text())
        cachePaginas.set(ruta, { texto, leidaEn: Date.now() })
        return texto
    } catch {
        return null
    }
}

const normalizar = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

async function buscarEnSitio(consulta: string) {
    const terminos = normalizar(consulta)
        .split(/[^a-z0-9ñ]+/)
        .filter(t => t.length > 2)
    if (!terminos.length) return { resultados: [] }

    // De a cuatro páginas a la vez para no pegarle al sitio con todo junto.
    const textos: Array<{ ruta: string; texto: string }> = []
    for (let i = 0; i < PAGINAS.length; i += 4) {
        const lote = await Promise.all(
            PAGINAS.slice(i, i + 4).map(async ruta => ({ ruta, texto: await textoDePagina(ruta) }))
        )
        for (const p of lote) if (p.texto) textos.push({ ruta: p.ruta, texto: p.texto })
    }

    const resultados = textos
        .flatMap(({ ruta, texto }) =>
            texto
                .split('\n')
                .map(linea => linea.trim())
                .filter(linea => linea.length > 40)
                .map(linea => {
                    const n = normalizar(linea)
                    const puntaje = terminos.reduce((s, t) => s + (n.includes(t) ? 1 : 0), 0)
                    return { ruta, fragmento: linea.slice(0, 500), puntaje }
                })
        )
        .filter(r => r.puntaje > 0)
        .sort((a, b) => b.puntaje - a.puntaje)
        .slice(0, 8)
        .map(({ ruta, fragmento }) => ({ ruta, fragmento }))

    return {
        resultados,
        nota: 'Si un fragmento contradice tu ficha, vale la ficha.',
    }
}

async function leerPagina(ruta: string) {
    const limpia = '/' + String(ruta || '').replace(/^https?:\/\/[^/]+/, '').replace(/^\/+/, '')
    if (!PAGINAS.includes(limpia)) {
        return { error: 'Esa página no está disponible. Páginas que puedes leer: ' + PAGINAS.join(', ') }
    }
    const texto = await textoDePagina(limpia)
    if (!texto) return { error: 'No se pudo leer la página en este momento.' }
    return { ruta: limpia, texto: texto.slice(0, 8000), nota: 'Si algo contradice tu ficha, vale la ficha.' }
}

/* ── Despacho ────────────────────────────────────────────────────── */

export async function ejecutarHerramienta(
    nombre: string,
    datos: unknown,
    ctx: ContextoHerramientas
): Promise<unknown> {
    // La API ya validó la forma contra input_schema; acá solo se tipa.
    const entrada = (datos ?? {}) as Record<string, string | undefined>
    switch (nombre) {
        case 'lotes_disponibles':
            return lotesDisponibles(String(entrada.proyecto))
        case 'horarios_disponibles':
            return horariosDisponibles(datos as { desde?: string; dias?: number })
        case 'agendar_visita':
            return agendar(datos as { proyecto: string; fecha: string; hora: string; lote?: string }, ctx)
        case 'link_reserva':
            return linkReserva(entrada, ctx)
        case 'preparar_pago_reserva':
            return prepararPago(entrada, ctx)
        case 'derivar_a_asesor':
            ctx.derivacion = {
                motivo: String(entrada.motivo || '').slice(0, 300),
                resumen: String(entrada.resumen || '').slice(0, 600),
            }
            return { ok: true, nota: 'Listo: los asesores quedan avisados cuando envíes tu respuesta.' }
        case 'guardar_contacto':
            return guardarContacto(entrada, ctx)
        case 'enviar_documento':
            return enviarDocumento(String(entrada.documento || ''), ctx)
        case 'buscar_en_sitio':
            return buscarEnSitio(String(entrada.consulta || ''))
        case 'leer_pagina':
            return leerPagina(String(entrada.ruta || ''))
        default:
            return { error: `Herramienta desconocida: ${nombre}` }
    }
}
