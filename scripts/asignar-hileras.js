/*
 * Aplica lo que dicta quien conoce el loteo, sobre lo que el calce automatico
 * no puede saber.
 *
 * El cruce con el catastro (scripts/numerar-lotes.js) reparte numero y etapa,
 * pero de ahi no sale el estado: en lots.json los 202 registros figuran como
 * disponibles. Quien vende es el que sabe cuales estan vendidos, y las zonas
 * que no son lote âareas verdes, estacionamiento, equipamientoâ tampoco estan
 * en ningun archivo.
 *
 *   node scripts/asignar-hileras.js
 *
 * Cada regla dice a que lotes toca por etapa y numero, que es como habla quien
 * dicta. Si una regla no encuentra a quien aplicarse, se avisa y no se escribe:
 * una regla que no calza suele significar que la numeracion cambio debajo.
 */

const fs = require('fs')
const path = require('path')

const DATOS = path.join(__dirname, '..', 'public/lomas3d/plano-lotes.json')

/** Todos los numeros de un tramo, en cualquier sentido. */
const tramo = (a, b) => {
    const l = []
    for (let n = Math.min(a, b); n <= Math.max(a, b); n++) l.push(n)
    return l
}

/** Los numeros de un tramo en orden descendente, como se recorren en el plano. */
const bajando = (desde, hasta) => {
    const l = []
    for (let n = desde; n >= hasta; n--) l.push(n)
    return l
}

/** Repite una zona tantas veces seguidas. */
const zona = (tipo, veces = 1) => Array.from({ length: veces }, () => ({ tipo }))

/* En la hilera de arriba de la etapa 1 casi todo esta vendido: se dicen los
   pocos que quedan disponibles y el resto se marca vendido. */
const DISPONIBLES_E1 = new Set([26, 25, 24, 23, 22, 21, 19])

/* En la etapa 2 es al reves: recien empieza a venderse, asi que se dicen los
   vendidos y el resto de los 47 queda disponible. */
const VENDIDOS_E2 = [1, 4, 8, 18]

/* De la hilera del 27 al 43 de la etapa 3, los vendidos. El estado se dice en
   la misma hilera y no en una regla aparte, porque la otra hilera de la etapa
   todavia no se dicta. */
const VENDIDOS_E3 = new Set([43, 42, 41, 40, 39, 38, 37, 36, 35, 33, 27])

/* De la hilera de arriba de la etapa 3, la del 1 al 26, los vendidos. */
const VENDIDOS_E3_ARRIBA = new Set([11, 16])

/**
 * Lo dictado.
 *
 * `vendidos` marca lotes por etapa y numero. `zonas` marca celdas que no son
 * lote, y como esas no tienen numero hay que ubicarlas de otra forma: se dicen
 * por los dos lotes entre los que quedan, que es como se ven en el plano.
 */
const REGLAS = [
    {
        /* Esta hilera no se puede tomar del catastro: ahi tiene un lote menos
           que el plano dibujado, y por eso dejaba una celda sin numero en medio
           de la corrida. Se reparte por posicion, recorriendo la hilera desde
           el triangulo de la esquina hacia adentro.

           Las 24 celdas cierran exacto asi: el triangulo es el lote 28, del 29
           al 44 van 16, despues tres areas verdes, despues el 45 y el 46, luego
           el estacionamiento de visitas, y el 47 al final, pegado al camino.

           El estacionamiento va entre el 46 y el 47, no despues del 47: por
           tamano parecia al reves âel 47 mide 2043 px y el estacionamiento
           3127â pero el 47 es un lote de esquina y por eso sale mas chico. */
        de: 'la hilera de abajo de la etapa 1',
        hilera: {
            etapa: 1,
            guia: { etapa: 1, numero: 40 },
            celdas: [
                // El triangulo de la esquina es el lote 28, con su numero.
                { n: 28, sold: true },
                ...tramo(29, 44).map(n => ({ n, sold: true })),
                { tipo: 'areaverde' },
                { tipo: 'areaverde' },
                { tipo: 'areaverde' },
                { n: 45, sold: true },
                { n: 46, sold: true },
                { tipo: 'estacionamiento' },
                { n: 47, sold: true }
            ]
        }
    },
    {
        /* La hilera de arriba, la siguiente hacia adentro. Se recorre igual:
           desde el lado de la esquina hacia el camino. Son 34 celdas y la
           cuenta cierra exacta. */
        de: 'la hilera de arriba de la etapa 1',
        hilera: {
            etapa: 1,
            guia: { etapa: 1, numero: 40 },
            franja: 1,
            celdas: [
                { reservado: true },
                ...bajando(27, 7).map(n => ({ n, sold: !DISPONIBLES_E1.has(n) })),
                { tipo: 'sanitario' },
                ...zona('areaverde', 5),
                ...bajando(6, 1).map(n => ({ n, sold: true }))
            ]
        }
    },
    {
        /* Primera hilera de la etapa 2: la numeracion vuelve a empezar en 1.
           Es la unica hilera de 34 celdas que quedaba, porque la otra de 34 es
           la de arriba de la etapa 1 y ya esta puesta.

           Lo dictado va de izquierda a derecha, o sea desde el camino hacia la
           esquina, y acÃ¡ se recorre al reves, asi que la lista va invertida.

           No se dijo que lotes estan vendidos, asi que quedan todos
           disponibles hasta que alguien lo diga. */
        de: 'la primera hilera de la etapa 2',
        hilera: {
            etapa: 2,
            guia: { etapa: 1, numero: 40 },
            franja: 3,
            celdas: [
                ...bajando(28, 9).map(n => ({ n, sold: false })),
                { tipo: 'sanitario' },
                ...zona('areaverde', 4),
                ...bajando(8, 2).map(n => ({ n, sold: false })),
                { tipo: 'estacionamiento' },
                { n: 1, sold: false }
            ]
        }
    },
    {
        /* Segunda hilera de la etapa 2, la que cierra la numeracion. El calce
           automatico habia dejado cuatro celdas sin nada y con eso corrio los
           numeros del 40 en adelante.

           Va del 29 al 41 desde la esquina, despues cuatro areas verdes, y del
           42 al 47 hasta el camino. La ultima celda, la mas grande de todo el
           plano, no se dicto todavia y se deja como esta. */
        de: 'la segunda hilera de la etapa 2',
        hilera: {
            etapa: 2,
            guia: { etapa: 1, numero: 40 },
            franja: 2,
            celdas: [
                ...tramo(29, 41).map(n => ({ n })),
                ...zona('areaverde', 4),
                ...tramo(42, 47).map(n => ({ n })),
                { dejar: true }
            ]
        }
    },
    {
        /* Estado de la etapa 2: de las dos hileras solo hay cuatro vendidos,
           el 1, el 4, el 8 y el 18. Todo el resto de la etapa esta disponible.

           Va despues de las hileras, porque ellas reparten numero y zona pero
           no el estado, y esto lo pone sobre los 47 lotes de la etapa. */
        de: 'estado de la etapa 2',
        vendidos: { etapa: 2, numeros: VENDIDOS_E2 },
        disponibles: { etapa: 2, numeros: tramo(1, 47).filter(n => !VENDIDOS_E2.includes(n)) }
    },
    {
        /* Primera hilera de la etapa 3. El calce automatico la dejaba corrida
           en uno: metia una celda suelta despues del 29 y ponia solo tres
           areas verdes donde hay cuatro.

           Dictada de izquierda a derecha va del 43 al 38, cuatro areas verdes,
           y del 37 al 27. Aca se recorre al reves —desde la esquina hacia el
           camino— asi que la lista sube del 27 al 43. */
        de: 'la hilera del 27 al 43 de la etapa 3',
        hilera: {
            etapa: 3,
            guia: { etapa: 1, numero: 40 },
            franja: 4,
            celdas: [
                ...tramo(27, 37).map(n => ({ n, sold: VENDIDOS_E3.has(n) })),
                ...zona('areaverde', 4),
                ...tramo(38, 43).map(n => ({ n, sold: VENDIDOS_E3.has(n) }))
            ]
        }
    },
    {
        /* Segunda hilera de la etapa 3, la de arriba, donde la numeracion
           empieza. El calce automatico dejaba cinco celdas sin nada, entre
           ellas el estacionamiento y el equipamiento.

           Dictada de izquierda a derecha: el estacionamiento pegado al camino,
           del 1 al 8, el equipamiento sanitario, tres areas verdes, y del 9 al
           26. Aca se recorre al reves, desde la esquina, asi que la lista baja. */
        de: 'la hilera del 1 al 26 de la etapa 3',
        hilera: {
            etapa: 3,
            guia: { etapa: 1, numero: 40 },
            franja: 5,
            celdas: [
                ...bajando(26, 9).map(n => ({ n, sold: VENDIDOS_E3_ARRIBA.has(n) })),
                ...zona('areaverde', 3),
                { tipo: 'sanitario' },
                ...bajando(8, 1).map(n => ({ n, sold: VENDIDOS_E3_ARRIBA.has(n) })),
                { tipo: 'estacionamiento' }
            ]
        }
    }
]

/** Distancia entre dos celdas, corrigiendo que la imagen no es cuadrada. */
const dist = (a, b, rel) => Math.hypot((a.u - b.u) * rel, a.v - b.v)

function main() {
    const datos = JSON.parse(fs.readFileSync(DATOS, 'utf8'))
    const L = datos.lotes
    const rel = datos.ancho / datos.alto
    const porNum = (etapa, n) => L.find(l => l.stage === etapa && l.n === n)
    let problemas = 0

    /**
     * Celdas sin numero que quedan entre dos lotes conocidos.
     *
     * Es la unica forma de nombrar una celda que el calce dejo sin numero: por
     * los dos vecinos numerados que la rodean, que es como se ve en el plano.
     */
    const sueltasEntre = (entre, cuantas) => {
        const a = porNum(entre.etapa, entre.a), b = porNum(entre.etapa, entre.b)
        if (!a || !b) return []
        const medio = { u: (a.u + b.u) / 2, v: (a.v + b.v) / 2 }
        const largo = dist(a, b, rel)
        return L
            .filter(l => l.n == null && !l.tipo)
            .map(l => ({ l, d: dist(l, medio, rel) }))
            .filter(x => x.d < largo)
            .sort((x, y) => x.d - y.d)
            .slice(0, cuantas)
            .map(x => x.l)
    }

    /**
     * Las celdas de una hilera, en orden desde la punta hacia adentro.
     *
     * La punta es el triangulo de la esquina: la celda que mas se va hacia
     * arriba y a la derecha. La direccion de la hilera la fija una segunda
     * celda conocida, y con esas dos se arma la recta: son de la hilera las
     * celdas que caen cerca de ella, y el orden sale de proyectarlas.
     *
     * Se hace asi y no siguiendo la numeracion porque justamente la numeracion
     * es lo que puede estar corrido.
     */
    const recorrerHilera = (guia, franja = 0) => {
        const punta = [...L].sort((a, b) => (b.u - b.v) - (a.u - a.v))[0]
        const otra = porNum(guia.etapa, guia.numero)
        if (!punta || !otra) return []
        const dx = (otra.u - punta.u) * rel, dy = otra.v - punta.v
        const m = Math.hypot(dx, dy)
        const ex = [dx / m, dy / m]
        const alLargo = l => (l.u - punta.u) * rel * ex[0] + (l.v - punta.v) * ex[1]
        // Con signo: crece al alejarse de la hilera de la esquina.
        const aparte = l => -(l.u - punta.u) * rel * ex[1] + (l.v - punta.v) * ex[0]

        /* Las franjas se separan solas: entre una y otra hay un camino, y en el
           perpendicular eso es un salto mucho mayor que el ancho de un lote. Se
           numeran desde la de la esquina hacia adentro. */
        const orden = [...L].sort((a, b) => aparte(a) - aparte(b))
        let g = 0
        orden[0].franja = 0
        for (let i = 1; i < orden.length; i++) {
            if (aparte(orden[i]) - aparte(orden[i - 1]) > 0.012) g++
            orden[i].franja = g
        }
        const fila = orden.filter(l => l.franja === franja)
        for (const l of orden) delete l.franja
        return fila.sort((x, y) => alLargo(x) - alLargo(y))
    }

    for (const r of REGLAS) {
        console.log(`\n${r.de}`)

        if (r.hilera) {
            const { etapa, guia, franja = 0, celdas } = r.hilera
            const fila = recorrerHilera(guia, franja)
            if (fila.length !== celdas.length) {
                console.error(`  La hilera tiene ${fila.length} celdas y la lista trae ${celdas.length}.`)
                console.error('  No se escribe nada: con la lista corrida, toda la hilera queda con el numero del vecino.')
                process.exit(1)
            }
            for (const [i, dicho] of celdas.entries()) {
                const l = fila[i]
                if (dicho.dejar) {
                    // Celda que todavia no se dicto: se cuenta pero no se toca.
                } else if (dicho.reservado) {
                    // Se ve rojo como un vendido, pero no se puede elegir.
                    l.tipo = 'reservado'; l.n = null; l.stage = etapa; l.sold = true
                } else if (dicho.simbolico) {
                    l.tipo = 'vendido'; l.n = null; l.stage = etapa; l.sold = true
                } else if (dicho.tipo) {
                    l.tipo = dicho.tipo; l.n = null; l.stage = null; l.sold = false
                } else {
                    l.tipo = 'lote'; l.n = dicho.n; l.stage = etapa; l.sold = !!dicho.sold
                }
            }
            const corto = { areaverde: 'AV', estacionamiento: 'EST', sanitario: 'SAN', descartado: '--' }
            const resumen = celdas.map(c =>
                c.dejar ? '??' : c.reservado ? 'RES' : c.simbolico ? '□' : c.tipo ? (corto[c.tipo] ?? c.tipo) : c.n).join(' ')
            console.log(`  ${fila.length} celdas desde la punta: ${resumen}`)
            const cuenta = {}
            for (const c of celdas) {
                const k = c.dejar ? 'sin dictar'
                    : c.reservado ? 'reservado'
                    : c.simbolico ? 'simbolica'
                        : c.tipo ?? (c.sold ? 'lote vendido' : 'lote disponible')
                cuenta[k] = (cuenta[k] ?? 0) + 1
            }
            console.log('  ' + Object.entries(cuenta).map(([k, v]) => `${v} ${k}`).join(', '))
        }

        /* Estado por numero. Se dice de las dos formas segun convenga: a veces
           se enumeran los vendidos y a veces los pocos que siguen libres. */
        for (const [clave, vendido] of [['vendidos', true], ['disponibles', false]]) {
            if (!r[clave]) continue
            const { etapa, numeros } = r[clave]
            const hechos = [], faltan = []
            for (const n of numeros) {
                const l = porNum(etapa, n)
                if (!l) { faltan.push(n); continue }
                l.sold = vendido
                l.tipo = 'lote'
                hechos.push(n)
            }
            console.log(`  ${clave}: ${hechos.length} de ${numeros.length} en la etapa ${etapa}`)
            if (faltan.length) {
                console.warn(`  OJO: no estan los numeros ${faltan.join(', ')}`)
                problemas++
            }
        }

        /* Simbolico: se ve vendido pero no es un lote que se pueda elegir. Va
           despues de los vendidos, porque le quita el numero y a partir de ahi
           ya no se le puede llegar por numero. */
        for (const s of r.simbolicos ?? []) {
            /* Se puede senalar de dos formas: por numero, cuando el calce se
               lo puso, o por los dos lotes entre los que queda, cuando la
               celda salio sin numero y no hay otra forma de nombrarla. */
            const cuales = s.numero != null
                ? [porNum(s.etapa, s.numero)].filter(Boolean)
                : sueltasEntre(s.entre, s.cuantas)
            if (!cuales.length) {
                console.warn(`  OJO: ${s.porque} â no encuentro esa celda`)
                problemas++
                continue
            }
            for (const l of cuales) {
                l.tipo = 'vendido'
                l.n = null
                l.stage = s.entre?.etapa ?? s.etapa
                l.sold = true
            }
            console.log(`  ${s.porque}`)
        }

        for (const z of r.zonas ?? []) {
            const sueltas = sueltasEntre(z.entre, z.cuantas)
            if (sueltas.length < z.cuantas) {
                console.warn(`  OJO: ${z.porque} â solo encontre ${sueltas.length} celdas sueltas`)
                problemas++
            }
            for (const l of sueltas) {
                l.tipo = z.tipo
                l.n = null
                l.stage = null
                l.sold = false
            }
            console.log(`  ${z.porque}: ${sueltas.length} marcadas`)
        }
    }

    for (const l of L) delete l.error

    datos.provisional = L.some(l => (l.tipo ?? 'lote') === 'lote' && (l.n == null || l.stage == null))
    fs.writeFileSync(DATOS, JSON.stringify(datos, null, 1))

    const sinResolver = L.filter(l => (l.tipo ?? 'lote') === 'lote' && l.n == null)
    console.log(`\nEscrito. Quedan ${sinResolver.length} celdas sin numero ni zona, de ${L.length}.`)
    if (problemas) console.log(`Hubo ${problemas} avisos: revisalos antes de publicar.`)
}

main()
