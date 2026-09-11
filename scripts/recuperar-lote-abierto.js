/*
 * Recupera un lote que el plano dibujado dejo abierto.
 *
 * Los lotes salen de lo que las lineas blancas encierran, asi que uno cuyo
 * contorno tenga una falla se derrama hacia el camino y se pierde: en vez de
 * un recinto de 1250 px queda pegado a una region de 43000 que el filtro tira.
 * Eso paso con un lote de la hilera del 25 al 41 de la etapa 4, y se nota
 * porque entre sus dos vecinos hay el doble de separacion que en toda la fila.
 *
 *   node scripts/recuperar-lote-abierto.js <id vecino> <id vecino>
 *
 * Los dos vecinos son los que quedaron a cada lado del hueco. El lote nuevo se
 * arma con lo que hay entre ellos: el centro es el punto medio, y la forma
 * sale de crecer desde ahi por los pixeles que no son de nadie, sin salirse de
 * la caja de un vecino puesta en el medio. Asi el contorno respeta las lineas
 * que si estan dibujadas, y la falla queda tapada por la caja.
 *
 * Escribe public/lomas3d/plano-mapa.png y public/lomas3d/plano-lotes.json.
 * Despues hay que volver a correr scripts/asignar-hileras.js.
 */

const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const RAIZ = path.join(__dirname, '..')
const MAPA = path.join(RAIZ, 'public/lomas3d/plano-mapa.png')
const DATOS = path.join(RAIZ, 'public/lomas3d/plano-lotes.json')

async function main() {
    const [a, b] = process.argv.slice(2, 4).map(Number)
    if (!a || !b) {
        console.error('Faltan los dos ids vecinos del hueco.')
        process.exit(1)
    }

    const datos = JSON.parse(fs.readFileSync(DATOS, 'utf8'))
    const la = datos.lotes.find(l => l.id === a), lb = datos.lotes.find(l => l.id === b)
    if (!la || !lb) {
        console.error('Alguno de esos ids no existe.')
        process.exit(1)
    }

    const img = await sharp(MAPA).raw().toBuffer({ resolveWithObject: true })
    const W = img.info.width, H = img.info.height, C = img.info.channels, d = img.data
    const id = (x, y) => d[(y*W+x)*C] + d[(y*W+x)*C+1]*256
    console.log(`mapa ${W}x${H}, ${datos.lotes.length} lotes`)

    // El centro del que falta es el punto medio: los vecinos estan a dos pasos.
    const cx = Math.round((la.u + lb.u) / 2 * W), cy = Math.round((la.v + lb.v) / 2 * H)
    if (id(cx, cy) !== 0) {
        console.error(`En (${cx},${cy}) ya hay el lote ${id(cx, cy)}. El hueco no esta ahi.`)
        process.exit(1)
    }

    /* La caja de uno de los vecinos, centrada en el hueco, es el limite: sin
       ella el crecido se escapa por la falla y se come el camino entero. Se
       toma la mas chica de las dos, que es la que menos se pasa. */
    const caja = l => [Math.round((l.caja[2]-l.caja[0])*W), Math.round((l.caja[3]-l.caja[1])*H)]
    const [anA, alA] = caja(la), [anB, alB] = caja(lb)
    const an = Math.min(anA, anB), al = Math.min(alA, alB)
    const x0 = cx - (an>>1), x1 = cx + (an>>1), y0 = cy - (al>>1), y1 = cy + (al>>1)
    console.log(`hueco en (${cx},${cy}), caja ${an}x${al}`)

    const nuevo = datos.lotes.reduce((m, l) => Math.max(m, l.id), 0) + 1
    const visto = new Set(), pila = [[cx, cy]]
    let sx = 0, sy = 0, bx0 = W, bx1 = 0, by0 = H, by1 = 0
    while (pila.length) {
        const [x, y] = pila.pop()
        if (x < x0 || x > x1 || y < y0 || y > y1) continue
        const k = y*W + x
        if (visto.has(k) || id(x, y) !== 0) continue
        visto.add(k)
        sx += x; sy += y
        if (x < bx0) bx0 = x
        if (x > bx1) bx1 = x
        if (y < by0) by0 = y
        if (y > by1) by1 = y
        pila.push([x+1, y], [x-1, y], [x, y+1], [x, y-1])
    }
    const n = visto.size
    console.log(`lote ${nuevo}: ${n} px (los vecinos tienen ${la.px} y ${lb.px})`)
    if (n < 300) {
        console.error('Quedo demasiado chico. Revisar a mano antes de escribir.')
        process.exit(1)
    }

    for (const k of visto) {
        const o = k * C
        d[o] = nuevo & 255
        d[o+1] = (nuevo >> 8) & 255
    }
    await sharp(d, { raw: { width: W, height: H, channels: C } })
        .png({ compressionLevel: 9 }).toFile(MAPA)

    datos.lotes.push({
        id: nuevo,
        fila: la.fila,
        u: +(sx/n/W).toFixed(5), v: +(sy/n/H).toFixed(5),
        caja: [+(bx0/W).toFixed(5), +(by0/H).toFixed(5), +(bx1/W).toFixed(5), +(by1/H).toFixed(5)],
        px: n,
        n: null, stage: null, sold: false, area: null,
        recuperado: true
    })
    datos.lotes.sort((p, q) => p.id - q.id)
    fs.writeFileSync(DATOS, JSON.stringify(datos, null, 1))
    console.log(`Escrito. Ahora hay ${datos.lotes.length} lotes. Falta correr asignar-hileras.js.`)
}

main().catch(e => { console.error('\n' + e.message); process.exit(1) })
