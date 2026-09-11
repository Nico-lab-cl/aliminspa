/*
 * Dibuja el plano con el numero y la zona de cada lote, para revisarlo a ojo.
 *
 * La numeracion se dicta (scripts/asignar-hileras.js) y el resumen que ese
 * script imprime dice el orden, pero no donde cae cada cosa en el dibujo. Esto
 * lo muestra encima de la foto, que es la unica forma de ver si una hilera
 * quedo corrida o si sobro una celda.
 *
 *   node scripts/revisar-plano.js [franja] [salida.png]
 *
 * Sin franja dibuja el plano entero. Con una franja dibuja solo esa hilera,
 * que es como se revisa lo recien dictado.
 */

const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const RAIZ = path.join(__dirname, '..')
const DATOS = path.join(RAIZ, 'public/lomas3d/plano-lotes.json')
const FOTO = path.join(RAIZ, 'public/lomas3d/plano.webp')

/** Mismos colores que el visor, para que lo revisado sea lo que se publica. */
const COLOR = {
    lote: l => (l.sold ? '#e5484d' : '#76d845'),
    estacionamiento: () => '#f2c033',
    sanitario: () => '#3b82f6',
    areaverde: () => '#1f7a34',
    reservado: () => '#e5484d',
    descartado: () => '#6b7280'
}

/** Ancho de la imagen de revision: alcanza para leer los numeros. */
const ANCHO = 3200

async function main() {
    const franja = process.argv[2] != null && process.argv[2] !== ''
        ? Number(process.argv[2]) : null
    const salida = process.argv[3]
        || path.join(RAIZ, franja == null ? 'revision-plano.png' : `revision-franja-${franja}.png`)

    const d = JSON.parse(fs.readFileSync(DATOS, 'utf8'))
    const alto = Math.round(ANCHO * d.alto / d.ancho)
    const lotes = d.lotes.filter(l => franja == null || l.fila === franja)
    if (!lotes.length) {
        console.error(`No hay celdas en la franja ${franja}`)
        process.exit(1)
    }

    const piezas = lotes.map(l => {
        const tipo = l.tipo || 'lote'
        const c = (COLOR[tipo] || (() => '#8a8a8a'))(l)
        const [x0, y0, x1, y1] = [l.caja[0] * ANCHO, l.caja[1] * alto,
                                  l.caja[2] * ANCHO, l.caja[3] * alto]
        // Un lote sin numero sale con interrogacion: es justo lo que hay que ver.
        const texto = tipo === 'lote'
            ? (l.n == null ? '?' : `${l.stage ?? '?'}-${l.n}`)
            : tipo.slice(0, 3).toUpperCase()
        return `<rect x="${x0.toFixed(1)}" y="${y0.toFixed(1)}" width="${(x1 - x0).toFixed(1)}" height="${(y1 - y0).toFixed(1)}" fill="${c}" fill-opacity="0.35" stroke="${c}" stroke-width="1.5"/>`
            + `<text x="${(l.u * ANCHO).toFixed(1)}" y="${(l.v * alto).toFixed(1)}" font-family="sans-serif" font-size="15" font-weight="700" fill="#ffffff" stroke="#000000" stroke-width="3" paint-order="stroke" text-anchor="middle" dominant-baseline="middle">${texto}</text>`
    })

    await sharp(FOTO)
        .resize({ width: ANCHO })
        .composite([{
            input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${ANCHO}" height="${alto}">${piezas.join('')}</svg>`),
            top: 0, left: 0
        }])
        .png().toFile(salida)

    console.log(`Escrito ${salida} — ${lotes.length} celdas`)
}

main().catch(e => { console.error('\n' + e.message); process.exit(1) })
