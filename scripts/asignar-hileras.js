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
        de: 'la hilera de abajo de la etapa 1',
        vendidos: { etapa: 1, numeros: tramo(28, 47) },
        zonas: [{
            tipo: 'areaverde',
            cuantas: 3,
            entre: { etapa: 1, a: 44, b: 45 },
            porque: 'tres celdas de area verde entre el lote 44 y el 45'
        }],
        simbolicos: [{
            etapa: 1, numero: 28,
            porque: 'el triangulo de la esquina queda rojo, sin numero ni ficha'
        }, {
            entre: { etapa: 1, a: 36, b: 37 }, cuantas: 1,
            porque: 'la celda suelta entre el 36 y el 37 tambien va roja, para que la hilera no quede cortada'
        }]
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

    for (const r of REGLAS) {
        console.log(`\n${r.de}`)

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
