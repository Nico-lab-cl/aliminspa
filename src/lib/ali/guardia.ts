/**
 * Última revisión de lo que Ali va a mandar (20-11-2026).
 *
 * Hay promesas que no se pueden hacer aunque la ficha lo diga claro: Haiku a
 * veces junta dos datos ciertos ("Arena y Sol se entrega antes" + "los roles
 * están asignados") y escribe uno falso ("entrega inmediata, con recepción
 * final y rol propio asignado", revisión semanal del 20-11). Si el texto trae
 * una de estas afirmaciones, motor.ts le pide a Ali que reescriba una vez.
 *
 * Solo frases afirmativas: "todavía no tiene recepción final" o "no es de
 * entrega inmediata" están bien y no se marcan.
 */

interface Regla {
    patron: RegExp
    motivo: string
}

const REGLAS: Regla[] = [
    {
        patron: /entrega inmediata|inmediata entrega|listos? para (construir|edificar)|construir (de inmediato|altiro|ya mismo)/gi,
        motivo: 'Ningún proyecto es de entrega inmediata ni está listo para construir: Arena y Sol se entrega a fines de 2026 aproximadamente y Lomas del Mar por etapas desde fines de 2027.',
    },
    {
        patron: /(tiene|tienen|con|cuenta con|cuentan con|ya está|ya están|obtuvo|obtuvieron)( la)? recepci[oó]n (final|municipal)/gi,
        motivo: 'Ningún proyecto tiene recepción final todavía: la escritura se va a firmar cuando la tenga.',
    },
    {
        patron: /(ya )?(tiene|tienen|con) (su |sus )?rol(es)? propios?( (inscritos?|asignados?))?|rol propio (inscrito|asignado)|✅\s*rol propio/gi,
        motivo: 'El rol propio se dice siempre en futuro: "se van a entregar con rol propio".',
    },
]

/** Lo que va antes de la frase la deja bien: una negación o el futuro. */
const BIEN_ANTES = /\b(no|ni|sin|ninguno|ninguna|imposible|todav[ií]a no|a[uú]n no|nunca|van a|vas a|se va a|se van a|entregar[aá]n?|entregarlos?|entregar)\b[^.!?\n]{0,25}$/i

/** Explicaciones de cada afirmación prohibida que trae el texto (vacío si está bien). */
export function afirmacionesProhibidas(texto: string): string[] {
    const motivos = new Set<string>()
    for (const r of REGLAS) {
        for (const m of texto.matchAll(r.patron)) {
            const antes = texto.slice(Math.max(0, (m.index ?? 0) - 40), m.index ?? 0)
            if (BIEN_ANTES.test(antes)) continue
            motivos.add(`"${m[0].trim()}": ${r.motivo}`)
        }
    }
    return [...motivos]
}
