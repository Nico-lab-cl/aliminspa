/*
 * Rescata una celda que el filtro de la importacion descarto.
 *
 * Los lotes salen de lo que las lineas blancas encierran, y despues se filtran
 * por forma para separarlos de los caminos. Ese filtro se equivoca con los
 * lotes en punta: el loteo esta girado respecto de la imagen, asi que una cuna
 * llena poco su caja recta y cae del lado equivocado del umbral por centesimas.
 * Ya paso con los triangulos de esquina y volvio a pasar con el del 41 de la
 * etapa 4, que llena 0,358 contra un umbral de 0,36.
 *
 *   node scripts/recuperar-celda.js <u> <v> [--escribir]
 *
 * u y v van en fraccion de la imagen, como en plano-lotes.json. Sin --escribir
 * solo cuenta que hay en ese punto y por que se cayo, que es como conviene
 * mirarlo antes de tocar nada.
 *
 * Se prefiere esto a bajar el umbral y reimportar: reimportar renumera las 238
 * celdas y obliga a rehacer todo lo dictado. Aca se agrega una celda con su
 * forma real, sin mover ninguna otra.
 *
 * Escribe public/lomas3d/plano-mapa.png y public/lomas3d/plano-lotes.json.
 * Despues hay que volver a correr scripts/asignar-hileras.js.
 */

const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const RAIZ = path.join(__dirname, '..')
const ORIGEN = path.join(RAIZ, 'Panoramica de Lomasturbas.png')
const MAPA = path.join(RAIZ, 'public/lomas3d/plano-mapa.png')
const DATOS = path.join(RAIZ, 'public/lomas3d/plano-lotes.json')

/* Los mismos valores que usa scripts/importar-plano-cenital.js: si se separan,
   esto deja de describir el mismo dibujo. */
const DETECTE = 4096, LUZ = 200, GRIS = 34

async function main() {
    const uu = Number(process.argv[2]), vv = Number(process.argv[3])
    const escribir = process.argv.includes('--escribir')
    if (!Number.isFinite(uu) || !Number.isFinite(vv)) {
        console.error('Faltan u y v, en fraccion de la imagen.')
        process.exit(1)
    }

    const r = await sharp(ORIGEN, { limitInputPixels: false })
        .resize(DETECTE).raw().toBuffer({ resolveWithObject: true })
    const W = r.info.width, H = r.info.height, C = r.info.channels, d = r.data

    const trazo = new Uint8Array(W * H)
    for (let i = 0; i < W * H; i++) {
        const R = d[i*C], G = d[i*C+1], B = d[i*C+2]
        const mn = Math.min(R, G, B), mx = Math.max(R, G, B)
        if (mn > LUZ && mx - mn < GRIS) trazo[i] = 1
    }

    // El recinto libre mas cercano al punto: el punto puede caer sobre la linea.
    let px = Math.round(uu * W), py = Math.round(vv * H)
    if (trazo[py*W + px]) {
        let mejor = null
        for (let dy = -20; dy <= 20 && !mejor; dy++) for (let dx = -20; dx <= 20; dx++) {
            const x = px + dx, y = py + dy
            if (x < 0 || x >= W || y < 0 || y >= H || trazo[y*W + x]) continue
            mejor = [x, y]; break
        }
        if (!mejor) { console.error('Ese punto cae sobre el trazo y no hay hueco cerca.'); process.exit(1) }
        ;[px, py] = mejor
        console.log(`El punto caia sobre la linea; se toma (${px},${py})`)
    }

    const dentro = new Set(), pila = [py*W + px]
    let sx = 0, sy = 0, x0 = W, x1 = 0, y0 = H, y1 = 0
    while (pila.length) {
        const p = pila.pop()
        if (dentro.has(p) || trazo[p]) continue
        dentro.add(p)
        const y = (p / W) | 0, x = p % W
        sx += x; sy += y
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
        if (x > 0) pila.push(p - 1)
        if (x < W-1) pila.push(p + 1)
        if (y > 0) pila.push(p - W)
        if (y < H-1) pila.push(p + W)
    }
    const n = dentro.size, an = x1-x0+1, al = y1-y0+1
    console.log(`Recinto de ${n} px, caja ${an}x${al} en (${x0},${y0})`)
    console.log(`  lleno ${(n/(an*al)).toFixed(3)}  alargado ${(Math.max(an,al)/Math.min(an,al)).toFixed(2)}`)
    console.log(`  centro (${Math.round(sx/n)},${Math.round(sy/n)})`)
    if (n > W * H * 0.01) {
        console.error('Es una region enorme: el dibujo esta abierto ahi y esto se derramaria.')
        process.exit(1)
    }
    if (!escribir) { console.log('\nNo se escribio nada. Con --escribir se agrega.'); return }

    const img = await sharp(MAPA).raw().toBuffer({ resolveWithObject: true })
    if (img.info.width !== W || img.info.height !== H) {
        console.error(`El mapa mide ${img.info.width}x${img.info.height} y la deteccion ${W}x${H}.`)
        process.exit(1)
    }
    const M = img.data, CM = img.info.channels
    const idEn = p => M[p*CM] + M[p*CM+1]*256
    const pisa = [...dentro].filter(p => idEn(p) !== 0)
    if (pisa.length) {
        console.error(`${pisa.length} px de ese recinto ya son del lote ${idEn(pisa[0])}.`)
        process.exit(1)
    }

    const datos = JSON.parse(fs.readFileSync(DATOS, 'utf8'))
    const nuevo = datos.lotes.reduce((m, l) => Math.max(m, l.id), 0) + 1
    for (const p of dentro) { M[p*CM] = nuevo & 255; M[p*CM+1] = (nuevo >> 8) & 255 }

    /* Se engorda sobre el trazo igual que en la importacion: sin eso queda una
       franja muerta del grosor de la linea donde el cursor no acierta nada. */
    let crecido = 0
    for (let paso = 0; paso < 4; paso++) {
        const nuevos = []
        for (const p of dentro) {
            const y = (p/W)|0, x = p % W
            for (const q of [p-1, p+1, p-W, p+W]) {
                if (q < 0 || q >= W*H) continue
                if ((q === p-1 && x === 0) || (q === p+1 && x === W-1)) continue
                if (!trazo[q] || idEn(q) !== 0) continue
                nuevos.push(q)
            }
        }
        for (const q of nuevos) {
            if (idEn(q) !== 0) continue
            M[q*CM] = nuevo & 255; M[q*CM+1] = (nuevo >> 8) & 255
            dentro.add(q); crecido++
        }
    }
    console.log(`Engordado ${crecido} px sobre el trazo`)

    let tx = 0, ty = 0
    x0 = W; x1 = 0; y0 = H; y1 = 0
    for (const p of dentro) {
        const y = (p/W)|0, x = p % W
        tx += x; ty += y
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
    }
    const t = dentro.size

    await sharp(M, { raw: { width: W, height: H, channels: CM } })
        .png({ compressionLevel: 9 }).toFile(MAPA)

    // La fila es la del vecino mas cercano: sirve para ordenar en el editor.
    const cerca = datos.lotes
        .map(l => ({ l, d: Math.hypot((l.u - tx/t/W) * W, (l.v - ty/t/H) * H) }))
        .sort((a, b) => a.d - b.d)[0].l
    datos.lotes.push({
        id: nuevo, fila: cerca.fila,
        u: +(tx/t/W).toFixed(5), v: +(ty/t/H).toFixed(5),
        caja: [+(x0/W).toFixed(5), +(y0/H).toFixed(5), +(x1/W).toFixed(5), +(y1/H).toFixed(5)],
        px: t, n: null, stage: null, sold: false, area: null, rescatado: true
    })
    datos.lotes.sort((p, q) => p.id - q.id)
    fs.writeFileSync(DATOS, JSON.stringify(datos, null, 1))
    console.log(`Escrito el lote ${nuevo} con ${t} px. Ahora hay ${datos.lotes.length}.`)
    console.log('Falta correr scripts/asignar-hileras.js.')
}

main().catch(e => { console.error('\n' + e.message); process.exit(1) })
