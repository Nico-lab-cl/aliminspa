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
       espejar deja una roseta, estirar deja estrias y repetir un trozo de
       vegetacion deja una estrella de 256 rayos. El problema no es el dibujo,
       es la convergencia.

       Lo unico que no se deforma al converger es lo que ya es constante a lo
       largo de la fila. Asi que la franja de abajo se reemplaza por el promedio
       de cada fila, entrando de a poco: arriba de la franja manda la foto real
       y hacia el nadir manda el promedio. Queda un degradado del color del
       suelo, sin figura. Los deslindes de los lotes siguen viendose porque son
       geometria 3D, no parte de la foto. */
    const franja = Math.max(abajo + 24, Math.round(ALTO * 0.09))
    const cruda = await sharp(plana).raw().toBuffer({ resolveWithObject: true })
    const px = cruda.data, W = cruda.info.width, C = cruda.info.channels
    const arranque = ALTO - franja
    const ultimaReal = arriba + mc.height - 1

    /* Promedio de cada fila de la franja. Las filas del relleno no tienen foto,
       asi que repiten la ultima que si la tiene. */
    const medias = []
    for (let y = arranque; y < ALTO; y++) {
        const f = Math.min(y, ultimaReal)
        let r = 0, g = 0, b = 0
        for (let x = 0; x < W; x++) {
            const i = (f * W + x) * C
            r += px[i]; g += px[i + 1]; b += px[i + 2]
        }
        medias.push([r / W, g / W, b / W])
    }

    /* Los promedios crudos saltan de fila en fila, y como cada fila es un
       anillo alrededor del dron, esos saltos salen dibujados como una diana.
       Se suavizan con una media movil ancha: el disco queda como un degradado
       continuo del color del suelo, sin bordes que mirar. */
    const RADIO = Math.round(franja * 0.35)
    const suavizadas = medias.map((_, k) => {
        let r = 0, g = 0, b = 0, n = 0
        for (let j = k - RADIO; j <= k + RADIO; j++) {
            const m = medias[Math.min(medias.length - 1, Math.max(0, j))]
            r += m[0]; g += m[1]; b += m[2]; n++
        }
        return [r / n, g / n, b / n]
    })

    const suave = t => { const u = Math.min(1, Math.max(0, t)); return u * u * (3 - 2 * u) }
    for (let y = arranque; y < ALTO; y++) {
        const [pr, pg, pb] = suavizadas[y - arranque]
        // Peso del promedio: 0 al entrar en la franja, 1 bastante antes del
        // borde, para que las filas del relleno ya no tengan nada que aportar.
        const w = suave((y - arranque) / (franja * 0.8))
        for (let x = 0; x < W; x++) {
            const i = (y * W + x) * C
            px[i] = px[i] * (1 - w) + pr * w
            px[i + 1] = px[i + 1] * (1 - w) + pg * w
            px[i + 2] = px[i + 2] * (1 - w) + pb * w
        }
    }
    console.log(`Nadir: ${franja} px de franja promediada por fila (${(franja / ALTO * 180).toFixed(1)} grados sobre el nadir)`)

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
