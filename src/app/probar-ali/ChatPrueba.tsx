'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import styles from './page.module.css'

/**
 * La conversación vive en el navegador: cada vez se manda el historial
 * completo a /api/ali/prueba, como lo hace el CRM con Instagram y Facebook.
 *
 * Feedback del equipo (16-11-2026): quien prueba dice quién es, marca 👍/👎 en
 * cada respuesta de Ali y, con 👎, qué debió decir. La conversación se guarda
 * sola en el CRM web (/api/ali/prueba/guardar → Agentes IA → Pruebas del equipo).
 */

type Canal = 'instagram' | 'facebook' | 'whatsapp'
type Voto = 'bien' | 'mal'

type Item =
    | { tipo: 'cliente'; texto: string }
    | { tipo: 'ali'; texto: string; turno: number; voto?: Voto | null; correccion?: string }
    | { tipo: 'aviso'; texto: string }

type Guardado = 'nada' | 'guardando' | 'ok' | 'error'

const ASESORES = ['Marcela', 'Bárbara', 'Orlando', 'Patricio', 'Chris', 'Marcela CEO', 'Nicolás']
const CLAVE_ASESOR = 'probar-ali:asesor'

function leerAsesor() {
    try {
        return localStorage.getItem(CLAVE_ASESOR) || ''
    } catch {
        return ''
    }
}

function recordarAsesor(nombre: string) {
    try {
        if (nombre) localStorage.setItem(CLAVE_ASESOR, nombre)
        else localStorage.removeItem(CLAVE_ASESOR)
    } catch {
        /* sin almacenamiento: se vuelve a preguntar la próxima vez */
    }
}

interface Contacto {
    nombre: string | null
    telefono: string | null
    email: string | null
}

const CANALES: { id: Canal; nombre: string }[] = [
    { id: 'instagram', nombre: 'Instagram' },
    { id: 'facebook', nombre: 'Facebook' },
    { id: 'whatsapp', nombre: 'WhatsApp' },
]

const SUGERENCIAS = ['Hola, quiero info', '¿Cuánto cuestan los terrenos?', '¿Vienen con rol propio?', '¿Tienen agua y luz?']

const nuevoId = () => Math.random().toString(36).slice(2, 12)
const esperar = (ms: number) => new Promise(r => setTimeout(r, ms))

export default function ChatPrueba() {
    const [canal, setCanal] = useState<Canal>('instagram')
    const [items, setItems] = useState<Item[]>([])
    const [texto, setTexto] = useState('')
    const [escribiendo, setEscribiendo] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [copiado, setCopiado] = useState(false)
    const [asesor, setAsesor] = useState('')
    const [listo, setListo] = useState(false)
    const [otro, setOtro] = useState('')
    const [nota, setNota] = useState('')
    const [verNota, setVerNota] = useState(false)
    const [corrigiendo, setCorrigiendo] = useState<number | null>(null)
    const [guardado, setGuardado] = useState<Guardado>('nada')
    const id = useRef(nuevoId())
    const contacto = useRef<Contacto>({ nombre: null, telefono: null, email: null })
    const turno = useRef(0)
    const fin = useRef<HTMLDivElement>(null)
    const ultimoGuardado = useRef('')

    useEffect(() => {
        setAsesor(leerAsesor())
        setListo(true)
    }, [])

    useEffect(() => {
        if (corrigiendo === null) fin.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, [items, escribiendo, corrigiendo])

    // Guardado automático en el CRM web, con una pausa para no mandar cada tecla.
    useEffect(() => {
        if (!asesor || escribiendo || !items.some(it => it.tipo === 'ali')) return
        const cuerpo = JSON.stringify({
            id: id.current,
            asesor,
            canal,
            nota: nota.trim() || null,
            mensajes: items.map(it =>
                it.tipo === 'ali'
                    ? { de: 'ali', texto: it.texto, voto: it.voto ?? null, correccion: it.voto === 'mal' ? it.correccion || null : null }
                    : { de: it.tipo, texto: it.texto }
            ),
        })
        if (cuerpo === ultimoGuardado.current) return
        const t = setTimeout(async () => {
            setGuardado('guardando')
            try {
                const res = await fetch('/api/ali/prueba/guardar', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: cuerpo,
                })
                if (!res.ok) throw new Error()
                ultimoGuardado.current = cuerpo
                setGuardado('ok')
            } catch {
                setGuardado('error')
            }
        }, 1200)
        return () => clearTimeout(t)
    }, [items, nota, asesor, canal, escribiendo])

    function reiniciar(nuevoCanal = canal) {
        setCanal(nuevoCanal)
        setItems([])
        setError(null)
        setTexto('')
        setNota('')
        setVerNota(false)
        setCorrigiendo(null)
        setGuardado('nada')
        id.current = nuevoId()
        contacto.current = { nombre: null, telefono: null, email: null }
        turno.current = 0
    }

    function elegirAsesor(nombre: string) {
        const limpio = nombre.trim().slice(0, 60)
        if (!limpio) return
        recordarAsesor(limpio)
        setAsesor(limpio)
        setOtro('')
    }

    function cambiarAsesor() {
        recordarAsesor('')
        setAsesor('')
        reiniciar()
    }

    function votar(i: number, voto: Voto) {
        setItems(prev =>
            prev.map((it, j) => (j === i && it.tipo === 'ali' ? { ...it, voto: it.voto === voto ? null : voto } : it))
        )
        const actual = items[i]
        const quitando = actual?.tipo === 'ali' && actual.voto === voto
        setCorrigiendo(voto === 'mal' && !quitando ? i : null)
    }

    function corregir(i: number, correccion: string) {
        setItems(prev => prev.map((it, j) => (j === i && it.tipo === 'ali' ? { ...it, correccion } : it)))
    }

    /** Historial para la API: los mensajes de Ali de un mismo turno van juntos, como en el CRM. */
    function historial(lista: Item[]) {
        const mensajes: { de: 'cliente' | 'ali'; texto: string }[] = []
        let ultimoTurno = -1
        for (const it of lista) {
            if (it.tipo === 'cliente') {
                mensajes.push({ de: 'cliente', texto: it.texto })
                ultimoTurno = -1
            } else if (it.tipo === 'ali') {
                const anterior = mensajes[mensajes.length - 1]
                if (anterior?.de === 'ali' && ultimoTurno === it.turno) anterior.texto += `\n\n${it.texto}`
                else mensajes.push({ de: 'ali', texto: it.texto })
                ultimoTurno = it.turno
            }
        }
        return mensajes
    }

    async function enviar(mensaje: string) {
        const limpio = mensaje.trim()
        if (!limpio || escribiendo || !asesor) return
        setError(null)
        setTexto('')
        const conCliente: Item[] = [...items, { tipo: 'cliente', texto: limpio }]
        setItems(conCliente)
        setEscribiendo(true)
        try {
            const res = await fetch('/api/ali/prueba', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ canal, id: id.current, cliente: contacto.current, mensajes: historial(conCliente) }),
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(data.error || 'Ali no pudo responder.')

            const t = ++turno.current
            const nuevos: Item[] = []
            if (data.contacto) {
                const c = data.contacto as Contacto & { interes?: string | null }
                contacto.current = {
                    nombre: c.nombre || contacto.current.nombre,
                    telefono: c.telefono || contacto.current.telefono,
                    email: c.email || contacto.current.email,
                }
                const datos = [c.nombre && `nombre: ${c.nombre}`, c.telefono && `teléfono: ${c.telefono}`, c.email && `correo: ${c.email}`]
                    .filter(Boolean)
                    .join(' · ')
                nuevos.push({ tipo: 'aviso', texto: `📋 Guardaría en el CRM ${datos || 'los datos'}${c.interes ? ` · busca: ${c.interes}` : ''}` })
            }
            if (data.visita) {
                nuevos.push({
                    tipo: 'aviso',
                    texto: `📅 Agendaría (simulado) ${data.visita.proyecto}, ${data.visita.fecha} a las ${data.visita.hora}`,
                })
            }
            if (data.derivacion) {
                nuevos.push({ tipo: 'aviso', texto: `🔔 Avisaría a un asesor: ${data.derivacion.motivo}` })
            }

            // Burbuja por burbuja, con una pausa corta, como en el chat real.
            const burbujas: string[] = data.burbujas || []
            for (let i = 0; i < burbujas.length; i++) {
                if (i > 0) await esperar(Math.min(1800, 400 + burbujas[i].length * 12))
                setItems(prev => [...prev, { tipo: 'ali', texto: burbujas[i], turno: t }])
            }
            if (!burbujas.length && !nuevos.length) nuevos.push({ tipo: 'aviso', texto: 'Ali no respondió nada a este mensaje.' })
            if (nuevos.length) setItems(prev => [...prev, ...nuevos])
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Ali no pudo responder.')
            // Se quita el mensaje que no tuvo respuesta para poder reintentar.
            setItems(items)
            setTexto(limpio)
        } finally {
            setEscribiendo(false)
        }
    }

    async function copiar() {
        const nombreCanal = CANALES.find(c => c.id === canal)?.nombre
        const lineas = items.map(it => {
            if (it.tipo === 'cliente') return `Cliente: ${it.texto}`
            if (it.tipo === 'aviso') return `[${it.texto}]`
            const voto = it.voto === 'bien' ? ' 👍' : it.voto === 'mal' ? ` 👎${it.correccion ? `\n→ Debió decir: ${it.correccion}` : ''}` : ''
            return `Ali: ${it.texto}${voto}`
        })
        if (nota.trim()) lineas.push(`Comentario: ${nota.trim()}`)
        try {
            await navigator.clipboard.writeText(`Prueba de Ali (${nombreCanal}) · ${asesor}\n\n${lineas.join('\n\n')}`)
            setCopiado(true)
            setTimeout(() => setCopiado(false), 2000)
        } catch {
            setError('No se pudo copiar. Selecciona el texto a mano.')
        }
    }

    return (
        <div className={styles.pagina}>
            <div className={styles.app}>
                <header className={styles.cabecera}>
                    <div className={styles.identidad}>
                        <div className={styles.avatar}>
                            <Image src="/images/logo-alimin-imagotipo.webp" alt="" width={40} height={40} />
                        </div>
                        <div>
                            <h1 className={styles.titulo}>Ali · modo prueba</h1>
                            <p className={styles.subtitulo}>
                                {escribiendo ? (
                                    'escribiendo…'
                                ) : asesor ? (
                                    <>
                                        Prueba {asesor} ·{' '}
                                        <button type="button" className={styles.enlace} onClick={cambiarAsesor}>
                                            cambiar
                                        </button>
                                        {guardado !== 'nada' && (
                                            <span className={guardado === 'error' ? styles.guardadoError : undefined}>
                                                {' · '}
                                                {guardado === 'guardando' ? 'guardando…' : guardado === 'ok' ? 'guardado ✓' : 'no se guardó'}
                                            </span>
                                        )}
                                    </>
                                ) : (
                                    'Asistente virtual de Alimin'
                                )}
                            </p>
                        </div>
                    </div>
                    <div className={styles.acciones}>
                        <button
                            type="button"
                            className={`${styles.boton} ${verNota || nota.trim() ? styles.botonActivo : ''}`}
                            onClick={() => setVerNota(v => !v)}
                            disabled={!items.some(it => it.tipo === 'ali')}
                        >
                            Comentario
                        </button>
                        <button type="button" className={styles.boton} onClick={copiar} disabled={!items.length}>
                            {copiado ? 'Copiado ✓' : 'Copiar'}
                        </button>
                        <button type="button" className={styles.boton} onClick={() => reiniciar()} disabled={!items.length}>
                            Reiniciar
                        </button>
                    </div>
                </header>

                <div className={styles.canales} role="tablist" aria-label="Canal que se simula">
                    {CANALES.map(c => (
                        <button
                            key={c.id}
                            type="button"
                            role="tab"
                            aria-selected={canal === c.id}
                            className={`${styles.canal} ${canal === c.id ? styles.canalActivo : ''}`}
                            onClick={() => c.id !== canal && reiniciar(c.id)}
                        >
                            {c.nombre}
                        </button>
                    ))}
                </div>

                <main className={styles.conversacion}>
                    <div className={styles.nota}>
                        Esto es una prueba: Ali responde igual que a un cliente de {CANALES.find(c => c.id === canal)?.nombre}, pero
                        no se crean leads, no se avisa a los asesores y las visitas no se agendan de verdad. Puedes inventar
                        nombre, teléfono y correo. Marca 👍 o 👎 en cada respuesta: la conversación se guarda sola para mejorar a Ali.
                    </div>

                    {listo && !asesor && (
                        <div className={styles.quien}>
                            <p className={styles.quienTitulo}>¿Quién está probando?</p>
                            <div className={styles.sugerencias}>
                                {ASESORES.map(a => (
                                    <button key={a} type="button" className={styles.sugerencia} onClick={() => elegirAsesor(a)}>
                                        {a}
                                    </button>
                                ))}
                            </div>
                            <form
                                className={styles.quienOtro}
                                onSubmit={e => {
                                    e.preventDefault()
                                    elegirAsesor(otro)
                                }}
                            >
                                <input
                                    className={styles.quienCampo}
                                    value={otro}
                                    onChange={e => setOtro(e.target.value)}
                                    placeholder="Otro nombre"
                                    maxLength={60}
                                    aria-label="Tu nombre"
                                />
                                <button type="submit" className={styles.boton} disabled={!otro.trim()}>
                                    Listo
                                </button>
                            </form>
                        </div>
                    )}

                    {asesor && !items.length && (
                        <div className={styles.sugerencias}>
                            {SUGERENCIAS.map(s => (
                                <button key={s} type="button" className={styles.sugerencia} onClick={() => enviar(s)}>
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}

                    {items.map((it, i) =>
                        it.tipo === 'aviso' ? (
                            <div key={i} className={styles.aviso}>
                                {it.texto}
                            </div>
                        ) : it.tipo === 'cliente' ? (
                            <div key={i} className={`${styles.burbuja} ${styles.cliente}`}>
                                {it.texto}
                            </div>
                        ) : (
                            <div key={i} className={styles.bloqueAli}>
                                <div
                                    className={`${styles.burbuja} ${styles.ali} ${it.voto === 'mal' ? styles.aliMal : it.voto === 'bien' ? styles.aliBien : ''}`}
                                >
                                    {it.texto}
                                </div>
                                <div className={styles.votos}>
                                    <button
                                        type="button"
                                        className={`${styles.voto} ${it.voto === 'bien' ? styles.votoBien : ''}`}
                                        onClick={() => votar(i, 'bien')}
                                        aria-pressed={it.voto === 'bien'}
                                        aria-label="Buena respuesta"
                                    >
                                        👍
                                    </button>
                                    <button
                                        type="button"
                                        className={`${styles.voto} ${it.voto === 'mal' ? styles.votoMal : ''}`}
                                        onClick={() => votar(i, 'mal')}
                                        aria-pressed={it.voto === 'mal'}
                                        aria-label="Mala respuesta"
                                    >
                                        👎
                                    </button>
                                    {it.voto === 'mal' && corrigiendo !== i && (
                                        <button type="button" className={styles.enlace} onClick={() => setCorrigiendo(i)}>
                                            {it.correccion ? `Debió decir: ${it.correccion.slice(0, 40)}${it.correccion.length > 40 ? '…' : ''}` : 'Escribir qué debió decir'}
                                        </button>
                                    )}
                                </div>
                                {it.voto === 'mal' && corrigiendo === i && (
                                    <div className={styles.correccion}>
                                        <textarea
                                            className={styles.correccionCampo}
                                            value={it.correccion || ''}
                                            onChange={e => corregir(i, e.target.value)}
                                            placeholder="¿Qué debió decir o hacer Ali? Ej.: no digas agua potable, es agua de pozo potabilizada"
                                            rows={3}
                                            maxLength={2000}
                                            autoFocus
                                        />
                                        <button type="button" className={styles.boton} onClick={() => setCorrigiendo(null)}>
                                            Listo
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    )}

                    {escribiendo && (
                        <div className={`${styles.burbuja} ${styles.ali} ${styles.puntos}`} aria-label="Ali está escribiendo">
                            <span />
                            <span />
                            <span />
                        </div>
                    )}
                    <div ref={fin} />
                </main>

                {error && <div className={styles.error}>{error}</div>}

                {verNota && (
                    <div className={styles.comentario}>
                        <textarea
                            className={styles.correccionCampo}
                            value={nota}
                            onChange={e => setNota(e.target.value)}
                            placeholder="Comentario general de esta conversación. Ej.: muy insistente pidiendo el teléfono"
                            rows={2}
                            maxLength={2000}
                            autoFocus
                        />
                        <button type="button" className={styles.boton} onClick={() => setVerNota(false)}>
                            Listo
                        </button>
                    </div>
                )}

                <form
                    className={styles.entrada}
                    onSubmit={e => {
                        e.preventDefault()
                        enviar(texto)
                    }}
                >
                    <textarea
                        className={styles.campo}
                        value={texto}
                        onChange={e => setTexto(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                enviar(texto)
                            }
                        }}
                        placeholder={asesor ? 'Escríbele a Ali…' : 'Primero elige quién está probando'}
                        disabled={!asesor}
                        rows={1}
                        maxLength={1500}
                        aria-label="Mensaje para Ali"
                    />
                    <button type="submit" className={styles.enviar} disabled={!texto.trim() || escribiendo}>
                        Enviar
                    </button>
                </form>
            </div>
        </div>
    )
}
