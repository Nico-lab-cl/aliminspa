/*
 * Arma la carpeta que se le entrega al diseñador para que dibuje la base del
 * mapa de lotes.
 *
 * La idea es que el diseñador NO tenga que adivinar dónde va cada lote: se le
 * entrega la ortofoto y, encima, los 116 polígonos ya posicionados con la misma
 * georreferenciación que usa el visor. Él dibuja sobre esa guía y lo que
 * devuelva calza solo con los lotes tocables de la web.
 *
 *   node scripts/paquete-disenador.js
 *
 * Deja todo en entrega-disenador/.
 */

const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const RAIZ = path.join(__dirname, '..')
const SALIDA = path.join(RAIZ, 'entrega-disenador')
const MAPA = path.join(RAIZ, 'public/lomas3d/mapa-data.json')
const GEO = path.join(RAIZ, 'public/lomas3d/georef.json')
/* Se usa la ortofoto que sirve la web, no el PNG original: es la que
   corresponde exactamente a georef.json (lleva 2 px de borde transparente),
   así que el SVG de deslindes calza píxel a píxel con ella. */
const ORTO = path.join(RAIZ, 'public/lomas3d/ortofoto.webp')

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
    fs.mkdirSync(SALIDA, { recursive: true })

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

    // ── SVG con los lotes, por etapas, para abrir en Illustrator o Figma
    const porEtapa = new Map()
    for (const l of data.lots) {
        if (!porEtapa.has(l.stage)) porEtapa.set(l.stage, [])
        porEtapa.get(l.stage).push(l)
    }

    let capas = ''
    for (const etapa of [...porEtapa.keys()].sort()) {
        let cuerpo = ''
        for (const l of porEtapa.get(etapa)) {
            const pts = l.p.map(([x, z]) => toPx(x, z).map(n => n.toFixed(1)).join(',')).join(' ')
            const [cx, cy] = toPx(l.cx, l.cy)
            cuerpo += `    <g id="lote_e${l.stage}_${String(l.n).padStart(2, '0')}">\n` +
                `      <polygon points="${pts}" fill="${l.sold ? '#ff6b6b' : '#76d845'}" fill-opacity="0.25" stroke="${l.sold ? '#c92a2a' : '#2f9e44'}" stroke-width="1.2"/>\n` +
                `      <text x="${cx.toFixed(1)}" y="${(cy + 4).toFixed(1)}" font-family="Montserrat, sans-serif" font-size="11" font-weight="700" fill="#0a1520" text-anchor="middle">${l.n}</text>\n` +
                `    </g>\n`
        }
        capas += `  <g id="Etapa_${etapa}" inkscape:groupmode="layer" inkscape:label="Etapa ${etapa}">\n${cuerpo}  </g>\n`
    }

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
     width="${G.w}" height="${G.h}" viewBox="0 0 ${G.w} ${G.h}">
  <title>Lomas del Mar — deslindes de los 116 lotes en venta</title>
  <desc>Posiciones exactas sobre ortofoto.png (${G.w}x${G.h} px). No mover ni escalar: cada lote esta georreferenciado en UTM 19S. Etapa 4 no aparece porque esta excluida de venta.</desc>
${capas}</svg>
`
    fs.writeFileSync(path.join(SALIDA, 'lotes-deslindes.svg'), svg)

    // ── la ortofoto tal cual, que es el lienzo
    await sharp(ORTO).png().toFile(path.join(SALIDA, 'ortofoto.png'))

    // ── una previsualización de los dos juntos
    // La previsualización la rasteriza sharp, que no conoce el espacio de
    // nombres de Inkscape: se quitan esos atributos, que ahí no aportan nada.
    const capasPlanas = capas.replace(/ inkscape:[a-z]+="[^"]*"/g, '')
    const previa = `<svg xmlns="http://www.w3.org/2000/svg" width="${G.w}" height="${G.h}">${capasPlanas}</svg>`
    await sharp(ORTO)
        .composite([{ input: Buffer.from(previa), top: 0, left: 0 }])
        .png()
        .toFile(path.join(SALIDA, 'previsualizacion.png'))

    const escala = (1 / U.sx).toFixed(4)
    fs.writeFileSync(path.join(SALIDA, 'LEEME.md'), `# Base del mapa de lotes — Lomas del Mar

## Qué hay acá

- **ortofoto.png** (${G.w} × ${G.h} px) — la foto del vuelo de dron. Es el lienzo.
- **lotes-deslindes.svg** — los ${data.lots.length} lotes en venta, ya posicionados sobre esa
  foto, separados en capas por etapa y con cada lote como grupo propio
  (\`lote_e2_17\` = Etapa 2, Lote 17).
- **previsualizacion.png** — las dos cosas superpuestas, para ver de qué se trata.

## Qué necesitamos de vuelta

Una imagen del **mismo tamaño exacto: ${G.w} × ${G.h} px**, en PNG o WebP, con la
base del loteo dibujada bonita: terreno, calles, deslindes, rótulos de etapa.

## Lo único que no se puede tocar

**Las posiciones del SVG.** Cada lote está georreferenciado en UTM 19S: 1 píxel =
${escala} m. Si se mueve, se escala o se recorta el lienzo, los lotes dejan de
coincidir con el mapa interactivo de la web.

Se puede redibujar, estilizar y cambiar colores libremente. Lo que no se puede es
desplazar la geometría.

## Qué NO hace falta pintar

El estado **disponible / vendido** no va en la imagen: lo pinta la web encima, en
vivo, porque cambia cada vez que se vende un lote. Si va pintado en la base, hay
que volver al diseñador con cada venta.

Los números de lote tampoco son necesarios: la web los dibuja como etiquetas.
Están en el SVG solo como referencia para ubicarse.

## Nota sobre la foto

La ortofoto que se entrega tiene el plano de venta antiguo pintado encima (verdes,
rojos, rótulos ETAPA 1-4). Si existe el original limpio del vuelo, mejor trabajar
sobre ese: se ve mucho mejor y evita que el plano viejo asome por debajo.
`)

    console.log(`Paquete listo en: ${SALIDA}`)
    console.log(`  ortofoto.png            ${G.w}x${G.h}`)
    console.log(`  lotes-deslindes.svg     ${data.lots.length} lotes en ${porEtapa.size} capas`)
    console.log(`  previsualizacion.png`)
    console.log(`  LEEME.md`)
}

main().catch(e => { console.error(e); process.exit(1) })
