import type Anthropic from '@anthropic-ai/sdk'
import { INSTRUCCIONES_CIERRE } from './conocimiento'
import { bloqueRemoto, configRemota, herramientasApagadas, type AgenteChat } from './config-remota'

/**
 * La IA de Cierre (fase 3, 12-11-2026). El CRM móvil decide qué agente
 * atiende según la etapa del lead (lib/agenteIA.ts): si la persona ya llegó a
 * la visita y no reservó, pide "cierre". Acá se arma lo que se suma al prompt.
 *
 * Solo corre si el agente "Cierre" está encendido en el CRM web; si está
 * apagado o el CRM no responde, la conversación sigue con Ali tal cual.
 */
export interface ModoCierre {
    agente: AgenteChat
    /** Bloques que van después de lo de Ali (y de redes), antes de los datos del momento. */
    bloques: Anthropic.TextBlockParam[]
    /** Herramientas que el equipo le apagó a Cierre. */
    apagadas: string[]
    version: string | null
}

const SIN_CIERRE: ModoCierre = { agente: 'atraccion', bloques: [], apagadas: [], version: null }

export async function modoCierre(pedido: string | null | undefined, nombresDeHerramientas: string[]): Promise<ModoCierre> {
    // "cierre_prueba" solo llega por /api/ali/redes con IA_SECRET (pruebas
    // simuladas): corre el Cierre aunque esté apagado en el CRM web. El CRM
    // móvil nunca lo manda.
    const prueba = pedido === 'cierre_prueba'
    if (pedido !== 'cierre' && !prueba) return SIN_CIERRE
    const config = await configRemota('cierre')
    if (!prueba && !config?.agente.activo) return SIN_CIERRE
    if (!config) {
        return { agente: 'cierre', bloques: [{ type: 'text', text: INSTRUCCIONES_CIERRE, cache_control: { type: 'ephemeral' } }], apagadas: [], version: null }
    }
    const extra = bloqueRemoto(config, nombresDeHerramientas)
    return {
        agente: 'cierre',
        // Un solo bloque: la API acepta hasta 4 puntos de caché y en redes ya
        // van 3 (ficha de Ali, lo aprobado para Ali y lo de redes).
        bloques: [
            {
                type: 'text',
                text: extra ? `${INSTRUCCIONES_CIERRE}\n${extra.replace(/^# Lo que cargó y aprobó el equipo de Alimin/, '# Lo que cargó el equipo para el Cierre')}` : INSTRUCCIONES_CIERRE,
                cache_control: { type: 'ephemeral' },
            },
        ],
        apagadas: herramientasApagadas(config),
        version: config.version,
    }
}
