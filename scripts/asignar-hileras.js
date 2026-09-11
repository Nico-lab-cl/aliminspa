/*
 * Aplica lo que dicta quien conoce el loteo, sobre lo que el calce automatico
 * no puede saber.
 *
 * El cruce con el catastro (scripts/numerar-lotes.js) reparte numero y etapa,
 * pero de ahi no sale el estado: en lots.json los 202 registros figuran como
 * disponibles. Quien vende es el que sabe cuales estan vendidos, y las zonas
 * que no son lote —areas verdes, estacionamiento, equipamiento— tampoco estan
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
           tamano parecia al reves —el 47 mide 2043 px y el estacionamiento
           3127— pero el 47 es un lote de esquina y por eso sale mas chico. */
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
    const recorrerHilera = guia => {
        const punta = [...L].sort((a, b) => (b.u - b.v) - (a.u - a.v))[0]
        const otra = porNum(guia.etapa, guia.numero)
        if (!punta || !otra) return []
        const dx = (otra.u - punta.u) * rel, dy = otra.v - punta.v
        const m = Math.hypot(dx, dy)
        const ex = [dx / m, dy / m]
        const alLargo = l => (l.u - punta.u) * rel * ex[0] + (l.v - punta.v) * ex[1]
        const aparte = l => Math.abs(-(l.u - punta.u) * rel * ex[1] + (l.v - punta.v) * ex[0])
        return L
            .filter(l => aparte(l) < 0.018 && alLargo(l) > -0.02)
            .sort((x, y) => alLargo(x) - alLargo(y))
    }

    for (const r of REGLAS) {
        console.log(`\n${r.de}`)

        if (r.hilera) {
            const { etapa, guia, celdas } = r.hilera
            const fila = recorrerHilera(guia)
            if (fila.length !== celdas.length) {
                console.error(`  La hilera tiene ${fila.length} celdas y la lista trae ${celdas.length}.`)
                console.error('  No se escribe nada: con la lista corrida, toda la hilera queda con el numero del vecino.')
                process.exit(1)
            }
            for (const [i, dicho] of celdas.entries()) {
                const l = fila[i]
                if (dicho.simbolico) {
                    l.tipo = 'vendido'; l.n = null; l.stage = etapa; l.sold = true
                } else if (dicho.tipo) {
                    l.tipo = dicho.tipo; l.n = null; l.stage = null; l.sold = false
                } else {
                    l.tipo = 'lote'; l.n = dicho.n; l.stage = etapa; l.sold = !!dicho.sold
                }
            }
            const corto = { areaverde: 'AV', estacionamiento: 'EST', sanitario: 'SAN', descartado: '--' }
            const resumen = celdas.map(c => c.simbolico ? '□' : c.tipo ? (corto[c.tipo] ?? c.tipo) : c.n).join(' ')
            console.log(`  ${fila.length} celdas desde la punta: ${resumen}`)
            const cuenta = {}
            for (const c of celdas) {
                const k = c.simbolico ? 'simbolica' : c.tipo ?? (c.sold ? 'lote vendido' : 'lote disponible')
                cuenta[k] = (cuenta[k] ?? 0) + 1
            }
            console.log('  ' + Object.entries(cuenta).map(([k, v]) => `${v} ${k}`).join(', '))
        }

        if (r.vendidos) {
            const { etapa, numeros } = r.vendidos
            const hechos = [], faltan = []
            for (const n of numeros) {
                const l = porNum(etapa, n)
                if (!l) { faltan.push(n); continue }
                l.sold = true
                l.tipo = 'lote'
                hechos.push(n)
            }
            console.log(`  vendidos: ${hechos.length} de ${numeros.length} (etapa ${etapa}, del ${numeros[0]} al ${numeros[numeros.length - 1]})`)
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
                console.warn(`  OJO: ${s.porque} — no encuentro esa celda`)
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
                console.warn(`  OJO: ${z.porque} — solo encontre ${sueltas.length} celdas sueltas`)
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
