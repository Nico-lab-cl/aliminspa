/*
 * Prepara el trozo de suelo que tapa el punto ciego del vuelo.
 *
 * La panoramica no llega al nadir: el stitch se corta a 4 grados de mirar
 * hacia abajo y el detalle se derrumba pasados los 83 de depresion. Ese cono
 * no se puede rellenar dentro de la panoramica, porque ahi todas las
 * direcciones convergen en un punto y cualquier dibujo sale como un disco o
 * como una estrella de rayos.
 *
 * Fuera de la panoramica si se puede: un trozo de suelo visto desde arriba,
 * en metros, sin convergencia ninguna. Es lo mismo que hacia el mapa anterior
 * —abria el manto bajo el dron y dejaba asomar la ortofoto— pero con imagen
 * que no trae el plano viejo pintado encima.
 *
 *   node scripts/chip-nadir.js
 *
 * Escribe public/lomas3d/nadir.webp (el trozo) y nadir.json (cuanto mide y
 * desde donde se mira). Depende de vuelo.json: si cambia el calce, hay que
 * volver a correrlo.
 *
 * La ortofoto del proyecto no sirve para esto: su georreferenciado deja el
 * punto bajo el dron fuera de la imagen, y ademas trae el plano viejo pintado
 * sobre un quinto de su superficie.
 */

const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const RAIZ = path.join(__dirname, '..')
const VUELO = path.join(RAIZ, 'public/lomas3d/vuelo.json')
const MAPA = path.join(RAIZ, 'public/lomas3d/mapa-data.json')
const PANO = path.join(RAIZ, 'public/lomas3d/pano-360.webp')
const SALIDA = path.join(RAIZ, 'public/lomas3d/nadir.webp')
const META = path.join(RAIZ, 'public/lomas3d/nadir.json')

/* Esri no pasa de z18 en El Tabo: z19 responde "map data not yet available".
   A esta latitud z18 son unos 50 cm por pixel. */
const SAT = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile'
const SAT_Z = 18

/** Lado del trozo, en metros. Cubre de sobra el cono ciego con su degradado. */
const LADO = 190

/** Resolucion de salida. 190 m en 512 px son 37 cm por pixel: mas que el origen. */
const PX = 512

/** Depresiones entre las que el suelo va reemplazando a la foto. */
const DESDE = 77, HASTA = 85

const TAU = Math.PI * 2
const RAD = Math.PI / 180

async function main() {
    const vuelo = JSON.parse(fs.readFileSync(VUELO, 'utf8'))
    const mapa = JSON.parse(fs.readFileSync(MAPA, 'utf8'))
    const la = mapa.origin.lat, lo = mapa.origin.lng
    const R = 111320, kx = R * Math.cos(la * RAD)
    console.log(`Vuelo: x ${vuelo.x}  z ${vuelo.z}  alt ${vuelo.alt}  giro ${vuelo.yaw}`)
    console.log(`Cono ciego: de ${DESDE}° a ${HASTA}° de depresion = de ${(vuelo.alt / Math.tan(HASTA * RAD)).toFixed(0)} a ${(vuelo.alt / Math.tan(DESDE * RAD)).toFixed(0)} m de radio`)

    // ── mosaico satelital alrededor del punto bajo el dron ──────────────────
    const N = 2 ** SAT_Z
    const merc = (lat, lng) => {
        const s = Math.sin(lat * RAD)
        return [(lng + 180) / 360 * N * 256,
                (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * N * 256]
    }
    const aLL = (x, z) => [la - z / R, lo + x / kx]

    const m = LADO * 0.75
    const esquinas = [[-m, -m], [m, -m], [-m, m], [m, m]]
        .map(([a, b]) => merc(...aLL(vuelo.x + a, vuelo.z + b)))
    const xs = esquinas.map(e => e[0]), ys = esquinas.map(e => e[1])
    const tx0 = Math.floor(Math.min(...xs) / 256), tx1 = Math.floor(Math.max(...xs) / 256)
    const ty0 = Math.floor(Math.min(...ys) / 256), ty1 = Math.floor(Math.max(...ys) / 256)

    const piezas = []
    for (let ty = ty0; ty <= ty1; ty++) {
        for (let tx = tx0; tx <= tx1; tx++) {
            const r = await fetch(`${SAT}/${SAT_Z}/${ty}/${tx}`, {
                headers: { 'User-Agent': 'aliminspa-build' }
            })
            if (!r.ok) { console.warn(`  mosaico ${tx}/${ty}: HTTP ${r.status}`); continue }
            piezas.push({
                input: Buffer.from(await r.arrayBuffer()),
                left: (tx - tx0) * 256, top: (ty - ty0) * 256
            })
        }
    }
    if (!piezas.length) throw new Error('No se pudo bajar ningun mosaico satelital.')
    console.log(`Satelital: ${piezas.length} mosaicos z${SAT_Z}`)

    const cols = tx1 - tx0 + 1, filas = ty1 - ty0 + 1
    const lienzo = await sharp({
        create: { width: cols * 256, height: filas * 256, channels: 3, background: { r: 107, g: 91, b: 69 } }
    }).composite(piezas).png().toBuffer()
    const cr = await sharp(lienzo).raw().toBuffer({ resolveWithObject: true })
    const SW = cr.info.width, SH = cr.info.height, SC = cr.info.channels, sd = cr.data
    const ox = tx0 * 256, oy = ty0 * 256

    const muestrear = (x, z) => {
        const [mx, my] = merc(...aLL(x, z))
        const fx = mx - ox, fy = my - oy
        if (fx < 0 || fy < 0 || fx >= SW - 1 || fy >= SH - 1) return null
        const x0 = Math.floor(fx), y0 = Math.floor(fy), ax = fx - x0, ay = fy - y0
        const en = (a, b) => (b * SW + a) * SC
        const out = [0, 0, 0]
        for (let c = 0; c < 3; c++) {
            out[c] = (sd[en(x0, y0) + c] * (1 - ax) + sd[en(x0 + 1, y0) + c] * ax) * (1 - ay)
                   + (sd[en(x0, y0 + 1) + c] * (1 - ax) + sd[en(x0 + 1, y0 + 1) + c] * ax) * ay
        }
        return out
    }

    /* El trozo se arma en metros alrededor del dron: la columna i es
       x = -LADO/2 + i*LADO/PX y la fila j es z = -LADO/2 + j*LADO/PX. El visor
       lo lee con esa misma cuenta, asi que la orientacion no depende de nada
       mas. */
    const bruto = Buffer.alloc(PX * PX * 3)
    for (let j = 0; j < PX; j++) {
        const z = vuelo.z - LADO / 2 + (j + 0.5) * LADO / PX
        for (let i = 0; i < PX; i++) {
            const x = vuelo.x - LADO / 2 + (i + 0.5) * LADO / PX
            const c = muestrear(x, z) || [107, 91, 69]
            const o = (j * PX + i) * 3
            bruto[o] = c[0]; bruto[o + 1] = c[1]; bruto[o + 2] = c[2]
        }
    }

    // ── igualar color con la foto del anillo que rodea al agujero ───────────
    /* El satelite es de otro dia y otra camara. Se comparan las medias y las
       desviaciones contra la propia panoramica en las depresiones donde las
       dos imagenes conviven, y se corrige por canal. Se dejan fuera los
       deslindes dibujados: son blancos y puros, y contados revientan el
       contraste del parche. */
    const p = await sharp(PANO).raw().toBuffer({ resolveWithObject: true })
    const PW = p.info.width, PH = p.info.height, PC = p.info.channels, pd = p.data
    const yawRad = (vuelo.yaw || 0) * RAD

    const nf = [0, 0, 0], nf2 = [0, 0, 0], ns = [0, 0, 0], ns2 = [0, 0, 0]
    let n = 0
    for (let dep = DESDE - 6; dep <= DESDE; dep += 0.5) {
        const rSuelo = vuelo.alt / Math.tan(dep * RAD)
        // fila de la equirectangular para esa depresion
        const fila = Math.round((0.5 + dep / 180) * PH)
        if (fila < 0 || fila >= PH) continue
        for (let g = 0; g < 360; g += 2) {
            const t = g * RAD
            const u = 0.5 - t / TAU + yawRad / TAU
            const col = Math.round((((u % 1) + 1) % 1) * PW) % PW
            const i = (fila * PW + col) * PC
            const mn = Math.min(pd[i], pd[i + 1], pd[i + 2])
            const mx = Math.max(pd[i], pd[i + 1], pd[i + 2])
            if (mn > 195 && mx - mn < 35) continue        // deslinde dibujado
            const c = muestrear(vuelo.x + Math.cos(t) * rSuelo, vuelo.z + Math.sin(t) * rSuelo)
            if (!c) continue
            for (let k = 0; k < 3; k++) {
                nf[k] += pd[i + k]; nf2[k] += pd[i + k] ** 2
                ns[k] += c[k]; ns2[k] += c[k] ** 2
            }
            n++
        }
    }
    if (n < 300) throw new Error(`Solo ${n} muestras para igualar color: muy pocas.`)
    const ajuste = [0, 1, 2].map(k => {
        const mf = nf[k] / n, ms = ns[k] / n
        const df = Math.sqrt(Math.max(1, nf2[k] / n - mf * mf))
        const ds = Math.sqrt(Math.max(1, ns2[k] / n - ms * ms))
        return { ms, mf, k: Math.min(1.8, Math.max(0.5, df / ds)) }
    })
    console.log(`Igualado de color sobre ${n} muestras:`)
    for (const [i, a] of ajuste.entries()) {
        console.log(`  canal ${'RGB'[i]}: media ${a.ms.toFixed(0)} → ${a.mf.toFixed(0)}, contraste ×${a.k.toFixed(2)}`)
    }
    for (let q = 0; q < PX * PX; q++) {
        for (let k = 0; k < 3; k++) {
            const a = ajuste[k]
            bruto[q * 3 + k] = Math.min(255, Math.max(0, (bruto[q * 3 + k] - a.ms) * a.k + a.mf))
        }
    }

    await sharp(bruto, { raw: { width: PX, height: PX, channels: 3 } })
        .webp({ quality: 88 }).toFile(SALIDA)
    console.log(`Escrito ${path.basename(SALIDA)} — ${(fs.statSync(SALIDA).size / 1024).toFixed(0)} KB`)

    fs.writeFileSync(META, JSON.stringify({
        _comentario: 'Trozo de suelo que tapa el cono ciego del vuelo. Lo escribe scripts/chip-nadir.js. Depende de vuelo.json.',
        lado: LADO, alt: vuelo.alt, yaw: vuelo.yaw, desde: DESDE, hasta: HASTA
    }, null, 1))
    console.log(`Escrito ${path.basename(META)}`)
}

main().catch(e => { console.error('\n' + e.message); process.exit(1) })
