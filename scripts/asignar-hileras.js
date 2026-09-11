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

        for (const z of r.zonas ?? []) {
            const a = porNum(z.entre.etapa, z.entre.a)
            const b = porNum(z.entre.etapa, z.entre.b)
            if (!a || !b) {
                console.warn(`  OJO: no encuentro los lotes ${z.entre.a} y ${z.entre.b} de la etapa ${z.entre.etapa}`)
                problemas++
                continue
            }
            /* Las celdas sin numero que caen entre esos dos lotes, medidas por
               cercania a la recta que los une. Se toman las mas cercanas al
               punto medio, tantas como se dijo. */
            const medio = { u: (a.u + b.u) / 2, v: (a.v + b.v) / 2 }
            const largo = dist(a, b, rel)
            const sueltas = L
                .filter(l => l.n == null && !l.tipo)
                .map(l => ({ l, d: dist(l, medio, rel) }))
                .filter(x => x.d < largo)
                .sort((x, y) => x.d - y.d)
                .slice(0, z.cuantas)
            if (sueltas.length < z.cuantas) {
                console.warn(`  OJO: ${z.porque} — solo encontre ${sueltas.length} celdas sueltas`)
                problemas++
            }
            for (const { l } of sueltas) {
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
