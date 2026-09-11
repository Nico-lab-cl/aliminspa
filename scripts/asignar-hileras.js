/*
 * Reparte numero, etapa y zona sobre una hilera completa del plano.
 *
 * El cruce automatico con el catastro (scripts/numerar-lotes.js) deja 7,5 m de
 * error sobre lotes de 14 m de lado, asi que puede emparejar un lote con su
 * vecino. Cuando alguien que conoce el loteo dicta una hilera entera —"de
 * izquierda a derecha: 47, 46, 45, tres areas verdes, y del 44 al 28"— eso vale
 * mas que cualquier ajuste, y se escribe de una.
 *
 *   node scripts/asignar-hileras.js
 *
 * Las hileras se detectan igual que las ve el ojo: el loteo son franjas
 * paralelas separadas por caminos, asi que se proyectan los centros sobre el
 * eje perpendicular a las franjas y se corta donde hay hueco. Las franjas
 * quedan numeradas F0, F1... de un lado al otro, y dentro de cada una las
 * celdas van en orden a lo largo.
 *
 * Antes de escribir se comprueba que la hilera tenga exactamente tantas celdas
 * como dice la lista. Si no calzan, no se toca nada: una lista corrida por una
 * celda deja toda la hilera con el numero del vecino.
 */

const fs = require('fs')
const path = require('path')

const DATOS = path.join(__dirname, '..', 'public/lomas3d/plano-lotes.json')

/** Del 44 al 28 hacia abajo, todos vendidos. */
const bajando = (desde, hasta) => {
    const l = []
    for (let n = desde; n >= hasta; n--) l.push({ n, sold: true })
    return l
}

/**
 * Lo que dicta quien conoce el loteo, hilera por hilera.
 *
 * `franja` es cual de las detectadas, y `celdas` va en el mismo orden en que
 * se recorre la hilera: desde el extremo que da al camino hacia la punta.
 */
const HILERAS = [
    {
        franja: 5,
        etapa: 1,
        desde: 'el extremo que da al camino',
        celdas: [
            { n: 47, sold: true },
            { n: 46, sold: true },
            { n: 45, sold: true },
            { tipo: 'areaverde' },
            { tipo: 'areaverde' },
            { tipo: 'areaverde' },
            ...bajando(44, 28)
        ]
    }
]

/** Agrupa los lotes en franjas, como se ven en el plano. */
function franjas(lotes, rel) {
    const P = lotes.map(l => [l.u * rel, l.v])
    const n = P.length
    let mx = 0, my = 0
    for (const p of P) { mx += p[0]; my += p[1] }
    mx /= n; my /= n
    let sxx = 0, sxy = 0, syy = 0
    for (const p of P) {
        const a = p[0] - mx, b = p[1] - my
        sxx += a * a; sxy += a * b; syy += b * b
    }
    /* Eje mayor de la nube: es la direccion en que corren las franjas, porque
       el loteo es mucho mas largo a lo largo de ellas que a lo ancho. */
    const t = 0.5 * Math.atan2(2 * sxy / n, (sxx - syy) / n)
    const eA = [Math.cos(t), Math.sin(t)], eB = [-Math.sin(t), Math.cos(t)]
    const proy = lotes.map((l, i) => {
        const a = P[i][0] - mx, b = P[i][1] - my
        return { l, a: a * eA[0] + b * eA[1], b: a * eB[0] + b * eB[1] }
    })
    const orden = [...proy].sort((x, y) => x.b - y.b)
    const corte = (orden[orden.length - 1].b - orden[0].b) * 0.022
    let g = 0
    orden[0].g = 0
    for (let i = 1; i < orden.length; i++) {
        if (orden[i].b - orden[i - 1].b > corte) g++
        orden[i].g = g
    }
    const grupos = new Map()
    for (const o of orden) {
        if (!grupos.has(o.g)) grupos.set(o.g, [])
        grupos.get(o.g).push(o)
    }
    for (const G of grupos.values()) G.sort((x, y) => x.a - y.a)
    return grupos
}

function main() {
    const datos = JSON.parse(fs.readFileSync(DATOS, 'utf8'))
    const grupos = franjas(datos.lotes, datos.ancho / datos.alto)
    console.log(`Franjas detectadas: ${grupos.size}`)
    for (const [k, G] of [...grupos].sort((a, b) => a[0] - b[0])) {
        console.log(`  F${k}: ${G.length} celdas`)
    }

    for (const h of HILERAS) {
        const G = grupos.get(h.franja)
        if (!G) { console.error(`\nNo existe la franja F${h.franja}.`); process.exit(1) }
        if (G.length !== h.celdas.length) {
            console.error(`\nF${h.franja} tiene ${G.length} celdas y la lista trae ${h.celdas.length}.`)
            console.error('No se escribe nada: con la lista corrida, toda la hilera queda con el numero del vecino.')
            process.exit(1)
        }
        console.log(`\nF${h.franja} — etapa ${h.etapa}, desde ${h.desde}`)
        for (const [i, dicho] of h.celdas.entries()) {
            const l = G[i].l
            if (dicho.tipo) {
                l.tipo = dicho.tipo
                l.n = null
                l.stage = null
                l.sold = false
            } else {
                l.tipo = 'lote'
                l.n = dicho.n
                l.stage = h.etapa
                l.sold = !!dicho.sold
            }
            delete l.error
        }
        const resumen = h.celdas.map(c => c.tipo ? 'AV' : c.n).join(' ')
        console.log(`  ${resumen}`)
        const vendidos = h.celdas.filter(c => c.sold).length
        const verdes = h.celdas.filter(c => c.tipo === 'areaverde').length
        console.log(`  ${h.celdas.length - verdes} lotes (${vendidos} vendidos) y ${verdes} de area verde`)
    }

    datos.provisional = datos.lotes.some(l =>
        (l.tipo ?? 'lote') === 'lote' && (l.n == null || l.stage == null))
    fs.writeFileSync(DATOS, JSON.stringify(datos, null, 1))

    const listos = datos.lotes.filter(l => (l.tipo ?? 'lote') !== 'lote' || l.n != null).length
    console.log(`\nEscrito. ${listos} de ${datos.lotes.length} celdas resueltas.`)
}

main()
