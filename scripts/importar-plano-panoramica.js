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
    for (let y = arranque; y < ALTO; y++) {
        // w: cuanto manda el relleno sobre la foto. w2: cuanto se cierra al
        // promedio, para que el punto exacto del nadir sea de un solo color.
        const w = suave((y - arranque) / (franja * 0.47))
        const w2 = suave((y - arranque) / franja)
        for (let x = 0; x < W; x++) {
            const i = (y * W + x) * C
            const fr = color[x * 3] * (1 - w2) + mr * w2
            const fg = color[x * 3 + 1] * (1 - w2) + mg * w2
            const fb = color[x * 3 + 2] * (1 - w2) + mb * w2
            px[i] = px[i] * (1 - w) + fr * w
            px[i + 1] = px[i + 1] * (1 - w) + fg * w
            px[i + 2] = px[i + 2] * (1 - w) + fb * w
        }
    }
    console.log(`Nadir: ${franja} px de franja (${(franja / ALTO * 180).toFixed(1)} grados sobre el nadir), color tomado de las filas ${refA}-${refB}`)

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
