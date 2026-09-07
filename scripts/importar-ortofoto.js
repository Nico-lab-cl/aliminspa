/*
 * Cambia la ortofoto que sirve de base al mapa 3D de /agendar-visita.
 *
 * La que hay hoy (Agendamiento-dron/drone/ortofoto.png) trae el plano de venta
 * pintado encima: lotes verdes y rojos, calles café y rótulos ETAPA 1-4. Este
 * script deja enchufar la foto limpia del vuelo sin tocar código.
 *
 * Qué hace, además de convertir a WebP:
 *   - Vuelve transparente el marco negro que el vuelo deja alrededor de la
 *     huella irregular de la foto, para que por debajo asome la satelital en
 *     vez de un rectángulo negro.
 *   - Agrega 2 px transparentes de borde: la textura se muestrea con
 *     ClampToEdge y, sin ese margen, el píxel del borde se estira y mancha
 *     el terreno.
 *   - Escribe public/lomas3d/georef.json, que es lo que el visor usa para
 *     calzar la foto con los lotes (UTM 19S).
 *
 * ---------------------------------------------------------------------------
 * USO
 *
 * 1) La foto limpia cubre EXACTAMENTE lo mismo que la actual (el caso normal:
 *    exportar el mismo encuadre con la capa del plano apagada). Sirve aunque
 *    tenga otra resolución:
 *
 *      node scripts/importar-ortofoto.js ruta/ortofoto-limpia.png --igual-encuadre
 *
 * 2) La foto viene con world file (.pgw / .jgw / .tfw / .wld) en UTM 19S:
 *
 *      node scripts/importar-ortofoto.js ruta/orto.png --world ruta/orto.pgw
 *
 * 3) Sabes los límites UTM 19S de la imagen (esquinas, en metros):
 *
 *      node scripts/importar-ortofoto.js ruta/orto.png --utm 256880,6294300,257520,6294810
 *      (orden: Este mínimo, Norte mínimo, Este máximo, Norte máximo)
 *
 * Después de importar, revisa el calce con:
 *
 *      node scripts/revisar-calce.js
 * ---------------------------------------------------------------------------
 */

const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const RAIZ = path.join(__dirname, '..')
const SALIDA_IMG = path.join(RAIZ, 'public/lomas3d/ortofoto.webp')
const SALIDA_GEO = path.join(RAIZ, 'public/lomas3d/georef.json')
const GEO_ACTUAL = path.join(RAIZ, 'Agendamiento-dron/georef.json')

/** Margen transparente que se agrega a cada lado. */
const BORDE = 2
/** Un píxel más oscuro que esto en los tres canales se considera marco del vuelo. */
const UMBRAL_NEGRO = 28

function salir(msg) {
    console.error('\n' + msg + '\n')
    console.error('Corre el script sin argumentos para ver los tres modos de uso.')
    process.exit(1)
}

/**
 * Georreferencia en el formato que espera el visor.
 *
 * El modelo es: px = x0 + (E - e0) * sx  y  py = y0 - (N - n0) * sy,
 * con E y N en UTM 19S y px/py en píxeles de la imagen.
 */
function desdeWorldFile(ruta) {
    const n = fs.readFileSync(ruta, 'utf8').trim().split(/\s+/).map(Number)
    if (n.length < 6 || n.some(v => !Number.isFinite(v))) {
        salir(`El world file ${ruta} no tiene los 6 números que corresponden.`)
    }
    const [A, D, B, E, C, F] = n
    if (D !== 0 || B !== 0) {
        salir('Ese world file trae rotación, y el visor solo maneja imágenes alineadas al norte.\nExporta la ortofoto sin rotar, o pásame los límites con --utm.')
    }
    // C y F son el centro del píxel superior izquierdo: por eso el medio píxel.
    return { e0: C, x0: 0.5, sx: 1 / A, n0: F, y0: 0.5, sy: 1 / Math.abs(E) }
}

function desdeLimitesUtm(txt, w, h) {
    const v = txt.split(',').map(Number)
    if (v.length !== 4 || v.some(x => !Number.isFinite(x))) {
        salir('--utm espera cuatro números: EsteMin,NorteMin,EsteMax,NorteMax')
    }
    const [e0, n0, e1, n1] = v
    if (e1 <= e0 || n1 <= n0) salir('--utm: el máximo tiene que ser mayor que el mínimo.')
    return { e0, x0: 0, sx: w / (e1 - e0), n0: n1, y0: 0, sy: h / (n1 - n0) }
}

function desdeEncuadreActual(w, h) {
    if (!fs.existsSync(GEO_ACTUAL)) salir(`No encuentro ${GEO_ACTUAL} para copiar el encuadre.`)
    const g = JSON.parse(fs.readFileSync(GEO_ACTUAL, 'utf8'))
    // Mismo terreno, otra resolución: la grilla se escala en proporción.
    const kx = w / g.w
    const ky = h / g.h
    return {
        e0: g.utm.e0, x0: g.utm.x0 * kx, sx: g.utm.sx * kx,
        n0: g.utm.n0, y0: g.utm.y0 * ky, sy: g.utm.sy * ky,
    }
}

async function main() {
    const [origen, modo, valor] = process.argv.slice(2)
    if (!origen) salir('Falta la ruta de la ortofoto.')
    if (!fs.existsSync(origen)) salir(`No existe el archivo ${origen}`)

    const meta = await sharp(origen).metadata()
    const w = meta.width
    const h = meta.height
    console.log(`Ortofoto de origen: ${origen} — ${w}x${h}`)

    let utm
    if (modo === '--igual-encuadre') utm = desdeEncuadreActual(w, h)
    else if (modo === '--world') {
        if (!valor) salir('--world necesita la ruta del world file.')
        utm = desdeWorldFile(valor)
    } else if (modo === '--utm') {
        if (!valor) salir('--utm necesita los cuatro límites.')
        utm = desdeLimitesUtm(valor, w, h)
    } else {
        salir('Falta decir cómo está georreferenciada: --igual-encuadre, --world <archivo> o --utm <e0,n0,e1,n1>')
    }

    // Marco negro del vuelo -> transparente.
    const { data, info } = await sharp(origen).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    let transparentes = 0
    for (let i = 0; i < data.length; i += info.channels) {
        if (data[i] < UMBRAL_NEGRO && data[i + 1] < UMBRAL_NEGRO && data[i + 2] < UMBRAL_NEGRO) {
            data[i + 3] = 0
            transparentes++
        }
    }

    await sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
        .extend({ top: BORDE, bottom: BORDE, left: BORDE, right: BORDE, background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp({ quality: 88, alphaQuality: 100 })
        .toFile(SALIDA_IMG)

    // El borde corre el origen de la grilla en la misma cantidad de píxeles.
    const georef = {
        img: '/lomas3d/ortofoto.webp',
        w: w + BORDE * 2,
        h: h + BORDE * 2,
        utm: { ...utm, x0: utm.x0 + BORDE, y0: utm.y0 + BORDE },
        origin: JSON.parse(fs.readFileSync(GEO_ACTUAL, 'utf8')).origin,
    }
    fs.writeFileSync(SALIDA_GEO, JSON.stringify(georef))

    const mb = (fs.statSync(SALIDA_IMG).size / 1048576).toFixed(2)
    console.log(`Escrito ${SALIDA_IMG} — ${georef.w}x${georef.h}, ${mb} MB`)
    console.log(`Marco negro vuelto transparente: ${(transparentes / (w * h) * 100).toFixed(1)} %`)
    console.log(`Escrito ${SALIDA_GEO}`)
    console.log('\nRevisa el calce con:  node scripts/revisar-calce.js')
}

main().catch(e => salir(e.stack || e.message))
