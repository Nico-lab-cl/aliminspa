/*
 * Arma el mapa de Arena y Sol a partir del plano ilustrado de ventas.
 *
 * Reemplaza al plano que salía del tour de Panoee (importar-plano-arenaysol.js):
 * aquel era una foto rectificada con números provisionales; este es el plano
 * que usa el equipo comercial, con los lotes dibujados en blanco, un símbolo
 * sobre cada lote vendido y el número de escritura (P61, P9...) escrito en los
 * que siguen disponibles. Si se vuelve a correr el script viejo, pisa esto.
 *
 *   node scripts/importar-plano-arenaysol-ilustrado.js [plano.jpg]
 *
 * Sin argumento usa scripts/fuentes/arenaysol-plano-ventas.jpg. Cuando cambie
 * lo vendido, se reemplaza ese archivo por el plano nuevo, se corrige la tabla
 * LOTES y se vuelve a correr.
 *
 * Escribe en public/arenaysol3d/:
 *   plano.webp / plano-lite.webp                     escritorio (alta y liviana)
 *   plano-vertical.webp / plano-vertical-lite.webp   el mismo girado, para teléfono en vertical
 *   plano-mapa.png / plano-mapa-vertical.png         mapa de identificadores (id = R + G*256)
 *   plano-lotes.json / plano-lotes-vertical.json     centro, caja y estado de cada lote
 *
 * Cómo salen los lotes. Las líneas del plano son blancas semitransparentes: sobre
 * la tierra se ven crema, no blancas. Se toma como línea todo píxel bastante más
 * claro que su entorno (contra una versión desenfocada), se engrosa un píxel
 * para cerrar cortes, y cada región encerrada es una celda. Qué celda es qué lote
 * lo dice la tabla LOTES: un punto dentro de cada uno, puesto mirando el plano.
 * Dos celdas quedan pegadas porque la línea que las separa casi no se ve; para
 * esas se ponen dos puntos y la región se parte entre ellos.
 *
 * Al final las líneas, símbolos y letras (que no son de ninguna celda) se
 * reparten a la celda más cercana, para que el lote se pinte y se pueda tocar
 * entero y no como un anillo alrededor del símbolo.
 *
 * Un lote vendido no lleva número: el plano no lo trae. Se guarda con
 * tipo 'vendido' y n en null, que el visor pinta de rojo sin dejarlo elegir.
 */

const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const RAIZ = path.join(__dirname, '..')
const SALIDA = path.join(RAIZ, 'public/arenaysol3d')

/** Umbral de línea: cuánto más claro que su entorno tiene que ser un píxel. */
const UMBRAL = 8, SIGMA = 4
/** Hasta dónde se reparten líneas y símbolos a la celda vecina, en píxeles. */
const ALCANCE = 26
/** Ancho de la versión liviana. La alta va al tamaño del original. */
const ANCHO_LITE = 1200

/*
 * Un punto por lote, en píxeles del plano de 1600x900.
 * p: número de escritura (disponible). Sin p: vendido. tipo: otro uso del suelo.
 */
const LOTES = [
    // franja de arriba, sobre Calle 1
    { x: 234, y: 188, tipo: 'sanitario' },
    { x: 283, y: 192 }, { x: 338, y: 199 },
    { x: 396, y: 208, p: 64 }, { x: 468, y: 217, p: 65 },
    // bloque arriba a la izquierda (la primera columna viene en una sola celda)
    { x: 195, y: 397 },
    { x: 261, y: 355 }, { x: 322, y: 353 }, { x: 385, y: 350 }, { x: 446, y: 348 }, { x: 507, y: 347 }, { x: 591, y: 356 },
    { x: 256, y: 422 }, { x: 321, y: 420 }, { x: 384, y: 418 }, { x: 446, y: 416 }, { x: 508, y: 414 },
    { x: 569, y: 413 }, { x: 630, y: 411 }, { x: 692, y: 403 }, { x: 752, y: 411 },
    // bloque arriba a la derecha
    { x: 905, y: 362 }, { x: 906, y: 425 }, { x: 1023, y: 416 }, { x: 1162, y: 448 }, { x: 1313, y: 488 }, { x: 1450, y: 526 },
    // bloque abajo a la izquierda, fila de arriba
    { x: 157, y: 567, p: 61 }, { x: 228, y: 561 }, { x: 294, y: 558 }, { x: 360, y: 555 },
    { x: 427, y: 556, parte: 'P6' },
    { x: 492, y: 549 }, { x: 557, y: 546 }, { x: 622, y: 545 }, { x: 690, y: 544, p: 18 }, { x: 756, y: 542 },
    // fila de abajo
    { x: 146, y: 626 }, { x: 222, y: 621, p: 9 }, { x: 291, y: 616, p: 8 }, { x: 358, y: 612, p: 7 },
    { x: 426, y: 612, p: 6, parte: 'P6' },
    { x: 491, y: 606, p: 5 }, { x: 557, y: 604, p: 4 }, { x: 645, y: 601 }, { x: 743, y: 602 },
    // bloque abajo a la derecha, fila de arriba (las filas bajan hacia la derecha)
    { x: 884, y: 546 }, { x: 943, y: 557 }, { x: 1010, y: 564 }, { x: 1071, y: 572 }, { x: 1132, y: 582 },
    { x: 1194, y: 595 }, { x: 1258, y: 608 }, { x: 1320, y: 622 }, { x: 1384, y: 639, p: 49 },
    { x: 1459, y: 659, parte: 'P47' },
    // fila de abajo
    { x: 934, y: 620 }, { x: 1003, y: 628 }, { x: 1063, y: 636 }, { x: 1125, y: 646 },
    { x: 1187, y: 659, p: 43 }, { x: 1250, y: 672, p: 44 }, { x: 1313, y: 685, p: 45 }, { x: 1379, y: 699, p: 46 },
    { x: 1451, y: 709, p: 47, parte: 'P47' },
]

async function main() {
    const origen = process.argv[2] || path.join(__dirname, 'fuentes/arenaysol-plano-ventas.jpg')

    const img = sharp(origen).removeAlpha()
    const { data: gris, info } = await img.clone().greyscale().raw().toBuffer({ resolveWithObject: true })
    const borroso = await img.clone().greyscale().blur(SIGMA).raw().toBuffer()
    const W = info.width, H = info.height, N = W * H

    /* ── líneas ── */
    const linea0 = new Uint8Array(N)
    for (let i = 0; i < N; i++) linea0[i] = gris[i] - borroso[i] > UMBRAL ? 1 : 0
    const linea = new Uint8Array(N)
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
        const i = y * W + x
        if (linea0[i] || linea0[i - 1] || linea0[i + 1] || linea0[i - W] || linea0[i + W]) linea[i] = 1
    }

    /* ── regiones encerradas ── */
    const region = new Int32Array(N).fill(-1)
    const tam = []
    const cola = new Int32Array(N)
    for (let s = 0; s < N; s++) {
        if (linea[s] || region[s] >= 0) continue
        const r = tam.length
        let h = 0, t = 0
        cola[t++] = s; region[s] = r
        while (h < t) {
            const i = cola[h++], x = i % W
            const vec = [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W]
            for (const j of vec) if (j >= 0 && j < N && !linea[j] && region[j] < 0) { region[j] = r; cola[t++] = j }
        }
        tam.push(t)
    }

    /* ── cada punto de la tabla toma su región ── */
    const regionDe = ({ x, y }) => {
        // El punto puede caer sobre un símbolo: se busca la región grande más cercana.
        for (let rad = 0; rad < 20; rad++) {
            for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
                const i = (y + dy) * W + (x + dx)
                if (region[i] >= 0 && tam[region[i]] > 1500) return region[i]
            }
        }
        throw new Error(`El punto ${x},${y} no cae en ninguna celda`)
    }
    const lote = new Int32Array(N).fill(0) // id de lote (1..), 0 = nada
    const porRegion = new Map()
    LOTES.forEach((l, k) => {
        const r = regionDe(l)
        if (!porRegion.has(r)) porRegion.set(r, [])
        porRegion.get(r).push(k)
    })
    for (let i = 0; i < N; i++) {
        const ks = porRegion.get(region[i])
        if (!ks) continue
        if (ks.length === 1) { lote[i] = ks[0] + 1; continue }
        // Región con dos lotes pegados: cada píxel al punto más cercano.
        const x = i % W, y = (i / W) | 0
        let mejor = ks[0], dMin = Infinity
        for (const k of ks) {
            const d = (LOTES[k].x - x) ** 2 + (LOTES[k].y - y) ** 2
            if (d < dMin) { dMin = d; mejor = k }
        }
        lote[i] = mejor + 1
    }
    for (const [r, ks] of porRegion) {
        if (ks.length > 2) throw new Error(`Región ${r} con ${ks.length} puntos: revisar la tabla`)
        if (ks.length === 2 && !(LOTES[ks[0]].parte && LOTES[ks[0]].parte === LOTES[ks[1]].parte))
            throw new Error(`Los puntos ${ks.map(k => LOTES[k].x + ',' + LOTES[k].y).join(' y ')} caen en la misma celda sin estar marcados como pareja`)
    }

    /* ── líneas, símbolos y restos chicos van a la celda vecina ── */
    const libre = i => lote[i] === 0 && (linea[i] || tam[region[i]] < 600)
    let frente = []
    for (let i = 0; i < N; i++) if (lote[i]) {
        const x = i % W
        if ((x > 0 && libre(i - 1)) || (x < W - 1 && libre(i + 1)) || (i >= W && libre(i - W)) || (i < N - W && libre(i + W))) frente.push(i)
    }
    for (let paso = 0; paso < ALCANCE && frente.length; paso++) {
        const sig = []
        for (const i of frente) {
            const x = i % W
            for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W]) {
                if (j >= 0 && j < N && libre(j)) { lote[j] = lote[i]; sig.push(j) }
            }
        }
        frente = sig
    }

    /* ── imágenes ── */
    fs.mkdirSync(SALIDA, { recursive: true })
    const base = sharp(origen).removeAlpha()
    const altoLite = Math.round(ANCHO_LITE * H / W)
    await base.clone().webp({ quality: 90 }).toFile(path.join(SALIDA, 'plano.webp'))
    await base.clone().rotate(90).webp({ quality: 90 }).toFile(path.join(SALIDA, 'plano-vertical.webp'))
    await base.clone().resize(ANCHO_LITE, altoLite).webp({ quality: 80 }).toFile(path.join(SALIDA, 'plano-lite.webp'))
    // sharp gira antes de redimensionar sin importar el orden de las llamadas:
    // las medidas van ya invertidas.
    await base.clone().rotate(90).resize(altoLite, ANCHO_LITE).webp({ quality: 80 }).toFile(path.join(SALIDA, 'plano-vertical-lite.webp'))

    const mapa = Buffer.alloc(N * 3)
    const cuenta = {}, sx = {}, sy = {}, caja = {}
    for (let i = 0; i < N; i++) {
        const id = lote[i]
        if (!id) continue
        mapa[i * 3] = id & 255
        mapa[i * 3 + 1] = (id >> 8) & 255
        const x = i % W, y = (i / W) | 0
        cuenta[id] = (cuenta[id] || 0) + 1
        sx[id] = (sx[id] || 0) + x; sy[id] = (sy[id] || 0) + y
        const c = caja[id] ||= [x, y, x, y]
        if (x < c[0]) c[0] = x; if (y < c[1]) c[1] = y; if (x > c[2]) c[2] = x; if (y > c[3]) c[3] = y
    }
    const crudo = { raw: { width: W, height: H, channels: 3 } }
    // Un cuarto de vuelta no interpola: los identificadores salen intactos.
    await sharp(mapa, crudo).png({ compressionLevel: 9 }).toFile(path.join(SALIDA, 'plano-mapa.png'))
    await sharp(mapa, crudo).rotate(90).png({ compressionLevel: 9 }).toFile(path.join(SALIDA, 'plano-mapa-vertical.png'))

    /* ── datos ── */
    const f = v => +v.toFixed(5)
    const datos = {
        _comentario: 'Lotes sacados del plano ilustrado de ventas (scripts/importar-plano-arenaysol-ilustrado.js). u y v en fraccion de imagen, origen arriba a la izquierda.',
        _numeracion: 'n es el numero de escritura (P61 -> 61) de los lotes disponibles, tal como viene rotulado en el plano. Los vendidos no traen numero: van con tipo "vendido" y n null.',
        fuente: path.basename(origen),
        ancho: W,
        alto: H,
        lotes: LOTES.map((l, k) => {
            const id = k + 1
            const c = caja[id]
            return {
                id,
                n: l.p ?? null,
                stage: null,
                sold: !l.p,
                area: null,
                tipo: l.tipo ?? (l.p ? 'lote' : 'vendido'),
                u: f(sx[id] / cuenta[id] / W),
                v: f(sy[id] / cuenta[id] / H),
                caja: [f(c[0] / W), f(c[1] / H), f((c[2] + 1) / W), f((c[3] + 1) / H)],
                px: cuenta[id],
                cx: 0, cy: 0,
            }
        }),
    }
    fs.writeFileSync(path.join(SALIDA, 'plano-lotes.json'), JSON.stringify(datos, null, 1) + '\n')

    // Girar un cuarto de vuelta a la derecha lleva (u, v) a (1 - v, u).
    const girado = {
        ...datos,
        _orientacion: 'Para plano-vertical.webp y plano-mapa-vertical.png: la misma imagen girada un cuarto de vuelta a la derecha.',
        ancho: H,
        alto: W,
        lotes: datos.lotes.map(l => ({
            ...l,
            u: f(1 - l.v),
            v: l.u,
            caja: [f(1 - l.caja[3]), l.caja[0], f(1 - l.caja[1]), l.caja[2]],
        })),
    }
    fs.writeFileSync(path.join(SALIDA, 'plano-lotes-vertical.json'), JSON.stringify(girado, null, 1) + '\n')

    const disp = datos.lotes.filter(l => l.n != null)
    console.log(`${W}x${H} · ${datos.lotes.length} celdas · ${disp.length} disponibles: ${disp.map(l => 'P' + l.n).join(' ')}`)
    const chicos = datos.lotes.filter(l => l.px < 1500)
    if (chicos.length) console.warn('OJO, celdas muy chicas:', chicos.map(l => l.id).join(', '))
}

main().catch(e => { console.error(e.message || e); process.exit(1) })
