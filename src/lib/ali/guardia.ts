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

/**
 * Pie con crédito directo → total con crédito (ficha de conocimiento.ts; si
 * cambia un precio, cambiarlo también aquí).
 */
const TOTALES_CON_CREDITO: [pie: string, total: string, contado: string][] = [
    ['$5.500.000', '$37.990.000', '$35.000.000'], // Lomas del Mar 200 m²
    ['$7.500.000', '$45.990.000', '$43.000.000'], // Lomas del Mar 390 m²
    ['$20.000.000', '$42.000.000', '$39.000.000'], // Arena y Sol
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
    // Precio con crédito sin el total (pendiente del 20-11: en "muy caro" Ali lo omitía).
    for (const [pie, total, contado] of TOTALES_CON_CREDITO) {
        if (!texto.includes(pie)) continue
        const faltan = [!texto.includes(contado) && `"${contado} al contado"`, !texto.includes(total) && `"${total} en total con crédito"`].filter(Boolean)
        if (faltan.length) {
            motivos.add(`Diste el pie de ${pie} sin ${faltan.join(' ni ')}: cuando das un precio va completo (contado, pie, cuotas y total con crédito).`)
        }
    }
    return [...motivos]
}

/**
 * Largo y forma de la respuesta (20-11-2026). Con la ficha más larga, Haiku a
 * veces responde varias preguntas en un párrafo de 400 caracteres en vez de
 * listas con ✅ (Francisco, Facebook): se lee mal en el celular. Lo que se
 * revisa es concreto y medible, no el estilo:
 *   - ningún bloque de texto corrido (sin contar las líneas con ✅ ni los
 *     enlaces) pasa de LARGO_MAXIMO caracteres;
 *   - en redes, no más de 3 mensajes (los bloques que parten con ✅ se pegan
 *     a su título, igual que en burbujasRedes).
 */
const LARGO_MAXIMO = 230

export function problemasDeFormato(texto: string, canal: string): string[] {
    const t = texto.trim()
    if (!t || /^\[SIN_RESPUESTA\]$/i.test(t)) return []
    const redes = canal !== 'web'
    const bloques = t.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean)
    const problemas: string[] = []

    const largos = bloques
        .map(b => b.split('\n').filter(l => !l.trim().startsWith('✅')).join(' ').replace(/https?:\/\/\S+/g, '').trim())
        .filter(b => b.length > LARGO_MAXIMO)
    if (largos.length) {
        problemas.push(
            redes
                ? `Tiene ${largos.length === 1 ? 'un párrafo' : 'párrafos'} de ${largos.map(b => b.length).join(' y ')} caracteres: en el celular se ve como un bloque. Cada frase suelta, máximo 2 líneas; si son 2 o más datos, van en lista (una línea corta de título y debajo un dato por línea con ✅).`
                : `Tiene ${largos.length === 1 ? 'un párrafo' : 'párrafos'} de ${largos.map(b => b.length).join(' y ')} caracteres: es un chat, 1 a 3 frases por mensaje.`
        )
    }

    if (redes) {
        let mensajes = 0
        for (const b of bloques) if (!b.startsWith('✅') || mensajes === 0) mensajes++
        if (mensajes > 3) {
            problemas.push(`Son ${mensajes} mensajes: el máximo es 3. Si preguntó muchas cosas, responde lo principal en listas con ✅ y ofrécele lo demás en la pregunta final.`)
        }
    }
    return problemas
}

/**
 * Modismos que Ali nunca usa (Nicolás, 20-11-2026: "te respondo al tiro"
 * "nunca en la vida"). Cercana sí, coloquial no: es la voz de la empresa.
 */
const MODISMOS = /\b(al ?tiro|cach[aá]i|cach[aá]s|wena|bac[aá]n|pucha|cu[aá]tico|la raja|filete|we[oó]n|wn|po|pos|oye|ya po|sipo|nopo|hueveo|fome)\b/gi

export function modismos(texto: string): string[] {
    const vistos = new Set<string>()
    for (const m of texto.matchAll(MODISMOS)) vistos.add(m[0].toLowerCase())
    return [...vistos]
}

/**
 * El precio va siempre con el pie y las cuotas, y la primera vez con lo que
 * viene con el terreno (Marcela, 20-11-2026: "sigue solo enviando valores";
 * Ali resumía "$37.990.000 con crédito directo" y nunca mandaba la lista).
 */
export function precioIncompleto(texto: string, yaDijoLoQueViene: boolean, canal: string): string[] {
    const problemas: string[] = []
    let dioPrecio = false
    for (const [pie, total, contado] of TOTALES_CON_CREDITO) {
        if (!texto.includes(contado) && !texto.includes(total)) continue
        dioPrecio = true
        if (!texto.includes(pie)) {
            problemas.push(`Diste ${texto.includes(contado) ? contado : total} sin el pie (${pie}) ni las cuotas: el precio con crédito va siempre con pie, cuotas y total, aunque ya se lo hayas dicho antes.`)
        }
    }
    if (dioPrecio && !yaDijoLoQueViene && !LO_QUE_VIENE.test(texto)) {
        problemas.push(
            canal === 'web'
                ? 'Diste el precio sin lo que viene con el terreno: súmalo en una frase corta (plano y limpio, agua de pozo potabilizada sin cuenta de agua, luz con medidor, estacionamiento de visitas y que se va a entregar con rol propio).'
                : 'Diste el precio sin lo que viene con el terreno: después de los precios, en un mensaje aparte, va "Y viene con 😊" con las 5 líneas con ✅ de tu ficha, y al final la pregunta. Máximo 3 mensajes: si son varios precios, van todos en el primer mensaje.'
        )
    }
    return problemas
}

/** Ya salió en la conversación (o en esta respuesta) la lista de lo que viene. */
export const LO_QUE_VIENE = /plano y limpio|agua de pozo potabilizada/i

/** Último recurso si después de reescribir todavía queda alguno. */
export function sinModismos(texto: string): string {
    return texto
        .replace(/\bal ?tiro\b/gi, 'de inmediato')
        .replace(/[,\s]+\b(po|pos)\b(?=[\s.,!?😊🙌🌊👋]|$)/gi, '')
        .replace(/\b(oye|pucha),?\s+/gi, '')
        .replace(/\bbac[aá]n\b/gi, 'genial')
        .replace(/\bfome\b/gi, 'aburrido')
        .replace(/\bcu[aá]tico\b/gi, 'impresionante')
}
