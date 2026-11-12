import type Anthropic from '@anthropic-ai/sdk'
import type { NextRequest } from 'next/server'
import { SITE } from '@/lib/constants'
import { BLOG_POSTS } from '@/lib/blog-data'
import { getAvailability } from '@/lib/availability'
import { isSlotBookable, parseCalendarDate, toCalendarDateInChile, toChileInstant } from '@/lib/booking-rules'
import { agendarVisita } from '@/lib/agendar-visita'
import { ARENA_Y_SOL, LOMAS_DEL_MAR, type Proyecto } from '@/components/agenda3d/proyectos'

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

export type CanalAli = 'web' | 'instagram' | 'facebook'

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

    const respuesta = await fetch(`${ORIGEN}${proyecto.plano.lotes}`, {
        signal: AbortSignal.timeout(8000),
        next: { revalidate: 300 },
    })
    if (!respuesta.ok) return { error: 'No se pudo leer el mapa de lotes en este momento.' }

    const { lotes } = (await respuesta.json()) as { lotes: LotePlano[] }
    const libres = lotes.filter(l => (l.tipo ?? 'lote') === 'lote' && !l.sold && l.n !== null)

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
    const redes = ctx.canal === 'instagram' || ctx.canal === 'facebook'
    if (!nombre || !telefono || !email) {
        return {
            ok: false,
            error: redes
                ? 'Para agendar faltan datos: pide el nombre, el teléfono y el correo que falten, para coordinar la visita. Si no quiere darlos, ofrécele el enlace de la agenda del proyecto.'
                : 'Faltan datos de contacto del cliente. Deriva a un asesor.',
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
        case 'derivar_a_asesor':
            ctx.derivacion = {
                motivo: String(entrada.motivo || '').slice(0, 300),
                resumen: String(entrada.resumen || '').slice(0, 600),
            }
            return { ok: true, nota: 'Listo: los asesores quedan avisados cuando envíes tu respuesta.' }
        case 'guardar_contacto':
            return guardarContacto(entrada, ctx)
        case 'buscar_en_sitio':
            return buscarEnSitio(String(entrada.consulta || ''))
        case 'leer_pagina':
            return leerPagina(String(entrada.ruta || ''))
        default:
            return { error: `Herramienta desconocida: ${nombre}` }
    }
}
