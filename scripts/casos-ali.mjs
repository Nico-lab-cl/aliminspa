#!/usr/bin/env node
/**
 * Banco de pruebas de Ali (Fase 2 del roadmap, 20-11-2026).
 *
 * Corre cada caso contra la Ali real en modo prueba (/api/ali/prueba: no crea
 * leads ni avisa a nadie) y la revisa de dos formas, como enseña el curso de
 * evaluaciones de Anthropic:
 *   - por código: "contiene", "no_contiene", "max_burbujas" y "silencio";
 *   - por un juez (/api/ali/juez, Haiku) que lee la MISMA ficha que Ali y
 *     califica de 0 a 100 si cumplió lo que "debe" hacer.
 * Al final saca la nota de Ali y la compara con la nota base guardada: si baja
 * más de 3 puntos o pasan menos casos, termina con error.
 *
 * Casos: scripts/ali-casos.json + los que salen de errores reales en el CRM web
 * (Revisión semanal → "Convertir en caso de prueba").
 *
 *   node scripts/casos-ali.mjs                   # todos, contra https://aliminspa.cl
 *   node scripts/casos-ali.mjs audio             # solo los casos con "audio" en el nombre
 *   node scripts/casos-ali.mjs --guardar-base    # guarda esta nota como la nueva base
 *   node scripts/casos-ali.mjs --sin-juez        # solo las revisiones por código (gratis)
 *   node scripts/casos-ali.mjs http://localhost:3000
 *
 * Clave del juez y de los casos del CRM: IA_SECRET, o el archivo ~/.alimin/ia-secret.
 * Cuándo correrlo: después de cada despliegue que toque a Ali (las pruebas van
 * contra el sitio publicado). Si la nota baja, se vuelve a la versión anterior
 * en EasyPanel y se corrige antes de publicar de nuevo.
 * Costo: ~US$0,002 por caso (respuesta de Ali + juez). Con la clave no cuenta para el límite de 60 por hora del chat de prueba.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = dirname(fileURLToPath(import.meta.url))
const ARCHIVO_CASOS = join(AQUI, 'ali-casos.json')
const ARCHIVO_BASE = join(AQUI, 'ali-nota-base.json')
const NOTA_MINIMA_CASO = 70
const TOLERANCIA = 3
/** Texto corrido máximo por mensaje, para todos los casos (guardia.ts corta en 230). */
const MAX_PARRAFO = 260

const args = process.argv.slice(2)
const banderas = new Set(args.filter(a => a.startsWith('--')))
const BASE = (args.find(a => /^https?:\/\//.test(a)) || 'https://aliminspa.cl').replace(/\/$/, '')
const FILTRO = (args.find(a => !a.startsWith('--') && !/^https?:\/\//.test(a)) || '').toLowerCase()
const CRM_WEB = (process.env.CRM_WEB_URL || 'https://marketing.aliminspa.cl').replace(/\/$/, '')

function secreto() {
    if (process.env.IA_SECRET) return process.env.IA_SECRET.trim()
    const archivo = join(homedir(), '.alimin', 'ia-secret')
    return existsSync(archivo) ? readFileSync(archivo, 'utf8').trim() : ''
}
const SECRETO = secreto()
const CON_JUEZ = Boolean(SECRETO) && !banderas.has('--sin-juez')

/* ── Casos ─────────────────────────────────────────────────────────────── */

function casosLocales() {
    const datos = JSON.parse(readFileSync(ARCHIVO_CASOS, 'utf8'))
    const reemplazar = t => String(t).replace('{{brochure}}', datos.brochure)
    return datos.casos.map(c => ({ ...c, mensajes: c.mensajes.map(m => ({ ...m, texto: reemplazar(m.texto) })) }))
}

async function casosDelCrm() {
    if (!SECRETO || banderas.has('--solo-locales')) return []
    try {
        const res = await fetch(`${CRM_WEB}/api/webhooks/ia/casos-ali`, { headers: { 'x-ia-secret': SECRETO }, signal: AbortSignal.timeout(20_000) })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const { casos } = await res.json()
        return (casos || []).map(c => ({
            nombre: `[CRM #${c.id}] ${c.nombre}`,
            origen: 'revisión semanal',
            canal: c.canal,
            mensajes: c.mensajes,
            debe: c.debe,
        }))
    } catch (error) {
        console.log(`(No pude leer los casos del CRM web: ${error.message}. Sigo solo con los locales.)`)
        return []
    }
}

/* ── Correr y revisar ──────────────────────────────────────────────────── */

async function responderAli(caso) {
    const res = await fetch(`${BASE}/api/ali/prueba`, {
        method: 'POST',
        // Con la clave, el banco no cuenta para el límite de 60 por hora del chat de prueba.
        headers: { 'content-type': 'application/json', ...(SECRETO ? { 'x-ia-secret': SECRETO } : {}) },
        body: JSON.stringify({
            canal: caso.canal,
            id: `banco-${Date.now()}`,
            cliente: { nombre: null, telefono: null, email: null, ...(caso.cliente || {}) },
            mensajes: caso.mensajes,
        }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
    const burbujas = data.burbujas || []
    return { burbujas, texto: burbujas.join('\n\n'), silencio: Boolean(data.silencio), derivacion: data.derivacion || null, intencion: data.intencion || null }
}

function revisarPorCodigo(caso, r) {
    const fallas = []
    const re = p => new RegExp(p, 'i')
    if (caso.silencio === true && !(r.silencio && !r.burbujas.length)) fallas.push('debía no responder')
    if (caso.silencio !== true && !r.burbujas.length) fallas.push('no respondió')
    for (const p of caso.contiene || []) if (!re(p).test(r.texto)) fallas.push(`no contiene /${p}/`)
    for (const p of caso.no_contiene || []) if (re(p).test(r.texto)) fallas.push(`contiene /${p}/`)
    if (caso.max_burbujas && r.burbujas.length > caso.max_burbujas) fallas.push(`${r.burbujas.length} mensajes (máximo ${caso.max_burbujas})`)
    // Párrafos largos: el texto corrido de cada bloque (como lo mide guardia.ts),
    // sin las líneas con ✅ ni enlaces.
    const maxParrafo = caso.max_parrafo ?? MAX_PARRAFO
    for (const b of r.burbujas.flatMap(x => x.split(/\n\s*\n/))) {
        const corrido = b.split('\n').filter(l => !l.trim().startsWith('✅')).join(' ').replace(/https?:\/\/\S+/g, '').trim()
        if (corrido.length > maxParrafo) fallas.push(`párrafo de ${corrido.length} caracteres (máximo ${maxParrafo})`)
    }
    if (caso.deriva === true && !r.derivacion) fallas.push('debía derivar y no derivó')
    if (caso.deriva === false && r.derivacion) fallas.push('derivó sin que correspondiera')
    return fallas
}

async function juzgar(caso, r) {
    const res = await fetch(`${BASE}/api/ali/juez`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-ia-secret': SECRETO },
        body: JSON.stringify({
            canal: caso.canal,
            conversacion: caso.mensajes,
            // El juez no ve las herramientas: si derivó, se lo contamos.
            respuesta: r.derivacion ? [...r.burbujas, `[Nota para el juez, no es un mensaje: Ali usó derivar_a_asesor con el motivo "${r.derivacion.motivo || 'sin motivo'}"]`] : r.burbujas,
            silencio: r.silencio,
            debe: caso.debe || [],
        }),
        signal: AbortSignal.timeout(90_000),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || `juez HTTP ${res.status}`)
    return data
}

/* ── Principal ─────────────────────────────────────────────────────────── */

const todos = [...casosLocales(), ...(await casosDelCrm())]
const elegidos = todos.filter(c => !FILTRO || c.nombre.toLowerCase().includes(FILTRO))
console.log(`Banco de pruebas de Ali: ${elegidos.length} casos contra ${BASE}${CON_JUEZ ? ', con juez' : ', sin juez (falta IA_SECRET o --sin-juez)'}.`)

const resultados = []
for (const caso of elegidos) {
    try {
        const r = await responderAli(caso)
        const fallasCodigo = revisarPorCodigo(caso, r)
        let veredicto = null
        if (CON_JUEZ) {
            try {
                veredicto = await juzgar(caso, r)
            } catch (error) {
                console.log(`   (el juez falló: ${error.message})`)
            }
        }
        // Una falla por código pesa más que la opinión del juez.
        let nota = veredicto ? veredicto.nota : fallasCodigo.length ? 0 : 100
        if (fallasCodigo.length) nota = Math.min(nota, 40)
        const incumplidos = (veredicto?.criterios || []).filter(c => !c.cumple)
        const pasa = !fallasCodigo.length && nota >= NOTA_MINIMA_CASO
        // Clasificador (Fase 3): se mide aparte, no baja la nota del caso.
        const esperado = caso.tipo ? [].concat(caso.tipo) : null
        const tipo = r.intencion?.tipo || null
        const clasificoBien = esperado ? Boolean(tipo && esperado.includes(tipo)) : null
        resultados.push({ nombre: caso.nombre, nota, pasa, clasificoBien })

        console.log(`\n${pasa ? '✓' : '✗'} ${caso.nombre}${veredicto || fallasCodigo.length ? `   nota ${nota}` : ''}`)
        if (esperado) console.log(`   ${clasificoBien ? '·' : '✗'} tipo: ${tipo || '(sin clasificar)'}${clasificoBien ? '' : ` (esperado ${esperado.join(' o ')})`}`)
        if (r.derivacion) console.log(`   (derivó: ${r.derivacion.motivo || JSON.stringify(r.derivacion).slice(0, 80)})`)
        console.log(r.silencio && !r.burbujas.length ? '   (sin respuesta, a propósito)' : r.burbujas.map(b => `   │ ${b.replace(/\n/g, '\n   │ ')}`).join('\n   ·\n'))
        for (const f of fallasCodigo) console.log(`   ✗ código: ${f}`)
        for (const c of incumplidos) console.log(`   ✗ juez: ${c.debe} → ${c.motivo}`)
        if (veredicto && !pasa && !incumplidos.length && veredicto.comentario) console.log(`   · juez: ${veredicto.comentario}`)
    } catch (error) {
        resultados.push({ nombre: caso.nombre, nota: 0, pasa: false })
        console.log(`\n✗ ${caso.nombre}\n   error: ${error.message}`)
    }
}

const pasan = resultados.filter(r => r.pasa).length
const nota = resultados.length ? Math.round(resultados.reduce((a, r) => a + r.nota, 0) / resultados.length) : 0
console.log(`\nAli: ${nota}/100 · ${pasan}/${resultados.length} casos bien.`)
const conTipo = resultados.filter(r => r.clasificoBien !== null)
if (conTipo.length) console.log(`Clasificador: ${conTipo.filter(r => r.clasificoBien).length}/${conTipo.length} mensajes con el tipo esperado.`)

// La nota base solo se compara con una corrida completa y con juez.
const completa = !FILTRO && CON_JUEZ
let bajo = false
if (completa && existsSync(ARCHIVO_BASE)) {
    const base = JSON.parse(readFileSync(ARCHIVO_BASE, 'utf8'))
    const delta = nota - base.nota
    console.log(`Nota base: ${base.nota}/100 · ${base.pasan}/${base.casos} (${base.fecha}). Cambio: ${delta >= 0 ? '+' : ''}${delta}.`)
    if (nota < base.nota - TOLERANCIA || pasan < base.pasan) {
        bajo = true
        console.log('⚠ Ali quedó peor que la base: revisar antes de dejar este cambio publicado.')
    }
}
if (banderas.has('--guardar-base')) {
    if (!completa) console.log('No guardo la base: hace falta una corrida completa (sin filtro) y con juez.')
    else {
        writeFileSync(ARCHIVO_BASE, JSON.stringify({ nota, pasan, casos: resultados.length, fecha: new Date().toISOString().slice(0, 10) }, null, 2) + '\n')
        console.log(`Nota base guardada: ${nota}/100 · ${pasan}/${resultados.length}.`)
    }
}

// exitCode y no exit(): en Windows, exit() con fetch abiertos corta con un assert de libuv.
process.exitCode = bajo || pasan < resultados.length ? 1 : 0
