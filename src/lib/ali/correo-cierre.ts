import Anthropic from '@anthropic-ai/sdk'
import { INSTRUCCIONES_ALI, INSTRUCCIONES_CIERRE, INSTRUCCIONES_CORREO_CIERRE } from './conocimiento'
import { configRemota, reportarUso, bloqueRemoto } from './config-remota'

/**
 * Correos de "Después de la visita" escritos por la IA de Cierre (12-11-2026).
 * Los pide el CRM web (lib/correo_cierre_ia.ts) para cada persona y cada paso
 * de la secuencia; acá solo se escribe el texto. El CRM arma el HTML y envía.
 */

const MODELO = 'claude-haiku-5-5'
const MAX_CONTEXTO = 8000

let cliente: Anthropic | null = null
const anthropic = () => (cliente ??= new Anthropic())

export interface PedidoCorreo {
    leadId: string
    nombre: string | null
    proyecto: string | null
    asesor: string | null
    paso: { posicion: number; total: number; tema: string }
    /** Lo que sabemos de la persona (ficha, visita, calificador, conversaciones). */
    contexto: string
}

export interface CorreoCierre {
    asunto: string
    preheader: string
    titulo: string
    parrafos: string[]
}

const texto = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

export function validarPedido(json: unknown): PedidoCorreo | null {
    if (!json || typeof json !== 'object') return null
    const j = json as Record<string, unknown>
    const p = (j.paso && typeof j.paso === 'object' ? j.paso : {}) as Record<string, unknown>
    const posicion = Number(p.posicion)
    const total = Number(p.total)
    const leadId = texto(j.leadId, 80)
    if (!leadId || !Number.isInteger(posicion) || posicion < 1 || posicion > 10) return null
    return {
        leadId,
        nombre: texto(j.nombre, 80) || null,
        proyecto: texto(j.proyecto, 60) || null,
        asesor: texto(j.asesor, 80) || null,
        paso: { posicion, total: Number.isInteger(total) && total > 0 ? total : 4, tema: texto(p.tema, 200) },
        contexto: texto(j.contexto, MAX_CONTEXTO),
    }
}

const HERRAMIENTA: Anthropic.Tool = {
    name: 'escribir_correo',
    description: 'Entrega el correo terminado.',
    input_schema: {
        type: 'object',
        properties: {
            asunto: { type: 'string', description: 'Máximo 60 caracteres.' },
            preheader: { type: 'string', description: 'Una línea que complementa el asunto.' },
            titulo: { type: 'string', description: 'Encabezado del correo, máximo 50 caracteres.' },
            parrafos: { type: 'array', items: { type: 'string' }, description: 'De 2 a 4 párrafos breves, sin enlaces.' },
        },
        required: ['asunto', 'preheader', 'titulo', 'parrafos'],
    },
}

/** Saca enlaces, teléfonos y dos puntos que se hayan colado: el botón del correo ya lleva el contacto. */
const limpiar = (t: string) =>
    t
        .replace(/https?:\/\/\S+/g, '')
        .replace(/\+?56\s?9[\s\d]{8,11}/g, '')
        .replace(/:[ \t]+(?=\S)/g, ', ')
        .replace(/\s*:\s*$/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim()

export async function escribirCorreoCierre(p: PedidoCorreo): Promise<CorreoCierre | null> {
    const config = await configRemota('cierre')
    const extra = config ? bloqueRemoto(config, []) : null

    const datos = [
        `Paso ${p.paso.posicion} de ${p.paso.total}${p.paso.tema ? ` · ${p.paso.tema}` : ''}.`,
        `Nombre: ${p.nombre || '(no lo sabemos)'}. Proyecto que visitó: ${p.proyecto || '(no lo sabemos)'}. Asesor a cargo: ${p.asesor || '(sin asesor)'}.`,
        p.contexto ? `\n# Lo que sabemos de esta persona (solo para ti)\n${p.contexto}` : null,
    ]
        .filter(Boolean)
        .join('\n')

    const system: Anthropic.TextBlockParam[] = [
        { type: 'text', text: INSTRUCCIONES_ALI, cache_control: { type: 'ephemeral' } },
        {
            type: 'text',
            text: `${INSTRUCCIONES_CIERRE}\n${INSTRUCCIONES_CORREO_CIERRE}${extra ? `\n${extra}` : ''}`,
            cache_control: { type: 'ephemeral' },
        },
        { type: 'text', text: datos },
    ]

    const respuesta = await anthropic().messages.create({
        model: MODELO,
        max_tokens: 1200,
        system,
        tools: [HERRAMIENTA],
        tool_choice: { type: 'tool', name: HERRAMIENTA.name },
        messages: [{ role: 'user', content: 'Escribe el correo de este paso para esta persona.' }],
    })
    const uso = respuesta.usage
    reportarUso({
        conversacionId: `correo:${p.leadId}:paso-${p.paso.posicion}`,
        canal: 'correo',
        agente: 'cierre',
        modelo: MODELO,
        input_tokens: uso.input_tokens,
        output_tokens: uso.output_tokens,
        cache_read_input_tokens: uso.cache_read_input_tokens,
        cache_creation_input_tokens: uso.cache_creation_input_tokens,
    })

    const llamada = respuesta.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
    const c = (llamada?.input || {}) as Record<string, unknown>
    const parrafos = Array.isArray(c.parrafos)
        ? c.parrafos.map(x => limpiar(String(x))).filter(x => x.length > 0).slice(0, 4)
        : []
    const asunto = limpiar(texto(c.asunto, 90)).slice(0, 70)
    if (!asunto || parrafos.length < 1) return null
    return {
        asunto,
        preheader: limpiar(texto(c.preheader, 150)),
        titulo: limpiar(texto(c.titulo, 80)).slice(0, 60) || asunto,
        parrafos,
    }
}
