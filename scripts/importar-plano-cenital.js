/*
 * Prepara el plano cenital para el mapa: la imagen que se publica y los lotes
 * sacados de las lineas que ya vienen dibujadas encima.
 *
 * Esta foto es cenital —mirando recto hacia abajo— y eso cambia todo respecto
 * de la panoramica anterior. Una foto plana no tiene punto debajo de la
 * camara, asi que no hay cono ciego ni disco en el centro. Tampoco hay nada
 * que proyectar, asi que no hace falta saber donde estaba el dron. Y la
 * orientacion es la que es: las casas quedan donde estan.
 *
 *   node scripts/importar-plano-cenital.js "ruta/plano.png"
 *
 * Escribe:
 *   public/lomas3d/plano.webp        la imagen que se publica
 *   public/lomas3d/plano-lite.webp   la version liviana para celular
 *   public/lomas3d/plano-mapa.png    mapa de identificadores, uno por lote
 *   public/lomas3d/plano-lotes.json  centro y tamano de cada lote
 *   (con --debug tambien celdas-plano.png para mirarlo)
 *
 * El mapa de identificadores lleva el numero de lote en los canales rojo y
 * verde (id = R + G*256). El visor lo lee para dos cosas: saber que lote hay
 * bajo el cursor, y pintar solo ese lote sin geometria de por medio.
 */

const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const RAIZ = path.join(__dirname, '..')
const SALIDA = path.join(RAIZ, 'public/lomas3d/plano.webp')
const SALIDA_LITE = path.join(RAIZ, 'public/lomas3d/plano-lite.webp')
const MAPA = path.join(RAIZ, 'public/lomas3d/plano-mapa.png')
const DATOS = path.join(RAIZ, 'public/lomas3d/plano-lotes.json')

/** Ancho de la imagen publicada, y de la version liviana. */
const ANCHO = 6000, ANCHO_LITE = 2600

/** Ancho al que se detectan los lotes y se publica el mapa de identificadores. */
const DETECTE = 4096

/* El trazo es blanco y sin color. */
const LUZ = 200, GRIS = 34

/* Superficie de un lote, en pixeles del ancho de deteccion. Sale del propio
   dibujo: la mediana ronda los 2000, con los lotes grandes al doble. */
const MIN = 500, MAX = 30000

async function main() {
    const origen = process.argv[2] || path.join(RAIZ, 'Panoramica de Lomasturbas.png')
    const debug = process.argv.includes('--debug')
    if (!fs.existsSync(origen)) {
        console.error(`No esta ${origen}`)
        process.exit(1)
    }

    const meta = await sharp(origen, { limitInputPixels: false }).metadata()
    console.log(`Origen: ${meta.width}x${meta.height} (${meta.format})`)

    // ── imagen publicada ────────────────────────────────────────────────────
    for (const [salida, ancho, calidad] of [[SALIDA, ANCHO, 82], [SALIDA_LITE, ANCHO_LITE, 74]]) {
        await sharp(origen, { limitInputPixels: false })
            .resize({ width: ancho }).webp({ quality: calidad }).toFile(salida)
        console.log(`Escrito ${path.basename(salida)} — ${(fs.statSync(salida).size / 1048576).toFixed(2)} MB`)
    }

    // ── lotes ───────────────────────────────────────────────────────────────
    const r = await sharp(origen, { limitInputPixels: false })
        .resize(DETECTE).raw().toBuffer({ resolveWithObject: true })
    const W = r.info.width, H = r.info.height, C = r.info.channels, d = r.data

    const trazo = new Uint8Array(W * H)
    let np = 0
    for (let i = 0; i < W * H; i++) {
        const R = d[i * C], G = d[i * C + 1], B = d[i * C + 2]
        const mn = Math.min(R, G, B), mx = Math.max(R, G, B)
        if (mn > LUZ && mx - mn < GRIS) { trazo[i] = 1; np++ }
    }
    console.log(`Deteccion a ${W}x${H} — trazo ${(np / (W * H) * 100).toFixed(2)} %`)
    if (np < W * H * 0.002) {
        console.error('Casi no hay trazo blanco. ¿Es el plano con los lotes dibujados?')
        process.exit(1)
    }

    /* Los recintos son lo que el trazo deja encerrado. No se dilata: las lineas
       de este plano son gruesas y continuas, y dilatarlas se come los lotes
       chicos. */
    const etiqueta = new Int32Array(W * H).fill(-1)
    const pila = new Int32Array(W * H)
    const celdas = []
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const p0 = y * W + x
            if (trazo[p0] || etiqueta[p0] >= 0) continue
            const id = celdas.length
            let sp = 0, n = 0, su = 0, sv = 0
            let x0 = x, x1 = x, y0 = y, y1 = y
            pila[sp++] = p0
            etiqueta[p0] = id
            while (sp) {
                const p = pila[--sp]
                const py = (p / W) | 0, px = p % W
                n++; su += px; sv += py
                if (px < x0) x0 = px
                if (px > x1) x1 = px
                if (py < y0) y0 = py
                if (py > y1) y1 = py
                for (const [a, b] of [[px, py - 1], [px, py + 1], [px + 1, py], [px - 1, py]]) {
                    if (a < 0 || a >= W || b < 0 || b >= H) continue
                    const q = b * W + a
                    if (trazo[q] || etiqueta[q] >= 0) continue
                    etiqueta[q] = id
                    pila[sp++] = q
                }
            }
            celdas.push({ id, n, cu: su / n, cv: sv / n, caja: [x0, y0, x1, y1] })
        }
    }
    console.log(`Recintos: ${celdas.length}`)

    /* Se descartan el fondo, el ruido y las tiras largas, que son los caminos.
       Un lote llena su caja; un camino curvo no. */
    const lotes = celdas.filter(c => {
        if (c.n < MIN || c.n > MAX) return false
        const an = c.caja[2] - c.caja[0] + 1, al = c.caja[3] - c.caja[1] + 1
        if (an > W * 0.12 || al > H * 0.25) return false
        if (c.n / (an * al) < 0.45) return false
        return Math.max(an, al) / Math.max(1, Math.min(an, al)) < 6
    })
    console.log(`Lotes: ${lotes.length}`)
    const ts = lotes.map(c => c.n).sort((a, b) => a - b)
    const q = f => ts[Math.min(ts.length - 1, Math.floor(ts.length * f))]
    console.log(`  superficie: min ${ts[0]}  p25 ${q(.25)}  mediana ${q(.5)}  p75 ${q(.75)}  max ${ts[ts.length - 1]} px`)

    /* Hileras: el loteo son filas de lotes y adentro de cada una el numero
       corre seguido. Sirve para repartir la numeracion despues sin ir uno por
       uno. En una foto cenital las hileras son rectas, asi que agrupar por la
       coordenada vertical del centro funciona. */
    const porV = [...lotes].sort((a, b) => a.cv - b.cv)
    const corte = H * 0.012
    let fila = 0
    porV[0].fila = 0
    for (let i = 1; i < porV.length; i++) {
        if (porV[i].cv - porV[i - 1].cv > corte) fila++
        porV[i].fila = fila
    }
    console.log(`Hileras: ${fila + 1}`)
    lotes.sort((a, b) => a.fila - b.fila || a.cu - b.cu)

    // ── mapa de identificadores ─────────────────────────────────────────────
    /* Las celdas se engordan hasta tocarse: si no, entre lote y lote queda una
       franja muerta del grosor del trazo donde el cursor no acierta nada. */
    const dest = new Int32Array(W * H)
    lotes.forEach((c, k) => { c.num = k + 1 })     // 0 queda para "aqui no hay lote"
    const deId = new Map(lotes.map(c => [c.id, c.num]))
    for (let p = 0; p < W * H; p++) {
        const e = etiqueta[p]
        if (e >= 0 && deId.has(e)) dest[p] = deId.get(e)
    }
    for (let paso = 0; paso < 4; paso++) {
        const copia = Int32Array.from(dest)
        for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
                const p = y * W + x
                if (copia[p] || !trazo[p]) continue     // solo se invade el trazo
                for (const [a, b] of [[x, y - 1], [x, y + 1], [x + 1, y], [x - 1, y]]) {
                    if (a < 0 || a >= W || b < 0 || b >= H) continue
                    const v = copia[b * W + a]
                    if (v) { dest[p] = v; break }
                }
            }
        }
    }

    const png = Buffer.alloc(W * H * 3)
    for (let p = 0; p < W * H; p++) {
        png[p * 3] = dest[p] & 255
        png[p * 3 + 1] = (dest[p] >> 8) & 255
    }
    await sharp(png, { raw: { width: W, height: H, channels: 3 } })
        .png({ compressionLevel: 9 }).toFile(MAPA)
    console.log(`Escrito ${path.basename(MAPA)} — ${(fs.statSync(MAPA).size / 1024).toFixed(0)} KB`)

    /* Centro y caja recalculados sobre la celda engordada, que es la que se
       toca. Van en fraccion de la imagen para que el visor no dependa de a que
       resolucion se publico. */
    const acum = new Map()
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const v = dest[y * W + x]
            if (!v) continue
            const s = acum.get(v) || (acum.set(v, { n: 0, u: 0, v: 0, x0: W, x1: 0, y0: H, y1: 0 }), acum.get(v))
            s.n++; s.u += x; s.v += y
            if (x < s.x0) s.x0 = x
            if (x > s.x1) s.x1 = x
            if (y < s.y0) s.y0 = y
            if (y > s.y1) s.y1 = y
        }
    }

    const salida = {
        _comentario: 'Lotes sacados del plano dibujado sobre la foto cenital, por scripts/importar-plano-cenital.js. u y v van en fraccion de la imagen, con el origen arriba a la izquierda. La numeracion es una propuesta sin verificar.',
        provisional: true,
        ancho: W, alto: H,
        lotes: lotes.map((c, k) => {
            const s = acum.get(c.num)
            return {
                id: c.num,
                fila: c.fila,
                u: +(s.u / s.n / W).toFixed(5),
                v: +(s.v / s.n / H).toFixed(5),
                caja: [+(s.x0 / W).toFixed(5), +(s.y0 / H).toFixed(5),
                       +(s.x1 / W).toFixed(5), +(s.y1 / H).toFixed(5)],
                px: s.n,
                n: null, stage: null, sold: false, area: null
            }
        })
    }
    fs.writeFileSync(DATOS, JSON.stringify(salida, null, 1))
    console.log(`Escrito ${path.basename(DATOS)} — ${salida.lotes.length} lotes`)

    if (debug) {
        const vis = Buffer.alloc(W * H * 3)
        for (let p = 0; p < W * H; p++) {
            const v = dest[p], o = p * 3
            if (!v) { vis[o] = vis[o + 1] = vis[o + 2] = 16; continue }
            vis[o] = (v * 97) % 200 + 55
            vis[o + 1] = (v * 53) % 200 + 55
            vis[o + 2] = (v * 29) % 200 + 55
        }
        const f = path.join(RAIZ, 'celdas-plano.png')
        await sharp(vis, { raw: { width: W, height: H, channels: 3 } })
            .resize({ width: 1600 }).png().toFile(f)
        console.log(`Escrito ${f}`)
    }

    console.log('\nFalta repartir numero, etapa y estado sobre estos lotes.')
}

main().catch(e => { console.error('\n' + e.message); process.exit(1) })
