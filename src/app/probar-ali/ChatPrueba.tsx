'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import styles from './page.module.css'

/**
 * La conversación vive solo en el navegador: cada vez se manda el historial
 * completo a /api/ali/prueba, como lo hace el CRM con Instagram y Facebook.
 */

type Canal = 'instagram' | 'facebook' | 'whatsapp'

type Item =
    | { tipo: 'cliente'; texto: string }
    | { tipo: 'ali'; texto: string; turno: number }
    | { tipo: 'aviso'; texto: string }

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
    const id = useRef(nuevoId())
    const contacto = useRef<Contacto>({ nombre: null, telefono: null, email: null })
    const turno = useRef(0)
    const fin = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fin.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, [items, escribiendo])

    function reiniciar(nuevoCanal = canal) {
        setCanal(nuevoCanal)
        setItems([])
        setError(null)
        setTexto('')
        id.current = nuevoId()
        contacto.current = { nombre: null, telefono: null, email: null }
        turno.current = 0
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
        if (!limpio || escribiendo) return
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
        const lineas = items.map(it =>
            it.tipo === 'cliente' ? `Cliente: ${it.texto}` : it.tipo === 'ali' ? `Ali: ${it.texto}` : `[${it.texto}]`
        )
        try {
            await navigator.clipboard.writeText(`Prueba de Ali (${nombreCanal})\n\n${lineas.join('\n\n')}`)
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
                                {escribiendo ? 'escribiendo…' : 'Asistente virtual de Alimin'}
                            </p>
                        </div>
                    </div>
                    <div className={styles.acciones}>
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
                        nombre, teléfono y correo.
                    </div>

                    {!items.length && (
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
                        ) : (
                            <div key={i} className={`${styles.burbuja} ${it.tipo === 'cliente' ? styles.cliente : styles.ali}`}>
                                {it.texto}
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
                        placeholder="Escríbele a Ali…"
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
