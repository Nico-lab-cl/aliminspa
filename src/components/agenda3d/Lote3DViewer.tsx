'use client'

/**
 * Envoltorio React del visor `<lote-3d>`.
 *
 * El elemento se crea a mano en vez de escribirlo en el JSX: `connectedCallback`
 * lee los atributos (src, georef, pano, quality) apenas entra al DOM, y React no
 * garantiza que los haya escrito antes de insertarlo. Creándolo acá el orden es
 * explícito y el visor nunca arranca sin saber qué cargar.
 */

import { useEffect, useRef, useState } from 'react'

/** Posición y orientación del dron cuando tomó la panorámica. */
export interface Vuelo {
    x: number
    z: number
    alt: number
    yaw: number
}

export interface Lot {
    id: number
    /** Número del lote dentro de su etapa. */
    n: number
    stage: number
    area: number | null
    sold: boolean
    price: number | null
    cx: number
    cy: number
    /** Esquinas del lote en coordenadas locales del loteo, en metros. */
    p?: Array<[number, number]>
    /** Giro en grados. Solo lo usan los lotes dibujados a mano. */
    rot?: number
}

/** Métodos del visor que usa la página. */
export interface ViewerHandle {
    select(id: number): void
    clear(): void
    setFilter(f: { stage: number }): void
    setLayer(k: Capa): void
    setMode(m: 'natural' | 'plataformas'): void
    setEnv(k: 'dron' | 'oscuro'): void
    setNumbers(on: boolean): void
    cinematic(on: boolean): void
    resetView(): void
    /* Modo de calce: congela la órbita y deja arrastrar la panorámica sobre
       el terreno para hacerla coincidir con los lotes. */
    setAlign(on: boolean): void
    topDown(): void
    nudgeYaw(d: number): void
    nudgeAlt(d: number): void
    setPanoYaw(deg: number): void
    /* Edición: colocar lotes a mano sobre el mapa. */
    setEditor(on: boolean): void
    pickGround(clientX: number, clientY: number): { x: number; z: number } | null
    setLots(lots: Lot[]): void
    dolly(factor: number): void
    setMezcla(opacidad: number): void
    pickGroundCenter(): { x: number; z: number } | null
    orbit(deg: number): void
    focusLot(id: number): void
    setDragMode(modo: 'mover' | 'girar'): void
    height(x: number, z: number): number
    dem: { min: number; max: number } | null
}

export type Capa = 'dron' | 'foto' | 'satelite'

/** Cuántos lotes hay y cuántos siguen disponibles. */
export interface Conteo {
    total: number
    disponibles: number
    porEtapa: Record<number, { total: number; disponibles: number }>
}

/** Lo que informa el visor cuando terminó de armar la escena. */
export interface Listo {
    relief: number
    layer: Capa
    calibrado: boolean
    conteo: Conteo
}

export type Quality = 'alta' | 'baja'

/**
 * Elige el perfil de calidad. La mayoría del tráfico llega desde Meta en
 * celular: ahí conviene una malla más gruesa y la panorámica liviana antes que
 * un mapa que tarda o se cae.
 */
export function detectQuality(): { quality: Quality; pano: string | null } {
    if (typeof navigator === 'undefined') return { quality: 'alta', pano: '/lomas3d/pano-360.webp' }

    const nav = navigator as Navigator & { deviceMemory?: number }
    const cores = nav.hardwareConcurrency ?? 4
    const memory = nav.deviceMemory ?? 4
    const narrow = typeof window !== 'undefined' && window.innerWidth < 900

    // Equipos realmente justos: sin panorámica 360°, que es la textura más
    // pesada de toda la escena.
    if (cores <= 4 || memory <= 2) return { quality: 'baja', pano: null }
    if (narrow) return { quality: 'baja', pano: '/lomas3d/pano-360-lite.webp' }
    return { quality: 'alta', pano: '/lomas3d/pano-360.webp' }
}

interface Props {
    className?: string
    /** Se dispara cuando el visitante toca un lote en el mapa. */
    onPick(lot: Lot): void
    /** Se dispara una vez que la escena terminó de armarse. */
    onReady(handle: ViewerHandle, detail: Listo): void
    onError?(): void
    /** Solo en modo de calce: informa los valores mientras se arrastra. */
    onAlign?(v: Vuelo): void
    /** Solo en modo editor: dónde cayó el clic sobre el terreno. */
    onGroundPick?(punto: { x: number; z: number }): void
}

export default function Lote3DViewer({ className, onPick, onReady, onError, onAlign, onGroundPick }: Props) {
    const hostRef = useRef<HTMLDivElement>(null)
    const [failed, setFailed] = useState(false)

    // Los callbacks viven en un ref: el efecto debe correr una sola vez, y si
    // dependiera de ellos el visor se destruiría en cada render del padre.
    const cbs = useRef({ onPick, onReady, onError, onAlign, onGroundPick })
    cbs.current = { onPick, onReady, onError, onAlign, onGroundPick }

    useEffect(() => {
        const host = hostRef.current
        if (!host) return

        let el: HTMLElement | null = null
        let cancelled = false

        const boot = async () => {
            /* Visor nuevo: la panorámica mirada de frente, sin proyectarla
               sobre el terreno. Va detrás de ?pano=1 mientras la numeración de
               los lotes siga sin verificar. */
            const q = new URLSearchParams(window.location.search)
            const pano = q.get('pano') === '1'
            try {
                // Dos ramas literales y no una expresion: el empaquetador
                // resuelve los import() leyendo la ruta, y con una variable
                // adentro no encuentra ningun modulo.
                if (pano) await import('./pano-lotes.js')
                else await import('./lote3d.js')
            } catch (err) {
                console.error('No se pudo cargar el visor 3D', err)
                if (!cancelled) {
                    setFailed(true)
                    cbs.current.onError?.()
                }
                return
            }
            if (cancelled) return

            const { quality, pano: panoSrc } = detectQuality()

            if (pano) {
                el = document.createElement('pano-lotes')
                el.setAttribute('pano', panoSrc ?? '/lomas3d/pano-360-lite.webp')
                el.setAttribute('mapa', '/lomas3d/lotes-mapa.png')
                el.setAttribute('celdas', '/lomas3d/lotes-pano.json')
                el.setAttribute('vuelo', '/lomas3d/vuelo.json')
                el.setAttribute('quality', quality)
                if (q.get('editor') === '1') el.setAttribute('editor', '1')
                el.style.width = '100%'
                el.style.height = '100%'
                el.addEventListener('lotpick', e => {
                    cbs.current.onPick((e as CustomEvent<Lot>).detail)
                })
                el.addEventListener('ready', e => {
                    const detail = (e as CustomEvent<Listo>).detail
                    cbs.current.onReady(el as unknown as ViewerHandle, detail)
                })
                host.appendChild(el)
                return
            }

            el = document.createElement('lote-3d')
            el.setAttribute('src', '/lomas3d/mapa-data.json')
            el.setAttribute('georef', '/lomas3d/georef.json')
            el.setAttribute('quality', quality)
            el.setAttribute('mode', 'natural')
            // La capa de entrada la decide el visor según el calce; el editor
            // dibuja siempre sobre la vista del dron.
            if (new URLSearchParams(window.location.search).get('editor') === '1') {
                el.setAttribute('editor', '1')
            }
            el.setAttribute('drone-alt', '110')
            el.setAttribute('drone-reach', '400')
            el.setAttribute('pano', panoSrc ?? '/lomas3d/pano-360-lite.webp')
            el.style.width = '100%'
            el.style.height = '100%'

            el.addEventListener('lotpick', e => {
                cbs.current.onPick((e as CustomEvent<Lot>).detail)
            })
            el.addEventListener('groundpick', e => {
                cbs.current.onGroundPick?.((e as CustomEvent<{ x: number; z: number }>).detail)
            })
            el.addEventListener('alignchange', e => {
                cbs.current.onAlign?.((e as CustomEvent<Vuelo>).detail)
            })
            el.addEventListener('ready', e => {
                const detail = (e as CustomEvent<Listo>).detail
                cbs.current.onReady(el as unknown as ViewerHandle, detail)
            })

            host.appendChild(el)
        }

        boot()

        return () => {
            cancelled = true
            // El visor guarda un WebGLRenderer con su propio animation loop:
            // sacarlo del DOM sin más deja la GPU trabajando en una pestaña que
            // ya cambió de página.
            const viewer = el as unknown as {
                destruir?(): void
                renderer?: { setAnimationLoop(cb: null): void; dispose(): void }
            } | null
            if (viewer?.destruir) {
                // El visor de panorámica lleva su propio bucle y sabe soltarlo.
                viewer.destruir()
            } else {
                viewer?.renderer?.setAnimationLoop(null)
                viewer?.renderer?.dispose()
            }
            el?.remove()
        }
    }, [])

    if (failed) {
        return (
            <div className={className} data-viewer-failed>
                <p>
                    No pudimos cargar el mapa 3D en este dispositivo. Puedes agendar tu visita igual
                    con el formulario de más abajo.
                </p>
            </div>
        )
    }

    return <div ref={hostRef} className={className} />
}
