'use client'

/**
 * Agendamiento sobre el mapa 3D de Lomas del Mar.
 *
 * El recorrido es uno solo y sin recargas: el visitante entra con el vuelo de
 * dron, elige su lote tocándolo en el mapa, y el mismo panel lateral se va
 * transformando en calendario, formulario y confirmación. Convive con /reunion,
 * que sigue siendo el agendamiento genérico de los tres proyectos.
 *
 * Las horas que se ofrecen salen de /api/availability, que ya cruzó el horario
 * de atención, la brecha de 24 horas y la ocupación real del Google Calendar
 * del equipo.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import {
    ArrowRight,
    Calendar,
    Check,
    ChevronLeft,
    ChevronRight,
    Loader2,
    MapPin,
    Ruler,
    Video,
    X,
} from 'lucide-react'
import Lote3DViewer, { Capa, Listo, Lot, ViewerHandle, Vuelo } from './Lote3DViewer'
import EditorLotes from './EditorLotes'
import { getUtmParams, newEventId } from '@/lib/track'
import { SITE } from '@/lib/constants'
import styles from './Agenda3D.module.css'

/** Nombre con que se guarda la visita. Sin sufijo: esta ruta no vive bajo /meta. */
const PROYECTO = 'Lomas del Mar'
/** Única modalidad que ofrece el equipo hoy. */
const MODALIDAD = 'Visita en terreno, El Tabo'
/** Ventana que se le pide a la agenda, en días. */
const VENTANA_DIAS = 60

const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
const DIAS_CORTOS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

type Step = 'lote' | 'fecha' | 'datos' | 'listo'

interface Availability {
    days: Array<{ date: string; slots: string[] }>
    liveCalendar: boolean
}

const CLP = (n: number) => '$' + Math.round(n).toLocaleString('es-CL')

/** "2026-09-18" -> "jueves 18 de septiembre" */
function fechaLarga(iso: string): string {
    const [y, m, d] = iso.split('-').map(Number)
    const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
    const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
    return `${dias[wd]} ${d} de ${MESES[m - 1].toLowerCase()}`
}

export default function Agenda3D() {
    const [started, setStarted] = useState(false)
    const [step, setStep] = useState<Step>('lote')

    const viewer = useRef<ViewerHandle | null>(null)
    const [viewerReady, setViewerReady] = useState(false)

    const [lot, setLot] = useState<Lot | null>(null)
    /* El plano de dron arranca en el mismo instante que el acercamiento y se
       funde mientras la cámara baja: el video tambien desciende, asi que los
       dos movimientos se encadenan y se lee como un solo viaje. Si entra
       despues, se nota el corte. */
    const [llegada, setLlegada] = useState(false)
    const videoLlegada = useRef<HTMLVideoElement | null>(null)

    /* El video de la portada se elige recien en el cliente: en el servidor no
       se sabe el tamaño de pantalla, y mandar el de escritorio a un celular
       eran 1,6 MB en vez de 430 KB. Hasta que se resuelve se ve el poster. */
    const [movil, setMovil] = useState<boolean | null>(null)
    /* En celular, tocar un lote ya no levanta la ficha entera: taparia el
       plano de dron justo cuando termina de aterrizar. Salen tres etiquetas
       al costado y la ficha se abre recien si el visitante lo pide. */
    const [fichaAbierta, setFichaAbierta] = useState(false)
    const [ahorroDatos, setAhorroDatos] = useState(false)
    const [stage, setStage] = useState(0)
    // La capa de entrada la decide el visor: vista del dron solo si el calce
    // de la panorámica ya está hecho.
    const [layer, setLayer] = useState<Capa>('foto')

    /* Modo de calce: se entra con /agendar-visita?calce=1. Sirve para hacer
       coincidir la panorámica del dron con los lotes una sola vez; el
       visitante normal nunca lo ve. */
    const [calce, setCalce] = useState(false)
    /* Editor de lotes: /agendar-visita?editor=1. Los coloca el equipo mirando
       la foto; el visitante normal nunca lo ve. */
    const [editor, setEditor] = useState(false)
    // El hijo necesita el visor como estado, no como ref: con un ref no se
    // entera de que ya está montado.
    const [handle, setHandle] = useState<ViewerHandle | null>(null)
    const [al, setAl] = useState<Vuelo | null>(null)
    const [guardado, setGuardado] = useState('')
    const [alineando, setAlineando] = useState(false)
    // Opacidad de la vista del dron sobre la ortofoto mientras se calza.
    const [mezcla, setMezcla] = useState(0.5)

    const [avail, setAvail] = useState<Availability | null>(null)
    const [availFailed, setAvailFailed] = useState(false)
    const [month, setMonth] = useState(() => {
        const now = new Date()
        return { year: now.getFullYear(), month: now.getMonth() + 1 }
    })
    const [date, setDate] = useState('')
    const [time, setTime] = useState('')

    const [form, setForm] = useState({ nombre: '', celular: '', email: '' })
    const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
    const [errorMsg, setErrorMsg] = useState('')
    const [meetLink, setMeetLink] = useState<string | null>(null)

    /* ─── agenda real ─── */

    const cargarAgenda = useCallback(async () => {
        try {
            const res = await fetch(`/api/availability?days=${VENTANA_DIAS}`)
            if (!res.ok) throw new Error('agenda no disponible')
            const data: Availability = await res.json()
            setAvail(data)
            setAvailFailed(false)
            // El calendario abre en el primer mes que efectivamente tiene cupo,
            // para que nadie caiga en una grilla completamente apagada.
            const primero = data.days[0]?.date
            if (primero) {
                const [y, m] = primero.split('-').map(Number)
                setMonth({ year: y, month: m })
            }
        } catch (err) {
            console.error('No se pudo leer la agenda', err)
            setAvailFailed(true)
        }
    }, [])

    // Se pide apenas el visitante entra al mapa: cuando llegue al paso de la
    // fecha, la grilla ya está lista y no ve un spinner.
    useEffect(() => {
        if (!started) return
        cargarAgenda()
        // La intro pudo quedar scrolleada: sin esto el mapa arranca cortado por
        // arriba y los chips quedan fuera de pantalla.
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [started, cargarAgenda])

    // Se lee de la URL en un efecto y no con useSearchParams: ese hook obliga
    // a envolver la página en Suspense y le quita el render en servidor.
    useEffect(() => {
        const q = new URLSearchParams(window.location.search)
        setCalce(q.get('calce') === '1')
        setEditor(q.get('editor') === '1')

        setMovil(window.innerWidth < 900)

        // Con ahorro de datos activado no se adelanta la descarga del plano de
        // llegada: entrara igual, solo que un poco despues.
        const con = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
        setAhorroDatos(!!con?.saveData)
    }, [])

    const guardarCalce = async () => {
        if (!al) return
        setGuardado('guardando')
        try {
            const res = await fetch('/api/dev/vuelo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ x: al.x, z: al.z, alt: al.alt, yaw: al.yaw }),
            })
            setGuardado(res.ok ? 'guardado' : 'error')
        } catch {
            setGuardado('error')
        }
    }

    const slotsPorDia = useMemo(() => {
        const map = new Map<string, string[]>()
        avail?.days.forEach(d => map.set(d.date, d.slots))
        return map
    }, [avail])

    const celdas = useMemo(() => {
        const first = new Date(Date.UTC(month.year, month.month - 1, 1))
        const total = new Date(Date.UTC(month.year, month.month, 0)).getUTCDate()
        // getUTCDay() da 0 para domingo; la grilla parte en lunes.
        const offset = (first.getUTCDay() + 6) % 7
        const out: Array<{ iso: string; day: number } | null> = Array(offset).fill(null)
        for (let d = 1; d <= total; d++) {
            const iso = `${month.year}-${String(month.month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
            out.push({ iso, day: d })
        }
        return out
    }, [month])

    const mesesConCupo = useMemo(() => {
        const set = new Set<string>()
        avail?.days.forEach(d => set.add(d.date.slice(0, 7)))
        return [...set].sort()
    }, [avail])

    const mesActual = `${month.year}-${String(month.month).padStart(2, '0')}`
    const idxMes = mesesConCupo.indexOf(mesActual)
    const irAMes = (delta: number) => {
        const destino = mesesConCupo[idxMes + delta]
        if (!destino) return
        const [y, m] = destino.split('-').map(Number)
        setMonth({ year: y, month: m })
    }

    /* ─── mapa ─── */

    const onReady = useCallback((handle: ViewerHandle, detail: Listo) => {
        viewer.current = handle
        setHandle(handle)
        setViewerReady(true)
        setLayer(detail.layer)
        handle.setNumbers(true)
        // La órbita de presentación es para el visitante; en las herramientas
        // internas estorba.
        const q = new URLSearchParams(window.location.search)
        if (q.get('editor') !== '1' && q.get('calce') !== '1') handle.cinematic(true)
    }, [])

    const onPick = useCallback((picked: Lot) => {
        viewer.current?.cinematic(false)
        // En el editor el clic sirve para elegir qué lote mover, no para
        // abrir la ficha de venta: de eso se encarga EditorLotes.
        if (new URLSearchParams(window.location.search).get('editor') === '1') return
        setLot(picked)
        setStep('lote')
        setFichaAbierta(false)

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
        const v = videoLlegada.current
        if (v) {
            v.currentTime = 0
            // Puede fallar si el navegador aun no habilita la reproduccion
            // automatica; el mapa sigue funcionando igual.
            v.play().catch(() => { })
        }
        setLlegada(true)
    }, [])

    const limpiarLote = () => {
        setLlegada(false)
        setFichaAbierta(false)
        videoLlegada.current?.pause()
        setLot(null)
        viewer.current?.clear()
        viewer.current?.cinematic(true)
    }

    const aplicar = <T,>(setter: (v: T) => void, fn: (h: ViewerHandle, v: T) => void) => (v: T) => {
        setter(v)
        if (viewer.current) fn(viewer.current, v)
    }

    const setStageChip = aplicar(setStage, (h, v: number) => h.setFilter({ stage: v }))
    const setLayerChip = aplicar(setLayer, (h, v: Capa) => h.setLayer(v))

    /* ─── envío ─── */

    // Etiqueta que se guarda en la base y viaja al evento de calendario.
    const loteLabel = lot ? `Etapa ${lot.stage} · Lote ${lot.n}` : null
    // La misma información en prosa, para los títulos y los mensajes.
    const loteTexto = lot ? `Lote ${lot.n} de la Etapa ${lot.stage}` : null

    const waMessage = lot
        ? `Hola, vengo del mapa 3D de Lomas del Mar. Me interesa el Lote ${lot.n} de la Etapa ${lot.stage}${lot.area ? ` (${lot.area} m²)` : ''}. ¿Sigue disponible?`
        : 'Hola, vengo del mapa 3D de Lomas del Mar y quiero agendar una visita.'

    const reservaMessage = lot
        ? `Hola, quiero reservar el Lote ${lot.n} de la Etapa ${lot.stage} de Lomas del Mar${lot.area ? ` (${lot.area} m²)` : ''}. ¿Cómo sigo?`
        : 'Hola, quiero reservar un lote en Lomas del Mar. ¿Cómo sigo?'

    /* La reserva se cierra por WhatsApp con un asesor: acá solo se registra la
       intención para poder medirla como conversión. */
    const marcarReserva = () => {
        const w = window as unknown as { fbq?: (...args: unknown[]) => void }
        w.fbq?.('track', 'Lead', {
            content_name: PROYECTO,
            content_category: 'Reserva de lote',
            ...(loteLabel ? { content_ids: [loteLabel] } : {}),
            currency: 'CLP',
            ...(lot?.price ? { value: lot.price } : {}),
        })
    }

    const waHref = (msg: string) =>
        `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(msg)}`

    const puedeEnviar =
        form.nombre.trim().length > 2 &&
        form.celular.trim().length >= 8 &&
        /.+@.+\..+/.test(form.email) &&
        !!date &&
        !!time

    const enviar = async () => {
        if (!puedeEnviar) return
        setStatus('loading')
        setErrorMsg('')

        const eventId = newEventId()
        const utm = getUtmParams()

        try {
            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: form.nombre,
                    email: form.email,
                    celular: form.celular,
                    proyecto: PROYECTO,
                    // El servidor valida con fechaLocal; fecha va como ISO para
                    // el registro y el evento de calendario.
                    fecha: new Date(`${date}T${time}:00`).toISOString(),
                    fechaLocal: date,
                    hora: time,
                    lote: loteLabel,
                    modalidad: MODALIDAD,
                    eventId,
                    ...utm,
                }),
            })

            const data = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(data?.error || 'No pudimos agendar tu visita.')

            setMeetLink(data.meetLink || null)

            const w = window as unknown as { fbq?: (...args: unknown[]) => void }
            if (w.fbq) {
                w.fbq('track', 'Schedule', {
                    content_name: PROYECTO,
                    content_category: 'Real Estate Visit',
                    ...(loteLabel ? { content_ids: [loteLabel] } : {}),
                    currency: 'CLP',
                    ...(lot?.price ? { value: lot.price } : {}),
                }, { eventID: eventId })
            }

            setStatus('idle')
            setStep('listo')
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : 'No pudimos agendar tu visita.')
            setStatus('error')
            // Si el bloque se ocupó entremedio, el visitante vuelve a elegir hora.
            if (err instanceof Error && err.message.includes('horario')) {
                setTime('')
                cargarAgenda()
            }
        }
    }

    /* ─── render ─── */

    const horasDelDia = date ? slotsPorDia.get(date) ?? [] : []

    return (
        <div className={styles.stage}>
            {/* Intro: el vuelo de dron ocupa la pantalla hasta que el visitante entra al mapa */}
            {!started && (
                <section className={styles.intro}>
                    <video
                        className={styles.introVideo}
                        src={movil === null ? undefined
                            : movil ? '/lomas3d/intro-dron-movil.mp4' : '/lomas3d/intro-dron.mp4'}
                        autoPlay
                        muted
                        loop
                        playsInline
                        poster="/lomas3d/intro-dron-poster.webp"
                    />
                    <div className={styles.introVeil} />
                    <div className={styles.introContent}>
                        <span className={styles.kicker}>Lomas del Mar · El Tabo</span>
                        <h1 className={styles.introTitle}>
                            Elige tu lote desde el aire<br />y agenda la visita
                        </h1>
                        <p className={styles.introText}>
                            El terreno completo, levantado con dron y elevación real. Toca el lote que
                            te gusta y reserva el día en que te lo mostramos.
                        </p>
                        <button className={styles.introCta} onClick={() => setStarted(true)}>
                            Entrar al mapa 3D <ArrowRight size={18} />
                        </button>
                        <div className={styles.introStats}>
                            <span><strong>200–390</strong> m² por lote</span>
                            <span><strong>3</strong> etapas</span>
                            <span><strong>10 min</strong> de la playa</span>
                        </div>
                    </div>
                </section>
            )}

            {/* Mapa + panel: el recorrido completo ocurre acá */}
            {started && (
                <section className={styles.map} aria-label="Mapa 3D del loteo">
                    <Lote3DViewer
                        className={styles.viewer}
                        onPick={onPick}
                        onReady={onReady}
                        onError={() => setStep('fecha')}
                        onAlign={setAl}
                    />

                    {/* Plano de dron que recibe al visitante cuando la cámara
                        termina de bajar al lote. Es ambiente del proyecto, no
                        una toma del lote elegido. */}
                    <div className={llegada ? styles.llegadaOn : styles.llegada} aria-hidden="true">
                        {viewerReady && movil !== null && (
                            <video
                                ref={videoLlegada}
                                src={movil
                                    ? '/lomas3d/construccion/llegada-lote-movil.mp4'
                                    : '/lomas3d/construccion/llegada-lote.mp4'}
                                poster="/lomas3d/construccion/llegada-lote-poster.webp"
                                muted
                                loop
                                playsInline
                                /* Se descarga apenas el mapa esta listo: si esperara al
                                   clic, el primer cuadro llegaria tarde y el encadenado
                                   con el vuelo de camara se romperia. Con ahorro de datos
                                   se deja para el momento del clic. */
                                preload={ahorroDatos ? 'metadata' : 'auto'}
                            />
                        )}
                    </div>

                    {!viewerReady && (
                        <div className={styles.loading}>
                            <Loader2 className={styles.spin} size={26} />
                            <span>Levantando el terreno…</span>
                        </div>
                    )}

                    <header className={styles.topBar}>
                        <div className={styles.brand}>
                            <Image
                                src="/lomas3d/logo-alimin-icon.png"
                                alt="Alimin"
                                width={40}
                                height={40}
                            />
                            <div>
                                <strong>LOMAS DEL MAR</strong>
                                <span>Mapa 3D · El Tabo</span>
                            </div>
                        </div>
                    </header>

                    <div className={styles.chips}>
                        <div className={styles.chipRow}>
                            {([['dron', 'Vista del dron'], ['foto', 'Ortofoto'], ['satelite', 'Satelital']] as const).map(
                                ([k, label]) => (
                                    <button
                                        key={k}
                                        className={layer === k ? styles.chipOn : styles.chip}
                                        onClick={() => setLayerChip(k)}
                                    >
                                        {label}
                                    </button>
                                )
                            )}
                        </div>
                        <div className={styles.chipRow}>
                            {[0, 1, 2, 3].map(s => (
                                <button
                                    key={s}
                                    className={stage === s ? styles.chipOn : styles.chip}
                                    onClick={() => setStageChip(s)}
                                >
                                    {s === 0 ? 'Todas' : `Etapa ${s}`}
                                </button>
                            ))}
                        </div>
                    </div>

                    {calce && (
                        <div className={styles.calce}>
                            <span className={styles.kickerDark}>Calzar la panorámica con los lotes</span>
                            <p className={styles.panelText}>
                                Abajo está la ortofoto, que ya calza con los lotes. Encima, la vista del
                                dron. Mueve la de arriba —arrastrando, o con <strong>Shift</strong> para
                                girarla— hasta que los caminos y las casas de las dos coincidan.
                            </p>
                            <div className={styles.calceBotones}>
                                <span className={styles.editorNota}>Solo ortofoto</span>
                                <input
                                    type="range"
                                    min={0}
                                    max={1}
                                    step={0.05}
                                    value={mezcla}
                                    onChange={e => {
                                        const v = Number(e.target.value)
                                        setMezcla(v)
                                        viewer.current?.setMezcla(v)
                                    }}
                                    className={styles.calceSlider}
                                    aria-label="Mezcla entre ortofoto y vista del dron"
                                />
                                <span className={styles.editorNota}>Solo dron</span>
                            </div>
                            <div className={styles.calceBotones}>
                                <button
                                    className={alineando ? styles.chipOn : styles.chip}
                                    onClick={() => {
                                        const on = !alineando
                                        setAlineando(on)
                                        viewer.current?.setAlign(on)
                                        if (on) {
                                            viewer.current?.setMezcla(mezcla)
                                            viewer.current?.topDown()
                                        }
                                    }}
                                >
                                    {alineando ? 'Calce activo' : 'Activar calce'}
                                </button>
                                <button className={styles.chip} onClick={() => viewer.current?.topDown()}>
                                    Vista cenital
                                </button>
                                <button className={styles.chip} onClick={() => viewer.current?.nudgeAlt(-10)}>
                                    − Altura
                                </button>
                                <button className={styles.chip} onClick={() => viewer.current?.nudgeAlt(10)}>
                                    + Altura
                                </button>
                                <button className={styles.chip} onClick={() => viewer.current?.nudgeYaw(-5)}>
                                    ↺ 5°
                                </button>
                                <button className={styles.chip} onClick={() => viewer.current?.nudgeYaw(5)}>
                                    ↻ 5°
                                </button>
                                <input
                                    type="range"
                                    min={-180}
                                    max={180}
                                    step={1}
                                    value={al?.yaw ?? 0}
                                    onChange={e => viewer.current?.setPanoYaw(Number(e.target.value))}
                                    className={styles.calceSlider}
                                    aria-label="Giro de la panorámica"
                                />
                                <span className={styles.calceLectura}>
                                    {al
                                        ? `X ${al.x} · Z ${al.z} · alt ${al.alt} m · giro ${al.yaw}°`
                                        : 'sin ajustes'}
                                </span>
                                <button className={styles.primaryBtn} onClick={guardarCalce} disabled={!al}>
                                    {guardado === 'guardando' ? 'Guardando…'
                                        : guardado === 'guardado' ? 'Guardado ✓'
                                        : guardado === 'error' ? 'No se pudo guardar'
                                        : 'Guardar calce'}
                                </button>
                            </div>
                        </div>
                    )}

                    {editor && <EditorLotes viewer={handle} />}

                    {/* Sin lote elegido el aviso es una barra compacta: la tarjeta
                        grande bajaba hasta el rincón del asistente flotante y se
                        pisaban. */}
                    {!editor && step === 'lote' && !lot && (
                        <div className={styles.hint}>
                            <div className={styles.hintTexto}>
                                <strong>Toca un lote en el mapa</strong>
                                <span className={styles.legend}>
                                    <span><i className={styles.dotFree} /> Disponible</span>
                                    <span><i className={styles.dotSold} /> Vendido</span>
                                </span>
                            </div>
                            <button className={styles.hintBtn} onClick={() => setStep('fecha')}>
                                Agendar sin elegir lote
                            </button>
                        </div>
                    )}

                    {!editor && movil && lot && !fichaAbierta && (
                        <div className={styles.etiquetas}>
                            <div className={styles.etiquetaLote}>
                                <strong>Lote {lot.n}</strong>
                                <span>Etapa {lot.stage} · {lot.area} m²</span>
                                <button onClick={limpiarLote} aria-label="Quitar selección">
                                    <X size={13} />
                                </button>
                            </div>
                            <button
                                className={styles.etiqueta}
                                onClick={() => { setStep('lote'); setFichaAbierta(true) }}
                            >
                                Ver lote
                            </button>
                            {!lot.sold && (
                                <button
                                    className={styles.etiquetaFuerte}
                                    onClick={() => { setStep('fecha'); setFichaAbierta(true) }}
                                >
                                    Agendar visita
                                </button>
                            )}
                            <a
                                className={styles.etiquetaWa}
                                href={waHref(waMessage)}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                WhatsApp
                            </a>
                        </div>
                    )}

                    {!editor && !(step === 'lote' && !lot) && (!movil || fichaAbierta) && <aside className={styles.panel}>
                        {step === 'lote' && lot && (
                            <div className={styles.panelBody}>
                                <div className={styles.panelHead}>
                                    <div>
                                        <span className={styles.kickerDark}>Etapa {lot.stage}</span>
                                        <h2 className={styles.lotNumber}>Lote {lot.n}</h2>
                                    </div>
                                    <div className={styles.panelHeadDer}>
                                        <span className={lot.sold ? styles.badgeSold : styles.badgeFree}>
                                            {lot.sold ? 'Vendido' : 'Disponible'}
                                        </span>
                                        <button
                                            className={styles.closeBtn}
                                            onClick={() => movil ? setFichaAbierta(false) : limpiarLote()}
                                            aria-label={movil ? 'Cerrar la ficha' : 'Quitar selección'}
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className={styles.specs}>
                                    <div>
                                        <Ruler size={15} />
                                        <span>Superficie</span>
                                        <strong>{lot.area ? `${lot.area.toLocaleString('es-CL')} m²` : 'Consultar'}</strong>
                                        <em>de escritura</em>
                                    </div>
                                    <div>
                                        <MapPin size={15} />
                                        <span>Cota</span>
                                        <strong>
                                            {viewer.current?.dem
                                                ? `${(viewer.current.dem.min + viewer.current.height(lot.cx, lot.cy)).toFixed(1)} m`
                                                : '—'}
                                        </strong>
                                    </div>
                                </div>

                                {lot.price && (
                                    <div className={styles.price}>
                                        <span>Precio del terreno</span>
                                        <strong>{CLP(lot.price)}</strong>
                                        {lot.area && <em>{CLP(lot.price / lot.area)} por m² · en pesos</em>}
                                    </div>
                                )}

                                <figure className={styles.video}>
                                    <video
                                        src={movil
                                            ? '/lomas3d/construccion/casa-200m2-movil.mp4'
                                            : '/lomas3d/construccion/casa-200m2.mp4'}
                                        poster="/lomas3d/construccion/casa-200m2-poster.webp"
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                        preload="metadata"
                                    />
                                    <figcaption>Ejemplo de lo que se puede construir en 200 m²</figcaption>
                                </figure>

                                {lot.sold ? (
                                    <>
                                        <p className={styles.panelText}>
                                            Este lote ya se vendió. Agenda igual y te mostramos los que
                                            quedan en la misma etapa.
                                        </p>
                                        <button
                                            className={styles.primaryBtn}
                                            onClick={() => { setStageChip(lot.stage); limpiarLote() }}
                                        >
                                            Ver los disponibles de la Etapa {lot.stage}
                                        </button>
                                    </>
                                ) : (
                                    <button className={styles.primaryBtn} onClick={() => setStep('fecha')}>
                                        Agendar visita <ArrowRight size={17} />
                                    </button>
                                )}

                                <div className={styles.ctaDoble}>
                                    <a
                                        className={styles.reservarBtn}
                                        href={waHref(reservaMessage)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={marcarReserva}
                                    >
                                        Reservar
                                    </a>
                                    <a
                                        className={styles.waBtn}
                                        href={waHref(waMessage)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        WhatsApp
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* Paso 2 — el día y la hora */}
                        {step === 'fecha' && (
                            <div className={styles.panelBody}>
                                <span className={styles.kickerDark}>Paso 2 de 3</span>
                                <h2 className={styles.panelTitle}>
                                    {loteTexto ? `Visita al ${loteTexto}` : 'Elige día y hora'}
                                </h2>

                                {availFailed && (
                                    <p className={styles.warn}>
                                        No pudimos leer la agenda. Escríbenos por WhatsApp y coordinamos
                                        la hora contigo.
                                    </p>
                                )}

                                {!avail && !availFailed && (
                                    <p className={styles.panelText}>
                                        <Loader2 className={styles.spin} size={15} /> Consultando la agenda
                                        del equipo…
                                    </p>
                                )}

                                {avail && (
                                    <>
                                        {!avail.liveCalendar && (
                                            <p className={styles.warn}>
                                                Estamos mostrando el horario de atención. Un asesor te
                                                confirma la hora exacta al llamarte.
                                            </p>
                                        )}

                                        <div className={styles.monthBar}>
                                            <button
                                                onClick={() => irAMes(-1)}
                                                disabled={idxMes <= 0}
                                                aria-label="Mes anterior"
                                            >
                                                <ChevronLeft size={17} />
                                            </button>
                                            <strong>{MESES[month.month - 1]} {month.year}</strong>
                                            <button
                                                onClick={() => irAMes(1)}
                                                disabled={idxMes < 0 || idxMes >= mesesConCupo.length - 1}
                                                aria-label="Mes siguiente"
                                            >
                                                <ChevronRight size={17} />
                                            </button>
                                        </div>

                                        <div className={styles.weekHead}>
                                            {DIAS_CORTOS.map(d => <span key={d}>{d}</span>)}
                                        </div>
                                        <div className={styles.grid}>
                                            {celdas.map((cell, i) => {
                                                if (!cell) return <span key={`v${i}`} />
                                                const libre = slotsPorDia.has(cell.iso)
                                                return (
                                                    <button
                                                        key={cell.iso}
                                                        className={
                                                            date === cell.iso ? styles.dayOn
                                                                : libre ? styles.day : styles.dayOff
                                                        }
                                                        disabled={!libre}
                                                        onClick={() => { setDate(cell.iso); setTime('') }}
                                                    >
                                                        {cell.day}
                                                    </button>
                                                )
                                            })}
                                        </div>

                                        {date && (
                                            <>
                                                <span className={styles.kickerDark}>
                                                    Horas libres · {fechaLarga(date)}
                                                </span>
                                                <div className={styles.slots}>
                                                    {horasDelDia.map(h => (
                                                        <button
                                                            key={h}
                                                            className={time === h ? styles.slotOn : styles.slot}
                                                            onClick={() => setTime(h)}
                                                        >
                                                            {h}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}

                                        <button
                                            className={styles.primaryBtn}
                                            disabled={!date || !time}
                                            onClick={() => setStep('datos')}
                                        >
                                            Continuar <ArrowRight size={17} />
                                        </button>
                                    </>
                                )}

                                <button className={styles.ghostBtn} onClick={() => setStep('lote')}>
                                    Volver al mapa
                                </button>
                            </div>
                        )}

                        {/* Paso 3 — los datos */}
                        {step === 'datos' && (
                            <div className={styles.panelBody}>
                                <span className={styles.kickerDark}>Paso 3 de 3</span>
                                <h2 className={styles.panelTitle}>¿A quién esperamos?</h2>
                                <p className={styles.resumen}>
                                    <Calendar size={14} /> {fechaLarga(date)} · {time} h
                                    {loteTexto && <> · {loteTexto}</>}
                                </p>

                                <label className={styles.field}>
                                    <span>Nombre y apellido</span>
                                    <input
                                        type="text"
                                        autoComplete="name"
                                        value={form.nombre}
                                        onChange={e => setForm({ ...form, nombre: e.target.value })}
                                        placeholder="Carolina Rojas"
                                    />
                                </label>
                                <label className={styles.field}>
                                    <span>Celular</span>
                                    <input
                                        type="tel"
                                        autoComplete="tel"
                                        value={form.celular}
                                        onChange={e => setForm({ ...form, celular: e.target.value })}
                                        placeholder="+56 9 1234 5678"
                                    />
                                </label>
                                <label className={styles.field}>
                                    <span>Email</span>
                                    <input
                                        type="email"
                                        autoComplete="email"
                                        value={form.email}
                                        onChange={e => setForm({ ...form, email: e.target.value })}
                                        placeholder="carolina@correo.cl"
                                    />
                                    <small>Te llega la cita a tu calendario con la ubicación exacta.</small>
                                </label>

                                {status === 'error' && <p className={styles.warn}>{errorMsg}</p>}

                                <button
                                    className={styles.primaryBtn}
                                    disabled={!puedeEnviar || status === 'loading'}
                                    onClick={enviar}
                                >
                                    {status === 'loading'
                                        ? <><Loader2 className={styles.spin} size={17} /> Agendando…</>
                                        : <>Confirmar visita <ArrowRight size={17} /></>}
                                </button>
                                <button className={styles.ghostBtn} onClick={() => setStep('fecha')}>
                                    Cambiar día u hora
                                </button>
                                <small className={styles.legal}>
                                    Usamos tus datos solo para coordinar esta visita.
                                </small>
                            </div>
                        )}

                        {/* Confirmación */}
                        {step === 'listo' && (
                            <div className={styles.panelBody}>
                                <div className={styles.tick}><Check size={26} /></div>
                                <h2 className={styles.panelTitle}>Visita agendada</h2>
                                <p className={styles.panelText}>
                                    Te esperamos el {fechaLarga(date)} a las {time} h en El Tabo
                                    {loteTexto && <>, para mostrarte el <strong>{loteTexto}</strong></>}.
                                    La invitación va camino a {form.email}.
                                </p>
                                {meetLink && (
                                    <a
                                        className={styles.ghostBtn}
                                        href={meetLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Video size={16} /> Link de videollamada de respaldo
                                    </a>
                                )}
                                <a
                                    className={styles.waBtn}
                                    href={waHref(
                                        `Hola, agendé una visita para el ${fechaLarga(date)} a las ${time} h${loteTexto ? ` por el ${loteTexto}` : ''}. Mi nombre es ${form.nombre}.`
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Confirmar por WhatsApp
                                </a>
                                <button
                                    className={styles.ghostBtn}
                                    onClick={() => { setStep('lote'); limpiarLote() }}
                                >
                                    Seguir explorando el mapa
                                </button>
                            </div>
                        )}
                    </aside>}
                </section>
            )}
        </div>
    )
}
