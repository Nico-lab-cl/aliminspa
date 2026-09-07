/*
 * Pone en public/lomas3d/mapa-data.json la superficie oficial de cada lote.
 *
 * El export del mapa trae en `area` la superficie medida sobre el polígono
 * dibujado, que no es la de la escritura: al comparar los 116 lotes contra
 * src/services/lotSpecs.ts —el archivo que el proyecto declara fuente de
 * verdad— 112 no calzaban, con diferencias de hasta 8 % (un lote de 200 m²
 * aparecía como 185). En una página de venta esa cifra no puede ser una
 * medición aproximada.
 *
 * El script deja:
 *   area     → superficie de escritura (lotSpecs)
 *   geoArea  → la medida sobre el polígono, que es la que usa la geometría
 *
 * Volver a correrlo cada vez que se re-sincronicen los polígonos desde
 * Nico-lab-cl/Lomas-del-mar (ver Agendamiento-dron/github.md):
 *
 *   node scripts/sync-lot-areas.js
 */

const fs = require('fs')
const path = require('path')
const ts = require('typescript')

const RAIZ = path.join(__dirname, '..')
const SPECS = path.join(RAIZ, 'src/services/lotSpecs.ts')
const MAPA = path.join(RAIZ, 'public/lomas3d/mapa-data.json')

function cargarSpecs() {
    // lotSpecs.ts importa "@/types", que no existe en esta app: para leer las
    // reglas de superficie ese tipo no hace falta.
    const fuente = fs
        .readFileSync(SPECS, 'utf8')
        .replace(/^import .*$/m, '')
        .replace(/LotDimensions/g, 'any')

    const js = ts.transpileModule(fuente, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
    }).outputText

    const mod = { exports: {} }
    new Function('module', 'exports', 'require', js)(mod, mod.exports, require)
    return mod.exports
}

function main() {
    const { getStageLotSpec } = cargarSpecs()
    const data = JSON.parse(fs.readFileSync(MAPA, 'utf8'))

    let corregidos = 0
    let sinSpec = 0
    const conflictosDeEstado = []

    for (const lot of data.lots) {
        const spec = getStageLotSpec(lot.stage, lot.n)
        if (!spec) {
            sinSpec++
            continue
        }

        if (lot.geoArea == null) lot.geoArea = lot.area

        if (spec.area_m2 != null && lot.area !== spec.area_m2) {
            lot.area = spec.area_m2
            corregidos++
        }

        // El estado de venta no se toca acá: si alguna vez deja de calzar hay
        // que revisarlo a mano, no pisarlo en silencio.
        if (spec.forceSold !== lot.sold) {
            conflictosDeEstado.push(`Etapa ${lot.stage} lote ${lot.n}: mapa=${lot.sold} specs=${spec.forceSold}`)
        }
    }

    fs.writeFileSync(MAPA, JSON.stringify(data))

    console.log(`Lotes: ${data.lots.length}`)
    console.log(`Superficies corregidas: ${corregidos}`)
    console.log(`Sin spec oficial: ${sinSpec}`)
    if (conflictosDeEstado.length) {
        console.warn('\nOJO — vendido/disponible no calza con lotSpecs.ts:')
        conflictosDeEstado.forEach(c => console.warn('  ' + c))
    } else {
        console.log('Vendido/disponible: calza con lotSpecs.ts')
    }
}

main()
