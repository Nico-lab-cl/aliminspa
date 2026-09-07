/*
 * Dibuja los lotes sobre la ortofoto para revisar a ojo si calzan.
 *
 * Usa exactamente la misma proyección que el visor (local -> WGS84 -> UTM 19S
 * -> píxel), así que lo que se ve en la imagen de salida es lo que se va a ver
 * en el mapa 3D. Correr después de cambiar la ortofoto con importar-ortofoto.js.
 *
 *   node scripts/revisar-calce.js [salida.png]
 *
 * Deja la imagen en calce-lotes.png (o donde le digas).
 */

const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const RAIZ = path.join(__dirname, '..')
const MAPA = path.join(RAIZ, 'public/lomas3d/mapa-data.json')
const GEO = path.join(RAIZ, 'public/lomas3d/georef.json')

/** WGS84 -> UTM 19S. Mismo cálculo que lote3d.js: no tocar sin revalidar el calce. */
function ll2utm(lat, lng) {
    const a = 6378137, f = 1 / 298.257223563, e2 = f * (2 - f), ep2 = e2 / (1 - e2)
    const k0 = 0.9996, lon0 = -69 * Math.PI / 180
    const p = lat * Math.PI / 180, l = lng * Math.PI / 180
    const s = Math.sin(p), N1 = a / Math.sqrt(1 - e2 * s * s)
    const T = Math.tan(p) ** 2, C = ep2 * Math.cos(p) ** 2, A = Math.cos(p) * (l - lon0)
    const M = a * ((1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 ** 3 / 256) * p
        - (3 * e2 / 8 + 3 * e2 * e2 / 32 + 45 * e2 ** 3 / 1024) * Math.sin(2 * p)
        + (15 * e2 * e2 / 256 + 45 * e2 ** 3 / 1024) * Math.sin(4 * p)
        - (35 * e2 ** 3 / 3072) * Math.sin(6 * p))
    return [
        k0 * N1 * (A + (1 - T + C) * A ** 3 / 6 + (5 - 18 * T + T * T + 72 * C - 58 * ep2) * A ** 5 / 120) + 500000,
        k0 * (M + N1 * Math.tan(p) * (A * A / 2 + (5 - T + 9 * C + 4 * C * C) * A ** 4 / 24
            + (61 - 58 * T + T * T + 600 * C - 330 * ep2) * A ** 6 / 720)) + 10000000,
    ]
}

async function main() {
    const salida = process.argv[2] || path.join(RAIZ, 'calce-lotes.png')
    const data = JSON.parse(fs.readFileSync(MAPA, 'utf8'))
    const G = JSON.parse(fs.readFileSync(GEO, 'utf8'))
    const U = G.utm

    const R = 111320
    const la = data.origin.lat, lo = data.origin.lng
    const kx = R * Math.cos(la * Math.PI / 180)
    const toPx = (x, z) => {
        const [E, N] = ll2utm(la - z / R, lo + x / kx)
        return [U.x0 + (E - U.e0) * U.sx, U.y0 - (N - U.n0) * U.sy]
    }

    let svg = ''
    let fuera = 0
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (const l of data.lots) {
        const pts = l.p.map(([x, z]) => {
            const [px, py] = toPx(x, z)
            minX = Math.min(minX, px); maxX = Math.max(maxX, px)
            minY = Math.min(minY, py); maxY = Math.max(maxY, py)
            if (px < 0 || py < 0 || px > G.w || py > G.h) fuera++
            return `${px.toFixed(1)},${py.toFixed(1)}`
        }).join(' ')
        const color = l.sold ? '#ff4d4d' : '#ff00ff'
        svg += `<polygon points="${pts}" fill="none" stroke="${color}" stroke-width="1.5"/>`
    }

    const imagen = path.join(RAIZ, 'public', G.img.replace(/^\//, ''))
    if (!fs.existsSync(imagen)) {
        console.error(`No encuentro la ortofoto ${imagen} que declara georef.json`)
        process.exit(1)
    }

    await sharp(imagen)
        .composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${G.w}" height="${G.h}">${svg}</svg>`), top: 0, left: 0 }])
        .png()
        .toFile(salida)

    console.log(`Ortofoto: ${G.img} — ${G.w}x${G.h}`)
    console.log(`Lotes dibujados: ${data.lots.length} (magenta = disponible, rojo = vendido)`)
    console.log(`Caja de los lotes: x ${minX.toFixed(0)}–${maxX.toFixed(0)}, y ${minY.toFixed(0)}–${maxY.toFixed(0)}`)
    console.log(fuera ? `OJO: ${fuera} vértices caen fuera de la imagen` : 'Todos los vértices caen dentro de la imagen')
    console.log(`\nEscrito: ${salida}`)
}

main().catch(e => { console.error(e); process.exit(1) })
