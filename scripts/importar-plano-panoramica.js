/*
 * Mete la panorámica con los deslindes dibujados en la proyección que usa el
 * mapa 3D.
 *
 * El archivo que llega del trazado no es una equirectangular completa: viene
 * girado y recortado por arriba respecto de la panorámica base. Este script
 * mide ese desfase comparando las dos imágenes —son la misma foto, así que
 * correlacionan— y reconstruye una equirectangular 2:1 alineada:
 *
 *   - la franja de los lotes sale del plano dibujado
 *   - el cielo y el cenit, que el dibujado no trae, salen de la base
 *
 * Asi el manto del visor puede usarla tal cual y los deslindes caen sobre el
 * terreno donde corresponde.
 *
 *   node scripts/importar-plano-panoramica.js "ruta/plano dibujado.jpg"
 *
 * Escribe public/lomas3d/pano-360.webp y pano-360-lite.webp. Guarda copia de
 * las anteriores con sufijo -previo por si hay que volver atras.
 */

const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const RAIZ = path.join(__dirname, '..')
const BASE = path.join(RAIZ, 'Agendamiento-dron/drone/pano-360.jpg')
const SALIDA = path.join(RAIZ, 'public/lomas3d/pano-360.webp')
const SALIDA_LITE = path.join(RAIZ, 'public/lomas3d/pano-360-lite.webp')

/** Ancho al que se reducen las dos imágenes para medir el desfase. */
const W = 1024

function ncc(u, v) {
    const n = u.length
    let mu = 0, mv = 0
    for (let i = 0; i < n; i++) { mu += u[i]; mv += v[i] }
    mu /= n; mv /= n
    let num = 0, du = 0, dv = 0
    for (let i = 0; i < n; i++) {
        const x = u[i] - mu, y = v[i] - mv
        num += x * y; du += x * x; dv += y * y
    }
    return du && dv ? num / Math.sqrt(du * dv) : -2
}

/**
 * Giro horizontal y desplazamiento vertical del plano dibujado respecto de la
 * base. Se compara solo el tercio superior: ahi hay cielo y horizonte, sin
 * lineas pintadas que ensucien la medicion.
 *
 * En una equirectangular, llevar las dos al mismo ancho ya iguala la escala
 * vertical: los grados por pixel son los mismos en los dos ejes. Por eso solo
 * hacen falta dos desplazamientos, no una escala.
 */
async function medirDesfase(archivo) {
    const a = await sharp(archivo).resize(W).greyscale().raw().toBuffer({ resolveWithObject: true })
    const b = await sharp(BASE).resize(W).greyscale().raw().toBuffer({ resolveWithObject: true })
    const HA = a.info.height, HB = b.info.height
    const filas = Math.floor(HA * 0.42)

    const puntuar = (dx, dy, pasoY, pasoX) => {
        const u = [], v = []
        for (let y = 10; y < filas; y += pasoY) {
            const yb = y + dy
            if (yb < 0 || yb >= HB) continue
            for (let x = 0; x < W; x += pasoX) {
                u.push(a.data[y * W + x])
                v.push(b.data[yb * W + (((x + dx) % W) + W) % W])
            }
        }
        return u.length < 400 ? -2 : ncc(u, v)
    }

    let mejor = { s: -2 }
    for (let dx = 0; dx < W; dx++) {
        for (let dy = -120; dy <= 200; dy += 2) {
            const s = puntuar(dx, dy, 3, 7)
            if (s > mejor.s) mejor = { s, dx, dy }
        }
    }
    for (let dx = mejor.dx - 3; dx <= mejor.dx + 3; dx++) {
        for (let dy = mejor.dy - 3; dy <= mejor.dy + 3; dy++) {
            const s = puntuar(dx, dy, 2, 4)
            if (s > mejor.s) mejor = { s, dx, dy }
        }
    }
    return { ...mejor, HA, HB }
}

async function main() {
    const origen = process.argv[2]
    if (!origen || !fs.existsSync(origen)) {
        console.error('Uso: node scripts/importar-plano-panoramica.js "ruta/plano dibujado.jpg"')
        process.exit(1)
    }

    const base = await sharp(BASE).metadata()
    const AN = base.width, AL = base.height
    console.log(`Panoramica base: ${AN}x${AL}`)

    const d = await medirDesfase(origen)
    console.log(`Correlacion con la base: ${d.s.toFixed(3)}`)
    if (d.s < 0.7) {
        console.error('\nCorrelacion demasiado baja: puede que no sea la misma panoramica.')
        console.error('No se escribe nada para no romper el mapa.')
        process.exit(1)
    }

    // Los desplazamientos se midieron a 1024 de ancho: se escalan al tamaño real.
    const k = AN / W
    const giro = Math.round(d.dx * k)
    const arriba = Math.round(d.dy * (AL / d.HB))
    console.log(`Giro: ${(d.dx / W * 360).toFixed(2)} grados (${giro} px)`)
    console.log(`Recorte superior del dibujado: ${(d.dy * 180 / d.HB).toFixed(1)} grados (${arriba} px)`)

    // El dibujado, llevado al ancho de la base.
    const dibujado = await sharp(origen).resize({ width: AN }).toBuffer()
    const md = await sharp(dibujado).metadata()
    console.log(`Plano dibujado reescalado: ${md.width}x${md.height}`)

    /* Se apoya sobre la base: el cielo y el cenit, que el dibujado no trae,
       quedan con los de la panoramica original. */
    const compuesta = await sharp(BASE)
        .composite([{ input: dibujado, top: arriba, left: 0 }])
        .raw()
        .toBuffer({ resolveWithObject: true })

    // Giro horizontal: la equirectangular es continua, se puede rotar sin costura.
    const { data, info } = compuesta
    const c = info.channels
    const girada = Buffer.alloc(data.length)
    for (let y = 0; y < AL; y++) {
        for (let x = 0; x < AN; x++) {
            const xo = (((x - giro) % AN) + AN) % AN
            data.copy(girada, (y * AN + x) * c, (y * AN + xo) * c, (y * AN + xo) * c + c)
        }
    }

    for (const [salida, ancho, calidad] of [[SALIDA, AN, 82], [SALIDA_LITE, 2048, 70]]) {
        if (fs.existsSync(salida)) fs.copyFileSync(salida, salida.replace('.webp', '-previo.webp'))
        await sharp(girada, { raw: { width: AN, height: AL, channels: c } })
            .resize({ width: ancho })
            .webp({ quality: calidad })
            .toFile(salida)
        console.log(`Escrito ${path.basename(salida)} — ${(fs.statSync(salida).size / 1048576).toFixed(2)} MB`)
    }

    console.log('\nCopias de seguridad con sufijo -previo por si hay que volver atras.')
}

main().catch(e => { console.error(e); process.exit(1) })
