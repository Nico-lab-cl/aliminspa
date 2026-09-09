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

    /* Abajo NO puede ir color liso. Esas filas son el nadir y al proyectarlas
       sobre el terreno se abren en un disco de decenas de metros justo bajo el
       dron: un tono plano se ve como una mancha en medio del mapa, y espejar
       las ultimas filas deja una roseta, que se nota igual.

       Se estiran las ultimas filas reales hacia abajo. En el mapa eso se
       proyecta como estrias radiales que convergen en el centro, que es
       justo lo que hace una panoramica de verdad cerca del nadir: continua
       en vez de dibujar una figura. */
    const espejo = await sharp(cuerpo)
        .extract({ left: 0, top: mc.height - 2, width: mc.width, height: 2 })
        .resize({ width: mc.width, height: abajo, fit: 'fill' })
        .toBuffer()

    /* Dos pasadas y no dos extend encadenados: sharp no los acumula, el
       segundo reemplaza al primero y la imagen sale con un solo relleno. */
    const conCielo = await sharp(cuerpo)
        .extend({ top: arriba, background: cielo })
        .toBuffer()
    const completa = await sharp(conCielo)
        .extend({ bottom: abajo, background: cielo })
        .composite([{ input: espejo, top: arriba + mc.height, left: 0 }])
        .toBuffer()

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
