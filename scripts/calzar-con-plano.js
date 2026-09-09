/*
 * Calcula donde estaba el dron usando los deslindes dibujados sobre la
 * panoramica.
 *
 * El manto del visor proyecta la panoramica sobre el terreno desde la posicion
 * del dron. Si esa posicion esta mal, la foto queda girada y corrida respecto
 * de los lotes. La panoramica se estitcheo y perdio el EXIF, asi que no hay
 * GPS ni rumbo que leer, y correlacionar la foto contra la ortofoto dio 0,137:
 * inservible.
 *
 * El plano dibujado cambia eso. Las lineas blancas SON los deslindes, trazados
 * en el espacio de la panoramica. Y los 137 poligonos son los mismos deslindes
 * en coordenadas reales. Asi que se buscan los cuatro parametros del vuelo que
 * hacen coincidir unos con otros: se proyecta cada vertice al equirect y se
 * mide cuantos caen sobre una linea blanca.
 *
 *   node scripts/calzar-con-plano.js
 *
 * Imprime el mejor calce. NO escribe nada: hay que revisarlo en
 * /agendar-visita?calce=1 antes de guardarlo.
 *
 * Supone suelo plano a la cota media del loteo. El desnivel es de 40 m sobre
 * 160 de altura de vuelo, asi que introduce error; alcanza para el rumbo y la
 * posicion gruesa, y el ajuste fino se termina a ojo.
 */

const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const RAIZ = path.join(__dirname, '..')
const MAPA = path.join(RAIZ, 'public/lomas3d/lotes-editados.json')
const PANO = path.join(RAIZ, 'public/lomas3d/pano-360.webp')

const TAU = Math.PI * 2

async function main() {
    const datos = JSON.parse(fs.readFileSync(MAPA, 'utf8'))
    const lotes = datos.lotes

    // ── mascara de las lineas dibujadas ──────────────────────────────────────
    const ANCHO = 2048
    const img = await sharp(PANO).resize(ANCHO).raw().toBuffer({ resolveWithObject: true })
    const W = img.info.width, H = img.info.height, C = img.info.channels
    /* Solo bajo el horizonte, que en una equirectangular esta a media altura:
       el cielo esta nublado y tambien es blanco, y al incluirlo la mascara se
       comia media imagen y la busqueda dejaba de significar nada.

       El umbral sale del histograma de esa mitad: el terreno se concentra
       entre 50 y 80, y hay un pico aparte sobre 230 que son las lineas. */
    const HORIZONTE = Math.floor(H * 0.52)
    const linea = new Uint8Array(W * H)
    let pintados = 0
    for (let y = HORIZONTE; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const i = (y * W + x) * C
            const r = img.data[i], g = img.data[i + 1], b = img.data[i + 2]
            const max = Math.max(r, g, b), min = Math.min(r, g, b)
            if (min > 230 && max - min < 20) { linea[y * W + x] = 1; pintados++ }
        }
    }
    const utiles = W * (H - HORIZONTE)
    console.log(`Panoramica ${W}x${H} — ${(pintados / utiles * 100).toFixed(2)} % de linea bajo el horizonte`)
    if (pintados < utiles * 0.005) {
        console.error('Casi no se detectan lineas blancas. ¿Es la panoramica con el plano dibujado?')
        process.exit(1)
    }

    // Se ensancha un poco: el trazo es fino y los vertices no caen exactos.
    const mascara = new Uint8Array(W * H)
    for (let y = HORIZONTE + 2; y < H - 2; y++) {
        for (let x = 2; x < W - 2; x++) {
            if (!linea[y * W + x]) continue
            for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) mascara[(y + dy) * W + x + dx] = 1
        }
    }

    // ── puntos a lo largo del contorno de cada lote ──────────────────────────
    const puntos = []
    for (const l of lotes) {
        for (let i = 0; i < l.p.length; i++) {
            const a = l.p[i], b = l.p[(i + 1) % l.p.length]
            const n = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 2))
            for (let k = 0; k < n; k++) {
                puntos.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n])
            }
        }
    }
    const paso = Math.ceil(puntos.length / 1600)
    const P = puntos.filter((_, i) => i % paso === 0)
    console.log(`Vertices de contorno: ${puntos.length} — se usan ${P.length}`)

    /** Fraccion de vertices que caen sobre una linea dibujada. */
    const puntuar = (dx, dz, alt, yawGrados) => {
        const yaw = yawGrados * Math.PI / 180
        let aciertos = 0
        for (let i = 0; i < P.length; i++) {
            const X = P[i][0] - dx, Z = P[i][1] - dz
            const t = Math.atan2(Z, X)
            const r = Math.hypot(X, Z)
            let u = 0.5 - t / TAU + yaw / TAU
            u -= Math.floor(u)
            const v = 0.5 - Math.asin(alt / Math.hypot(r, alt)) / Math.PI
            const px = Math.min(W - 1, Math.max(0, Math.round(u * W)))
            const py = Math.min(H - 1, Math.max(0, Math.round((1 - v) * H)))
            if (mascara[py * W + px]) aciertos++
        }
        return aciertos / P.length
    }

    console.log('\nBuscando (esto toma un rato)…')
    let mejor = { s: -1 }
    for (let yaw = -180; yaw < 180; yaw += 4) {
        // El vuelo fue de dron: alturas de cientos de metros no son reales y
        // solo aparecen cuando la mascara esta sucia.
        for (const alt of [80, 100, 120, 140, 170, 200, 240]) {
            for (let dx = -180; dx <= 180; dx += 45) {
                for (let dz = -180; dz <= 180; dz += 45) {
                    const s = puntuar(dx, dz, alt, yaw)
                    if (s > mejor.s) mejor = { s, dx, dz, alt, yaw }
                }
            }
        }
    }
    console.log(`  grueso:  x ${mejor.dx}  z ${mejor.dz}  alt ${mejor.alt}  giro ${mejor.yaw}  →  ${(mejor.s * 100).toFixed(1)} % de aciertos`)

    for (let yaw = mejor.yaw - 6; yaw <= mejor.yaw + 6; yaw += 1) {
        for (let alt = Math.max(60, mejor.alt - 40); alt <= Math.min(300, mejor.alt + 40); alt += 10) {
            for (let dx = mejor.dx - 50; dx <= mejor.dx + 50; dx += 10) {
                for (let dz = mejor.dz - 50; dz <= mejor.dz + 50; dz += 10) {
                    const s = puntuar(dx, dz, alt, yaw)
                    if (s > mejor.s) mejor = { s, dx, dz, alt, yaw }
                }
            }
        }
    }
    console.log(`  medio:   x ${mejor.dx}  z ${mejor.dz}  alt ${mejor.alt}  giro ${mejor.yaw}  →  ${(mejor.s * 100).toFixed(1)} % de aciertos`)

    for (let yaw = mejor.yaw - 2; yaw <= mejor.yaw + 2; yaw += 0.25) {
        for (let alt = Math.max(60, mejor.alt - 12); alt <= Math.min(300, mejor.alt + 12); alt += 3) {
            for (let dx = mejor.dx - 12; dx <= mejor.dx + 12; dx += 3) {
                for (let dz = mejor.dz - 12; dz <= mejor.dz + 12; dz += 3) {
                    const s = puntuar(dx, dz, alt, yaw)
                    if (s > mejor.s) mejor = { s, dx, dz, alt, yaw }
                }
            }
        }
    }

    const azar = pintados / utiles
    console.log(`  fino:    x ${mejor.dx}  z ${mejor.dz}  alt ${mejor.alt}  giro ${mejor.yaw}  →  ${(mejor.s * 100).toFixed(1)} % de aciertos`)
    console.log(`\nPor azar se acertaria ${(azar * 100).toFixed(1)} %, asi que el calce es ${(mejor.s / azar).toFixed(0)} veces mejor que el azar.`)
    console.log(mejor.s > 0.5
        ? '\nCalce bueno. Cargalo y revisalo a ojo antes de guardar.'
        : '\nCalce dudoso: revisalo bien en el modo de calce antes de darlo por bueno.')

    console.log('\nPara probarlo, pega esto en public/lomas3d/vuelo.json:\n')
    console.log(JSON.stringify({
        _comentario: 'Calce calculado con scripts/calzar-con-plano.js sobre los deslindes dibujados.',
        calibrado: true,
        x: mejor.dx, z: mejor.dz, alt: mejor.alt, yaw: mejor.yaw,
    }, null, 2))
}

main().catch(e => { console.error(e); process.exit(1) })
