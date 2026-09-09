/*
 * Convierte la panoramica con los deslindes dibujados en la equirectangular
 * 2:1 que necesita el mapa 3D.
 *
 * El archivo que sale del trazado no es una equirectangular completa: cubre
 * unos 130 grados verticales en vez de 180, porque el vuelo no alcanza el
 * cenit ni el nadir. Para que el visor la proyecte bien hay que devolverla a
 * 2:1 con el horizonte exactamente al medio.
 *
 * El horizonte se detecta en la propia imagen —el cielo nublado es claro y sin
 * color, el terreno no— asi que no hace falta compararla con nada. Un intento
 * anterior alineaba esta foto contra la panoramica antigua y era un callejon
 * sin salida: la banda que se comparaba era cielo, que correlaciona alto en
 * cualquier angulo, y el resultado no significaba nada.
 *
 *   node scripts/importar-plano-panoramica.js "ruta/plano.tiff"
 *
 * Escribe public/lomas3d/pano-360.webp y pano-360-lite.webp.
 *
 * Tapa ademas el agujero del nadir con satelital de Esri, reproyectada aqui
 * mismo. Eso hace que la salida dependa de public/lomas3d/vuelo.json: si el
 * calce cambia, hay que volver a correr este script o el parche queda corrido.
 *
 * Despues hay que recalcular el calce, porque la foto nueva no tiene por que
 * mirar hacia donde miraba la anterior:
 *
 *   node scripts/calzar-con-plano.js
 */

const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const RAIZ = path.join(__dirname, '..')
const SALIDA = path.join(RAIZ, 'public/lomas3d/pano-360.webp')
const SALIDA_LITE = path.join(RAIZ, 'public/lomas3d/pano-360-lite.webp')
const VUELO = path.join(RAIZ, 'public/lomas3d/vuelo.json')
const MAPA = path.join(RAIZ, 'public/lomas3d/mapa-data.json')

/* Esri no pasa de z18 en El Tabo: z19 responde "map data not yet available".
   A esta latitud z18 son unos 50 cm por pixel. */
const SAT = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile'
const SAT_Z = 18

/** Ancho de la equirectangular que se publica. El alto sale de la relacion 2:1. */
const ANCHO = 6144

/**
 * Fila del horizonte, como fraccion del alto.
 *
 * Se recorre de arriba hacia abajo contando por fila cuantos pixeles son
 * cielo: claros y sin color dominante. Arriba da 100 %, y en el horizonte cae
 * de golpe. Se toma el primer cruce por la mitad.
 */
async function buscarHorizonte(archivo) {
    const W = 1024
    const r = await sharp(archivo, { limitInputPixels: false })
        .resize(W).raw().toBuffer({ resolveWithObject: true })
    const H = r.info.height, C = r.info.channels

    const cieloPorFila = []
    for (let y = 0; y < H; y++) {
        let cielo = 0
        for (let x = 0; x < W; x++) {
            const i = (y * W + x) * C
            const R = r.data[i], G = r.data[i + 1], B = r.data[i + 2]
            if (Math.min(R, G, B) > 120 && Math.max(R, G, B) - Math.min(R, G, B) < 40) cielo++
        }
        cieloPorFila.push(cielo / W)
    }

    if (cieloPorFila[0] < 0.5) {
        throw new Error('La imagen no empieza con cielo arriba: no parece una panoramica sin rotar.')
    }
    for (let y = 1; y < H; y++) {
        if (cieloPorFila[y - 1] >= 0.5 && cieloPorFila[y] < 0.5) return y / H
    }
    throw new Error('No se encontro el horizonte: el cielo no llega a cortarse.')
}

/*
 * Mosaico satelital de un trozo de mundo, en memoria.
 *
 * Devuelve un muestreador bilineal por lat/lng. Se baja una sola vez, al
 * compilar: el visitante no pide nada.
 */
async function mosaicoSatelital(la, lo, R, kx, cx, cz, radio) {
    const N = 2 ** SAT_Z
    const merc = (lat, lng) => {
        const s = Math.sin(lat * Math.PI / 180)
        return [(lng + 180) / 360 * N * 256,
                (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * N * 256]
    }
    const aLL = (x, z) => [la - z / R, lo + x / kx]
    const m = radio * 1.15   // un poco de margen para el bilineal del borde
    const [pxW, pyN] = merc(...aLL(cx - m, cz - m))
    const [pxE, pyS] = merc(...aLL(cx + m, cz + m))
    const tx0 = Math.floor(Math.min(pxW, pxE) / 256), tx1 = Math.floor(Math.max(pxW, pxE) / 256)
    const ty0 = Math.floor(Math.min(pyN, pyS) / 256), ty1 = Math.floor(Math.max(pyN, pyS) / 256)
    const cols = tx1 - tx0 + 1, filas = ty1 - ty0 + 1

    const piezas = []
    let bajadas = 0
    for (let ty = ty0; ty <= ty1; ty++) {
        for (let tx = tx0; tx <= tx1; tx++) {
            const r = await fetch(`${SAT}/${SAT_Z}/${ty}/${tx}`, {
                headers: { 'User-Agent': 'aliminspa-build' }
            })
            if (!r.ok) { console.warn(`  mosaico ${tx}/${ty}: HTTP ${r.status}`); continue }
            piezas.push({
                input: Buffer.from(await r.arrayBuffer()),
                left: (tx - tx0) * 256, top: (ty - ty0) * 256
            })
            bajadas++
        }
    }
    if (!bajadas) throw new Error('No se pudo bajar ningun mosaico satelital.')
    console.log(`Satelital: ${bajadas} de ${cols * filas} mosaicos z${SAT_Z}`)

    const lienzo = await sharp({
        create: { width: cols * 256, height: filas * 256, channels: 3, background: { r: 107, g: 91, b: 69 } }
    }).composite(piezas).png().toBuffer()
    const cr = await sharp(lienzo).raw().toBuffer({ resolveWithObject: true })
    const SW = cr.info.width, SH = cr.info.height, SC = cr.info.channels, sd = cr.data
    const ox = tx0 * 256, oy = ty0 * 256

    /** Color del suelo en un punto del mundo, o null si cae fuera del mosaico. */
    return (x, z) => {
        const [plat, plng] = aLL(x, z)
        const [mx, my] = merc(plat, plng)
        const fx = mx - ox, fy = my - oy
        if (fx < 0 || fy < 0 || fx >= SW - 1 || fy >= SH - 1) return null
        const x0 = Math.floor(fx), y0 = Math.floor(fy), ax = fx - x0, ay = fy - y0
        const en = (a, b) => (b * SW + a) * SC
        const out = [0, 0, 0]
        for (let c = 0; c < 3; c++) {
            out[c] = (sd[en(x0, y0) + c] * (1 - ax) + sd[en(x0 + 1, y0) + c] * ax) * (1 - ay)
                   + (sd[en(x0, y0 + 1) + c] * (1 - ax) + sd[en(x0 + 1, y0 + 1) + c] * ax) * ay
        }
        return out
    }
}

async function main() {
    const origen = process.argv[2]
    if (!origen || !fs.existsSync(origen)) {
        console.error('Uso: node scripts/importar-plano-panoramica.js "ruta/plano.tiff"')
        process.exit(1)
    }

    const meta = await sharp(origen, { limitInputPixels: false }).metadata()
    console.log(`Origen: ${meta.width}x${meta.height} (${meta.format}) — cubre ${(meta.height / meta.width * 360).toFixed(1)} grados verticales`)

    const fraccion = await buscarHorizonte(origen)
    console.log(`Horizonte al ${(fraccion * 100).toFixed(1)} % del alto`)

    // La foto, llevada al ancho de publicacion.
    const cuerpo = await sharp(origen, { limitInputPixels: false })
        .resize({ width: ANCHO })
        .toBuffer()
    const mc = await sharp(cuerpo).metadata()

    const ALTO = ANCHO / 2
    const horizonte = Math.round(mc.height * fraccion)
    const arriba = Math.round(ALTO / 2 - horizonte)
    const abajo = ALTO - arriba - mc.height
    console.log(`Relleno: ${arriba} px arriba, ${abajo} px abajo, para dejar el horizonte en la fila ${ALTO / 2} de ${ALTO}`)
    if (arriba < 0 || abajo < 0) {
        console.error('La foto no cabe en 2:1 con el horizonte al medio. Revisa que no venga ya recortada o rotada.')
        process.exit(1)
    }

    /* Arriba va cielo liso: son las filas del cenit, que en el mapa quedan a
       espaldas de la camara y practicamente no se miran. */
    const { data: tono } = await sharp(cuerpo).extract({ left: 0, top: 0, width: mc.width, height: 8 })
        .resize(1, 1).raw().toBuffer({ resolveWithObject: true })
    const cielo = { r: tono[0], g: tono[1], b: tono[2] }
    console.log(`Relleno de cielo: rgb(${cielo.r},${cielo.g},${cielo.b})`)

    /* Dos pasadas y no dos extend encadenados: sharp no los acumula, el
       segundo reemplaza al primero y la imagen sale con un solo relleno. */
    const conCielo = await sharp(cuerpo)
        .extend({ top: arriba, background: cielo })
        .toBuffer()
    const plana = await sharp(conCielo)
        .extend({ bottom: abajo, background: cielo })
        .toBuffer()

    /* El nadir es la zona que el vuelo no alcanza, y ademas las ultimas filas
       que si trae la foto vienen degradadas del stitch.

       En una equirectangular todas las direcciones convergen en la fila de
       abajo, asi que al proyectarla cualquier dibujo con estructura se abre en
       rayos desde el punto bajo el dron. Probado: color liso deja una mancha,
       espejar una roseta, estirar estrias, repetir vegetacion una estrella de
       256 rayos, y el promedio de cada fila un velo gris que igual se ve,
       porque el promedio de toda la vuelta no es el color del suelo de ningun
       lado en particular: sale verdoso donde el terreno es pardo.

       Asi que el relleno se saca del color que tiene el suelo en cada rumbo:
       se toma una banda de filas reales sobre la zona fea, se desenfoca a lo
       ancho hasta que no queda ningun detalle —solo el color— y se usa como
       relleno. Cada sector queda del tono que le toca y el parche se confunde
       con lo de al lado. Justo en el nadir, donde todos los rumbos se juntan
       en un punto, se cierra al promedio para que no salga un molinillo. */
    /* El ancho sale de medir la foto, no de mirarla: el detalle horizontal por
       fila se mantiene entero hasta unos 15 grados sobre el nadir, baja al 71 %
       a los 12 y se derrumba al 47 % bajo los 9. Asi que la franja arranca a
       los 15 grados y el relleno manda del todo a los 8: entre medio la foto
       esta blanda pero es real, y se prefiere blanda a inventada.

       Cada grado de mas es mapa tapado, y no poco: a los 260 m de vuelo que
       tiene el calce, 15 grados ya son 70 m de radio. */
    const franja = Math.max(abajo + 24, Math.round(ALTO * 0.0833))
    const cruda = await sharp(plana).raw().toBuffer({ resolveWithObject: true })
    const px = cruda.data, W = cruda.info.width, C = cruda.info.channels
    const arranque = ALTO - franja

    /* Banda de referencia: filas reales por encima de la franja, lejos del
       relleno y de las filas degradadas del final del stitch. */
    const refA = arranque - Math.round(franja * 0.9)
    const refB = arranque - Math.round(franja * 0.25)
    const fila = new Float64Array(W * 3)
    for (let x = 0; x < W; x++) {
        let r = 0, g = 0, b = 0
        for (let y = refA; y < refB; y++) {
            const i = (y * W + x) * C
            r += px[i]; g += px[i + 1]; b += px[i + 2]
        }
        const n = refB - refA
        fila[x * 3] = r / n; fila[x * 3 + 1] = g / n; fila[x * 3 + 2] = b / n
    }

    /* Tres pasadas de media movil circular ≈ una gaussiana, y cada pasada es
       O(W) con suma corrida. El radio es medio sector: borra el detalle y deja
       el color. */
    const radio = Math.round(W / 12)
    let color = fila
    for (let pasada = 0; pasada < 3; pasada++) {
        const salida = new Float64Array(W * 3)
        for (let c = 0; c < 3; c++) {
            let suma = 0
            for (let j = -radio; j <= radio; j++) suma += color[((((j % W) + W) % W) * 3) + c]
            for (let x = 0; x < W; x++) {
                salida[x * 3 + c] = suma / (2 * radio + 1)
                suma += color[(((x + radio + 1) % W) * 3) + c] - color[(((((x - radio) % W) + W) % W) * 3) + c]
            }
        }
        color = salida
    }
    let mr = 0, mg = 0, mb = 0
    for (let x = 0; x < W; x++) { mr += color[x * 3]; mg += color[x * 3 + 1]; mb += color[x * 3 + 2] }
    mr /= W; mg /= W; mb /= W

    const suave = t => { const u = Math.min(1, Math.max(0, t)); return u * u * (3 - 2 * u) }

    /* Suelo de verdad para el agujero: satelital de ese mismo punto, traido a
       coordenadas de la panoramica.

       Cada pixel de la franja es una direccion desde el dron. Se invierte la
       misma cuenta que usa el manto en el visor —angulo bajo el horizonte y
       rumbo— se cruza con el suelo, y ahi se mira que color tiene el satelite.
       Como es la inversa exacta de lo que hace el manto, al proyectarlo vuelve
       a caer donde corresponde, sin capa nueva ni geometria nueva.

       Supone suelo plano a la cota del dron. Sobre 70 m de radio el desnivel
       corre el muestreo unos metros, que para un relleno blando no importa. */
    const vuelo = JSON.parse(fs.readFileSync(VUELO, 'utf8'))
    const mapa = JSON.parse(fs.readFileSync(MAPA, 'utf8'))
    const RT = 111320, kx = RT * Math.cos(mapa.origin.lat * Math.PI / 180)
    const TAU = Math.PI * 2
    const yawRad = (vuelo.yaw || 0) * Math.PI / 180
    const alt = vuelo.alt
    // Radio de suelo que abarca la franja: el angulo de arriba de la franja.
    const phiArranque = Math.PI * ((arranque + 0.5) / ALTO - 0.5)
    const radioSuelo = alt / Math.tan(phiArranque)
    console.log(`Agujero: ${franja} px de franja = ${(90 - phiArranque * 180 / Math.PI).toFixed(1)} grados sobre el nadir = ${radioSuelo.toFixed(0)} m de radio en el suelo a ${alt} m de vuelo`)

    let muestra = null
    try {
        muestra = await mosaicoSatelital(mapa.origin.lat, mapa.origin.lng, RT, kx, vuelo.x, vuelo.z, radioSuelo)
    } catch (e) {
        console.warn(`Sin satelital (${e.message}): la franja queda con el color liso de respaldo.`)
    }

    /* Igualar el satelite a la foto: viene de otro dia, otra camara y otra
       hora. Igualar solo la media dejaba el parche lavado —el satelite tiene
       menos contraste y al subirle el brillo se aplana—, asi que se igualan
       media y desviacion por canal sobre el anillo donde las dos imagenes
       conviven. Es la correccion clasica de transferencia de color. */
    let ajuste = null
    if (muestra) {
        const nf = [0, 0, 0], nf2 = [0, 0, 0], ns = [0, 0, 0], ns2 = [0, 0, 0]
        let n = 0
        for (let y = arranque; y < ALTO; y += 2) {
            const w = suave((y - arranque) / (franja * 0.32))
            if (w < 0.12 || w > 0.5) continue
            const phi = Math.PI * ((y + 0.5) / ALTO - 0.5)
            const r = alt / Math.tan(phi)
            for (let x = 0; x < W; x += 8) {
                const t = Math.PI + yawRad - TAU * (x + 0.5) / W
                const c = muestra(vuelo.x + Math.cos(t) * r, vuelo.z + Math.sin(t) * r)
                if (!c) continue
                const i = (y * W + x) * C
                /* Los deslindes dibujados son blancos y puros, y no son suelo:
                   contados, inflaban la desviacion de la foto y el satelite
                   salia con el contraste reventado. */
                const mn = Math.min(px[i], px[i + 1], px[i + 2])
                const mx = Math.max(px[i], px[i + 1], px[i + 2])
                if (mn > 195 && mx - mn < 35) continue
                for (let k = 0; k < 3; k++) {
                    nf[k] += px[i + k]; nf2[k] += px[i + k] ** 2
                    ns[k] += c[k]; ns2[k] += c[k] ** 2
                }
                n++
            }
        }
        if (n > 500) {
            ajuste = [0, 1, 2].map(k => {
                const mf = nf[k] / n, ms = ns[k] / n
                const df = Math.sqrt(Math.max(1, nf2[k] / n - mf * mf))
                const ds = Math.sqrt(Math.max(1, ns2[k] / n - ms * ms))
                // El factor se acota: sin tope, un anillo con poco contraste
                // dispara el ruido del satelite.
                return { ms, mf, k: Math.min(1.8, Math.max(0.5, df / ds)) }
            })
            console.log('Igualado de color sobre ' + n + ' muestras:')
            for (const [i, a] of ajuste.entries()) {
                console.log(`  canal ${'RGB'[i]}: media ${a.ms.toFixed(0)} → ${a.mf.toFixed(0)}, contraste ×${a.k.toFixed(2)}`)
            }
        } else {
            console.warn(`Pocas muestras (${n}) para igualar color: se deja sin corregir.`)
        }
    }
    const corregir = (c, k) => ajuste
        ? Math.min(255, Math.max(0, (c - ajuste[k].ms) * ajuste[k].k + ajuste[k].mf))
        : c

    let conSat = 0, sinSat = 0
    for (let y = arranque; y < ALTO; y++) {
        // w: cuanto manda el relleno sobre la foto. w2: cuanto se cierra al
        // promedio, para el respaldo liso cuando no hay satelital.
        const w = suave((y - arranque) / (franja * 0.32))
        const w2 = suave((y - arranque) / franja)
        const phi = Math.PI * ((y + 0.5) / ALTO - 0.5)
        const r = alt / Math.tan(phi)
        for (let x = 0; x < W; x++) {
            const i = (y * W + x) * C
            let fr, fg, fb
            const c = muestra && muestra(vuelo.x + Math.cos(Math.PI + yawRad - TAU * (x + 0.5) / W) * r,
                                        vuelo.z + Math.sin(Math.PI + yawRad - TAU * (x + 0.5) / W) * r)
            if (c) {
                fr = corregir(c[0], 0); fg = corregir(c[1], 1); fb = corregir(c[2], 2)
                conSat++
            } else {
                // Respaldo: el color del suelo en ese rumbo, cerrando al promedio.
                fr = color[x * 3] * (1 - w2) + mr * w2
                fg = color[x * 3 + 1] * (1 - w2) + mg * w2
                fb = color[x * 3 + 2] * (1 - w2) + mb * w2
                sinSat++
            }
            px[i] = px[i] * (1 - w) + fr * w
            px[i + 1] = px[i + 1] * (1 - w) + fg * w
            px[i + 2] = px[i + 2] * (1 - w) + fb * w
        }
    }
    console.log(`Franja: ${(conSat / (conSat + sinSat) * 100).toFixed(1)} % con satelital, el resto con color de respaldo`)

    const completa = await sharp(px, { raw: cruda.info }).png().toBuffer()

    const mf = await sharp(completa).metadata()
    if (mf.width !== ANCHO || mf.height !== ALTO) {
        throw new Error(`La equirectangular quedo en ${mf.width}x${mf.height} y tenia que ser ${ANCHO}x${ALTO}.`)
    }

    for (const [salida, ancho, calidad] of [[SALIDA, ANCHO, 82], [SALIDA_LITE, 2048, 70]]) {
        await sharp(completa).resize({ width: ancho }).webp({ quality: calidad }).toFile(salida)
        console.log(`Escrito ${path.basename(salida)} — ${(fs.statSync(salida).size / 1048576).toFixed(2)} MB`)
    }

    console.log('\nAhora hay que recalcular el calce:  node scripts/calzar-con-plano.js')
}

main().catch(e => { console.error('\n' + e.message); process.exit(1) })
