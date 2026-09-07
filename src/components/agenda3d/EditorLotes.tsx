'use client'

/**
 * Editor de lotes sobre el mapa 3D.
 *
 * Se entra con /agendar-visita?editor=1 y sirve para colocar los lotes a mano
 * mirando la foto del dron: cada clic en el terreno deja un lote del tamaño
 * configurado, y el último giro se conserva para que una fila entera se arme
 * clic tras clic sin volver a tocar nada.
 *
 * Lo que se dibuja acá manda sobre los polígonos del repo: al guardar queda en
 * public/lomas3d/lotes-editados.json y el visor lo carga en vez de los
 * originales, que quedan intactos en mapa-data.json.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Lot, ViewerHandle } from './Lote3DViewer'
import styles from './Agenda3D.module.css'

/** Un lote del editor: centro, giro y tamaño. Todos comparten dimensiones. */
export interface LoteEditor {
    id: number
    n: number
    stage: number
    cx: number
    cy: number
    /** Giro en grados. */
    rot: number
    ancho: number
    fondo: number
    sold: boolean
}

/** Los dos precios que maneja el proyecto, según superficie. */
const PRECIO_CHICO = 35990000
const PRECIO_GRANDE = 43990000

const precioDe = (area: number) => (area < 300 ? PRECIO_CHICO : PRECIO_GRANDE)

/** Las cuatro esquinas de un lote, en las coordenadas locales del loteo. */
export function esquinas(l: LoteEditor): Array<[number, number]> {
    const a = (l.rot * Math.PI) / 180
    const cos = Math.cos(a)
    const sin = Math.sin(a)
    const hw = l.ancho / 2
    const hf = l.fondo / 2
    return ([[-hw, -hf], [hw, -hf], [hw, hf], [-hw, hf]] as Array<[number, number]>).map(
        ([dx, dz]) => [
            +(l.cx + dx * cos - dz * sin).toFixed(2),
            +(l.cy + dx * sin + dz * cos).toFixed(2),
        ] as [number, number]
    )
}

/** Pasa un lote del editor al formato que consume el visor. */
export function aLot(l: LoteEditor): Lot {
    const area = Math.round(l.ancho * l.fondo)
    return {
        id: l.id,
        n: l.n,
        stage: l.stage,
        area,
        sold: l.sold,
        price: precioDe(area),
        cx: l.cx,
        cy: l.cy,
        rot: l.rot,
        p: esquinas(l),
    }
}

interface Props {
    viewer: ViewerHandle | null
}

export default function EditorLotes({ viewer }: Props) {
    const [lotes, setLotes] = useState<LoteEditor[]>([])
    const [ancho, setAncho] = useState(10)
    const [fondo, setFondo] = useState(20)
    const [etapa, setEtapa] = useState(1)
    const [numero, setNumero] = useState(1)
    const [rot, setRot] = useState(0)
    const [selId, setSelId] = useState<number | null>(null)
    const [colocando, setColocando] = useState(false)
    const [estado, setEstado] = useState('')
    const [arrastre, setArrastre] = useState<'mover' | 'girar'>('mover')
    const [lista, setLista] = useState(false)

    // Los listeners del visor se montan una sola vez: leen los ajustes de acá
    // para no tener que reengancharse en cada tecla que el usuario cambia.
    const ajustes = useRef({ ancho, fondo, etapa, numero, rot, colocando })
    ajustes.current = { ancho, fondo, etapa, numero, rot, colocando }

    const sel = lotes.find(l => l.id === selId) ?? null

    // El id elegido se lee desde callbacks que se crean una sola vez.
    const selIdRef = useRef<number | null>(null)
    selIdRef.current = selId
    // Al encadenar, el lote nuevo pasa a ser el elegido: así se sigue la fila.
    const nuevoIdRef = useRef<number | null>(null)

    /* ─── carga de lo que ya estuviera dibujado ─── */

    useEffect(() => {
        fetch('/lomas3d/lotes-editados.json')
            .then(r => (r.ok ? r.json() : null))
            .then(d => {
                if (!d?.lotes?.length) return
                /* Los archivos guardados antes de este cambio no traen ancho
                   ni fondo: se recuperan de las aristas del polígono, o el
                   editor no podría volver a moverlos ni girarlos. */
                const dist = (a: number[], b: number[]) => Math.hypot(b[0] - a[0], b[1] - a[1])
                const previos: LoteEditor[] = d.lotes.map((l: LoteEditor & { p?: number[][] }) => ({
                    ...l,
                    ancho: l.ancho ?? (l.p ? +dist(l.p[0], l.p[1]).toFixed(2) : 10),
                    fondo: l.fondo ?? (l.p ? +dist(l.p[1], l.p[2]).toFixed(2) : 20),
                }))
                setLotes(previos)
                setNumero(Math.max(...previos.map(l => l.n)) + 1)
                if (d.dimension) {
                    setAncho(d.dimension.ancho ?? 10)
                    setFondo(d.dimension.fondo ?? 20)
                }
            })
            .catch(() => { })
    }, [])

    /* ─── el visor refleja lo dibujado ─── */

    useEffect(() => {
        if (!viewer) return
        viewer.setEditor(true)
        return () => viewer.setEditor(false)
    }, [viewer])

    useEffect(() => {
        viewer?.setLots(lotes.map(aLot))
        if (nuevoIdRef.current != null) {
            setSelId(nuevoIdRef.current)
            nuevoIdRef.current = null
        }
    }, [viewer, lotes])

    /* ─── colocar y seleccionar ─── */

    const colocar = useCallback((punto: { x: number; z: number }, forzar = false) => {
        const a = ajustes.current
        if (!a.colocando && !forzar) return
        setLotes(prev => {
            const id = prev.length ? Math.max(...prev.map(l => l.id)) + 1 : 1
            // Queda elegido al tiro: así se puede encadenar la fila con D sin
            // tener que volver a tocarlo.
            nuevoIdRef.current = id
            return [...prev, {
                id, n: a.numero, stage: a.etapa,
                cx: punto.x, cy: punto.z, rot: a.rot,
                ancho: a.ancho, fondo: a.fondo, sold: false,
            }]
        })
        setNumero(n => n + 1)
    }, [])

    useEffect(() => {
        const el = viewer as unknown as HTMLElement | null
        if (!el) return
        const enSuelo = (e: Event) => colocar((e as CustomEvent<{ x: number; z: number }>).detail)
        const enLote = (e: Event) => setSelId((e as CustomEvent<Lot>).detail.id)
        const enArrastre = (e: Event) => {
            const d = (e as CustomEvent<{ id: number; cx: number; cy: number }>).detail
            setLotes(prev => prev.map(l => (l.id === d.id ? { ...l, cx: d.cx, cy: d.cy } : l)))
        }
        el.addEventListener('groundpick', enSuelo)
        el.addEventListener('lotpick', enLote)
        el.addEventListener('lotdrag', enArrastre)
        return () => {
            el.removeEventListener('groundpick', enSuelo)
            el.removeEventListener('lotpick', enLote)
            el.removeEventListener('lotdrag', enArrastre)
        }
    }, [viewer, colocar])

    /** Coloca un lote donde apunta la mira del centro de la pantalla. */
    const colocarEnMira = useCallback(() => {
        const punto = viewer?.pickGroundCenter()
        if (punto) colocar(punto, true)
    }, [viewer, colocar])

    /**
     * Repite el lote elegido pegado a uno de sus lados, con el mismo tamaño y
     * giro. Es lo que arma una fila de loteo: colocas el primero, lo orientas,
     * y encadenas el resto sin dejar huecos ni solapes.
     *
     * El desplazamiento va en el marco del propio lote, así que la fila sigue
     * su giro aunque esté torcida respecto del norte.
     */
    const repetir = useCallback((lado: 'derecha' | 'izquierda' | 'frente' | 'fondo') => {
        setLotes(prev => {
            const base = prev.find(l => l.id === selIdRef.current)
            if (!base) return prev
            const off = {
                derecha: [base.ancho, 0],
                izquierda: [-base.ancho, 0],
                frente: [0, -base.fondo],
                fondo: [0, base.fondo],
            }[lado]
            const a = (base.rot * Math.PI) / 180
            const cx = +(base.cx + off[0] * Math.cos(a) - off[1] * Math.sin(a)).toFixed(2)
            const cy = +(base.cy + off[0] * Math.sin(a) + off[1] * Math.cos(a)).toFixed(2)
            const id = Math.max(...prev.map(l => l.id)) + 1
            nuevoIdRef.current = id
            return [...prev, { ...base, id, n: ajustes.current.numero, cx, cy }]
        })
        setNumero(n => n + 1)
    }, [])

    const cambiar = (id: number, cambios: Partial<LoteEditor>) =>
        setLotes(prev => prev.map(l => (l.id === id ? { ...l, ...cambios } : l)))

    const borrar = (id: number) => {
        setLotes(prev => prev.filter(l => l.id !== id))
        setSelId(null)
    }

    /* ─── teclado: mover y girar el lote elegido ─── */

    // La barra espaciadora coloca donde apunta la mira, se haya elegido lote o no.
    useEffect(() => {
        const onEspacio = (e: KeyboardEvent) => {
            if (e.code !== 'Space') return
            const destino = e.target as HTMLElement
            if (destino.tagName === 'INPUT' || destino.tagName === 'SELECT') return
            e.preventDefault()
            colocarEnMira()
        }
        window.addEventListener('keydown', onEspacio)
        return () => window.removeEventListener('keydown', onEspacio)
    }, [colocarEnMira])

    useEffect(() => {
        if (selId == null) return
        const onKey = (e: KeyboardEvent) => {
            const destino = e.target as HTMLElement
            if (destino.tagName === 'INPUT' || destino.tagName === 'SELECT') return
            const paso = e.shiftKey ? 0.2 : 1
            const mover = (dx: number, dz: number) =>
                setLotes(prev => prev.map(l =>
                    l.id === selId ? { ...l, cx: +(l.cx + dx).toFixed(2), cy: +(l.cy + dz).toFixed(2) } : l))

            switch (e.key) {
                case 'ArrowLeft': mover(-paso, 0); break
                case 'ArrowRight': mover(paso, 0); break
                case 'ArrowUp': mover(0, -paso); break
                case 'ArrowDown': mover(0, paso); break
                case 'q': case 'Q':
                    setLotes(prev => prev.map(l => l.id === selId ? { ...l, rot: +(l.rot - (e.shiftKey ? 0.5 : 5)).toFixed(1) } : l))
                    break
                case 'e': case 'E':
                    setLotes(prev => prev.map(l => l.id === selId ? { ...l, rot: +(l.rot + (e.shiftKey ? 0.5 : 5)).toFixed(1) } : l))
                    break
                case 'd': case 'D': repetir('derecha'); break
                case 'a': case 'A': repetir('izquierda'); break
                case 'w': case 'W': repetir('frente'); break
                case 's': case 'S': repetir('fondo'); break
                case 'Delete': case 'Backspace': borrar(selId); break
                default: return
            }
            e.preventDefault()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [selId, repetir])

    /* ─── guardar ─── */

    const guardar = async () => {
        setEstado('guardando')
        try {
            const res = await fetch('/api/dev/lotes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dimension: { ancho, fondo },
                    // Se guardan las medidas y el giro junto al polígono: son lo
                    // que el editor necesita para poder retomar el trabajo.
                    lotes: lotes.map(l => ({ ...aLot(l), ancho: l.ancho, fondo: l.fondo })),
                }),
            })
            setEstado(res.ok ? 'guardado' : 'error')
        } catch {
            setEstado('error')
        }
    }

    const descargar = () => {
        const blob = new Blob(
            [JSON.stringify({
                dimension: { ancho, fondo },
                lotes: lotes.map(l => ({ ...aLot(l), ancho: l.ancho, fondo: l.fondo })),
            }, null, 2)],
            { type: 'application/json' }
        )
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = 'lotes-editados.json'
        a.click()
        URL.revokeObjectURL(a.href)
    }

    /** Trae los 116 del repo como punto de partida, con el tamaño uniforme. */
    const traerOriginales = async () => {
        const d = await fetch('/lomas3d/mapa-data.json').then(r => r.json())
        const previos: LoteEditor[] = d.lots.map((l: Lot & { p: Array<[number, number]> }, i: number) => {
            // El giro sale de la primera arista; el centro, del promedio de las
            // esquinas. La forma exacta se pierde a propósito: acá todos los
            // lotes miden lo mismo.
            const [a, b] = l.p
            return {
                id: i + 1,
                n: l.n,
                stage: l.stage,
                cx: +(l.p.reduce((s, q) => s + q[0], 0) / l.p.length).toFixed(2),
                cy: +(l.p.reduce((s, q) => s + q[1], 0) / l.p.length).toFixed(2),
                rot: +((Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI).toFixed(1),
                ancho, fondo, sold: l.sold,
            }
        })
        setLotes(previos)
        setNumero(Math.max(...previos.map(l => l.n)) + 1)
        setSelId(null)
    }

    return (
        <>
            {/* Lista de todos los lotes: cambiar número, etapa y estado de
                136 lotes tocándolos uno a uno en el mapa sería eterno. */}
            {lista && (
                <div className={styles.listaPanel}>
                    <div className={styles.listaCabecera}>
                        <strong>{lotes.length} lotes</strong>
                        <span className={styles.editorNota}>
                            {lotes.filter(l => !l.sold).length} disponibles ·{' '}
                            {lotes.filter(l => l.sold).length} vendidos
                        </span>
                        <button className={styles.chip} onClick={() => setLista(false)}>Cerrar</button>
                    </div>
                    <div className={styles.listaCuerpo}>
                        {[...lotes].sort((a, b) => a.stage - b.stage || a.n - b.n).map(l => (
                            <div
                                key={l.id}
                                className={l.id === selId ? styles.listaFilaOn : styles.listaFila}
                            >
                                <button
                                    className={styles.listaIr}
                                    onClick={() => { setSelId(l.id); viewer?.focusLot(l.id) }}
                                    title="Ver en el mapa"
                                >
                                    ⌖
                                </button>
                                <label className={styles.editorCampo}>
                                    Nº
                                    <input
                                        type="number"
                                        min={1}
                                        value={l.n}
                                        onChange={e => cambiar(l.id, { n: Number(e.target.value) })}
                                    />
                                </label>
                                <label className={styles.editorCampo}>
                                    Et
                                    <input
                                        type="number"
                                        min={1}
                                        max={4}
                                        value={l.stage}
                                        onChange={e => cambiar(l.id, { stage: Number(e.target.value) })}
                                    />
                                </label>
                                <span className={styles.editorNota}>{Math.round(l.ancho * l.fondo)} m²</span>
                                <button
                                    className={l.sold ? styles.estadoVendido : styles.estadoLibre}
                                    onClick={() => cambiar(l.id, { sold: !l.sold })}
                                >
                                    {l.sold ? 'Vendido' : 'Disponible'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* La mira: encuadras con libertad y el lote cae justo acá. */}
            <div className={styles.mira} aria-hidden="true">
                <span className={styles.miraH} />
                <span className={styles.miraV} />
            </div>

            <div className={styles.editor}>
            <div className={styles.editorFila}>
                <span className={styles.kickerDark}>Editor de lotes · {lotes.length} colocados</span>
                <button
                    className={colocando ? styles.chipOn : styles.chip}
                    onClick={() => setColocando(v => !v)}
                >
                    {colocando ? 'Colocando: clic en el mapa' : 'Colocar apagado'}
                </button>
                <button className={styles.primaryBtn} onClick={colocarEnMira}>
                    Colocar en la mira (espacio)
                </button>
                <button
                    className={lista ? styles.chipOn : styles.chip}
                    onClick={() => setLista(v => !v)}
                >
                    Lista ({lotes.length})
                </button>
                <span className={styles.editorSep} />
                <button className={styles.chip} onClick={() => viewer?.dolly(0.7)}>Acercar +</button>
                <button className={styles.chip} onClick={() => viewer?.dolly(1.4)}>Alejar −</button>
                <button className={styles.chip} onClick={() => viewer?.orbit(-15)}>↺ Girar</button>
                <button className={styles.chip} onClick={() => viewer?.orbit(15)}>Girar ↻</button>
                <button className={styles.chip} onClick={() => viewer?.topDown()}>Vista cenital</button>
                <button
                    className={arrastre === 'girar' ? styles.chipOn : styles.chip}
                    onClick={() => {
                        const m = arrastre === 'mover' ? 'girar' : 'mover'
                        setArrastre(m)
                        viewer?.setDragMode(m)
                    }}
                >
                    {arrastre === 'mover' ? 'Arrastrar: desplaza' : 'Arrastrar: gira'}
                </button>
                <span className={styles.editorNota}>
                    arrastra para recorrer · botón derecho gira · rueda acerca ·
                    arrastra el lote elegido para moverlo
                </span>
            </div>

            <div className={styles.editorFila}>
                <label className={styles.editorCampo}>
                    Ancho
                    <input type="number" min={2} max={60} step={0.5} value={ancho}
                        onChange={e => setAncho(Number(e.target.value))} />
                    m
                </label>
                <label className={styles.editorCampo}>
                    Fondo
                    <input type="number" min={2} max={60} step={0.5} value={fondo}
                        onChange={e => setFondo(Number(e.target.value))} />
                    m
                </label>
                <span className={styles.editorNota}>= {Math.round(ancho * fondo)} m²</span>
                <label className={styles.editorCampo}>
                    Etapa
                    <input type="number" min={1} max={4} value={etapa}
                        onChange={e => setEtapa(Number(e.target.value))} />
                </label>
                <label className={styles.editorCampo}>
                    Nº
                    <input type="number" min={1} value={numero}
                        onChange={e => setNumero(Number(e.target.value))} />
                </label>
                <label className={styles.editorCampo}>
                    Giro
                    <input type="range" min={-180} max={180} step={1} value={rot}
                        onChange={e => setRot(Number(e.target.value))} className={styles.calceSlider} />
                    {rot}°
                </label>
            </div>

            {sel ? (
                <div className={styles.editorFila}>
                    <strong className={styles.editorSel}>Lote {sel.n} · Etapa {sel.stage}</strong>
                    <span className={styles.editorNota}>
                        {sel.ancho}×{sel.fondo} m = {Math.round(sel.ancho * sel.fondo)} m² · flechas mueven ·
                        Q/E giran · Shift afina · Supr borra
                    </span>
                    <label className={styles.editorCampo}>
                        Nº
                        <input type="number" min={1} value={sel.n}
                            onChange={e => cambiar(sel.id, { n: Number(e.target.value) })} />
                    </label>
                    <label className={styles.editorCampo}>
                        Etapa
                        <input type="number" min={1} max={4} value={sel.stage}
                            onChange={e => cambiar(sel.id, { stage: Number(e.target.value) })} />
                    </label>
                    <label className={styles.editorCampo}>
                        Giro
                        <input type="range" min={-180} max={180} step={0.5} value={sel.rot}
                            onChange={e => cambiar(sel.id, { rot: Number(e.target.value) })}
                            className={styles.calceSlider} />
                        {sel.rot}°
                    </label>
                    <button
                        className={sel.sold ? styles.estadoVendido : styles.estadoLibre}
                        onClick={() => cambiar(sel.id, { sold: !sel.sold })}
                    >
                        {sel.sold ? 'Vendido' : 'Disponible'}
                    </button>
                    <span className={styles.editorSep} />
                    <span className={styles.editorNota}>Repetir pegado:</span>
                    <button className={styles.chip} onClick={() => repetir('izquierda')}>← A</button>
                    <button className={styles.chip} onClick={() => repetir('derecha')}>D →</button>
                    <button className={styles.chip} onClick={() => repetir('frente')}>↑ W</button>
                    <button className={styles.chip} onClick={() => repetir('fondo')}>↓ S</button>
                    <span className={styles.editorSep} />
                    <button className={styles.chip} onClick={() => borrar(sel.id)}>Borrar</button>
                    <button className={styles.chip} onClick={() => setSelId(null)}>Soltar</button>
                </div>
            ) : (
                <span className={styles.editorNota}>
                    Toca un lote ya puesto para moverlo, girarlo o borrarlo.
                </span>
            )}

            <div className={styles.editorFila}>
                <button className={styles.primaryBtn} onClick={guardar} disabled={!lotes.length}>
                    {estado === 'guardando' ? 'Guardando…'
                        : estado === 'guardado' ? 'Guardado ✓'
                            : estado === 'error' ? 'No se pudo guardar'
                                : 'Guardar lotes'}
                </button>
                <button className={styles.chip} onClick={descargar} disabled={!lotes.length}>
                    Descargar JSON
                </button>
                <button className={styles.chip} onClick={traerOriginales}>
                    Traer los 116 del repo
                </button>
                <button
                    className={styles.chip}
                    onClick={() => { setLotes([]); setSelId(null); setNumero(1) }}
                >
                    Vaciar
                </button>
            </div>
            </div>
        </>
    )
}
