/*
 * Estima dónde estaba el dron cuando tomó la panorámica.
 *
 * El manto de /agendar-visita proyecta la panorámica sobre el terreno desde la
 * posición del dron. Si esa posición está mal, la foto queda girada y corrida
 * respecto de los lotes. La panorámica se estitcheó y perdió el EXIF, así que
 * no hay GPS ni rumbo que leer.
 *
 * Lo que hace este script es aprovechar que la ortofoto SÍ está bien
 * georreferenciada: para cada punto del suelo compara el gris de la ortofoto
 * con el gris que la panorámica pondría ahí, y busca los parámetros que hagan
 * calzar mejor las dos imágenes (correlación cruzada normalizada).
 *
 *   node scripts/estimar-calce.js
 *
 * Imprime el mejor calce encontrado. NO escribe nada: es un punto de partida
 * para el modo de calce de /agendar-visita?calce=1, donde se afina a ojo.
 *
 * Supone suelo plano a la cota media del loteo. Alcanza para el rumbo, que es
 * el parámetro que más descoloca la imagen; la altura y el desplazamiento
 * conviene terminarlos a mano.
 */

const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const RAIZ = path.join(__dirname, '..')
const MAPA = path.join(RAIZ, 'public/lomas3d/mapa-data.json')
const GEO = path.join(RAIZ, 'public/lomas3d/georef.json')
const ORTO = path.join(RAIZ, 'public/lomas3d/ortofoto.webp')
const PANO = path.join(RAIZ, 'public/lomas3d/pano-360.webp')

const TAU = Math.PI * 2

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

/** Correlación cruzada normalizada entre dos series del mismo largo. */
function ncc(a, b) {
    const n = a.length
    if (n < 50) return -1
    let ma = 0, mb = 0
    for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i] }
    ma /= n; mb /= n
    let num = 0, da = 0, db = 0
    for (let i = 0; i < n; i++) {
        const x = a[i] - ma, y = b[i] - mb
        num += x * y; da += x * x; db += y * y
    }
    return da && db ? num / Math.sqrt(da * db) : -1
}

async function main() {
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

    // --- ortofoto en color, para poder descartar el plano pintado
    const ow = 800
    const o = await sharp(ORTO).resize(ow).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    const OW = o.info.width, OH = o.info.height, OC = o.info.channels
    const escala = OW / G.w

    // --- panorámica en gris
    const pw = 2048
    const pn = await sharp(PANO).resize(pw).greyscale().raw().toBuffer({ resolveWithObject: true })
    const PW = pn.info.width, PH = pn.info.height, PC = pn.info.channels

    // --- muestras de suelo: la caja de los lotes, con margen
    const xs = data.lots.flatMap(l => l.p.map(p => p[0]))
    const zs = data.lots.flatMap(l => l.p.map(p => p[1]))
    const x0 = Math.min(...xs) - 80, x1 = Math.max(...xs) + 80
    const z0 = Math.min(...zs) - 80, z1 = Math.max(...zs) + 80

    const puntos = []
    const grisOrto = []
    const PASO = 3 // metros
    for (let X = x0; X <= x1; X += PASO) {
        for (let Z = z0; Z <= z1; Z += PASO) {
            const [px, py] = toPx(X, Z)
            const ix = Math.round(px * escala), iy = Math.round(py * escala)
            if (ix < 0 || iy < 0 || ix >= OW || iy >= OH) continue
            const i = (iy * OW + ix) * OC
            if (o.data[i + 3] < 200) continue                       // fuera de la huella del vuelo
            const r = o.data[i], g = o.data[i + 1], b = o.data[i + 2]
            // El plano pintado son colores puros: no representan el terreno y
            // sesgarían la correlación, así que se descartan.
            if (Math.max(r, g, b) - Math.min(r, g, b) > 55) continue
            puntos.push([X, Z])
            grisOrto.push(0.299 * r + 0.587 * g + 0.114 * b)
        }
    }
    console.log(`Muestras de suelo utilizables: ${puntos.length}`)
    if (puntos.length < 500) {
        console.error('Muy pocas muestras limpias. ¿La ortofoto está bien?')
        process.exit(1)
    }

    const grisPano = new Float64Array(puntos.length)
    /** Gris que la panorámica pondría en cada punto del suelo, para un calce dado. */
    const proyectar = (dx, dz, alt, yawDeg) => {
        const yaw = yawDeg * Math.PI / 180
        for (let i = 0; i < puntos.length; i++) {
            const X = puntos[i][0] - dx, Z = puntos[i][1] - dz
            const t = Math.atan2(Z, X)
            const r = Math.hypot(X, Z)
            let u = 0.5 - t / TAU + yaw / TAU
            u -= Math.floor(u)                                       // RepeatWrapping
            const v = 0.5 - Math.asin(alt / Math.hypot(r, alt)) / Math.PI
            const ix = Math.min(PW - 1, Math.max(0, Math.round(u * PW)))
            const iy = Math.min(PH - 1, Math.max(0, Math.round((1 - v) * PH)))
            grisPano[i] = pn.data[(iy * PW + ix) * PC]
        }
        return ncc(grisOrto, grisPano)
    }

    // --- 1) el rumbo es lo que más descoloca: se barre entero
    let mejor = { s: -2 }
    for (let yaw = -180; yaw < 180; yaw += 1) {
        const s = proyectar(0, 0, 110, yaw)
        if (s > mejor.s) mejor = { s, x: 0, z: 0, alt: 110, yaw }
    }
    console.log(`\nMejor rumbo con el dron en el origen: ${mejor.yaw}°  (correlación ${mejor.s.toFixed(3)})`)

    // --- 2) posición y altura alrededor de ese rumbo
    for (const alt of [70, 90, 110, 130, 160, 200]) {
        for (let dx = -120; dx <= 120; dx += 30) {
            for (let dz = -120; dz <= 120; dz += 30) {
                for (let yaw = mejor.yaw - 25; yaw <= mejor.yaw + 25; yaw += 5) {
                    const s = proyectar(dx, dz, alt, yaw)
                    if (s > mejor.s) mejor = { s, x: dx, z: dz, alt, yaw }
                }
            }
        }
    }
    console.log(`Tras buscar posición y altura: x ${mejor.x}, z ${mejor.z}, alt ${mejor.alt} m, giro ${mejor.yaw}°  (correlación ${mejor.s.toFixed(3)})`)

    // --- 3) afinado
    for (let dx = mejor.x - 20; dx <= mejor.x + 20; dx += 5) {
        for (let dz = mejor.z - 20; dz <= mejor.z + 20; dz += 5) {
            for (let alt = mejor.alt - 20; alt <= mejor.alt + 20; alt += 5) {
                for (let yaw = mejor.yaw - 4; yaw <= mejor.yaw + 4; yaw += 1) {
                    const s = proyectar(dx, dz, alt, yaw)
                    if (s > mejor.s) mejor = { s, x: dx, z: dz, alt, yaw }
                }
            }
        }
    }

    console.log('\n──────────────────────────────────────────────')
    console.log(`Mejor calce:  x ${mejor.x}   z ${mejor.z}   alt ${mejor.alt} m   giro ${mejor.yaw}°`)
    console.log(`Correlación con la ortofoto: ${mejor.s.toFixed(3)}`)
    console.log(mejor.s > 0.35
        ? 'Calce plausible. Cárgalo y termina de afinarlo a ojo.'
        : 'Correlación baja: tómalo solo como punto de partida, el ajuste fino va a ser a mano.')
    console.log('──────────────────────────────────────────────')
    console.log('\nPara probarlo, pega esto en public/lomas3d/vuelo.json:\n')
    console.log(JSON.stringify({ x: mejor.x, z: mejor.z, alt: mejor.alt, yaw: mejor.yaw }, null, 2))
}

main().catch(e => { console.error(e); process.exit(1) })
