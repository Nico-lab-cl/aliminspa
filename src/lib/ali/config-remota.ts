/**
 * Config de Ali que el equipo edita en el CRM web (módulo "Agentes IA"):
 * instrucciones extra, objeciones y datos aprobados, y qué herramientas
 * puede usar. También reporta al CRM los tokens que gasta cada respuesta.
 *
 * Todo esto es opcional. Si falta IA_SECRET, el CRM no responde, tarda más de
 * 3 segundos o manda algo que no calza con el contrato, `configRemota()`
 * devuelve null y Ali conversa exactamente como antes, con lo de
 * `conocimiento.ts`. El reporte de uso nunca se espera ni corta la respuesta.
 */

/** El agente que atiende el chat web dentro del flujo del CRM. */
const AGENTE = 'atraccion'
const TIMEOUT_MS = 3000
/** Cuánto se reutiliza una config buena antes de volver a pedirla. */
const VIGENCIA_MS = 5 * 60 * 1000
/**
 * Cuánto se recuerda que el CRM falló. Más corto que la vigencia para que se
 * recupere pronto, pero evita sumar 3 s de espera a cada mensaje mientras esté caído.
 */
const VIGENCIA_FALLO_MS = 60 * 1000

export interface ConocimientoRemoto {
    tipo: 'objecion' | 'dato' | 'regla'
    tema: string
    como_lo_dice: string | null
    respuesta: string
}

export interface ConfigRemota {
    agente: {
        id: string
        nombre: string
        modelo: string
        activo: boolean
        instrucciones: string
        herramientas: Record<string, boolean>
    }
    conocimiento: ConocimientoRemoto[]
    version: string
}

/** Con la misma URL por defecto que usa `crm-webhook.ts` para el CRM web. */
function credenciales() {
    const secreto = process.env.IA_SECRET
    if (!secreto) return null
    const url = (process.env.CRM_WEB_URL || 'https://marketing.aliminspa.cl').replace(/\/+$/, '')
    return { url, secreto }
}

/* ── Lectura de la config ────────────────────────────────────────── */

let cache: { config: ConfigRemota | null; vence: number } | null = null
/** Si llegan varios mensajes a la vez con el caché vencido, se pide una sola vez. */
let enCurso: Promise<ConfigRemota | null> | null = null

/** La config vigente del agente de atracción, o null para seguir con lo local. */
export async function configRemota(): Promise<ConfigRemota | null> {
    if (cache && Date.now() < cache.vence) return cache.config
    if (!enCurso) {
        enCurso = pedirConfig()
            .then(config => {
                cache = { config, vence: Date.now() + (config ? VIGENCIA_MS : VIGENCIA_FALLO_MS) }
                return config
            })
            .finally(() => {
                enCurso = null
            })
    }
    return enCurso
}

async function pedirConfig(): Promise<ConfigRemota | null> {
    const crm = credenciales()
    if (!crm) return null

    try {
        const res = await fetch(`${crm.url}/api/webhooks/ia/config?agente=${AGENTE}`, {
            headers: { 'x-ia-secret': crm.secreto },
            cache: 'no-store',
            signal: AbortSignal.timeout(TIMEOUT_MS),
        })
        if (res.status !== 200) {
            console.error(`[ali] Config remota: el CRM respondió ${res.status}; sigo con la config local.`)
            return null
        }
        const config = validar(await res.json())
        if (!config) console.error('[ali] Config remota: la respuesta no calza con el contrato; sigo con la config local.')
        return config
    } catch (error) {
        console.error('[ali] Config remota no disponible; sigo con la config local:', error)
        return null
    }
}

const esTexto = (v: unknown): v is string => typeof v === 'string'
const esObjeto = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' && v !== null && !Array.isArray(v)

/** Revisa el JSON campo por campo. Ante cualquier cosa rara, null: mejor lo local que algo a medias. */
function validar(json: unknown): ConfigRemota | null {
    if (!esObjeto(json) || !esObjeto(json.agente) || !Array.isArray(json.conocimiento) || !esTexto(json.version)) {
        return null
    }

    const { id, nombre, modelo, activo, instrucciones, herramientas } = json.agente
    if (!esTexto(id) || !esTexto(nombre) || !esTexto(modelo) || typeof activo !== 'boolean' || !esTexto(instrucciones)) {
        return null
    }
    if (!esObjeto(herramientas) || !Object.values(herramientas).every(v => typeof v === 'boolean')) return null

    const conocimiento: ConocimientoRemoto[] = []
    for (const item of json.conocimiento) {
        if (!esObjeto(item)) return null
        const { tipo, tema, como_lo_dice, respuesta } = item
        if (tipo !== 'objecion' && tipo !== 'dato' && tipo !== 'regla') return null
        if (!esTexto(tema) || !esTexto(respuesta)) return null
        if (como_lo_dice !== null && !esTexto(como_lo_dice)) return null
        conocimiento.push({ tipo, tema, como_lo_dice, respuesta })
    }

    return {
        agente: {
            id,
            nombre,
            modelo,
            activo,
            instrucciones,
            herramientas: herramientas as Record<string, boolean>,
        },
        conocimiento,
        version: json.version,
    }
}

/* ── Bloque del prompt ───────────────────────────────────────────── */

const ORDEN_TIPOS: ConocimientoRemoto['tipo'][] = ['objecion', 'dato', 'regla']
const TITULO_TIPO: Record<ConocimientoRemoto['tipo'], string> = {
    objecion: 'Objeciones',
    dato: 'Datos',
    regla: 'Reglas',
}

const comparar = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

/**
 * Las herramientas que el equipo apagó, en orden alfabético. `derivar_a_asesor`
 * nunca se apaga: es la salida de Ali cuando no sabe algo.
 */
export function herramientasApagadas(config: ConfigRemota) {
    return Object.entries(config.agente.herramientas)
        .filter(([nombre, activa]) => activa === false && nombre !== 'derivar_a_asesor')
        .map(([nombre]) => nombre)
        .sort(comparar)
}

/**
 * El texto que se suma al prompt con lo que editó el equipo, o null si no hay
 * nada que sumar. Sale siempre igual para la misma config (se ordena todo acá,
 * sin importar el orden en que lo mande el CRM), para que el caché de prompt
 * de Anthropic no se rompa entre mensajes.
 */
export function bloqueRemoto(config: ConfigRemota, nombresDeHerramientas: string[]): string | null {
    const secciones: string[] = []

    const instrucciones = config.agente.instrucciones.trim()
    if (instrucciones) {
        secciones.push(`## Instrucciones del equipo\n${instrucciones}`)
    }

    const items = config.conocimiento
        .map(c => ({
            tipo: c.tipo,
            tema: c.tema.trim(),
            como: c.como_lo_dice?.trim() || null,
            respuesta: c.respuesta.trim(),
        }))
        .filter(c => c.tema && c.respuesta)
        .sort(
            (a, b) =>
                ORDEN_TIPOS.indexOf(a.tipo) - ORDEN_TIPOS.indexOf(b.tipo) ||
                comparar(a.tema, b.tema) ||
                comparar(a.como ?? '', b.como ?? '') ||
                comparar(a.respuesta, b.respuesta)
        )

    if (items.length) {
        const grupos = ORDEN_TIPOS.map(tipo => {
            const delTipo = items.filter(c => c.tipo === tipo)
            if (!delTipo.length) return null
            const lineas = delTipo.map(c =>
                [
                    `- Tema: ${c.tema}`,
                    c.como ? `  Cómo lo dice el cliente: ${c.como}` : null,
                    `  Respuesta aprobada: ${c.respuesta}`,
                ]
                    .filter(Boolean)
                    .join('\n')
            )
            return `### ${TITULO_TIPO[tipo]}\n${lineas.join('\n')}`
        }).filter(Boolean)

        secciones.push(
            [
                '## Objeciones y respuestas aprobadas',
                'Úsalas cuando calcen con lo que pregunta o plantea la persona. Respeta el contenido; adapta solo el tono a la conversación.',
                ...grupos,
            ].join('\n\n')
        )
    }

    const apagadas = herramientasApagadas(config).filter(n => nombresDeHerramientas.includes(n))
    if (apagadas.length) {
        secciones.push(
            `## Herramientas desactivadas\nEl equipo desactivó: ${apagadas.join(', ')}. No las tienes en esta conversación aunque se mencionen arriba; si hacía falta una, deriva a un asesor.`
        )
    }

    if (!secciones.length) return null

    return [
        '# Lo que cargó y aprobó el equipo de Alimin',
        'Esto es parte de tu ficha. Si algo de aquí contradice lo de arriba, vale lo de aquí: es lo más reciente que aprobó el equipo.',
        ...secciones,
    ].join('\n\n')
}

/* ── Reporte de uso ──────────────────────────────────────────────── */

export interface UsoDeTokens {
    conversacionId: string
    modelo: string
    input_tokens: number | null
    output_tokens: number | null
    cache_read_input_tokens: number | null
    cache_creation_input_tokens: number | null
}

/** Manda al CRM lo que gastó una llamada al modelo. No se espera: si falla, solo se anota en consola. */
export function reportarUso(uso: UsoDeTokens) {
    const crm = credenciales()
    if (!crm) return

    fetch(`${crm.url}/api/webhooks/ia/uso`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-ia-secret': crm.secreto },
        body: JSON.stringify({
            agente: AGENTE,
            canal: 'web',
            conversacion_id: uso.conversacionId,
            modelo: uso.modelo,
            input_tokens: uso.input_tokens ?? 0,
            output_tokens: uso.output_tokens ?? 0,
            cache_read_input_tokens: uso.cache_read_input_tokens ?? 0,
            cache_creation_input_tokens: uso.cache_creation_input_tokens ?? 0,
        }),
        cache: 'no-store',
        signal: AbortSignal.timeout(10_000),
    })
        .then(res => {
            if (!res.ok) console.error(`[ali] El CRM no registró el uso: respondió ${res.status}`)
        })
        .catch(error => console.error('[ali] No se pudo reportar el uso al CRM:', error))
}
