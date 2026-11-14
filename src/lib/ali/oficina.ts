/**
 * Avisos a la Oficina IA (Miniverse en EasyPanel, repo oficina-ia-alimin):
 * cuando Ali o Cierre trabajan, su personaje camina al escritorio y dice lo
 * que hizo. Nunca se mandan datos de clientes: solo el canal y la acción.
 *
 * Opcional: sin OFICINA_IA_URL no hace nada. Nunca se espera ni corta la
 * respuesta al cliente (2 s de timeout, errores silenciosos).
 */

export type AgenteOficina = 'ali' | 'cierre'

const NOMBRE: Record<AgenteOficina, string> = { ali: 'Ali', cierre: 'Cierre' }
const CANAL: Record<string, string> = { web: 'el chat web', instagram: 'Instagram', facebook: 'Facebook', correo: 'un correo' }

function enviar(ruta: string, cuerpo: unknown) {
    const base = process.env.OFICINA_IA_URL?.replace(/\/+$/, '')
    const secreto = process.env.IA_SECRET
    if (!base || !secreto) return
    fetch(`${base}${ruta}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-ia-secret': secreto },
        body: JSON.stringify(cuerpo),
        cache: 'no-store',
        signal: AbortSignal.timeout(2000),
    }).catch(() => {})
}

/** El agente se pone a trabajar (camina a su escritorio). */
export function oficinaTrabaja(agente: AgenteOficina, canal: string) {
    enviar('/api/heartbeat', {
        agent: agente,
        name: NOMBRE[agente],
        state: 'working',
        task: canal === 'correo' ? 'Escribiendo un correo post-visita' : `Atendiendo ${CANAL[canal] ?? canal}`,
    })
}

/** El agente dice lo que hizo y, unos segundos después, queda disponible. */
export function oficinaDice(agente: AgenteOficina, mensaje: string) {
    enviar('/api/act', { agent: agente, action: { type: 'speak', message: mensaje.slice(0, 80) } })
    setTimeout(() => enviar('/api/heartbeat', { agent: agente, name: NOMBRE[agente], state: 'idle', task: null }), 6000)
}

/** Qué dice al terminar una respuesta de chat, según lo que pasó. */
export function fraseDeRespuesta(canal: string, r: { visita?: unknown; derivacion?: unknown }) {
    if (r.visita) return '¡Agendé una visita!'
    if (r.derivacion) return 'Pasé el caso a un asesor'
    return `Respondí en ${CANAL[canal] ?? canal}`
}
