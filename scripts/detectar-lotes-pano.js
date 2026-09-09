/*
 * Saca los lotes de las lineas que ya vienen dibujadas en la panoramica.
 *
 * El plano esta trazado sobre la foto con lineas blancas cerradas, asi que
 * cada lote es un recinto. Se marca el trazo, se cierra a golpe de dilatacion
 * y lo que queda encerrado son las celdas. No hace falta ponerlas a mano ni
 * saber donde estaba el dron: las celdas viven en coordenadas de la propia
 * panoramica.
 *
 *   node scripts/detectar-lotes-pano.js
 *
 * Escribe:
 *   public/lomas3d/lotes-mapa.png   mapa de identificadores, uno por celda
 *   public/lomas3d/lotes-pano.json  centro, tamano y fila de cada celda
 *   (con --debug tambien un celdas-debug.png para mirarlo)
 *
 * El mapa de identificadores lleva el numero de celda en los canales rojo y
 * verde (id = R + G*256). El visor lo lee para dos cosas: saber que lote hay
 * bajo el cursor, y pintar solo ese lote sin geometria de por medio.
 */

const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const RAIZ = path.join(__dirname, '..')
const PANO = path.join(RAIZ, 'public/lomas3d/pano-360.webp')
const MAPA = path.join(RAIZ, 'public/lomas3d/lotes-mapa.png')
const DATOS = path.join(RAIZ, 'public/lomas3d/lotes-pano.json')
const VIEJOS = path.join(RAIZ, 'public/lomas3d/lotes-editados.json')

/** Ancho al que se trabaja y se publica el mapa de identificadores. */
const ANCHO = 4096

/* El trazo es blanco y sin color. El umbral es generoso a proposito: mas vale
   marcar de mas y cerrar el recinto que dejar una fuga y fundir dos lotes. */
const LUZ = 205, GRIS = 30

/* Radio de la dilatacion que cierra los cortes del trazo (vegetacion encima,
   antialias). Cuesta un par de pixeles de borde por lote, que se recuperan
   despues al engordar las celdas. */
const CIERRE = 2

/* Una celda es candidata a lote si tiene entre esto y esto de superficie. El
   rango es ancho porque en una equirectangular un lote cercano ocupa mucho
   mas que uno lejano. */
const MIN = 380, MAX = 120000

async function main() {
    const debug = process.argv.includes('--debug')
    if (!fs.existsSync(PANO)) {
        console.error(`No esta ${PANO}. Corre antes importar-plano-panoramica.js`)
        process.exit(1)
    }

    const r = await sharp(PANO).resize(ANCHO).raw().toBuffer({ resolveWithObject: true })
    const W = r.info.width, H = r.info.height, C = r.info.channels, d = r.data
    // El plano esta bajo el horizonte, que en una equirectangular va al medio.
    const Y0 = Math.floor(H * 0.55)
    console.log(`Panoramica ${W}x${H}, se mira de la fila ${Y0} hacia abajo`)

    // ── el trazo ────────────────────────────────────────────────────────────
    const trazo = new Uint8Array(W * H)
    let np = 0
    for (let y = Y0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const i = (y * W + x) * C
            const mn = Math.min(d[i], d[i + 1], d[i + 2])
            const mx = Math.max(d[i], d[i + 1], d[i + 2])
            if (mn > LUZ && mx - mn < GRIS) { trazo[y * W + x] = 1; np++ }
        }
    }
    const utiles = W * (H - Y0)
    console.log(`Trazo: ${np} px, ${(np / utiles * 100).toFixed(1)} % de la zona util`)
    if (np < utiles * 0.005) {
        console.error('Casi no hay trazo blanco. ¿Es la panoramica con el plano dibujado?')
        process.exit(1)
    }

    const cerrado = new Uint8Array(W * H)
    for (let y = Y0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            if (!trazo[y * W + x]) continue
            for (let dy = -CIERRE; dy <= CIERRE; dy++) {
                const yy = y + dy
                if (yy < Y0 || yy >= H) continue
                for (let dx = -CIERRE; dx <= CIERRE; dx++) cerrado[yy * W + (x + dx + W) % W] = 1
            }
        }
    }

    // ── recintos ────────────────────────────────────────────────────────────
    /* La panoramica da la vuelta, asi que el vecino de la ultima columna es la
       primera: si no, un lote partido por la costura saldria como dos. */
    const etiqueta = new Int32Array(W * H).fill(-1)
    const pila = new Int32Array(W * H)
    const celdas = []
    for (let y = Y0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const p0 = y * W + x
            if (cerrado[p0] || etiqueta[p0] >= 0) continue
            const id = celdas.length
            let sp = 0, n = 0, su = 0, sv = 0
            let x0 = x, x1 = x, y0 = y, y1 = y
            pila[sp++] = p0
            etiqueta[p0] = id
            while (sp) {
                const p = pila[--sp]
                const py = (p / W) | 0, pxx = p % W
                n++; su += pxx; sv += py
                if (pxx < x0) x0 = pxx
                if (pxx > x1) x1 = pxx
                if (py < y0) y0 = py
                if (py > y1) y1 = py
                const vec = [[pxx, py - 1], [pxx, py + 1], [(pxx + 1) % W, py], [(pxx - 1 + W) % W, py]]
                for (const [a, b] of vec) {
                    if (b < Y0 || b >= H) continue
                    const q = b * W + a
                    if (cerrado[q] || etiqueta[q] >= 0) continue
                    etiqueta[q] = id
                    pila[sp++] = q
                }
            }
            celdas.push({ id, n, cu: su / n, cv: sv / n, caja: [x0, y0, x1, y1] })
        }
    }
    console.log(`Recintos: ${celdas.length}`)

    /* Se descartan el fondo, el ruido y las tiras largas, que son los caminos.
       El criterio de tira es la relacion entre la superficie y su caja: un
       lote llena su caja, un camino curvo no. */
    const lotes = celdas.filter(c => {
        if (c.n < MIN || c.n > MAX) return false
        const an = c.caja[2] - c.caja[0] + 1, al = c.caja[3] - c.caja[1] + 1
        if (an > W * 0.2 || al > H * 0.2) return false
        if (c.n / (an * al) < 0.42) return false        // no llena su caja: camino
        const largura = Math.max(an, al) / Math.max(1, Math.min(an, al))
        return largura < 7
    })
    console.log(`Celdas que parecen lote: ${lotes.length}`)
    const ts = lotes.map(c => c.n).sort((a, b) => a - b)
    const q = f => ts[Math.min(ts.length - 1, Math.floor(ts.length * f))]
    console.log(`  superficie: min ${ts[0]}  mediana ${q(.5)}  max ${ts[ts.length - 1]} px`)

    /* Filas: el loteo son hileras de lotes, y adentro de una hilera el numero
       corre seguido. Agrupar por fila da un orden con el que despues se
       reparten los numeros sin ir uno por uno.

       Se agrupa por el centro vertical, que en la panoramica separa las
       hileras porque cada una esta a su distancia del dron. */
    const porV = [...lotes].sort((a, b) => a.cv - b.cv)
    const corte = (H - Y0) * 0.022
    let fila = 0
    porV[0].fila = 0
    for (let i = 1; i < porV.length; i++) {
        if (porV[i].cv - porV[i - 1].cv > corte) fila++
        porV[i].fila = fila
    }
    console.log(`Hileras detectadas: ${fila + 1}`)

    // Dentro de cada hilera, de izquierda a derecha.
    lotes.sort((a, b) => a.fila - b.fila || a.cu - b.cu)
    lotes.forEach((c, i) => { c.orden = i })

    // ── mapa de identificadores ─────────────────────────────────────────────
    /* Las celdas se engordan hasta tocarse: el trazo se marco con holgura y
       sin esto quedaria un borde muerto de varios pixeles alrededor de cada
       lote, donde el cursor no acierta nada. */
    const dest = new Int32Array(W * H)
    lotes.forEach((c, k) => { c.num = k + 1 })   // 0 queda para "aqui no hay lote"
    const deId = new Map(lotes.map(c => [c.id, c.num]))
    for (let p = 0; p < W * H; p++) {
        const e = etiqueta[p]
        if (e >= 0 && deId.has(e)) dest[p] = deId.get(e)
    }
    for (let paso = 0; paso < CIERRE + 2; paso++) {
        const copia = Int32Array.from(dest)
        for (let y = Y0; y < H; y++) {
            for (let x = 0; x < W; x++) {
                const p = y * W + x
                if (copia[p]) continue
                for (const [a, b] of [[x, y - 1], [x, y + 1], [(x + 1) % W, y], [(x - 1 + W) % W, y]]) {
                    if (b < Y0 || b >= H) continue
                    const v = copia[b * W + a]
                    if (v) { dest[p] = v; break }
                }
            }
        }
    }

    const png = Buffer.alloc(W * H * 3)
    for (let p = 0; p < W * H; p++) {
        const v = dest[p]
        png[p * 3] = v & 255
        png[p * 3 + 1] = (v >> 8) & 255
    }
    await sharp(png, { raw: { width: W, height: H, channels: 3 } })
        .png({ compressionLevel: 9, palette: false }).toFile(MAPA)
    console.log(`Escrito ${path.basename(MAPA)} — ${(fs.statSync(MAPA).size / 1024).toFixed(0)} KB`)

    /* Centro recalculado sobre la celda engordada, que es la que se toca. Va
       en vueltas y en fraccion de alto, no en pixeles: asi el visor puede
       cambiar de resolucion sin tocar estos datos. */
    const suma = new Map()
    for (let y = Y0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const v = dest[y * W + x]
            if (!v) continue
            const s = suma.get(v) || (suma.set(v, { n: 0, u: 0, v: 0 }), suma.get(v))
            s.n++; s.u += x; s.v += y
        }
    }
    /* Numero, etapa y estado: se proponen emparejando las celdas en orden de
       hilera con los registros que ya existen, ordenados por etapa y numero.
       Es una PROPUESTA, no un dato: las cuentas no calzan exactas y un lote
       marcado vendido que no lo es seria un error caro. Hay que revisarla en
       el editor antes de publicarla. */
    const previos = fs.existsSync(VIEJOS)
        ? JSON.parse(fs.readFileSync(VIEJOS, 'utf8')).lotes
            .slice().sort((a, b) => a.stage - b.stage || a.n - b.n)
        : []
    if (previos.length) {
        console.log(`Numeracion propuesta emparejando ${lotes.length} celdas con ${previos.length} registros`)
        if (previos.length !== lotes.length) {
            console.warn(`  OJO: sobran ${Math.abs(previos.length - lotes.length)} de un lado. La propuesta se corre a partir de ahi.`)
        }
    }

    const salida = {
        _comentario: 'Celdas sacadas del plano dibujado en la panoramica por scripts/detectar-lotes-pano.js. u va en vueltas (0..1) y v en fraccion de alto. La numeracion es una propuesta sin verificar: revisar en /agendar-visita?editor=1.',
        provisional: true,
        ancho: W, alto: H,
        celdas: lotes.map((c, k) => {
            const s = suma.get(c.num)
            const p = previos[k]
            return {
                id: c.num,
                fila: c.fila,
                u: +(s.u / s.n / W).toFixed(5),
                v: +(s.v / s.n / H).toFixed(5),
                px: s.n,
                n: p ? p.n : null,
                stage: p ? p.stage : null,
                sold: p ? !!p.sold : false,
                area: p && p.area != null ? p.area : null
            }
        })
    }
    fs.writeFileSync(DATOS, JSON.stringify(salida, null, 1))
    console.log(`Escrito ${path.basename(DATOS)} — ${salida.celdas.length} celdas`)

    if (debug) {
        const vis = Buffer.alloc(W * H * 3)
        for (let p = 0; p < W * H; p++) {
            const v = dest[p], o = p * 3
            if (!v) { vis[o] = vis[o + 1] = vis[o + 2] = 16; continue }
            vis[o] = (v * 97) % 200 + 55
            vis[o + 1] = (v * 53) % 200 + 55
            vis[o + 2] = (v * 29) % 200 + 55
        }
        const f = path.join(RAIZ, 'celdas-debug.png')
        await sharp(vis, { raw: { width: W, height: H, channels: 3 } })
            .extract({ left: 0, top: Y0, width: W, height: H - Y0 })
            .png().toFile(f)
        console.log(`Escrito ${f}`)
    }

    console.log('\nFalta repartir numero, etapa y estado sobre estas celdas: /agendar-visita?editor=1')
}

main().catch(e => { console.error('\n' + e.message); process.exit(1) })
