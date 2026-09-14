/*
 * Prepara el plano cenital de Arena y Sol a partir del tour virtual de Panoee.
 *
 * Arena y Sol no tiene foto de dron mirando recto hacia abajo como Lomas del
 * Mar. Lo que hay son dos panoramicas 360 tomadas desde el dron, oblicuas, una
 * en cada extremo del loteo, con los lotes dibujados encima como poligonos del
 * visor. De ahi salen las dos cosas que necesita el mapa.
 *
 * La imagen se rectifica: se supone el suelo plano y se reproyecta la esfera
 * sobre ese plano, de modo que el resultado es una vista cenital de verdad y
 * no una foto inclinada. Las lineas de deslinde, que en la panoramica se ven
 * curvas, salen rectas.
 *
 * Con una sola panoramica el extremo lejano quedaba borroso: alla el angulo de
 * vision es rasante y la imagen se estira. Por eso se usan las dos y cada
 * pedazo del plano sale de la escena que lo mira mas de frente. Como del tour
 * no se sabe ni el giro ni la altura de cada vuelo, las escenas se registran
 * haciendo calzar los lotes que ambas ven (ver `registrar`).
 *
 *   node scripts/importar-plano-arenaysol.js
 *
 * Escribe:
 *   public/arenaysol3d/plano.webp        la imagen que se publica
 *   public/arenaysol3d/plano-lite.webp   la version liviana para celular
 *   public/arenaysol3d/plano-mapa.png    mapa de identificadores, uno por lote
 *   public/arenaysol3d/plano-lotes.json  centro y tamano de cada lote
 *
 * El mapa de identificadores lleva el numero de lote en los canales rojo y
 * verde (id = R + G*256), igual que en Lomas del Mar, porque lo lee el mismo
 * visor. Se rasteriza punto a punto y no con SVG: el suavizado de bordes
 * inventaria identificadores que no existen en el limite entre dos lotes.
 *
 * OJO con dos cosas.
 *
 * Los numeros de lote. El tour no los trae: solo dice, por color, si el lote
 * esta vendido o disponible. Los numeros que escribe este script son un orden
 * provisional por posicion, para que el visor pueda pintar y seleccionar. No
 * son los de la escritura y la pagina no los muestra como tales.
 *
 * Las superficies. La escala en metros saldria de la distancia entre los dos
 * puntos de vuelo, y esa distancia viene de dos chinches puestas a mano en
 * Panoee. Da lotes de ~380 m2 donde el proyecto vende de 200, asi que no es
 * confiable y `area` se escribe en null a proposito. El plano sirve para ver
 * donde esta cada lote, no para medirlo.
 */

const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const RAIZ = path.join(__dirname, '..')
const TOUR = path.join(RAIZ, 'tour-arenaysol')
const SALIDA_DIR = path.join(RAIZ, 'public/arenaysol3d')

/** Las dos escenas del tour que tienen lotes dibujados. */
const ESCENAS = ['02-Vista_2_Arena_y_Sol', '03-Vista_1_Arena_y_Sol']

/** Ancho de la imagen publicada, y de la version liviana. */
const ANCHO = 6000, ANCHO_LITE = 2600

/** Ancho del mapa de identificadores. Un lote son miles de pixeles: sobra. */
const MAPA_ANCHO = 4096

/**
 * Margen alrededor de los lotes, en unidades de altura de vuelo.
 *
 * No es solo aire: cuanto más margen, menos alargada queda la imagen, y una
 * imagen menos alargada entra mejor en pantalla. Con 1.25 la proporción baja a
 * ~1.93:1, que en escritorio se ve entera sin que el visor tenga que recortar,
 * y girada calza con un teléfono en vertical.
 */
const MARGEN = 1.25

/*
 * Como se trata lo que hay alrededor del loteo.
 *
 * La rectificacion supone el suelo plano, y eso vale para el suelo pero no
 * para lo que sobresale: casas, arboles y postes tienen altura, asi que salen
 * estirados hacia afuera desde el punto bajo el dron. En el loteo no se nota
 * —esta pelado— pero en el barrio vecino las casas quedan derretidas.
 *
 * No se puede arreglar sin un modelo del terreno que no tenemos, asi que en
 * vez de disimularlo se lo pone en su lugar: el entorno se desenfoca, se
 * desatura y se oscurece a medida que se aleja de los lotes. Deja de leerse
 * como una foto fallada y pasa a leerse como contexto, que es para lo que
 * esta. Y el loteo, que es lo que el visitante vino a mirar, queda nitido y a
 * todo color.
 *
 * Las distancias van en lados de lote, que es la medida que se ve en pantalla.
 */
const ENTORNO = {
    nitidoHasta: 0.5,   // hasta acá no se toca nada
    tratadoDesde: 3.0,  // de acá en adelante, tratamiento completo
    desatura: 0.55,
    oscurece: 0.35,
    desenfoque: 0.0016, // radio, en fracción del ancho de la imagen
}

/**
 * Cuanto manda el angulo de vision al mezclar las dos escenas.
 *
 * El peso de cada escena en un punto es sin(depresion) elevado a esto. Con el
 * exponente alto la eleccion es casi siempre una sola escena —la que mira mas
 * de frente, que es la que tiene mejor resolucion ahi— y la otra solo aparece
 * en la franja donde las dos ven parecido. Eso evita a la vez el corte duro y
 * el fantasma de mezclar dos fotos que no calzan al milimetro.
 */
const DUREZA = 6

const R = Math.PI / 180
const D = 180 / Math.PI

/* ───────── geometria ───────── */

/**
 * De angulos de la panoramica a metros sobre el suelo.
 *
 * Con la camara en el origen y el suelo plano una unidad mas abajo, un punto
 * visto con depresion `atv` esta a distancia horizontal 1/tan(atv). La unidad
 * es la altura de vuelo de esa escena.
 */
function alSuelo(p) {
    const r = 1 / Math.tan(p.atv * R)
    return [r * Math.sin(p.ath * R), r * Math.cos(p.ath * R)]
}

function area(pts) {
    let a = 0
    for (let i = 0; i < pts.length; i++) {
        const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]
        a += x1 * y2 - x2 * y1
    }
    return Math.abs(a) / 2
}

function centro(pts) {
    let a = 0, cx = 0, cy = 0
    for (let i = 0; i < pts.length; i++) {
        const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]
        const f = x1 * y2 - x2 * y1
        a += f; cx += (x1 + x2) * f; cy += (y1 + y2) * f
    }
    a /= 2
    return a ? [cx / (6 * a), cy / (6 * a)] : pts[0]
}

const mediana = xs => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)] }

/** Verde del visor de Panoee: disponible. Rojo: vendido. Otra cosa: sin asignar. */
function estaDisponible(fill) {
    const m = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(fill || '')
    if (!m) return null
    const [r, g] = [+m[1], +m[2]]
    if (g > 150 && r < 120) return true
    if (r > 150 && g < 120) return false
    return null
}

/* ───────── registro de las dos escenas ───────── */

/**
 * Encuentra el giro y el desplazamiento que llevan la escena B sobre la A.
 *
 * La escala sale de suponer que los lotes miden lo mismo en las dos, que es
 * cierto porque son los mismos lotes. El giro y el desplazamiento salen de una
 * votacion: para cada giro candidato, cada par de lotes propone la traslacion
 * que los haria coincidir, y la mas votada gana. Despues se afina alternando
 * emparejar y ajustar por minimos cuadrados.
 */
function registrar(A, B) {
    const s = Math.sqrt(mediana(A.areas) / mediana(B.areas))
    const PB = B.centros.map(([x, y]) => [x * s, y * s])
    const PA = A.centros
    const lado = Math.sqrt(mediana(A.areas))
    const CELDA = lado * 0.30, TOL = lado * 0.45

    const votar = giros => {
        let mejor = null
        for (const th of giros) {
            const co = Math.cos(th * R), si = Math.sin(th * R)
            const urna = new Map()
            for (const p of PB) {
                const rx = p[0] * co - p[1] * si, ry = p[0] * si + p[1] * co
                for (const q of PA) {
                    const tx = q[0] - rx, ty = q[1] - ry
                    const k = Math.round(tx / CELDA) + ',' + Math.round(ty / CELDA)
                    const v = urna.get(k)
                    if (v) { v.n++; v.sx += tx; v.sy += ty } else urna.set(k, { n: 1, sx: tx, sy: ty })
                }
            }
            for (const v of urna.values()) {
                if (!mejor || v.n > mejor.n) mejor = { n: v.n, th, tx: v.sx / v.n, ty: v.sy / v.n }
            }
        }
        return mejor
    }

    const grueso = []
    for (let t = 0; t < 360; t += 1) grueso.push(t)
    let m = votar(grueso)
    const fino = []
    for (let t = m.th - 2; t <= m.th + 2; t += 0.1) fino.push(t)
    m = votar(fino)

    const parear = (th, tx, ty) => {
        const co = Math.cos(th * R), si = Math.sin(th * R)
        const porA = new Map()
        PB.forEach((p, i) => {
            const x = p[0] * co - p[1] * si + tx, y = p[0] * si + p[1] * co + ty
            let mejor = -1, dm = Infinity
            PA.forEach((q, j) => { const d = Math.hypot(q[0] - x, q[1] - y); if (d < dm) { dm = d; mejor = j } })
            if (dm >= TOL) return
            // Un lote de A no puede ser pareja de dos de B: gana el mas cercano.
            const v = porA.get(mejor)
            if (!v || dm < v.d) porA.set(mejor, { b: i, a: mejor, d: dm })
        })
        return [...porA.values()]
    }

    let pares = parear(m.th, m.tx, m.ty)
    for (let k = 0; k < 5; k++) {
        let mx1 = 0, my1 = 0, mx2 = 0, my2 = 0
        for (const p of pares) { mx1 += PB[p.b][0]; my1 += PB[p.b][1]; mx2 += PA[p.a][0]; my2 += PA[p.a][1] }
        const n = pares.length
        mx1 /= n; my1 /= n; mx2 /= n; my2 /= n
        let ca = 0, cb = 0
        for (const p of pares) {
            const x1 = PB[p.b][0] - mx1, y1 = PB[p.b][1] - my1
            const x2 = PA[p.a][0] - mx2, y2 = PA[p.a][1] - my2
            ca += x1 * x2 + y1 * y2
            cb += x1 * y2 - y1 * x2
        }
        const th = Math.atan2(cb, ca) * D
        const co = Math.cos(th * R), si = Math.sin(th * R)
        m = { th, tx: mx2 - (mx1 * co - my1 * si), ty: my2 - (mx1 * si + my1 * co) }
        pares = parear(m.th, m.tx, m.ty)
    }
    return { escala: s, giro: m.th, tx: m.tx, ty: m.ty, pares, lado, error: mediana(pares.map(p => p.d)) }
}

/* ───────── carga ───────── */

function cargarEscena(doc, key) {
    const e = doc.escenas.find(x => x.key === key)
    if (!e) throw new Error('No esta la escena ' + key)
    const g = e.poligonos.map(p => p.puntos.map(alSuelo))
    return {
        key,
        poligonos: g,
        centros: g.map(centro),
        areas: g.map(area),
        disponible: e.poligonos.map(p => estaDisponible(p.fillColor)),
        actualizado: e.poligonos.map(p => p.actualizado || ''),
    }
}

async function main() {
    const doc = JSON.parse(fs.readFileSync(path.join(TOUR, 'lotes-poligonos.json'), 'utf8'))
    const A = cargarEscena(doc, ESCENAS[0])   // marco de referencia
    const B = cargarEscena(doc, ESCENAS[1])

    const reg = registrar(A, B)
    console.log('registro: giro', reg.giro.toFixed(2) + '°',
        'escala', reg.escala.toFixed(4),
        'traslacion', reg.tx.toFixed(3), reg.ty.toFixed(3))
    console.log('lotes en comun:', reg.pares.length, 'de', B.centros.length, 'de', ESCENAS[1],
        '· error mediano', (reg.error / reg.lado * 100).toFixed(1) + '% del lado de un lote')

    // B al marco de A.
    const co = Math.cos(reg.giro * R), si = Math.sin(reg.giro * R)
    const aMarco = ([x, y]) => {
        const u = x * reg.escala, v = y * reg.escala
        return [u * co - v * si + reg.tx, u * si + v * co + reg.ty]
    }
    // Y la vuelta, para muestrear la panoramica de B.
    const deMarco = ([x, y]) => {
        const u = x - reg.tx, v = y - reg.ty
        return [(u * co + v * si) / reg.escala, (-u * si + v * co) / reg.escala]
    }

    const camB = [reg.tx, reg.ty]        // donde volaba B, en el marco de A
    const altB = reg.escala              // su altura, en unidades de la de A

    /* ── un solo juego de lotes ── */

    const deB = new Map(reg.pares.map(p => [p.b, p.a]))   // lote de B -> lote de A
    const paraA = new Map(reg.pares.map(p => [p.a, p.b]))

    /** Depresion con que una camara a altura h y en `cam` ve el punto `p`. */
    const depresion = (p, cam, h) => Math.atan2(h, Math.hypot(p[0] - cam[0], p[1] - cam[1]))

    const lotes = []
    let conflictos = 0

    A.centros.forEach((cA, i) => {
        const j = paraA.get(i)
        const pA = A.poligonos[i]
        if (j === undefined) {
            lotes.push({ g: pA, disponible: A.disponible[i], visto: 'Vista 2', conflicto: false })
            return
        }
        // Lo ven las dos. La geometria sale de la que lo mira mas de frente,
        // para que el poligono y la foto de abajo vengan de la misma escena.
        const pB = B.poligonos[j].map(aMarco)
        const cB = aMarco(B.centros[j])
        const dA = depresion(cA, [0, 0], 1), dB = depresion(cB, camB, altB)
        const mejorB = dB > dA

        // El estado sale de la edicion mas reciente: alguien cambio el color en
        // una escena y no en la otra.
        const a = A.disponible[i], b = B.disponible[j]
        const hayConflicto = a !== null && b !== null && a !== b
        if (hayConflicto) conflictos++
        const gana = hayConflicto
            ? (B.actualizado[j] > A.actualizado[i] ? b : a)
            : (a === null ? b : a)

        lotes.push({
            g: mejorB ? pB : pA,
            disponible: gana,
            visto: 'ambas',
            conflicto: hayConflicto,
        })
    })

    // Los que solo ve B.
    B.poligonos.forEach((p, j) => {
        if (deB.has(j)) return
        lotes.push({ g: p.map(aMarco), disponible: B.disponible[j], visto: 'Vista 1', conflicto: false })
    })

    const soloB = lotes.filter(l => l.visto === 'Vista 1').length
    console.log('lotes:', lotes.length,
        '· solo en Vista 2:', lotes.filter(l => l.visto === 'Vista 2').length,
        '· en ambas:', lotes.filter(l => l.visto === 'ambas').length,
        '· solo en Vista 1:', soloB)
    if (conflictos) console.log('OJO:', conflictos, 'lotes donde las escenas discrepan; gana la edicion mas reciente')

    /* ── encuadre ── */

    let X0 = Infinity, X1 = -Infinity, Y0 = Infinity, Y1 = -Infinity
    for (const l of lotes) for (const [x, y] of l.g) {
        if (x < X0) X0 = x; if (x > X1) X1 = x
        if (y < Y0) Y0 = y; if (y > Y1) Y1 = y
    }
    X0 -= MARGEN; X1 += MARGEN; Y0 -= MARGEN; Y1 += MARGEN
    const relacion = (X1 - X0) / (Y1 - Y0)
    console.log('encuadre X', X0.toFixed(2), '..', X1.toFixed(2), ' Y', Y0.toFixed(2), '..', Y1.toFixed(2),
        ' relacion', relacion.toFixed(3))

    /* ── orden provisional: por hileras, y dentro de cada una de oeste a este ── */

    const cs = lotes.map(l => centro(l.g))
    const lado = Math.sqrt(mediana(lotes.map(l => area(l.g))))
    /* Solo se numeran los que el tour pinto de verde o de rojo. El que quedo
       sin color no se sabe si esta en venta, y el visor cuenta como disponible
       todo lo que tenga numero: numerarlo lo sumaba a los disponibles que ve
       el visitante sin que nadie lo haya dicho. Sin numero queda sin tenir y,
       como tampoco entra al mapa de identificadores, no se puede elegir. */
    lotes.map((l, i) => ({ i, c: cs[i], l }))
        .filter(o => o.l.disponible !== null)
        .sort((a, b) => {
            const fa = Math.round(a.c[1] / lado), fb = Math.round(b.c[1] / lado)
            return fa !== fb ? fa - fb : a.c[0] - b.c[0]
        })
        .forEach((o, k) => { lotes[o.i].n = k + 1 })

    fs.mkdirSync(SALIDA_DIR, { recursive: true })

    /* ── la imagen ── */

    const eqA = await cargarEquirect(ESCENAS[0])
    const eqB = await cargarEquirect(ESCENAS[1])
    const marco = { X0, X1, Y0, Y1, camB, altB, deMarco }

    marco.lotes = lotes
    marco.lado = lado

    /*
     * La misma imagen en dos orientaciones.
     *
     * El loteo es una franja de casi 2:1 y una pantalla de teléfono en
     * vertical es lo contrario: no entra, y el visitante termina viendo seis
     * lotes y arrastrando de lado. Girada 90° la franja calza casi exacta, así
     * que se publican las dos y la página carga la que corresponda. Se giran
     * los píxeles ya calculados, no se vuelve a proyectar nada.
     */
    const alto = Math.round(ANCHO / relacion)
    const grande = await rectificar(eqA, eqB, marco, ANCHO, alto)
    await guardar(grande, ANCHO, alto, path.join(SALIDA_DIR, 'plano.webp'), 82, 0)
    await guardar(grande, ANCHO, alto, path.join(SALIDA_DIR, 'plano-vertical.webp'), 82, 90)

    const altoLite = Math.round(ANCHO_LITE / relacion)
    const chica = await rectificar(eqA, eqB, marco, ANCHO_LITE, altoLite)
    await guardar(chica, ANCHO_LITE, altoLite, path.join(SALIDA_DIR, 'plano-lite.webp'), 78, 0)
    await guardar(chica, ANCHO_LITE, altoLite, path.join(SALIDA_DIR, 'plano-vertical-lite.webp'), 78, 90)

    /* ── el mapa de identificadores ── */

    const mapaAlto = Math.round(MAPA_ANCHO / relacion)
    const pix = rasterizar(lotes, MAPA_ANCHO, mapaAlto, X0, X1, Y0, Y1)
    const crudo = { width: MAPA_ANCHO, height: mapaAlto, channels: 3 }
    // Un cuarto de vuelta no interpola: los identificadores salen intactos.
    await sharp(pix.buf, { raw: crudo }).png({ compressionLevel: 9, palette: false })
        .toFile(path.join(SALIDA_DIR, 'plano-mapa.png'))
    await sharp(pix.buf, { raw: crudo }).rotate(90).png({ compressionLevel: 9, palette: false })
        .toFile(path.join(SALIDA_DIR, 'plano-mapa-vertical.png'))
    console.log('mapa de ids', MAPA_ANCHO + 'x' + mapaAlto, '(y girado)')

    /* ── los datos ── */

    const aU = x => (x - X0) / (X1 - X0)
    const aV = y => (Y1 - y) / (Y1 - Y0)
    const datos = {
        _comentario: 'Lotes sacados de los poligonos del tour de Panoee, proyectados al plano del suelo y fusionadas las dos escenas (scripts/importar-plano-arenaysol.js). u y v en fraccion de imagen, origen arriba a la izquierda.',
        _numeracion: 'PROVISIONAL: el tour no trae numeros de lote. n es un orden por posicion, no el numero de la escritura.',
        _superficies: 'area va en null a proposito: la escala en metros no es confiable. Ver el encabezado del script.',
        provisional: true,
        fuente: 'https://tour.panoee.net/arenaysol/68a920e6671c3e138277f1ef',
        escenas: ESCENAS,
        registro: { giro: +reg.giro.toFixed(3), escala: +reg.escala.toFixed(5), tx: +reg.tx.toFixed(4), ty: +reg.ty.toFixed(4) },
        ancho: MAPA_ANCHO,
        alto: mapaAlto,
        lotes: lotes.map((l, i) => {
            const c = cs[i]
            const xs = l.g.map(p => p[0]), ys = l.g.map(p => p[1])
            return {
                id: i + 1,
                n: l.n,
                stage: null,
                sold: l.disponible === false,
                area: null,
                tipo: l.disponible === null ? 'ninguna' : 'lote',
                visto: l.visto,
                ...(l.conflicto ? { conflicto: true } : {}),
                u: +aU(c[0]).toFixed(5),
                v: +aV(c[1]).toFixed(5),
                caja: [
                    +aU(Math.min(...xs)).toFixed(5), +aV(Math.max(...ys)).toFixed(5),
                    +aU(Math.max(...xs)).toFixed(5), +aV(Math.min(...ys)).toFixed(5),
                ],
                px: pix.cuenta[i + 1] || 0,
                cx: +c[0].toFixed(4), cy: +c[1].toFixed(4),
            }
        }),
    }
    fs.writeFileSync(path.join(SALIDA_DIR, 'plano-lotes.json'), JSON.stringify(datos, null, 1))

    /*
     * El mismo JSON para la imagen girada.
     *
     * Girar un cuarto de vuelta a la derecha lleva el punto (u, v) a
     * (1 - v, u), y la caja —que va como esquina superior izquierda y esquina
     * inferior derecha— hay que rearmarla con las esquinas que quedan en esos
     * lugares después del giro.
     */
    const girado = {
        ...datos,
        _orientacion: 'Para plano-vertical.webp y plano-mapa-vertical.png: la misma imagen girada un cuarto de vuelta a la derecha.',
        ancho: mapaAlto,
        alto: MAPA_ANCHO,
        lotes: datos.lotes.map(l => ({
            ...l,
            u: +(1 - l.v).toFixed(5),
            v: l.u,
            caja: [
                +(1 - l.caja[3]).toFixed(5), l.caja[0],
                +(1 - l.caja[1]).toFixed(5), l.caja[2],
            ],
        })),
    }
    fs.writeFileSync(path.join(SALIDA_DIR, 'plano-lotes-vertical.json'), JSON.stringify(girado, null, 1))

    const enVenta = datos.lotes.filter(l => l.tipo === 'lote')
    console.log('json escrito:', datos.lotes.length, 'lotes ·',
        enVenta.filter(l => !l.sold).length, 'disponibles ·',
        enVenta.filter(l => l.sold).length, 'vendidos')
}

/* ───────── imagen ───────── */

async function cargarEquirect(key) {
    const dir = path.join(TOUR, 'panoramicas-360', key)
    const f = fs.readdirSync(dir).find(x => x.includes('equirectangular'))
    const { data, info } = await sharp(path.join(dir, f)).raw().toBuffer({ resolveWithObject: true })
    return { data, W: info.width, H: info.height, ch: info.channels }
}

/** Muestrea una equirectangular en la direccion que va a `(x, y)` del suelo. */
function muestrear(eq, x, y, out) {
    const n = Math.sqrt(x * x + 1 + y * y)
    const lon = Math.atan2(x, y) * D, lat = Math.asin(-1 / n) * D
    const u = (lon + 180) / 360 * eq.W, v = (90 - lat) / 180 * eq.H
    const u0 = Math.floor(u), v0 = Math.min(eq.H - 1, Math.max(0, Math.floor(v)))
    const tu = u - u0, tv = v - v0
    const ua = ((u0 % eq.W) + eq.W) % eq.W, ub = ((u0 + 1) % eq.W + eq.W) % eq.W
    const vb = Math.min(eq.H - 1, v0 + 1)
    const a = (v0 * eq.W + ua) * eq.ch, b = (v0 * eq.W + ub) * eq.ch
    const c = (vb * eq.W + ua) * eq.ch, d = (vb * eq.W + ub) * eq.ch
    const w0 = (1 - tu) * (1 - tv), w1 = tu * (1 - tv), w2 = (1 - tu) * tv, w3 = tu * tv
    for (let k = 0; k < 3; k++) {
        out[k] = eq.data[a + k] * w0 + eq.data[b + k] * w1 + eq.data[c + k] * w2 + eq.data[d + k] * w3
    }
}

/**
 * Reproyecta las dos panoramicas sobre el plano del suelo y las mezcla.
 *
 * Cada punto se pesa por lo de frente que lo mira cada camara, de modo que el
 * plano se arma con la escena que mejor resolucion tiene en cada zona.
 */
async function rectificar(eqA, eqB, marco, OW, OH, destino, calidad) {
    const { X0, X1, Y0, Y1, camB, altB, deMarco } = marco
    const o = Buffer.alloc(OW * OH * 3)
    const ca = [0, 0, 0], cb = [0, 0, 0]

    for (let j = 0; j < OH; j++) {
        const Y = Y1 - (j + 0.5) / OH * (Y1 - Y0)
        for (let i = 0; i < OW; i++) {
            const X = X0 + (i + 0.5) / OW * (X1 - X0)

            const rA = Math.hypot(X, Y)
            const wA = Math.pow(1 / Math.sqrt(rA * rA + 1), DUREZA)          // sin(depresion)^DUREZA
            const dx = X - camB[0], dy = Y - camB[1]
            const rB = Math.hypot(dx, dy)
            const wB = Math.pow(altB / Math.sqrt(rB * rB + altB * altB), DUREZA)

            muestrear(eqA, X, Y, ca)
            const l = deMarco([X, Y])
            muestrear(eqB, l[0], l[1], cb)

            const s = wA + wB
            const q = (j * OW + i) * 3
            for (let k = 0; k < 3; k++) o[q + k] = (ca[k] * wA + cb[k] * wB) / s
        }
        if (j % 500 === 0) process.stdout.write('   fila ' + j + '/' + OH + '\n')
    }

    tratarEntorno(o, OW, OH, marco)
    return o
}

/** Guarda el plano, derecho o girado un cuarto de vuelta a la derecha. */
async function guardar(buf, OW, OH, destino, calidad, giro) {
    let img = sharp(buf, { raw: { width: OW, height: OH, channels: 3 } })
    if (giro) img = img.rotate(giro)
    await img.webp({ quality: calidad }).toFile(destino)
    console.log('imagen', path.basename(destino),
        (giro ? OH + 'x' + OW : OW + 'x' + OH),
        (fs.statSync(destino).size / 1048576).toFixed(2) + ' MB')
}

/**
 * Cuánto se aleja cada punto del loteo, para saber cuánto atenuarlo.
 *
 * Se dibuja una máscara de los lotes a baja resolución y se le saca la
 * distancia con dos pasadas de chamfer. Baja resolución alcanza porque el
 * degradado es suave: lo que se interpola después no se nota.
 */
function mapaDeLejania(lotes, OW, OH, X0, X1, Y0, Y1, lado) {
    const MW = 800, MH = Math.max(2, Math.round(MW * OH / OW))
    const dentro = new Uint8Array(MW * MH)
    const aI = x => (x - X0) / (X1 - X0) * MW
    const aJ = y => (Y1 - y) / (Y1 - Y0) * MH

    for (const l of lotes) {
        const P = l.g.map(([x, y]) => [aI(x), aJ(y)])
        const i0 = Math.max(0, Math.floor(Math.min(...P.map(p => p[0]))))
        const i1 = Math.min(MW - 1, Math.ceil(Math.max(...P.map(p => p[0]))))
        const j0 = Math.max(0, Math.floor(Math.min(...P.map(p => p[1]))))
        const j1 = Math.min(MH - 1, Math.ceil(Math.max(...P.map(p => p[1]))))
        for (let j = j0; j <= j1; j++) {
            const py = j + 0.5
            for (let i = i0; i <= i1; i++) {
                const px = i + 0.5
                let d = false
                for (let a = 0, b = P.length - 1; a < P.length; b = a++) {
                    const [xa, ya] = P[a], [xb, yb] = P[b]
                    if ((ya > py) !== (yb > py) && px < (xb - xa) * (py - ya) / (yb - ya) + xa) d = !d
                }
                if (d) dentro[j * MW + i] = 1
            }
        }
    }

    const INF = 1e9, D2 = new Float32Array(MW * MH)
    for (let i = 0; i < D2.length; i++) D2[i] = dentro[i] ? 0 : INF
    const r = 1, q = Math.SQRT2
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
        const i = y * MW + x; let v = D2[i]
        if (x > 0) v = Math.min(v, D2[i - 1] + r)
        if (y > 0) v = Math.min(v, D2[i - MW] + r)
        if (y > 0 && x > 0) v = Math.min(v, D2[i - MW - 1] + q)
        if (y > 0 && x < MW - 1) v = Math.min(v, D2[i - MW + 1] + q)
        D2[i] = v
    }
    for (let y = MH - 1; y >= 0; y--) for (let x = MW - 1; x >= 0; x--) {
        const i = y * MW + x; let v = D2[i]
        if (x < MW - 1) v = Math.min(v, D2[i + 1] + r)
        if (y < MH - 1) v = Math.min(v, D2[i + MW] + r)
        if (y < MH - 1 && x < MW - 1) v = Math.min(v, D2[i + MW + 1] + q)
        if (y < MH - 1 && x > 0) v = Math.min(v, D2[i + MW - 1] + q)
        D2[i] = v
    }

    // De píxeles de la máscara a lados de lote, y de ahí a cuánto se atenúa.
    const porPixel = (X1 - X0) / MW / lado
    const f = new Float32Array(MW * MH)
    const a = ENTORNO.nitidoHasta, b = ENTORNO.tratadoDesde
    for (let i = 0; i < f.length; i++) {
        const t = Math.max(0, Math.min(1, (D2[i] * porPixel - a) / (b - a)))
        f[i] = t * t * (3 - 2 * t)     // suavizado, para que no se vea el borde
    }
    return { f, MW, MH }
}

/** Desenfoque de caja separable, con sumas corridas. */
function desenfocar(src, OW, OH, radio) {
    if (radio < 1) return src
    const n = 2 * radio + 1
    const tmp = Buffer.alloc(OW * OH * 3)
    for (let y = 0; y < OH; y++) {
        const fila = y * OW * 3
        for (let k = 0; k < 3; k++) {
            let suma = 0
            for (let x = -radio; x <= radio; x++) suma += src[fila + Math.min(OW - 1, Math.max(0, x)) * 3 + k]
            for (let x = 0; x < OW; x++) {
                tmp[fila + x * 3 + k] = suma / n
                const sale = Math.min(OW - 1, Math.max(0, x - radio))
                const entra = Math.min(OW - 1, Math.max(0, x + radio + 1))
                suma += src[fila + entra * 3 + k] - src[fila + sale * 3 + k]
            }
        }
    }
    const out = Buffer.alloc(OW * OH * 3)
    for (let x = 0; x < OW; x++) {
        for (let k = 0; k < 3; k++) {
            let suma = 0
            for (let y = -radio; y <= radio; y++) suma += tmp[Math.min(OH - 1, Math.max(0, y)) * OW * 3 + x * 3 + k]
            for (let y = 0; y < OH; y++) {
                out[y * OW * 3 + x * 3 + k] = suma / n
                const sale = Math.min(OH - 1, Math.max(0, y - radio))
                const entra = Math.min(OH - 1, Math.max(0, y + radio + 1))
                suma += tmp[entra * OW * 3 + x * 3 + k] - tmp[sale * OW * 3 + x * 3 + k]
            }
        }
    }
    return out
}

/** Aplica el desenfoque, la desaturación y el oscurecido según la lejanía. */
function tratarEntorno(o, OW, OH, marco) {
    const { lotes, lado, X0, X1, Y0, Y1 } = marco
    const { f, MW, MH } = mapaDeLejania(lotes, OW, OH, X0, X1, Y0, Y1, lado)
    const borroso = desenfocar(o, OW, OH, Math.round(OW * ENTORNO.desenfoque))

    for (let j = 0; j < OH; j++) {
        // La máscara es más chica: se interpola en bilineal.
        const my = (j + 0.5) / OH * MH - 0.5
        const j0 = Math.max(0, Math.min(MH - 1, Math.floor(my))), j1 = Math.min(MH - 1, j0 + 1)
        const tj = Math.max(0, Math.min(1, my - j0))
        for (let i = 0; i < OW; i++) {
            const mx = (i + 0.5) / OW * MW - 0.5
            const i0 = Math.max(0, Math.min(MW - 1, Math.floor(mx))), i1 = Math.min(MW - 1, i0 + 1)
            const ti = Math.max(0, Math.min(1, mx - i0))
            const v = (f[j0 * MW + i0] * (1 - ti) + f[j0 * MW + i1] * ti) * (1 - tj)
                + (f[j1 * MW + i0] * (1 - ti) + f[j1 * MW + i1] * ti) * tj
            if (v <= 0.002) continue

            const q = (j * OW + i) * 3
            const r = o[q] + (borroso[q] - o[q]) * v
            const g = o[q + 1] + (borroso[q + 1] - o[q + 1]) * v
            const b = o[q + 2] + (borroso[q + 2] - o[q + 2]) * v
            const luz = 0.299 * r + 0.587 * g + 0.114 * b
            const ds = ENTORNO.desatura * v, os = 1 - ENTORNO.oscurece * v
            o[q] = (r + (luz - r) * ds) * os
            o[q + 1] = (g + (luz - g) * ds) * os
            o[q + 2] = (b + (luz - b) * ds) * os
        }
    }
}

/**
 * Pinta cada lote con su identificador en los canales rojo y verde.
 *
 * Punto en poligono por cruce de rayo, recorriendo solo la caja de cada lote:
 * sin suavizado, para que en el limite entre dos lotes no aparezca un
 * identificador que no existe.
 */
function rasterizar(lotes, OW, OH, X0, X1, Y0, Y1) {
    const buf = Buffer.alloc(OW * OH * 3)
    const cuenta = {}
    const aI = x => (x - X0) / (X1 - X0) * OW
    const aJ = y => (Y1 - y) / (Y1 - Y0) * OH

    lotes.forEach((l, k) => {
        const id = k + 1
        // Sin numero no se elige: ver por que en el orden provisional.
        if (l.n == null) { cuenta[id] = 0; return }
        const P = l.g.map(([x, y]) => [aI(x), aJ(y)])
        const i0 = Math.max(0, Math.floor(Math.min(...P.map(p => p[0]))))
        const i1 = Math.min(OW - 1, Math.ceil(Math.max(...P.map(p => p[0]))))
        const j0 = Math.max(0, Math.floor(Math.min(...P.map(p => p[1]))))
        const j1 = Math.min(OH - 1, Math.ceil(Math.max(...P.map(p => p[1]))))
        let n = 0
        for (let j = j0; j <= j1; j++) {
            const py = j + 0.5
            for (let i = i0; i <= i1; i++) {
                const px = i + 0.5
                let dentro = false
                for (let a = 0, b = P.length - 1; a < P.length; b = a++) {
                    const [xa, ya] = P[a], [xb, yb] = P[b]
                    if ((ya > py) !== (yb > py) && px < (xb - xa) * (py - ya) / (yb - ya) + xa) dentro = !dentro
                }
                if (!dentro) continue
                const q = (j * OW + i) * 3
                buf[q] = id & 255
                buf[q + 1] = (id >> 8) & 255
                n++
            }
        }
        cuenta[id] = n
    })
    return { buf, cuenta }
}

main().catch(e => { console.error(e); process.exit(1) })
