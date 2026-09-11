/*
 * Le pone numero, etapa y estado a los lotes detectados en el plano cenital,
 * cruzandolos con el catastro del proyecto Lomas-del-mar-update4.
 *
 * Ese proyecto tiene dos archivos que juntos son el catastro completo:
 * lotPolygons.json, con 201 poligonos en coordenadas geograficas reales, y
 * lots.json, con numero, etapa y estado de cada uno. Se unen por id.
 *
 * Acá no se adivina nada por orden de hilera. Se calza nube contra nube: los
 * centros de los lotes detectados contra los centros del catastro. Como las
 * dos son el mismo loteo, existe un giro, una escala y un desplazamiento que
 * los hacen coincidir. Se busca el giro probando la vuelta entera, y despues
 * se afina alternando emparejar y reajustar.
 *
 * Al final el emparejamiento es uno a uno y se informa el error tipico. Si ese
 * error no es chico comparado con el tamano de un lote, el calce no sirve y hay
 * que decirlo en vez de publicar numeros inventados.
 *
 *   node scripts/numerar-lotes.js [ruta al proyecto del catastro]
 *
 * Reescribe public/lomas3d/plano-lotes.json con la numeracion puesta.
 */

const fs = require('fs')
const path = require('path')

const RAIZ = path.join(__dirname, '..')
const DATOS = path.join(RAIZ, 'public/lomas3d/plano-lotes.json')
const CATASTRO_POR_DEFECTO =
    'C:/Users/pc/.gemini/antigravity/scratch/lomas-del-mar/Lomas-del-mar-update4'

/** Radio de la Tierra en metros por grado de latitud. */
const R = 111320

function similitud(a, b) {
    /* Giro, escala y desplazamiento que mejor llevan los puntos a sobre los b,
       con las parejas ya conocidas. Es el ajuste clasico de Umeyama en 2D. */
    const n = a.length
    let ax = 0, ay = 0, bx = 0, by = 0
    for (let i = 0; i < n; i++) { ax += a[i][0]; ay += a[i][1]; bx += b[i][0]; by += b[i][1] }
    ax /= n; ay /= n; bx /= n; by /= n
    let punto = 0, cruz = 0, va = 0
    for (let i = 0; i < n; i++) {
        const dax = a[i][0] - ax, day = a[i][1] - ay
        const dbx = b[i][0] - bx, dby = b[i][1] - by
        punto += dax * dbx + day * dby
        cruz += dax * dby - day * dbx
        va += dax * dax + day * day
    }
    const giro = Math.atan2(cruz, punto)
    const escala = va > 0 ? (punto * Math.cos(giro) + cruz * Math.sin(giro)) / va : 1
    const c = Math.cos(giro) * escala, s = Math.sin(giro) * escala
    return { c, s, tx: bx - (c * ax - s * ay), ty: by - (s * ax + c * ay) }
}

const aplicar = (T, p) => T.afin
    ? [T.a * p[0] + T.b * p[1] + T.tx, T.d * p[0] + T.e * p[1] + T.ty]
    : [T.c * p[0] - T.s * p[1] + T.tx, T.s * p[0] + T.c * p[1] + T.ty]

/**
 * Ajuste afin: seis parametros en vez de cuatro.
 *
 * El de similitud solo permite girar, escalar y mover, y con eso el error se
 * quedaba en media cancha de lote. La foto es de dron, no un ortomosaico: tiene
 * algo de perspectiva, asi que las dos direcciones del loteo no estan a la
 * misma escala ni perfectamente a escuadra. El afin absorbe justo eso.
 *
 * Sale de resolver dos sistemas de tres por tres, uno por cada coordenada.
 */
function afin(a, b) {
    const M = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
    const vx = [0, 0, 0], vy = [0, 0, 0]
    for (let i = 0; i < a.length; i++) {
        const f = [a[i][0], a[i][1], 1]
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) M[r][c] += f[r] * f[c]
            vx[r] += f[r] * b[i][0]
            vy[r] += f[r] * b[i][1]
        }
    }
    const resolver = v => {
        // Gauss con pivoteo sobre una copia, que el sistema es minusculo.
        const A = M.map((f, i) => [...f, v[i]])
        for (let i = 0; i < 3; i++) {
            let piv = i
            for (let r = i + 1; r < 3; r++) if (Math.abs(A[r][i]) > Math.abs(A[piv][i])) piv = r
            ;[A[i], A[piv]] = [A[piv], A[i]]
            if (Math.abs(A[i][i]) < 1e-12) return null
            for (let r = 0; r < 3; r++) {
                if (r === i) continue
                const k = A[r][i] / A[i][i]
                for (let c = i; c < 4; c++) A[r][c] -= k * A[i][c]
            }
        }
        return [A[0][3] / A[0][0], A[1][3] / A[1][1], A[2][3] / A[2][2]]
    }
    const X = resolver(vx), Y = resolver(vy)
    if (!X || !Y) return null
    return { afin: true, a: X[0], b: X[1], tx: X[2], d: Y[0], e: Y[1], ty: Y[2] }
}

/** Para cada punto de a, el mas cercano de b. Devuelve indices y distancias. */
function vecinos(a, b) {
    return a.map(p => {
        let mejor = -1, d2 = Infinity
        for (let j = 0; j < b.length; j++) {
            const dx = p[0] - b[j][0], dy = p[1] - b[j][1]
            const d = dx * dx + dy * dy
            if (d < d2) { d2 = d; mejor = j }
        }
        return [mejor, Math.sqrt(d2)]
    })
}

function main() {
    const base = process.argv[2] || CATASTRO_POR_DEFECTO
    const fPoly = path.join(base, 'src/services/lotPolygons.json')
    const fLots = path.join(base, 'src/data/lots.json')
    for (const f of [fPoly, fLots, DATOS]) {
        if (!fs.existsSync(f)) { console.error(`No esta ${f}`); process.exit(1) }
    }

    const poligonos = JSON.parse(fs.readFileSync(fPoly, 'utf8'))
    const registros = JSON.parse(fs.readFileSync(fLots, 'utf8'))
    const porId = new Map(registros.map(l => [l.id, l]))
    const catastro = poligonos.filter(p => porId.has(p.id))
    console.log(`Catastro: ${catastro.length} lotes con poligono y ficha`)

    const salida = JSON.parse(fs.readFileSync(DATOS, 'utf8'))
    const detectados = salida.lotes
    console.log(`Detectados en el plano: ${detectados.length}`)

    // ── las dos nubes, en metros ────────────────────────────────────────────
    const la0 = catastro[0].center.lat
    const kx = R * Math.cos(la0 * Math.PI / 180)
    // El eje y crece hacia el sur, igual que las filas de una imagen.
    const mundo = catastro.map(p => [p.center.lng * kx, -p.center.lat * R])

    /* Los detectados van en fraccion de imagen. Se multiplica la u por la
       relacion de la imagen para que un metro mida lo mismo en los dos ejes;
       la escala global la absorbe el ajuste. */
    const rel = salida.ancho / salida.alto
    const plano = detectados.map(l => [l.u * rel, l.v])

    // ── giro inicial: se prueba la vuelta entera ────────────────────────────
    const centro = pts => {
        let x = 0, y = 0
        for (const p of pts) { x += p[0]; y += p[1] }
        return [x / pts.length, y / pts.length]
    }
    const disp = (pts, c) => {
        let s = 0
        for (const p of pts) s += (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2
        return Math.sqrt(s / pts.length)
    }
    const cP = centro(plano), cM = centro(mundo)
    const escala0 = disp(mundo, cM) / disp(plano, cP)

    let mejor = null
    for (let g = 0; g < 360; g += 2) {
        const a = g * Math.PI / 180
        const c = Math.cos(a) * escala0, s = Math.sin(a) * escala0
        const T = {
            c, s,
            tx: cM[0] - (c * cP[0] - s * cP[1]),
            ty: cM[1] - (s * cP[0] + c * cP[1])
        }
        const v = vecinos(plano.map(p => aplicar(T, p)), mundo)
        const coste = v.reduce((t, [, d]) => t + d, 0) / v.length
        if (!mejor || coste < mejor.coste) mejor = { coste, T, g }
    }
    console.log(`Giro inicial: ${mejor.g}°  error medio ${mejor.coste.toFixed(1)} m`)

    // ── afinado: emparejar y reajustar, alternando ──────────────────────────
    let T = mejor.T
    for (let it = 0; it < 40; it++) {
        const proy = plano.map(p => aplicar(T, p))
        const v = vecinos(proy, mundo)
        // Solo las parejas razonables mandan en el reajuste.
        const corte = 25
        const a = [], b = []
        for (let i = 0; i < v.length; i++) {
            if (v[i][1] > corte) continue
            a.push(plano[i]); b.push(mundo[v[i][0]])
        }
        if (a.length < 20) break
        /* Las primeras vueltas con similitud, para no dejar que el afin se
           acomode a parejas equivocadas antes de que el calce grueso este. */
        T = it < 8 ? similitud(a, b) : (afin(a, b) || similitud(a, b))
    }
    const proy = plano.map(p => aplicar(T, p))
    const v = vecinos(proy, mundo)
    const ds = v.map(x => x[1]).sort((x, y) => x - y)
    const q = f => ds[Math.min(ds.length - 1, Math.floor(ds.length * f))]
    console.log(`Afinado: error mediano ${q(.5).toFixed(1)} m, p90 ${q(.9).toFixed(1)} m, peor ${ds[ds.length - 1].toFixed(1)} m`)

    /* Tamano tipico de un lote, para saber si ese error es chico o no: el lado
       de un cuadrado de 200 m2 son 14 m. */
    const LADO = 14
    if (q(.5) > LADO) {
        console.error(`\nEl calce no sirve: el error mediano (${q(.5).toFixed(1)} m) es mayor que un lote entero.`)
        console.error('No se escribe nada. Los numeros habria que ponerlos a mano.')
        process.exit(1)
    }

    // ── emparejamiento uno a uno, del mas seguro al menos ───────────────────
    const pares = []
    for (let i = 0; i < proy.length; i++) {
        for (let j = 0; j < mundo.length; j++) {
            const dx = proy[i][0] - mundo[j][0], dy = proy[i][1] - mundo[j][1]
            const d = Math.hypot(dx, dy)
            if (d <= LADO * 1.5) pares.push([d, i, j])
        }
    }
    pares.sort((a, b) => a[0] - b[0])
    const tomadoI = new Set(), tomadoJ = new Set()
    let asignados = 0
    for (const [d, i, j] of pares) {
        if (tomadoI.has(i) || tomadoJ.has(j)) continue
        tomadoI.add(i); tomadoJ.add(j)
        const ficha = porId.get(catastro[j].id)
        const l = detectados[i]
        l.n = Number(ficha.number)
        l.stage = ficha.stage
        l.sold = ficha.status !== 'available'
        l.error = +d.toFixed(1)
        asignados++
    }
    console.log(`\nEmparejados uno a uno: ${asignados}`)
    console.log(`  celdas detectadas sin pareja: ${detectados.length - asignados}`)
    console.log(`  lotes del catastro sin pareja: ${catastro.length - asignados}`)

    const porEtapa = {}
    for (const l of detectados) if (l.stage != null) porEtapa[l.stage] = (porEtapa[l.stage] || 0) + 1
    console.log(`  por etapa: ${JSON.stringify(porEtapa)}`)

    salida.provisional = false
    salida._comentario = 'Lotes sacados del plano cenital y numerados cruzandolos con el catastro de Lomas-del-mar-update4 (scripts/importar-plano-cenital.js y scripts/numerar-lotes.js). u y v en fraccion de imagen, origen arriba a la izquierda.'
    fs.writeFileSync(DATOS, JSON.stringify(salida, null, 1))
    console.log(`\nEscrito ${path.basename(DATOS)}`)
}

main()
