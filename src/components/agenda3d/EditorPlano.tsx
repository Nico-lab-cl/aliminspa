'use client'

/**
 * Editor de la numeración del plano cenital: /agendar-visita?plano=1&editor=1.
 *
 * Los lotes salen solos de las líneas dibujadas en la foto, pero el número, la
 * etapa y la zona hay que ponérselos. El cruce automático con el catastro deja
 * un error mediano de 7,5 m sobre lotes de 14 m de lado, así que puede caer en
 * el vecino: sirve de punto de partida, no de verdad. Acá se revisa y se
 * corrige.
 *
 * Está pensado para ir rápido con el teclado: se escribe el número, Enter lo
 * guarda y salta al lote siguiente de la hilera. Así son 200 pulsaciones en vez
 * de 200 viajes al mouse.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styles from './EditorPlano.module.css'

/** Zonas del plano, con el mismo color que usa el visor. */
const ZONAS = [
    { id: 'lote', nombre: 'Lote', color: '#76d845' },
    { id: 'estacionamiento', nombre: 'Estacionamiento', color: '#f2c033' },
    { id: 'sanitario', nombre: 'Equip. sanitario', color: '#3b82f6' },
    { id: 'areaverde', nombre: 'Área verde', color: '#1f7a34' },
    { id: 'descartado', nombre: 'No es zona', color: '#6b7280' }
] as const

export interface LotePlano {
    id: number
    fila: number
    u: number
    v: number
    n: number | null
    stage: number | null
    sold: boolean
    tipo?: string
    area: number | null
}

/** Lo que el editor necesita del visor. */
export interface VisorPlano {
    lotes: LotePlano[]
    select(id: number): void
    _sel: number
    _pintar(): void
    _sucio: boolean
    addEventListener(t: string, f: EventListener): void
    removeEventListener(t: string, f: EventListener): void
}

export default function EditorPlano({ viewer }: { viewer: VisorPlano | null }) {
    const [sel, setSel] = useState<number>(0)
    const [guardando, setGuardando] = useState(false)
    const [aviso, setAviso] = useState<string | null>(null)
    const [, redibujar] = useState(0)
    const campoNumero = useRef<HTMLInputElement>(null)

    const lotes = viewer?.lotes ?? []
    const lote = useMemo(() => lotes.find(l => l.id === sel) ?? null, [lotes, sel])

    /* El orden de recorrido es el de la hilera: primero por fila, después de
       izquierda a derecha. Es el mismo orden en que corre la numeración. */
    const orden = useMemo(
        () => [...lotes].sort((a, b) => a.fila - b.fila || a.u - b.u),
        [lotes])

    const faltan = useMemo(
        () => lotes.filter(l => (l.tipo ?? 'lote') === 'lote' && (l.n == null || l.stage == null)).length,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [lotes, sel, guardando])

    // El visor avisa cuándo se tocó un lote en el mapa.
    useEffect(() => {
        if (!viewer) return
        const alTocar = (e: Event) => {
            const d = (e as CustomEvent<{ id: number }>).detail
            setSel(d.id)
            setAviso(null)
            setTimeout(() => campoNumero.current?.select(), 0)
        }
        viewer.addEventListener('lotpick', alTocar)
        return () => viewer.removeEventListener('lotpick', alTocar)
    }, [viewer])

    const aplicar = useCallback((cambio: Partial<LotePlano>) => {
        if (!lote || !viewer) return
        Object.assign(lote, cambio)
        viewer._pintar()
        viewer._sucio = true
        redibujar(n => n + 1)
    }, [lote, viewer])

    /** Salta al lote siguiente o anterior en el orden de la hilera. */
    const saltar = useCallback((paso: number) => {
        if (!viewer || !orden.length) return
        const i = orden.findIndex(l => l.id === sel)
        const j = Math.max(0, Math.min(orden.length - 1, (i < 0 ? 0 : i) + paso))
        const siguiente = orden[j]
        setSel(siguiente.id)
        viewer.select(siguiente.id)
        setTimeout(() => campoNumero.current?.select(), 0)
    }, [viewer, orden, sel])

    /* Al pasar al siguiente se hereda la etapa: dentro de una hilera casi
       siempre es la misma, y escribirla 200 veces no tiene sentido. */
    const siguiente = useCallback(() => {
        const etapa = lote?.stage ?? null
        const numero = lote?.n ?? null
        saltar(1)
        setTimeout(() => {
            const i = orden.findIndex(l => l.id === sel)
            const s = orden[i + 1]
            if (!s || !viewer) return
            if (s.stage == null && etapa != null) s.stage = etapa
            if (s.n == null && numero != null) s.n = numero + 1
            viewer._pintar()
            viewer._sucio = true
            redibujar(n => n + 1)
        }, 0)
    }, [lote, saltar, orden, sel, viewer])

    const guardar = useCallback(async () => {
        if (!viewer) return
        setGuardando(true)
        setAviso(null)
        try {
            const r = await fetch('/api/dev/plano', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lotes: viewer.lotes.map(l => ({
                        id: l.id, n: l.n, stage: l.stage,
                        sold: !!l.sold, tipo: l.tipo ?? 'lote', area: l.area
                    }))
                })
            })
            const j = await r.json()
            setAviso(r.ok ? `Guardado: ${j.tocados} lotes` : j.error ?? 'No se pudo guardar')
        } catch (e) {
            setAviso(e instanceof Error ? e.message : 'No se pudo guardar')
        } finally {
            setGuardando(false)
        }
    }, [viewer])

    // Atajos: sirven mientras no se esté escribiendo en un campo de texto.
    useEffect(() => {
        const alPulsar = (e: KeyboardEvent) => {
            const enCampo = (e.target as HTMLElement)?.tagName === 'INPUT'
            if (e.key === 'Enter') { e.preventDefault(); siguiente(); return }
            if (enCampo) return
            if (e.key === 'ArrowRight') { e.preventDefault(); saltar(1) }
            else if (e.key === 'ArrowLeft') { e.preventDefault(); saltar(-1) }
            else if (e.key.toLowerCase() === 'v') aplicar({ sold: !lote?.sold })
            else if (e.key >= '1' && e.key <= '4') aplicar({ stage: Number(e.key) })
            else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); guardar() }
        }
        window.addEventListener('keydown', alPulsar)
        return () => window.removeEventListener('keydown', alPulsar)
    }, [siguiente, saltar, aplicar, guardar, lote])

    if (!viewer) return null

    const tipo = lote?.tipo ?? 'lote'

    return (
        <aside className={styles.panel}>
            <header className={styles.cabecera}>
                <strong>Numerar lotes</strong>
                <span>{lotes.length - faltan}/{lotes.length} listos</span>
            </header>

            {!lote && <p className={styles.vacio}>Toca un lote en el mapa para empezar.</p>}

            {lote && (
                <>
                    <div className={styles.zonas}>
                        {ZONAS.map(z => (
                            <button
                                key={z.id}
                                className={tipo === z.id ? styles.zonaActiva : styles.zona}
                                style={{ '--c': z.color } as React.CSSProperties}
                                onClick={() => aplicar({ tipo: z.id })}
                            >
                                {z.nombre}
                            </button>
                        ))}
                    </div>

                    {tipo === 'lote' && (
                        <div className={styles.campos}>
                            <label>
                                Número
                                <input
                                    ref={campoNumero}
                                    type="number"
                                    min={1}
                                    value={lote.n ?? ''}
                                    onChange={e => aplicar({ n: e.target.value === '' ? null : Number(e.target.value) })}
                                />
                            </label>
                            <label>
                                Etapa
                                <input
                                    type="number"
                                    min={1}
                                    max={9}
                                    value={lote.stage ?? ''}
                                    onChange={e => aplicar({ stage: e.target.value === '' ? null : Number(e.target.value) })}
                                />
                            </label>
                            <label>
                                Superficie m²
                                <input
                                    type="number"
                                    min={1}
                                    value={lote.area ?? ''}
                                    onChange={e => aplicar({ area: e.target.value === '' ? null : Number(e.target.value) })}
                                />
                            </label>
                            <button
                                className={lote.sold ? styles.vendido : styles.disponible}
                                onClick={() => aplicar({ sold: !lote.sold })}
                            >
                                {lote.sold ? 'Vendido' : 'Disponible'}
                            </button>
                        </div>
                    )}

                    <div className={styles.navegar}>
                        <button onClick={() => saltar(-1)}>← Anterior</button>
                        <button onClick={siguiente}>Siguiente →</button>
                    </div>
                </>
            )}

            <button className={styles.guardar} onClick={guardar} disabled={guardando}>
                {guardando ? 'Guardando…' : 'Guardar todo'}
            </button>
            {aviso && <p className={styles.aviso}>{aviso}</p>}

            <p className={styles.ayuda}>
                Enter guarda y salta al siguiente heredando la etapa. ← → se mueven por la
                hilera, 1-4 ponen la etapa, V marca vendido, Ctrl+S guarda.
            </p>
        </aside>
    )
}
