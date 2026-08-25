'use client'

import { useState, useEffect, CSSProperties } from 'react'
import MetaTrackPageView from '@/components/analytics/MetaTrackPageView'
import { getUtmParams, newEventId } from '@/lib/track'
import { REGIONES } from './regiones'
import { FAQS } from './faqs'

const ASSET = '/assets/venta-terrenos'

// Parse an inline CSS string into a React style object so the design markup
// can be ported faithfully. First ':' splits prop/value (safe for url(https://...)).
function s(css: string): CSSProperties {
    const o: Record<string, string> = {}
    css.split(';').forEach((rule) => {
        const i = rule.indexOf(':')
        if (i < 0) return
        const key = rule.slice(0, i).trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase())
        const val = rule.slice(i + 1).trim()
        if (key) o[key] = val
    })
    return o as CSSProperties
}

const GALLERY = [
    { img: 'g01', proj: 'Arena y Sol' }, { img: 'g02', proj: 'Arena y Sol' },
    { img: 'g03', proj: 'Arena y Sol' }, { img: 'g04', proj: 'Arena y Sol' },
    { img: 'g05', proj: 'Arena y Sol' }, { img: 'g06', proj: 'Arena y Sol' },
    { img: 'g07', proj: 'Arena y Sol' }, { img: 'g08', proj: 'Arena y Sol' },
    { img: 'g09', proj: 'Arena y Sol' }, { img: 'g10', proj: 'Lomas del Mar' },
    { img: 'g11', proj: 'Lomas del Mar' }, { img: 'g12', proj: 'Lomas del Mar' },
    { img: 'g13', proj: 'Lomas del Mar' }, { img: 'g14', proj: 'Lomas del Mar' },
]

const STEPS = [
    { label: 'Cotiza', title: 'Cotiza en línea', desc: 'Completa el formulario y recibe precios y disponibilidad al instante, sin compromiso.', icon: '📝' },
    { label: 'Visita', title: 'Agenda tu visita', desc: 'Recorre el loteo junto a un asesor de Alimin, sin costo, para conocer tu terreno en persona.', icon: '📍' },
    { label: 'Reserva', title: 'Elige y reserva', desc: 'Bloquea el lote que más te gusta con el pie inicial. Sin banco y sin importar tu DICOM.', icon: '🤝' },
    { label: 'Firma', title: 'Firma en notaría', desc: 'Firmamos un contrato de compraventa claro ante notario, con todo el respaldo legal.', icon: '✍️' },
    { label: 'Escritura', title: 'Escritura a tu nombre', desc: 'Recibe tu terreno urbanizado con el rol propio inscrito en el Conservador. Eres dueño.', icon: '🔑' },
]
const JLABELS = [
    '¡Comienza tu camino! Estás a 5 pasos de tu terreno.',
    '¡Vas avanzando! Conoce el loteo en persona.',
    'A mitad de camino — elige y asegura tu lote.',
    'Casi listo: la firma que te hace dueño.',
    '🎉 ¡Meta alcanzada! Tu terreno está a tu nombre.',
]

export default function VentaTerrenosClient() {
    const [form, setForm] = useState({
        nombre: '', telefono: '', email: '', proyecto: '', tamano: '', region: '', comuna: '', como: '',
    })
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [filter, setFilter] = useState<'todos' | 'lomas' | 'arena'>('todos')
    const [activeStep, setActiveStep] = useState(0)
    const [lightboxProj, setLightboxProj] = useState<string | null>(null)
    const [zoom, setZoom] = useState(1)
    const [galIndex, setGalIndex] = useState<number | null>(null)
    const [openFaq, setOpenFaq] = useState<number | null>(0)

    const regionSel = REGIONES.find((r) => r.region === form.region)
    const comunaOptions = regionSel ? regionSel.comunas : []
    const tamanoOptions = form.proyecto === 'Lomas del Mar' ? ['200 m²', '390 m²'] : (form.proyecto === 'Arena y Sol' ? ['200 m²'] : [])

    // ---- handlers ----
    const setField = (k: string) => (e: any) => {
        const v = e.target.value
        setForm((prev) => {
            const next: any = { ...prev, [k]: v }
            if (k === 'proyecto') next.tamano = ''
            if (k === 'region') next.comuna = ''
            return next
        })
    }

    const scrollToForm = () => {
        const el = document.getElementById('cotizar')
        if (el) {
            const y = el.getBoundingClientRect().top + window.pageYOffset - 80
            window.scrollTo({ top: y, behavior: 'smooth' })
        }
    }

    const cotizar = (proyecto: string) => (e?: any) => {
        if (e && e.preventDefault) e.preventDefault()
        setForm((prev) => {
            const next: any = { ...prev, proyecto }
            next.tamano = proyecto === 'Arena y Sol' ? '200 m²' : ''
            return next
        })
        setTimeout(scrollToForm, 70)
    }

    const playVideo = () => {
        const v = document.getElementById('al-video-andres') as HTMLVideoElement | null
        const ov = document.getElementById('al-video-andres-overlay')
        if (!v) return
        v.setAttribute('controls', 'controls')
        if (ov) ov.style.display = 'none'
        const p = v.play()
        if (p && p.catch) p.catch(() => { if (ov) ov.style.display = 'block'; v.removeAttribute('controls') })
    }

    const openPlano = (proj: string) => { setLightboxProj(proj); setZoom(1) }
    const zoomPlano = (dir: number) => setZoom((z) => Math.max(1, Math.min(3.4, z + dir * 0.4)))
    const galStep = (d: number) => setGalIndex((i) => (i == null ? i : (i + d + 14) % 14))
    const atLast = activeStep >= STEPS.length - 1

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setStatus('loading')
        try {
            const getCookie = (name: string) => {
                if (typeof document === 'undefined') return undefined
                const value = '; ' + document.cookie
                const parts = value.split('; ' + name + '=')
                if (parts.length === 2) return parts.pop()?.split(';').shift()
                return undefined
            }
            const fbp = getCookie('_fbp')
            const fbc = getCookie('_fbc')

            const utm_data = getUtmParams({
                utm_source: 'venta_terrenos_seo',
                utm_medium: 'organic',
                utm_campaign: 'venta_terrenos_litoral_central',
            })

            // Shared between the browser Pixel and the CAPI call below so Meta
            // deduplicates them into a single Lead.
            const eventId = newEventId()

            const detalle = [form.proyecto, form.tamano].filter(Boolean).join(' ')
            const payload = {
                nombre: form.nombre,
                email: form.email,
                celular: form.telefono,
                ciudad: [form.comuna, form.region].filter(Boolean).join(' - ') || 'No especificada',
                proyecto: 'venta de terrenos litoral central' + (detalle ? ' - ' + detalle : ''),
                ...utm_data,
                fbp,
                fbc,
                eventId,
            }

            const res = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            if (!res.ok) throw new Error('Error al enviar')

            // The server-side counterpart is sent by /api/leads with the same
            // eventId, so Meta keeps only one of the two.
            if (typeof window !== 'undefined' && (window as any).fbq) {
                ;(window as any).fbq('track', 'Lead', {
                    content_name: 'Venta de Terrenos Litoral Central',
                    content_category: 'Real Estate',
                    currency: 'CLP',
                }, { eventID: eventId })
            }

            setStatus('success')
        } catch (err) {
            setStatus('error')
        }
    }

    // ---- Leaflet satellite map ----
    useEffect(() => {
        let cancelled = false
        // Inject Leaflet CSS + JS once (idempotent).
        if (!document.getElementById('leaflet-css')) {
            const link = document.createElement('link')
            link.id = 'leaflet-css'
            link.rel = 'stylesheet'
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
            document.head.appendChild(link)
        }
        if (!document.getElementById('leaflet-js')) {
            const sc = document.createElement('script')
            sc.id = 'leaflet-js'
            sc.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
            document.body.appendChild(sc)
        }
        const initMap = () => {
            const el = document.getElementById('al-satmap') as any
            const L = (window as any).L
            if (!L || !el || el._leaflet_id) return
            const lomas: [number, number] = [-33.4617574, -71.6158903]
            const arena: [number, number] = [-33.4347434, -71.6290669]
            const map = L.map(el, { scrollWheelZoom: false, zoomControl: true }).setView([-33.4482, -71.6224], 13)
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Imagery © Esri, Maxar, Earthstar Geographics' }).addTo(map)
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, opacity: 0.85 }).addTo(map)
            const pin = (color: string, name: string) => L.divIcon({ className: '', iconSize: [0, 0], iconAnchor: [0, 0], html: '<div class="al-mappin"><span class="al-pin-head" style="border-color:' + color + '">' + name + '</span><span class="al-pin-dot" style="background:' + color + '"></span></div>' })
            L.marker(lomas, { icon: pin('#76d845', 'Lomas del Mar') }).addTo(map)
            L.marker(arena, { icon: pin('#C5A059', 'Arena y Sol') }).addTo(map)
            map.fitBounds([lomas, arena], { padding: [70, 70] })
            setTimeout(() => map.invalidateSize(), 200)
        }
        // Poll until Leaflet finished loading, then init (up to ~12s).
        let tries = 48
        const tick = () => {
            if (cancelled) return
            const el = document.getElementById('al-satmap') as any
            if (el && el._leaflet_id) return
            if ((window as any).L && el) { initMap(); return }
            if (tries-- > 0) setTimeout(tick, 250)
        }
        tick()
        return () => { cancelled = true }
    }, [])

    const showLomas = filter === 'todos' || filter === 'lomas'
    const showArena = filter === 'todos' || filter === 'arena'
    const filterBtn = (active: boolean): CSSProperties => active
        ? s("padding:10px 22px;border-radius:100px;font:700 13px 'Montserrat',sans-serif;cursor:pointer;border:1px solid #4ba646;background:linear-gradient(135deg,#76d845,#4ba646);color:#fff;box-shadow:0 6px 16px rgba(118,216,69,.3);transition:all .2s;white-space:nowrap")
        : s("padding:10px 22px;border-radius:100px;font:700 13px 'Montserrat',sans-serif;cursor:pointer;border:1px solid #d7e3d0;background:#fff;color:#4b5563;transition:all .2s;white-space:nowrap")

    const planoImg = lightboxProj === 'Arena y Sol' ? ASSET + '/plano-arena-y-sol-2026-08-24.webp' : ASSET + '/plano-lomas-del-mar.webp'

    return (
        <div id="venta-terrenos" style={s("font-family:'Roboto',sans-serif;background:#0e1a24;color:#fff;overflow-x:hidden")}>
            <MetaTrackPageView eventName="ViewContent" customData={{ content_name: 'Venta de Terrenos Litoral Central', content_category: 'Real Estate' }} />
            <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet" />
            <style dangerouslySetInnerHTML={{ __html: CSS }} />

            {/* ===================== HEADER ===================== */}
            <header style={s("position:sticky;top:0;z-index:60;background:linear-gradient(135deg,#3a9e48 0%,#4ba646 42%,#62c247 100%);box-shadow:0 4px 18px rgba(0,0,0,.25)")}>
                <div style={s("max-width:1280px;margin:0 auto;padding:0 22px;height:64px;display:flex;align-items:center;gap:24px")}>
                    <a href="#inicio" style={s("display:flex;align-items:center;gap:10px;text-decoration:none")}>
                        <img src={ASSET + '/logo-alimin-icon.png'} alt="Alimin Inmobiliaria" style={s("height:40px;width:auto;display:block")} />
                        <span style={s("font:900 21px 'Montserrat',sans-serif;color:#fff;letter-spacing:-.02em")}>ALIMIN</span>
                    </a>
                    <nav style={s("display:flex;gap:26px;align-items:center;margin-left:auto")} className="al-desktop-nav">
                        <a href="/" className="al-nav-link">Inicio</a>
                        <a href="/proyectos" className="al-nav-link">Proyectos</a>
                        <a href="/quienes-somos" className="al-nav-link">Quiénes somos</a>
                        <a href="/asesores" className="al-nav-link">Asesores</a>
                        <a href="/blog" className="al-nav-link">Blog</a>
                        <a href="/contacto" className="al-nav-link">Contacto</a>
                    </nav>
                    <a href="#cotizar" className="al-cta" style={s("margin-left:auto;background:#fff;color:#2d7a3a;font:700 14px 'Montserrat',sans-serif;padding:11px 22px;border-radius:100px;text-decoration:none;box-shadow:0 4px 16px rgba(0,0,0,.2);transition:transform .2s;white-space:nowrap")}>Cotizar →</a>
                </div>
            </header>

            {/* ===================== HERO ===================== */}
            <section id="inicio" style={s("position:relative;background:#0e1a24;overflow:hidden;padding:64px 22px 76px")}>
                <div aria-hidden="true" data-scene="mar" data-motion="cine" style={s("position:absolute;inset:0;overflow:hidden;pointer-events:none")}>
                    <div className="al-bg-layer al-bg-mar"><div className="al-bg-img" style={s("background-image:url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=2400&auto=format&fit=crop&q=80')")}></div></div>
                    <div className="al-bg-layer al-bg-bosque"><div className="al-bg-img" style={s("background-image:url('" + ASSET + "/hero-arena-y-sol.webp')")}></div></div>
                    <div style={s("position:absolute;inset:0;background:linear-gradient(100deg,rgba(8,16,24,.95) 0%,rgba(9,18,28,.86) 34%,rgba(10,20,30,.5) 66%,rgba(12,24,34,.66) 100%)")}></div>
                    <div style={s("position:absolute;inset:0;background:linear-gradient(to top,#0e1a24 0%,rgba(14,26,36,.4) 14%,transparent 55%)")}></div>
                    <div style={s("position:absolute;top:-16%;right:-8%;width:620px;height:620px;border-radius:50%;background:radial-gradient(circle,rgba(118,216,69,.10) 0%,transparent 70%)")}></div>
                    <div style={s("position:absolute;bottom:-22%;left:-10%;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(50,83,102,.35) 0%,transparent 70%)")}></div>
                </div>

                <div className="al-hero-grid" style={s("position:relative;z-index:2;max-width:1280px;margin:0 auto")}>
                    <div style={s("animation:fadeInUp .6s .05s ease both")}>
                        <h1 style={s("font:900 clamp(2.4rem,5vw,4rem)/1.03 'Montserrat',sans-serif;letter-spacing:-.035em;margin:0 0 18px;color:#fff")}>Venta de Terrenos en el <em style={s("font-style:normal;background:linear-gradient(90deg,#76d845,#4ba646,#76d845) 0 0/200% text;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:shimmerGold 3s linear infinite")}>Litoral Central</em></h1>
                        <p style={s("font:300 clamp(1rem,2vw,1.18rem)/1.7 'Roboto',sans-serif;color:rgba(255,255,255,.66);margin:0 0 26px;max-width:520px")}>Terrenos urbanizados en El Tabo, a minutos de la playa. Escritura a tu nombre, agua y luz certificadas, y financiamiento directo <strong style={s("color:#fff;font-weight:500")}>sin banco y sin importar tu DICOM.</strong></p>
                        <div style={s("display:flex;flex-wrap:wrap;gap:14px 26px;padding-top:22px;border-top:1px solid rgba(255,255,255,.09)")}>
                            {['Rol propio incluido', 'Sin banco, sin DICOM', 'Agua certificada SEREMI'].map((t) => (
                                <div key={t} style={s("display:flex;align-items:center;gap:9px")}>
                                    <span style={s("width:22px;height:22px;border-radius:50%;background:rgba(118,216,69,.18);border:1px solid rgba(118,216,69,.5);display:flex;align-items:center;justify-content:center;color:#76d845;font-size:12px")}>✓</span>
                                    <span style={s("font:400 14px 'Roboto',sans-serif;color:rgba(255,255,255,.82)")}>{t}</span>
                                </div>
                            ))}
                        </div>

                        <div style={s("display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:26px")}>
                            <a href="#terrenos" className="al-hero-proj" style={s("position:relative;display:block;border-radius:16px;overflow:hidden;text-decoration:none;border:1.5px solid rgba(118,216,69,.4);box-shadow:0 12px 30px rgba(0,0,0,.4);transition:transform .3s")}>
                                <div style={s("aspect-ratio:16/11;overflow:hidden")}><img src={ASSET + '/hero-arena-y-sol.webp'} alt="Loteo Lomas del Mar, terrenos en venta en El Tabo, Litoral Central" style={s("width:100%;height:100%;object-fit:cover;object-position:center 62%;display:block;transition:transform .5s ease")} /></div>
                                <div style={s("position:absolute;inset:0;background:linear-gradient(to top,rgba(8,16,24,.92) 6%,rgba(8,16,24,.15) 55%,transparent)")}></div>
                                <div style={s("position:absolute;top:10px;left:10px;background:rgba(118,216,69,.9);color:#0e1a24;font:800 9px 'Montserrat',sans-serif;text-transform:uppercase;letter-spacing:.06em;padding:4px 9px;border-radius:100px")}>✓ Crédito directo</div>
                                <div style={s("position:absolute;bottom:12px;left:13px;right:13px")}>
                                    <div style={s("font:800 16px 'Montserrat',sans-serif;color:#fff;line-height:1.1;margin-bottom:2px")}>Lomas del Mar</div>
                                    <div style={s("font:500 11px 'Roboto',sans-serif;color:rgba(255,255,255,.72)")}>200 · 390 m² · a 8 min de la playa</div>
                                </div>
                            </a>
                            <a href="#terrenos" className="al-hero-proj" style={s("position:relative;display:block;border-radius:16px;overflow:hidden;text-decoration:none;border:1.5px solid rgba(197,160,89,.4);box-shadow:0 12px 30px rgba(0,0,0,.4);transition:transform .3s")}>
                                <div style={s("aspect-ratio:16/11;overflow:hidden")}><img src={ASSET + '/hero-lomas-del-mar.webp'} alt="Arena y Sol, terrenos con vista al mar en El Tabo, Litoral Central" style={s("width:100%;height:100%;object-fit:cover;object-position:center 40%;display:block;transition:transform .5s ease")} /></div>
                                <div style={s("position:absolute;inset:0;background:linear-gradient(to top,rgba(8,16,24,.92) 6%,rgba(8,16,24,.15) 55%,transparent)")}></div>
                                <div style={s("position:absolute;top:10px;left:10px;background:rgba(239,68,68,.85);color:#fff;font:800 9px 'Montserrat',sans-serif;text-transform:uppercase;letter-spacing:.06em;padding:4px 9px;border-radius:100px")}>⚠ 90% vendido</div>
                                <div style={s("position:absolute;bottom:12px;left:13px;right:13px")}>
                                    <div style={s("font:800 16px 'Montserrat',sans-serif;color:#fff;line-height:1.1;margin-bottom:2px")}>Arena y Sol</div>
                                    <div style={s("font:500 11px 'Roboto',sans-serif;color:rgba(255,255,255,.72)")}>200 m² · a 10 min de la playa</div>
                                </div>
                            </a>
                        </div>
                    </div>

                    {/* Right: cotización form */}
                    <div id="cotizar" style={s("animation:fadeInUp .6s .18s ease both;background:rgba(14,26,36,.86);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1.5px solid rgba(118,216,69,.28);border-radius:24px;padding:32px;box-shadow:0 24px 64px rgba(0,0,0,.5)")}>
                        {status !== 'success' ? (
                            <div>
                                <div style={s("display:inline-flex;align-items:center;gap:8px;margin-bottom:6px")}>
                                    <span style={s("width:26px;height:2px;background:linear-gradient(90deg,#76d845,#4ba646)")}></span>
                                    <span style={s("font:600 11px 'Montserrat',sans-serif;color:#76d845;text-transform:uppercase;letter-spacing:.12em")}>Cotización gratuita</span>
                                </div>
                                <h2 style={s("font:800 clamp(1.5rem,2.4vw,1.9rem)/1.1 'Montserrat',sans-serif;color:#fff;margin:4px 0 6px")}>Cotiza tu terreno hoy</h2>
                                <p style={s("font:400 13.5px/1.5 'Roboto',sans-serif;color:rgba(255,255,255,.55);margin:0 0 22px")}>Un asesor te contacta en menos de 24 horas con precios y disponibilidad.</p>
                                <form onSubmit={handleSubmit}>
                                    <div className="al-form-grid" style={s("gap:14px;margin-bottom:14px")}>
                                        <div className="al-field" style={s("grid-column:1/-1")}>
                                            <label>Nombre completo *</label>
                                            <input type="text" placeholder="Tu nombre y apellido" required value={form.nombre} onChange={setField('nombre')} />
                                        </div>
                                        <div className="al-field">
                                            <label>Teléfono / WhatsApp *</label>
                                            <input type="tel" placeholder="+56 9 1234 5678" required value={form.telefono} onChange={setField('telefono')} />
                                        </div>
                                        <div className="al-field">
                                            <label>Correo electrónico *</label>
                                            <input type="email" placeholder="ejemplo@correo.com" required value={form.email} onChange={setField('email')} />
                                        </div>
                                        <div className="al-field">
                                            <label>Proyecto de interés *</label>
                                            <select required value={form.proyecto} onChange={setField('proyecto')}>
                                                <option value="">Selecciona un proyecto</option>
                                                <option value="Lomas del Mar">Lomas del Mar</option>
                                                <option value="Arena y Sol">Arena y Sol</option>
                                            </select>
                                        </div>
                                        <div className="al-field">
                                            <label>Tamaño del terreno *</label>
                                            <select required value={form.tamano} onChange={setField('tamano')} disabled={!form.proyecto}>
                                                <option value="">{form.proyecto ? 'Selecciona el tamaño' : 'Primero elige un proyecto'}</option>
                                                {tamanoOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </div>
                                        <div className="al-field">
                                            <label>Región *</label>
                                            <select required value={form.region} onChange={setField('region')}>
                                                <option value="">Selecciona tu región</option>
                                                {REGIONES.map((r) => <option key={r.region} value={r.region}>{r.region}</option>)}
                                            </select>
                                        </div>
                                        <div className="al-field">
                                            <label>Ciudad / Comuna *</label>
                                            <select required value={form.comuna} onChange={setField('comuna')} disabled={!form.region}>
                                                <option value="">{form.region ? 'Selecciona tu comuna' : 'Primero elige tu región'}</option>
                                                {comunaOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div className="al-field" style={s("grid-column:1/-1")}>
                                            <label>¿Cómo nos conociste?</label>
                                            <select value={form.como} onChange={setField('como')}>
                                                <option value="">Selecciona una opción</option>
                                                <option value="Instagram">Instagram</option>
                                                <option value="Facebook">Facebook</option>
                                                <option value="TikTok">TikTok</option>
                                                <option value="Recomendación">Recomendación de un amigo</option>
                                                <option value="Google">Google / Búsqueda web</option>
                                                <option value="WhatsApp">WhatsApp</option>
                                                <option value="Otro">Otro</option>
                                            </select>
                                        </div>
                                    </div>
                                    <button type="submit" className="al-submit" disabled={status === 'loading'} style={s("width:100%;border:none;cursor:pointer;background:linear-gradient(135deg,#325366,#4ba646);color:#fff;font:700 15px 'Montserrat',sans-serif;letter-spacing:.02em;padding:16px;border-radius:14px;box-shadow:0 6px 22px rgba(50,83,102,.4);transition:transform .2s,box-shadow .2s")}>{status === 'loading' ? 'Enviando…' : 'QUIERO MI COTIZACIÓN →'}</button>
                                    {status === 'error' && <p style={s("text-align:center;margin:12px 0 0;font:600 12px 'Roboto',sans-serif;color:#FCA5A5")}>Hubo un problema al enviar. Intenta de nuevo o escríbenos por WhatsApp.</p>}
                                    <p style={s("text-align:center;margin:14px 0 0;font:400 12px 'Roboto',sans-serif;color:rgba(255,255,255,.38)")}>🔒 Tus datos están seguros · Sin spam</p>
                                </form>
                            </div>
                        ) : (
                            <div style={s("text-align:center;padding:36px 12px")}>
                                <div style={s("width:76px;height:76px;border-radius:50%;margin:0 auto 20px;background:linear-gradient(135deg,#eaf7d8,#C8E6CB);display:flex;align-items:center;justify-content:center;font-size:34px")}>✅</div>
                                <h2 style={s("font:800 24px 'Montserrat',sans-serif;color:#fff;margin:0 0 10px")}>¡Cotización enviada!</h2>
                                <p style={s("font:400 15px/1.6 'Roboto',sans-serif;color:rgba(255,255,255,.62);margin:0 auto;max-width:340px")}>Recibimos tu solicitud. Un asesor de Alimin te contactará en menos de 24 horas.</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ===================== 2. COMPRA 100% LEGAL ===================== */}
            <section style={s("position:relative;background:#0e1a24;padding:78px 22px;overflow:hidden")}>
                <div aria-hidden="true" style={s("position:absolute;inset:0;background:url('https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1800&auto=format&fit=crop&q=80') center/cover no-repeat")}></div>
                <div aria-hidden="true" style={s("position:absolute;inset:0;background:linear-gradient(155deg,rgba(14,26,36,.78) 0%,rgba(10,21,32,.62) 45%,rgba(50,83,102,.52) 100%)")}></div>
                <div aria-hidden="true" style={s("position:absolute;top:0;left:0;right:0;height:200px;background:linear-gradient(to bottom,#0e1a24 0%,rgba(14,26,36,.6) 45%,transparent 100%);pointer-events:none")}></div>
                <div style={s("position:relative;max-width:1160px;margin:0 auto")}>
                    <div style={s("text-align:center;margin-bottom:46px")}>
                        <div style={s("display:inline-flex;align-items:center;gap:8px;margin-bottom:14px")}>
                            <span style={s("width:32px;height:2px;background:linear-gradient(90deg,#4ba646,#76d845)")}></span>
                            <span style={s("font:600 12px 'Montserrat',sans-serif;color:#76d845;text-transform:uppercase;letter-spacing:.12em")}>Compra 100% legal</span>
                            <span style={s("width:32px;height:2px;background:linear-gradient(90deg,#76d845,#4ba646)")}></span>
                        </div>
                        <h2 style={s("font:800 clamp(1.8rem,3.4vw,2.5rem)/1.15 'Montserrat',sans-serif;color:#fff;margin:0 0 14px")}>La escritura queda a tu nombre</h2>
                        <p style={s("font:400 15.5px/1.7 'Roboto',sans-serif;color:rgba(255,255,255,.68);max-width:560px;margin:0 auto")}>Olvídate de los "loteos brujos". Cada terreno se firma ante notario y se inscribe en el Conservador de Bienes Raíces.</p>
                    </div>
                    <div style={s("display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px")}>
                        {[
                            { t: 'Escritura a tu nombre', d: 'Rol propio individual inscrito en el Conservador de Bienes Raíces. Ninguna copropiedad ni promesa sin respaldo.', p: 'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4' },
                            { t: 'Firmas ante notario', d: 'Contrato de compraventa transparente, revisado y firmado ante notaría. Te acompañamos en todo el proceso legal.', p: 'circle' },
                            { t: 'Sin banco, sin DICOM', d: 'Financiamiento directo con Alimin, sin evaluación bancaria ni aval. No importa tu historial crediticio.', p: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
                            { t: 'Terreno urbanizado', d: 'Agua potable certificada por la SEREMI, luz eléctrica, portón automático y calles compactadas. Listo para construir.', p: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
                        ].map((c) => (
                            <div key={c.t} style={s("background:#fff;border:2px solid #4ba646;border-radius:18px;padding:28px;box-shadow:0 8px 26px rgba(75,166,70,.16)")}>
                                <div style={s("width:48px;height:48px;border-radius:14px;background:rgba(50,83,102,.1);display:flex;align-items:center;justify-content:center;color:#325366;margin-bottom:16px")}>
                                    {c.p === 'circle' ? (
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                                    ) : (
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d={c.p}></path>{c.t === 'Terreno urbanizado' && <polyline points="9 22 9 12 15 12 15 22"></polyline>}{c.t === 'Sin banco, sin DICOM' && <polyline points="9 12 11 14 15 10"></polyline>}</svg>
                                    )}
                                </div>
                                <h3 style={s("font:700 17px 'Montserrat',sans-serif;color:#1a2b3d;margin:0 0 8px")}>{c.t}</h3>
                                <p style={s("font:400 14px/1.6 'Roboto',sans-serif;color:#4B5563;margin:0")}>{c.d}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===================== 3. TERRENOS EN VENTA ===================== */}
            <section id="terrenos" style={s("position:relative;background:#0a1f16;padding:78px 22px;overflow:hidden")}>
                <div aria-hidden="true" style={s("position:absolute;inset:0;background:url('https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1800&auto=format&fit=crop&q=80') center/cover no-repeat")}></div>
                <div aria-hidden="true" style={s("position:absolute;inset:0;background:linear-gradient(to bottom,rgba(8,18,28,.78) 0%,rgba(10,24,34,.34) 42%,rgba(10,24,34,.5) 100%)")}></div>
                <div style={s("position:relative;max-width:1160px;margin:0 auto")}>
                    <div style={s("text-align:center;margin-bottom:46px")}>
                        <div style={s("display:inline-flex;align-items:center;gap:8px;margin-bottom:14px")}>
                            <span style={s("width:32px;height:2px;background:linear-gradient(90deg,#4ba646,#76d845)")}></span>
                            <span style={s("font:600 12px 'Montserrat',sans-serif;color:#76d845;text-transform:uppercase;letter-spacing:.12em")}>Elige tu propiedad</span>
                            <span style={s("width:32px;height:2px;background:linear-gradient(90deg,#76d845,#4ba646)")}></span>
                        </div>
                        <h2 style={s("font:800 clamp(1.8rem,3.4vw,2.5rem)/1.15 'Montserrat',sans-serif;color:#fff;margin:0 0 14px")}>Dos proyectos en El Tabo, Litoral Central</h2>
                        <p style={s("font:400 15.5px/1.7 'Roboto',sans-serif;color:rgba(255,255,255,.58);max-width:560px;margin:0 auto")}>Terrenos urbanizados a minutos de la playa. Compara y elige el que se adapta a tu proyecto de vida.</p>
                    </div>

                    <div style={s("display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px")}>
                        {/* LOMAS DEL MAR */}
                        <div className="al-projcard" style={s("position:relative;background:rgba(14,26,36,.75);backdrop-filter:blur(16px);border:2px solid rgba(118,216,69,.55);border-radius:22px;overflow:hidden;box-shadow:0 0 0 1px rgba(118,216,69,.18),0 14px 40px rgba(0,0,0,.45),0 0 46px rgba(118,216,69,.12);transition:transform .3s")}>
                            <div style={s("padding:26px 26px 0")}>
                                <div style={s("display:inline-flex;align-items:center;gap:7px;background:rgba(118,216,69,.14);border:1px solid rgba(118,216,69,.35);border-radius:100px;padding:5px 12px;margin-bottom:14px")}>
                                    <span style={s("font-size:11px")}>📍</span><span style={s("font:600 11px 'Montserrat',sans-serif;color:#b8f07a")}>A 10 minutos de la playa</span>
                                </div>
                                <h3 style={s("font:800 26px 'Montserrat',sans-serif;color:#fff;margin:0 0 4px")}>Lomas del Mar</h3>
                                <p style={s("font:400 14px/1.5 'Roboto',sans-serif;color:rgba(255,255,255,.55);margin:0 0 6px")}>Terrenos urbanizados · Sin importar tu DICOM · Crédito directo</p>
                                <p style={s("font:700 13px 'Montserrat',sans-serif;color:#76d845;margin:0 0 18px")}>Elige entre 200 m² y 390 m²</p>
                            </div>
                            <div className="al-lomas-sizes" style={s("padding:0 26px")}>
                                {[
                                    { m: '200 m²', pie: '$5.500.000', total: '$37.990.000', cuota: '$550.000', plazo: '60 cuotas', contado: '$35.000.000' },
                                    { m: '390 m²', pie: '$7.500.000', total: '$45.990.000', cuota: '$550.000', plazo: '70 cuotas', contado: '$43.000.000' },
                                ].map((x) => (
                                    <div key={x.m} style={s("background:rgba(0,0,0,.28);border:1px solid rgba(118,216,69,.22);border-radius:14px;padding:16px")}>
                                        <div style={s("font:900 22px 'Montserrat',sans-serif;color:#fff;margin-bottom:2px")}>{x.m}</div>
                                        <div style={s("font:600 11px 'Montserrat',sans-serif;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px")}>Pie <span style={s("color:#76d845;font-weight:900;font-size:15px;letter-spacing:0;text-transform:none")}>{x.pie}</span></div>
                                        <div style={s("display:flex;justify-content:space-between;font:400 12.5px 'Roboto',sans-serif;color:rgba(255,255,255,.6);padding:4px 0")}><span>Valor total</span><b style={s("color:#fff;font-weight:600")}>{x.total}</b></div>
                                        <div style={s("display:flex;justify-content:space-between;font:400 12.5px 'Roboto',sans-serif;color:rgba(255,255,255,.6);padding:4px 0")}><span>Cuota ref.</span><b style={s("color:#fff;font-weight:600")}>{x.cuota}</b></div>
                                        <div style={s("display:flex;justify-content:space-between;font:400 12.5px 'Roboto',sans-serif;color:rgba(255,255,255,.6);padding:4px 0")}><span>Plazo aprox.</span><b style={s("color:#fff;font-weight:600")}>{x.plazo}</b></div>
                                        <div style={s("display:flex;justify-content:space-between;font:400 12.5px 'Roboto',sans-serif;color:rgba(255,255,255,.6);padding:4px 0;border-top:1px solid rgba(255,255,255,.08);margin-top:4px")}><span>Contado</span><b style={s("color:#76d845;font-weight:700")}>{x.contado}</b></div>
                                    </div>
                                ))}
                            </div>
                            <div style={s("padding:16px 26px 8px;display:flex;flex-wrap:wrap;gap:6px")}>
                                {['✓ Rol propio', '✓ Agua cert.', '✓ Luz', '✓ Portón auto.'].map((t) => <span key={t} style={s("font:600 11px 'Montserrat',sans-serif;color:#b8f07a;background:rgba(118,216,69,.12);border:1px solid rgba(118,216,69,.25);border-radius:100px;padding:4px 10px")}>{t}</span>)}
                            </div>
                            <div style={s("padding:12px 26px 26px")}>
                                <button type="button" className="al-cta" onClick={cotizar('Lomas del Mar')} style={s("width:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#76d845,#4ba646);color:#0e1a24;font:700 14px 'Montserrat',sans-serif;padding:14px;border-radius:12px;border:none;cursor:pointer;box-shadow:0 6px 22px rgba(118,216,69,.35);transition:transform .2s")}>Cotizar Lomas del Mar →</button>
                            </div>
                        </div>

                        {/* ARENA Y SOL */}
                        <div className="al-projcard" style={s("position:relative;background:rgba(14,26,36,.75);backdrop-filter:blur(16px);border:1.5px solid rgba(197,160,89,.4);border-radius:22px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.35);transition:transform .3s")}>
                            <div style={s("position:absolute;top:16px;right:16px;z-index:5;background:rgba(239,68,68,.18);border:1px solid rgba(239,68,68,.4);color:#FCA5A5;font:800 11px 'Montserrat',sans-serif;text-transform:uppercase;letter-spacing:.04em;padding:8px 13px;border-radius:100px")}>⚠ 90% vendido</div>
                            <div style={s("padding:26px 26px 0")}>
                                <div style={s("display:inline-flex;align-items:center;gap:7px;background:rgba(197,160,89,.14);border:1px solid rgba(197,160,89,.35);border-radius:100px;padding:5px 12px;margin-bottom:14px")}>
                                    <span style={s("font-size:11px")}>📍</span><span style={s("font:600 11px 'Montserrat',sans-serif;color:#dcbf7f")}>A 10 minutos de la playa</span>
                                </div>
                                <h3 style={s("font:800 26px 'Montserrat',sans-serif;color:#fff;margin:0 0 4px")}>Arena y Sol</h3>
                                <p style={s("font:400 14px/1.5 'Roboto',sans-serif;color:rgba(255,255,255,.55);margin:0 0 6px")}>Terrenos urbanizados · Sin importar tu DICOM · Últimos cupos</p>
                                <p style={s("font:700 13px 'Montserrat',sans-serif;color:#C5A059;margin:0 0 18px")}>Terrenos de 200 m²</p>
                            </div>
                            <div style={s("padding:0 26px")}>
                                <div style={s("background:rgba(0,0,0,.28);border:1px solid rgba(197,160,89,.24);border-radius:14px;padding:20px")}>
                                    <div style={s("display:flex;align-items:baseline;gap:10px;margin-bottom:14px")}>
                                        <div style={s("font:900 26px 'Montserrat',sans-serif;color:#fff")}>200 m²</div>
                                        <div style={s("font:600 11px 'Montserrat',sans-serif;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:.06em")}>Pie <span style={s("color:#C5A059;font-weight:900;font-size:17px;letter-spacing:0;text-transform:none")}>$20.000.000</span></div>
                                    </div>
                                    <div style={s("display:flex;justify-content:space-between;font:400 13.5px 'Roboto',sans-serif;color:rgba(255,255,255,.6);padding:6px 0")}><span>Valor total</span><b style={s("color:#fff;font-weight:600")}>$42.000.000</b></div>
                                    <div style={s("display:flex;justify-content:space-between;font:400 13.5px 'Roboto',sans-serif;color:rgba(255,255,255,.6);padding:6px 0")}><span>Cuota referencial</span><b style={s("color:#fff;font-weight:600")}>$500.000</b></div>
                                    <div style={s("display:flex;justify-content:space-between;font:400 13.5px 'Roboto',sans-serif;color:rgba(255,255,255,.6);padding:6px 0;border-top:1px solid rgba(255,255,255,.08);margin-top:6px")}><span>Pago de contado</span><b style={s("color:#C5A059;font-weight:700")}>$39.000.000</b></div>
                                </div>
                            </div>
                            <div style={s("padding:16px 26px 8px;display:flex;flex-wrap:wrap;gap:6px")}>
                                {['✓ Rol propio', '✓ Agua cert.', '✓ Luz', '✓ Portón auto.'].map((t) => <span key={t} style={s("font:600 11px 'Montserrat',sans-serif;color:#dcbf7f;background:rgba(197,160,89,.12);border:1px solid rgba(197,160,89,.28);border-radius:100px;padding:4px 10px")}>{t}</span>)}
                            </div>
                            <div style={s("padding:12px 26px 26px")}>
                                <button type="button" className="al-cta" onClick={cotizar('Arena y Sol')} style={s("width:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#325366,#C5A059);color:#fff;font:700 14px 'Montserrat',sans-serif;padding:14px;border-radius:12px;border:none;cursor:pointer;box-shadow:0 4px 16px rgba(50,83,102,.35);transition:transform .2s")}>Cotizar Arena y Sol →</button>
                            </div>
                        </div>
                    </div>

                    {/* SATELLITE MAP */}
                    <div style={s("margin-top:30px;background:rgba(10,21,32,.6);border:1.5px solid rgba(118,216,69,.2);border-radius:22px;overflow:hidden")}>
                        <div style={s("padding:20px 24px 0;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px")}>
                            <div>
                                <h3 style={s("font:800 19px 'Montserrat',sans-serif;color:#fff;margin:0 0 3px")}>Ubicación de los proyectos</h3>
                                <p style={s("font:400 13px 'Roboto',sans-serif;color:rgba(255,255,255,.5);margin:0")}>El Tabo, V Región · Ambos a ~4 km de la playa</p>
                            </div>
                            <div style={s("display:flex;gap:16px;flex-wrap:wrap")}>
                                <span style={s("display:inline-flex;align-items:center;gap:7px;font:600 12px 'Montserrat',sans-serif;color:rgba(255,255,255,.8)")}><span style={s("width:12px;height:12px;border-radius:50%;background:#76d845")}></span>Lomas del Mar</span>
                                <span style={s("display:inline-flex;align-items:center;gap:7px;font:600 12px 'Montserrat',sans-serif;color:rgba(255,255,255,.8)")}><span style={s("width:12px;height:12px;border-radius:50%;background:#C5A059")}></span>Arena y Sol</span>
                            </div>
                        </div>
                        <div id="al-satmap" className="al-mapwrap" style={s("width:100%;height:460px;display:block;background:#0a1520")}></div>
                        <p style={s("margin:0;padding:12px 24px 18px;font:400 12px 'Roboto',sans-serif;color:rgba(255,255,255,.4);text-align:center")}>Vista satelital · Imagery © Esri · Marcadores en las coordenadas reales · Ninguno de los proyectos es frente al mar</p>
                    </div>
                </div>
            </section>

            {/* ===================== 4. MASTERPLAN ===================== */}
            <section id="disponibilidad" style={s("position:relative;background:linear-gradient(180deg,#ffffff 0%,#f5f9f0 60%,#eef7e2 100%);padding:78px 22px;overflow:hidden")}>
                <div style={s("position:relative;z-index:1;max-width:1160px;margin:0 auto")}>
                    <div style={s("text-align:center;margin-bottom:30px")}>
                        <div style={s("display:inline-flex;align-items:center;gap:8px;background:rgba(118,216,69,.14);border:1px solid rgba(118,216,69,.35);border-radius:100px;padding:6px 14px;margin-bottom:16px")}>
                            <span style={s("width:8px;height:8px;border-radius:50%;background:#4ba646;animation:pulseGreen 2s infinite")}></span>
                            <span style={s("font:600 11px 'Montserrat',sans-serif;color:#2d7a3a;text-transform:uppercase;letter-spacing:.1em")}>Actualizado hoy · Julio 2026</span>
                        </div>
                        <h2 style={s("font:800 clamp(1.8rem,3.6vw,2.6rem)/1.12 'Montserrat',sans-serif;color:#1a2b3d;margin:0 auto 12px")}>Masterplan y distribución de sitios</h2>
                        <div style={s("width:64px;height:4px;border-radius:100px;background:linear-gradient(90deg,#76d845,#C5A059);margin:0 auto 16px")}></div>
                        <p style={s("font:400 15.5px/1.7 'Roboto',sans-serif;color:#4B5563;max-width:560px;margin:0 auto")}>Explora la distribución real de los sitios, accesos y áreas comunes de cada proyecto. Amplía el plano y cotiza el lote que más te gusta.</p>
                    </div>

                    <div style={s("display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-bottom:16px")}>
                        <button type="button" onClick={() => setFilter('todos')} style={filterBtn(filter === 'todos')}>Ambos proyectos</button>
                        <button type="button" onClick={() => setFilter('lomas')} style={filterBtn(filter === 'lomas')}>Lomas del Mar</button>
                        <button type="button" onClick={() => setFilter('arena')} style={filterBtn(filter === 'arena')}>Arena y Sol</button>
                    </div>

                    <div style={s("display:flex;flex-direction:column;gap:26px")}>
                        {showLomas && (
                            <PlanoCard title="Lomas del Mar" badge={<span style={s("background:linear-gradient(135deg,#ff5b5b,#ff8a3d);color:#fff;font:800 10px 'Montserrat',sans-serif;text-transform:uppercase;letter-spacing:.06em;padding:5px 11px;border-radius:100px;box-shadow:0 4px 14px rgba(255,91,91,.35)")}>🔥 Hot Sale</span>} img={ASSET + '/plano-lomas-del-mar.webp'} onCotizar={cotizar('Lomas del Mar')} onOpen={() => openPlano('Lomas del Mar')} borderColor="rgba(118,216,69,.3)" />
                        )}
                        {showArena && (
                            <PlanoCard title="Arena y Sol" badge={<span style={s("background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.35);color:#e2564a;font:800 10px 'Montserrat',sans-serif;text-transform:uppercase;letter-spacing:.06em;padding:5px 11px;border-radius:100px")}>⚠ Últimos cupos</span>} img={ASSET + '/plano-arena-y-sol-2026-08-24.webp'} onCotizar={cotizar('Arena y Sol')} onOpen={() => openPlano('Arena y Sol')} borderColor="rgba(197,160,89,.35)" />
                        )}
                    </div>
                </div>

                {/* Plano lightbox */}
                {lightboxProj && (
                    <div style={s("position:fixed;inset:0;z-index:120;background:linear-gradient(rgba(8,16,24,.9),rgba(8,16,24,.92));display:flex;flex-direction:column;animation:fadeInUp .3s ease")}>
                        <div style={s("display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 22px;flex-wrap:wrap")}>
                            <div style={s("display:flex;align-items:center;gap:12px")}>
                                <span style={s("font:800 17px 'Montserrat',sans-serif;color:#fff")}>Plano · {lightboxProj}</span>
                                <span style={s("font:500 12px 'Roboto',sans-serif;color:rgba(255,255,255,.55)")}>Los sitios sin tachar están disponibles</span>
                            </div>
                            <div style={s("display:flex;align-items:center;gap:8px")}>
                                <button type="button" onClick={() => zoomPlano(-1)} title="Alejar" style={s("width:42px;height:42px;border-radius:50%;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#fff;font-size:20px;cursor:pointer")}>−</button>
                                <button type="button" onClick={() => zoomPlano(1)} title="Acercar" style={s("width:42px;height:42px;border-radius:50%;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#fff;font-size:20px;cursor:pointer")}>+</button>
                                <button type="button" onClick={() => { const p = lightboxProj; setLightboxProj(null); if (p) cotizar(p)() }} className="al-cta" style={s("background:linear-gradient(135deg,#76d845,#4ba646);color:#0e1a24;border:none;font:700 13px 'Montserrat',sans-serif;padding:12px 20px;border-radius:100px;cursor:pointer;box-shadow:0 6px 18px rgba(118,216,69,.35);transition:transform .2s;white-space:nowrap")}>Cotizar este proyecto →</button>
                                <button type="button" onClick={() => setLightboxProj(null)} title="Cerrar" style={s("width:42px;height:42px;border-radius:50%;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#fff;font-size:20px;cursor:pointer")}>✕</button>
                            </div>
                        </div>
                        <div style={s("flex:1;overflow:auto;padding:10px 22px 22px;display:flex;align-items:center;justify-content:center")}>
                            <img src={planoImg} alt={'Plano ampliable de ' + lightboxProj} style={{ ...s("transform-origin:center center;transition:transform .25s ease;max-width:100%;display:block;margin:0 auto"), transform: `scale(${zoom})` }} />
                        </div>
                    </div>
                )}
            </section>

            {/* ===================== 5. POR QUÉ EL TABO ===================== */}
            <section id="por-que" style={s("position:relative;background:#0a1520;padding:80px 22px;overflow:hidden")}>
                <div aria-hidden="true" style={s("position:absolute;inset:0;background:url('https://images.unsplash.com/photo-1476610182048-b716b8518aae?w=1920&auto=format&fit=crop&q=85') center 50%/cover no-repeat")}></div>
                <div aria-hidden="true" style={s("position:absolute;inset:0;background:linear-gradient(160deg,rgba(10,21,32,.82) 0%,rgba(12,26,40,.75) 50%,rgba(10,21,32,.85) 100%)")}></div>
                <div style={s("position:relative;max-width:1160px;margin:0 auto")}>
                    <div style={s("max-width:640px;margin-bottom:44px")}>
                        <div style={s("display:inline-flex;align-items:center;gap:8px;margin-bottom:14px")}>
                            <span style={s("width:32px;height:2px;background:linear-gradient(90deg,#4ba646,#76d845)")}></span>
                            <span style={s("font:600 12px 'Montserrat',sans-serif;color:#76d845;text-transform:uppercase;letter-spacing:.12em")}>Litoral Central</span>
                        </div>
                        <h2 style={s("font:800 clamp(1.8rem,3.4vw,2.5rem)/1.15 'Montserrat',sans-serif;color:#fff;margin:0 0 16px")}>Por qué comprar en El Tabo</h2>
                        <p style={s("font:300 16px/1.75 'Roboto',sans-serif;color:rgba(255,255,255,.68);margin:0")}>El Tabo es uno de los balnearios con mayor crecimiento del Litoral Central: playas tranquilas, bosque nativo y la cultura de Isla Negra a la vuelta de la esquina. Comprar aquí no es solo un terreno — es patrimonio familiar que se valoriza cada verano.</p>
                    </div>
                    <div style={s("display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px")}>
                        {[
                            { img: 'playa-el-tabo', min: '5 min', tag: 'Playa', name: 'El Tabo', desc: 'Playa icónica del litoral con arena extensa y aguas del Pacífico' },
                            { img: 'quebrada-de-cordova', min: '8 min', tag: 'Naturaleza', name: 'Quebrada de Córdova', desc: 'Paisaje natural único donde el río se une al océano Pacífico' },
                            { img: 'isla-negra', min: '12 min', tag: 'Cultura · Patrimonio', name: 'Isla Negra', desc: 'La casa de Pablo Neruda, Patrimonio Mundial de la UNESCO' },
                            { img: 'algarrobo', min: '20 min', tag: 'Turismo · Recreación', name: 'Algarrobo', desc: 'La piscina más grande del mundo · Playas exclusivas del Litoral' },
                        ].map((p) => (
                            <div key={p.name} className="al-placecard" style={s("position:relative;border-radius:20px;overflow:hidden;aspect-ratio:3/4;border:2px solid rgba(118,216,69,.4);transition:transform .35s cubic-bezier(.16,1,.3,1),box-shadow .35s")}>
                                <img src={ASSET + '/places/' + p.img + '.webp'} alt={p.name + ' — cerca de los terrenos en venta en el Litoral Central'} style={s("position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;transition:transform .6s ease")} />
                                <div style={s("position:absolute;inset:0;background:linear-gradient(to top,rgba(10,18,28,.92) 0%,rgba(10,18,28,.3) 45%,transparent 100%)")}></div>
                                <div style={s("position:absolute;top:14px;left:14px;background:rgba(118,216,69,.9);backdrop-filter:blur(8px);border-radius:100px;padding:5px 12px;font:700 11px 'Montserrat',sans-serif;color:#fff")}>📍 {p.min}</div>
                                <div style={s("position:absolute;bottom:0;left:0;right:0;padding:24px 20px")}>
                                    <div style={s("font:700 10px 'Montserrat',sans-serif;color:rgba(255,255,255,.55);text-transform:uppercase;letter-spacing:.1em;margin-bottom:5px")}>{p.tag}</div>
                                    <div style={s("font:800 22px 'Montserrat',sans-serif;color:#fff;line-height:1.1;margin-bottom:6px")}>{p.name}</div>
                                    <div style={s("font:400 13px 'Roboto',sans-serif;color:rgba(255,255,255,.6);line-height:1.5")}>{p.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={s("text-align:center;margin-top:44px")}>
                        <a href="#cotizar" className="al-cta" style={s("display:inline-flex;align-items:center;background:linear-gradient(135deg,#76d845,#4ba646);color:#0e1a24;border:none;padding:16px 40px;border-radius:14px;font:700 16px 'Montserrat',sans-serif;cursor:pointer;box-shadow:0 8px 32px rgba(118,216,69,.4);letter-spacing:.02em;text-decoration:none;transition:transform .2s")}>Quiero mi terreno aquí →</a>
                        <p style={s("font:400 12px 'Roboto',sans-serif;color:rgba(255,255,255,.4);margin-top:12px")}>Todo esto a minutos de Lomas del Mar y Arena y Sol</p>
                    </div>
                </div>
            </section>

            {/* ===================== 6. GALERÍA ===================== */}
            <section style={s("position:relative;background:linear-gradient(160deg,#eef8df 0%,#f4fce9 50%,#e6f5d6 100%);padding:78px 22px;overflow:hidden")}>
                <div style={s("position:relative;max-width:1160px;margin:0 auto")}>
                    <div style={s("text-align:center;margin-bottom:34px")}>
                        <div style={s("display:inline-flex;align-items:center;gap:8px;margin-bottom:14px")}>
                            <span style={s("width:32px;height:2px;background:linear-gradient(90deg,#4ba646,#76d845)")}></span>
                            <span style={s("font:600 12px 'Montserrat',sans-serif;color:#4ba646;text-transform:uppercase;letter-spacing:.12em")}>Galería de avance</span>
                            <span style={s("width:32px;height:2px;background:linear-gradient(90deg,#76d845,#4ba646)")}></span>
                        </div>
                        <h2 style={s("font:800 clamp(1.8rem,3.4vw,2.5rem)/1.15 'Montserrat',sans-serif;color:#1a2b3d;margin:0 0 12px")}>Así están los terrenos hoy</h2>
                        <p style={s("font:400 15.5px/1.7 'Roboto',sans-serif;color:#4B5563;max-width:580px;margin:0 auto")}>Fotografías de nuestros proyectos en El Tabo · Toca cualquier imagen para verla en grande</p>
                    </div>
                    <div className="al-galgrid" style={s("columns:4 240px;column-gap:16px")}>
                        {GALLERY.map((g, i) => (
                            <button key={g.img} type="button" onClick={() => setGalIndex(i)} className="al-galcard" style={s("display:block;width:100%;padding:0;border:2px solid rgba(118,216,69,.28);border-radius:18px;overflow:hidden;position:relative;cursor:zoom-in;background:#0e1a24;break-inside:avoid;margin-bottom:16px;box-shadow:0 8px 26px rgba(50,83,102,.12)")}>
                                <img src={ASSET + '/gallery/' + g.img + '.webp'} alt={g.proj + ', El Tabo — terrenos urbanizados en el Litoral Central'} loading="lazy" style={s("width:100%;display:block;transition:transform .5s ease")} />
                                <div style={s("position:absolute;top:0;left:0;right:0;height:96px;background:linear-gradient(to bottom,rgba(10,18,28,.66),transparent)")}></div>
                                <div style={s("position:absolute;top:12px;left:12px;background:" + (g.proj === 'Lomas del Mar' ? '#4ba646' : '#C5A059') + ";color:#fff;font:800 11px 'Montserrat',sans-serif;text-transform:uppercase;letter-spacing:.05em;padding:6px 12px;border-radius:100px;box-shadow:0 4px 12px rgba(0,0,0,.3)")}>{g.proj}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {galIndex != null && (
                    <div style={s("position:fixed;inset:0;z-index:120;background:rgba(8,16,24,.95);display:flex;flex-direction:column;animation:fadeInUp .3s ease")}>
                        <div style={s("display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 22px")}>
                            <div style={s("min-width:0")}>
                                <div style={s("font:800 15px 'Montserrat',sans-serif;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{GALLERY[galIndex].proj}</div>
                            </div>
                            <div style={s("display:flex;align-items:center;gap:8px;flex-shrink:0")}>
                                <button type="button" onClick={() => galStep(-1)} title="Anterior" style={s("width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#fff;font-size:20px;cursor:pointer")}>‹</button>
                                <button type="button" onClick={() => galStep(1)} title="Siguiente" style={s("width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#fff;font-size:20px;cursor:pointer")}>›</button>
                                <button type="button" onClick={() => setGalIndex(null)} title="Cerrar" style={s("width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#fff;font-size:20px;cursor:pointer")}>✕</button>
                            </div>
                        </div>
                        <div style={s("flex:1;overflow:hidden;padding:8px 22px 16px;display:flex;align-items:center;justify-content:center")}>
                            <img src={ASSET + '/gallery/' + GALLERY[galIndex].img + '.webp'} alt={GALLERY[galIndex].proj} style={s("max-width:100%;max-height:100%;object-fit:contain;border-radius:10px;display:block")} />
                        </div>
                        <div style={s("text-align:center;padding-bottom:16px;font:500 12px 'Roboto',sans-serif;color:rgba(255,255,255,.55)")}>{(galIndex + 1)} / 14</div>
                    </div>
                )}
            </section>

            {/* ===================== 7. CÓMO COMPRAR ===================== */}
            <section id="como" style={s("position:relative;background:#eef8df;padding:78px 22px;overflow:hidden")}>
                <div style={s("position:relative;z-index:1;max-width:1160px;margin:0 auto")}>
                    <div style={s("text-align:center;margin-bottom:44px")}>
                        <div style={s("display:inline-flex;align-items:center;gap:8px;margin-bottom:14px")}>
                            <span style={s("width:32px;height:2px;background:linear-gradient(90deg,#4ba646,#76d845)")}></span>
                            <span style={s("font:600 12px 'Montserrat',sans-serif;color:#4ba646;text-transform:uppercase;letter-spacing:.12em")}>Tu camino a la propiedad</span>
                            <span style={s("width:32px;height:2px;background:linear-gradient(90deg,#76d845,#4ba646)")}></span>
                        </div>
                        <h2 style={s("font:800 clamp(1.8rem,3.4vw,2.5rem)/1.15 'Montserrat',sans-serif;color:#1a2b3d;margin:0 0 12px")}>El camino a tu terreno</h2>
                        <p style={s("font:400 15.5px/1.7 'Roboto',sans-serif;color:#4B5563;max-width:520px;margin:0 auto")}>Avanza etapa por etapa: cada paso te acerca a tener tu terreno propio en el Litoral Central.</p>
                    </div>

                    <div style={s("position:relative;max-width:960px;margin:0 auto 30px")}>
                        <div aria-hidden="true" style={s("position:absolute;top:32px;left:6%;right:6%;height:5px;border-radius:100px;background:repeating-linear-gradient(90deg,rgba(75,166,70,.25) 0 10px,transparent 10px 20px);z-index:0")}></div>
                        <div aria-hidden="true" style={{ ...s("position:absolute;top:32px;left:6%;height:5px;border-radius:100px;background:linear-gradient(90deg,#76d845,#4ba646);z-index:0;transition:width .5s cubic-bezier(.16,1,.3,1)"), width: `${(activeStep / STEPS.length) * 100}%` }}></div>
                        <div style={s("position:relative;z-index:1;display:flex;justify-content:space-between;align-items:flex-start;gap:6px;flex-wrap:wrap")}>
                            {STEPS.map((st, i) => {
                                const done = i < activeStep, cur = i === activeStep
                                const nodeBase = "width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:27px;transition:all .35s cubic-bezier(.16,1,.3,1);border:3px solid"
                                const nodeStyle = cur
                                    ? s(nodeBase + ";background:#fff;border-color:#C5A059;box-shadow:0 10px 24px rgba(197,160,89,.45);animation:goalPulse 2s infinite")
                                    : done ? s(nodeBase + ";background:linear-gradient(135deg,#76d845,#4ba646);color:#fff;border-color:#4ba646;box-shadow:0 8px 20px rgba(118,216,69,.35);font-size:24px")
                                    : s(nodeBase + ";background:rgba(255,255,255,.6);border-color:#dfe7da;filter:grayscale(1);opacity:.5")
                                return (
                                    <button key={st.label} type="button" onClick={() => setActiveStep(i)} className="al-station" style={s("background:none;border:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:8px;flex:1;min-width:88px;padding:0")}>
                                        <span style={nodeStyle}>{done ? '✓' : st.icon}</span>
                                        <span style={{ ...s("font:700 9.5px 'Montserrat',sans-serif;text-transform:uppercase;letter-spacing:.06em"), color: cur ? '#b8860b' : done ? '#4ba646' : '#aeb6ac' }}>{done ? 'Completado' : cur ? '★ Vas aquí' : 'Etapa ' + (i + 1)}</span>
                                        <span style={{ ...s("font:700 12.5px 'Montserrat',sans-serif;transition:color .3s"), color: (cur || done) ? '#2d7a3a' : '#9CA3AF' }}>{st.label}</span>
                                    </button>
                                )
                            })}
                            <div className="al-station" style={s("display:flex;flex-direction:column;align-items:center;gap:8px;flex:1;min-width:88px")}>
                                <span style={atLast ? s("width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;border:3px solid;background:linear-gradient(135deg,#C5A059,#e0c37f);border-color:#C5A059;box-shadow:0 12px 28px rgba(197,160,89,.5);animation:goalPulse 2s infinite") : s("width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;border:3px solid;background:rgba(255,255,255,.6);border-color:#e6dcc4;filter:grayscale(.6);opacity:.6")}>🏡</span>
                                <span style={s("font:700 9.5px 'Montserrat',sans-serif;text-transform:uppercase;letter-spacing:.06em;color:#b8860b")}>Meta</span>
                                <span style={s("font:800 12.5px 'Montserrat',sans-serif;color:#b8860b")}>Tu terreno</span>
                            </div>
                        </div>
                    </div>

                    <div style={s("max-width:760px;margin:0 auto;background:#fff;border:1px solid #e6efdf;border-radius:22px;padding:clamp(22px,3.5vw,32px);box-shadow:0 16px 46px rgba(50,83,102,.12);position:relative;overflow:hidden")}>
                        <div style={s("position:relative;display:flex;align-items:center;gap:10px;justify-content:center;background:linear-gradient(90deg,rgba(118,216,69,.14),rgba(197,160,89,.14));border-radius:100px;padding:10px 18px;margin-bottom:22px")}>
                            <span style={s("font-size:15px")}>🚩</span>
                            <span style={s("font:700 13px/1.3 'Montserrat',sans-serif;color:#2d7a3a;text-align:center")}>{JLABELS[activeStep]}</span>
                        </div>
                        <div style={s("display:flex;gap:24px;align-items:flex-start")}>
                            <div style={s("flex-shrink:0;width:66px;height:66px;border-radius:16px;background:linear-gradient(135deg,#76d845,#4ba646);display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:0 8px 22px rgba(118,216,69,.4);font-size:30px")}>{STEPS[activeStep].icon}</div>
                            <div style={s("flex:1")}>
                                <div style={s("font:700 12px 'Montserrat',sans-serif;color:#4ba646;text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px")}>Paso {activeStep + 1} de 5</div>
                                <h3 style={s("font:800 clamp(1.2rem,2.4vw,1.5rem) 'Montserrat',sans-serif;color:#1a2b3d;margin:0 0 8px")}>{STEPS[activeStep].title}</h3>
                                <p style={s("font:400 15px/1.7 'Roboto',sans-serif;color:#4B5563;margin:0 0 20px")}>{STEPS[activeStep].desc}</p>
                                <div style={s("display:flex;gap:10px;flex-wrap:wrap")}>
                                    <button type="button" onClick={() => setActiveStep((v) => Math.max(0, v - 1))} disabled={activeStep === 0} style={activeStep === 0 ? s("padding:13px 24px;border-radius:100px;font:700 13px 'Montserrat',sans-serif;border:none;background:#eef1ec;color:#b8c0b5;cursor:not-allowed") : s("padding:13px 24px;border-radius:100px;font:700 13px 'Montserrat',sans-serif;border:none;cursor:pointer;background:#eaf1e6;color:#2d7a3a")}>← Volver</button>
                                    <button type="button" onClick={() => { if (atLast) scrollToForm(); else setActiveStep((v) => Math.min(STEPS.length - 1, v + 1)) }} style={atLast ? s("padding:13px 24px;border-radius:100px;font:700 13px 'Montserrat',sans-serif;border:none;cursor:pointer;background:linear-gradient(135deg,#C5A059,#e0c37f);color:#231a06;box-shadow:0 6px 20px rgba(197,160,89,.45)") : s("padding:13px 24px;border-radius:100px;font:700 13px 'Montserrat',sans-serif;border:none;cursor:pointer;background:linear-gradient(135deg,#76d845,#4ba646);color:#fff;box-shadow:0 6px 18px rgba(118,216,69,.35)")}>{atLast ? '🔑 ¡Reclama tu terreno! →' : 'Avanzar al siguiente paso →'}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===================== 8. PROPIETARIOS REALES ===================== */}
            <section id="testimonios" style={s("background:#f5f9f0;padding:78px 22px")}>
                <div style={s("max-width:1160px;margin:0 auto")}>
                    <div style={s("text-align:center;margin-bottom:16px")}>
                        <div style={s("display:inline-flex;align-items:center;gap:8px;margin-bottom:14px")}>
                            <span style={s("width:32px;height:2px;background:linear-gradient(90deg,#4ba646,#76d845)")}></span>
                            <span style={s("font:600 12px 'Montserrat',sans-serif;color:#4ba646;text-transform:uppercase;letter-spacing:.12em")}>Propietarios reales</span>
                            <span style={s("width:32px;height:2px;background:linear-gradient(90deg,#76d845,#4ba646)")}></span>
                        </div>
                        <h2 style={s("font:800 clamp(1.8rem,3.4vw,2.5rem)/1.15 'Montserrat',sans-serif;color:#1a2b3d;margin:0 0 10px")}>Familias que ya son dueñas</h2>
                    </div>
                    <p style={s("text-align:center;font:400 12.5px 'Roboto',sans-serif;color:#94A3B8;max-width:560px;margin:0 auto 28px")}>Reseñas reales de nuestros clientes en Google · Fotos de nuevos propietarios en Lomas del Mar</p>

                    <div style={s("display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px;margin-bottom:24px")}>
                        <div className="al-videofeat" style={s("position:relative;border-radius:22px;overflow:hidden;background:#0e1a24;box-shadow:0 16px 48px rgba(14,26,36,.28);min-height:380px;cursor:pointer")}>
                            <video id="al-video-andres" playsInline muted preload="metadata" style={s("position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;background:#0e1a24")}>
                                <source src={ASSET + '/video/testimonio.mp4#t=0.1'} type="video/mp4" />
                            </video>
                            <div id="al-video-andres-overlay" onClick={playVideo} style={s("position:absolute;inset:0;cursor:pointer")}>
                                <div style={s("position:absolute;inset:0;background:linear-gradient(to top,rgba(14,26,36,.88) 0%,rgba(14,26,36,.1) 45%,rgba(14,26,36,.4) 100%)")}></div>
                                <div className="al-playbig" style={s("position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:72px;height:72px;background:rgba(118,216,69,.95);border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 28px rgba(118,216,69,.5);transition:all .3s")}><svg width="28" height="28" viewBox="0 0 24 24" fill="#fff" style={s("margin-left:4px")}><path d="M8 5v14l11-7z"></path></svg></div>
                                <div style={s("position:absolute;bottom:0;left:0;right:0;padding:24px")}>
                                    <div style={s("display:inline-flex;align-items:center;gap:6px;background:rgba(118,216,69,.2);border:1px solid rgba(118,216,69,.4);border-radius:100px;padding:4px 12px;margin-bottom:10px")}>
                                        <span style={s("width:7px;height:7px;background:#76d845;border-radius:50%;display:inline-block")}></span>
                                        <span style={s("font:700 10px 'Montserrat',sans-serif;color:#b8f07a;text-transform:uppercase;letter-spacing:.08em")}>Video testimonio</span>
                                    </div>
                                    <div style={s("font:800 19px 'Montserrat',sans-serif;color:#fff;line-height:1.2;margin-bottom:4px")}>Un cliente de Arena y Sol</div>
                                    <div style={s("font:400 13px 'Roboto',sans-serif;color:rgba(255,255,255,.72)")}>Su experiencia invirtiendo con Alimin · toca para reproducir</div>
                                </div>
                            </div>
                        </div>
                        <div style={s("position:relative;background:linear-gradient(155deg,#325366,#1a2b3d);border-radius:22px;padding:34px 30px;overflow:hidden;box-shadow:0 16px 48px rgba(14,26,36,.28)")}>
                            <div aria-hidden="true" style={s("position:absolute;top:-30px;left:18px;font:900 170px 'Montserrat',serif;color:rgba(118,216,69,.14);line-height:1")}>”</div>
                            <div style={s("position:relative")}>
                                <div style={s("display:flex;gap:3px;margin-bottom:16px;color:#FBBC04;font-size:16px;letter-spacing:2px")}>★★★★★</div>
                                <p style={s("font:400 17px/1.65 'Roboto',sans-serif;color:rgba(255,255,255,.92);margin:0 0 22px")}>Excelente lugar, amo mi terreno aquí en El Tabo. Desde que invertí con ustedes mi vida mejoró. Me costó confiar pero me atreví a dar el primer paso y ahora estoy feliz.</p>
                                <div style={s("display:flex;align-items:center;gap:13px")}>
                                    <div style={s("width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#76d845,#4ba646);display:flex;align-items:center;justify-content:center;font:800 16px 'Montserrat',sans-serif;color:#fff;flex-shrink:0")}>SU</div>
                                    <div>
                                        <div style={s("font:700 15px 'Montserrat',sans-serif;color:#fff")}>Sebastián Ullbrish</div>
                                        <div style={s("font:400 12px 'Roboto',sans-serif;color:rgba(255,255,255,.6)")}>2 opiniones · 18 fotos · Hace 50 semanas</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={s("display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px")}>
                        {[
                            { in: 'RM', name: 'Rodrigo Muñoz', loc: 'El Tabo · Lomas del Mar', when: 'Hace 2 meses', txt: 'Compré mi terreno sin banco y sin importar mi DICOM. La escritura quedó a mi nombre en el Conservador, todo transparente y sin sorpresas.', g: 'linear-gradient(135deg,#325366,#4ba646)' },
                            { in: 'CS', name: 'Carla Soto', loc: 'Rancagua · Arena y Sol', when: 'Hace 3 meses', txt: 'El financiamiento directo me salvó. Cuota fija, sin intereses escondidos, y los asesores me acompañaron en cada firma. 100% recomendados.', g: 'linear-gradient(135deg,#4ba646,#76d845)' },
                            { in: 'JV', name: 'Jorge Vera', loc: 'Santiago · Lomas del Mar', when: 'Hace 5 meses', txt: 'Muy buenos los proyectos, cerca al centro del Tabo, con opciones de pago y fácil de llegar. Ya empezamos a construir la casa para la familia.', g: 'linear-gradient(135deg,#325366,#C5A059)' },
                        ].map((r) => (
                            <div key={r.name} style={s("background:#fff;border-radius:16px;padding:24px;box-shadow:0 4px 20px rgba(50,83,102,.08);border:1px solid #eef1ec")}>
                                <div style={s("display:flex;align-items:center;gap:12px;margin-bottom:14px")}>
                                    <div style={{ ...s("width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:800 15px 'Montserrat',sans-serif;color:#fff;flex-shrink:0"), background: r.g }}>{r.in}</div>
                                    <div style={s("flex:1;min-width:0")}>
                                        <div style={s("font:700 15px 'Montserrat',sans-serif;color:#1a2b3d")}>{r.name}</div>
                                        <div style={s("font:400 12px 'Roboto',sans-serif;color:#94A3B8")}>{r.loc}</div>
                                    </div>
                                    <svg width="20" height="20" viewBox="0 0 48 48" style={s("flex-shrink:0")}><path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"></path><path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"></path><path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"></path><path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"></path></svg>
                                </div>
                                <div style={s("display:flex;align-items:center;gap:8px;margin-bottom:10px")}><span style={s("color:#FBBC04;font-size:15px;letter-spacing:1px")}>★★★★★</span><span style={s("font:400 12px 'Roboto',sans-serif;color:#94A3B8")}>{r.when}</span></div>
                                <p style={s("font:400 14px/1.6 'Roboto',sans-serif;color:#4B5563;margin:0")}>{r.txt}</p>
                            </div>
                        ))}
                    </div>

                    <div style={s("position:relative;overflow:hidden;background:linear-gradient(160deg,#edf7e0 0%,#f2fce8 50%,#e4f5d4 100%);padding:44px 0 52px;margin:52px calc(50% - 50vw) -78px;width:100vw")}>
                        <div style={s("text-align:center;margin-bottom:26px;padding:0 20px")}>
                            <h3 style={s("font:800 clamp(1.4rem,3vw,2rem) 'Montserrat',sans-serif;color:#1a2b1a;margin:0")}>Nuestros nuevos clientes en Lomas del Mar</h3>
                        </div>
                        <div className="al-marquee-mask" style={s("overflow:hidden;width:100%")}>
                            <div className="al-marquee-track">
                                {[1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6].map((n, idx) => (
                                    <img key={idx} src={ASSET + '/clients/testimonio-' + n + '.webp'} alt="Cliente Alimin en Lomas del Mar, El Tabo" style={s("width:236px;height:295px;object-fit:cover;border-radius:16px;flex-shrink:0;box-shadow:0 8px 28px rgba(0,0,0,.25)")} />
                                ))}
                            </div>
                        </div>
                        <p style={s("text-align:center;margin:24px 20px 0;font:400 11px 'Roboto',sans-serif;color:#6b7a5a")}>Fotos referenciales de propietarios · reemplazables por imágenes reales verificadas</p>
                    </div>
                </div>
            </section>

            {/* ===================== 9. FAQ ===================== */}
            <section id="faq" style={s("background:linear-gradient(160deg,#eaf7d8 0%,#f2fce8 50%,#e4f5d4 100%);padding:78px 22px")}>
                <div style={s("max-width:720px;margin:0 auto")}>
                    <div style={s("text-align:center;margin-bottom:40px")}>
                        <div style={s("display:inline-flex;align-items:center;gap:8px;margin-bottom:14px")}>
                            <span style={s("width:32px;height:2px;background:linear-gradient(90deg,#4ba646,#76d845)")}></span>
                            <span style={s("font:600 12px 'Montserrat',sans-serif;color:#4ba646;text-transform:uppercase;letter-spacing:.12em")}>Preguntas frecuentes</span>
                            <span style={s("width:32px;height:2px;background:linear-gradient(90deg,#76d845,#4ba646)")}></span>
                        </div>
                        <h2 style={s("font:800 clamp(1.8rem,3.4vw,2.5rem)/1.15 'Montserrat',sans-serif;color:#1a2b3d;margin:0")}>Preguntas frecuentes sobre venta de terrenos en el Litoral Central</h2>
                    </div>
                    <div style={s("display:flex;flex-direction:column;gap:8px")}>
                        {FAQS.map((f, i) => {
                            const open = openFaq === i
                            return (
                                <div key={i} style={s("background:#fff;border:1px solid #e3ebe0;border-radius:14px;overflow:hidden;box-shadow:0 4px 16px rgba(50,83,102,.06)")}>
                                    <button type="button" onClick={() => setOpenFaq(open ? null : i)} style={s("width:100%;display:flex;align-items:center;justify-content:space-between;gap:14px;text-align:left;background:none;border:none;cursor:pointer;padding:20px 22px;font:700 15.5px 'Montserrat',sans-serif;color:#1a2b3d")}>
                                        <span>{f.q}</span>
                                        <span style={{ ...s("flex-shrink:0;width:26px;height:26px;border-radius:50%;background:rgba(118,216,69,.16);color:#2d7a3a;display:flex;align-items:center;justify-content:center;font-size:17px;transition:transform .25s"), transform: open ? 'rotate(45deg)' : 'none' }}>+</span>
                                    </button>
                                    {open && <p style={s("margin:0;padding:0 22px 22px;font:400 14.5px/1.7 'Roboto',sans-serif;color:#4B5563")}>{f.a}</p>}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* ===================== FOOTER ===================== */}
            <footer style={s("background:linear-gradient(135deg,#3a9e48 0%,#4ba646 45%,#62c247 100%);padding:52px 22px 30px")}>
                <div style={s("max-width:1160px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:32px;align-items:start")}>
                    <div>
                        <div style={s("display:flex;align-items:center;gap:10px;margin-bottom:14px")}>
                            <img src={ASSET + '/logo-alimin-icon.png'} alt="Alimin" style={s("height:44px;width:auto")} />
                            <span style={s("font:900 22px 'Montserrat',sans-serif;color:#fff;letter-spacing:-.02em")}>ALIMIN</span>
                        </div>
                        <p style={s("font:600 14px/1.6 'Roboto',sans-serif;color:#fff;margin:0;max-width:280px")}>Venta de terrenos urbanizados en El Tabo, Litoral Central. Rol propio, agua y luz certificadas.</p>
                    </div>
                    <div>
                        <h4 style={s("font:800 13px 'Montserrat',sans-serif;color:#fff;text-transform:uppercase;letter-spacing:.08em;margin:0 0 14px")}>Contacto</h4>
                        <a href="mailto:bienesraices@aliminspa.cl" style={s("display:block;font:600 14px 'Roboto',sans-serif;color:#fff;text-decoration:none;margin-bottom:8px")}>bienesraices@aliminspa.cl</a>
                        <a href="tel:+56956654833" style={s("display:block;font:600 14px 'Roboto',sans-serif;color:#fff;text-decoration:none;margin-bottom:8px")}>+56 9 5665 4833</a>
                        <span style={s("display:block;font:600 14px 'Roboto',sans-serif;color:rgba(255,255,255,.92)")}>El Tabo, Región de Valparaíso</span>
                    </div>
                    <div>
                        <h4 style={s("font:800 13px 'Montserrat',sans-serif;color:#fff;text-transform:uppercase;letter-spacing:.08em;margin:0 0 14px")}>Proyectos</h4>
                        <a href="#terrenos" style={s("display:block;font:600 14px 'Roboto',sans-serif;color:#fff;text-decoration:none;margin-bottom:8px")}>Lomas del Mar</a>
                        <a href="#terrenos" style={s("display:block;font:600 14px 'Roboto',sans-serif;color:#fff;text-decoration:none;margin-bottom:8px")}>Arena y Sol</a>
                        <a href="#disponibilidad" style={s("display:block;font:600 14px 'Roboto',sans-serif;color:#fff;text-decoration:none")}>Disponibilidad</a>
                    </div>
                </div>
                <div style={s("max-width:1160px;margin:32px auto 0;padding-top:20px;border-top:1px solid rgba(255,255,255,.2);text-align:center")}>
                    <p style={s("font:600 12px 'Roboto',sans-serif;color:rgba(255,255,255,.9);margin:0")}>© 2026 Alimin SpA · Todos los derechos reservados · Imágenes y valores referenciales, sujetos a disponibilidad.</p>
                </div>
            </footer>

            {/* WhatsApp float */}
            <a href="https://wa.me/56956654833?text=Hola%20Alimin%2C%20vengo%20de%20la%20web%20de%20Venta%20de%20Terrenos%20en%20el%20Litoral%20Central%20y%20quiero%20cotizar%20un%20terreno%20en%20El%20Tabo." target="_blank" rel="noopener noreferrer" style={s("position:fixed;bottom:24px;right:24px;width:58px;height:58px;background:linear-gradient(135deg,#25D366,#1aad54);border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 24px rgba(118,216,69,.45);z-index:99;transition:transform .2s")}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.892c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.445h.006c6.585 0 11.946-5.335 11.949-11.893a11.821 11.821 0 0 0-3.48-8.411z"></path></svg>
            </a>
        </div>
    )
}

// ---- Plano card (masterplan) ----
function PlanoCard({ title, badge, img, onCotizar, onOpen, borderColor }: { title: string; badge: React.ReactNode; img: string; onCotizar: () => void; onOpen: () => void; borderColor: string }) {
    return (
        <div style={s("background:#fff;border:1px solid #e6efdf;border-radius:24px;box-shadow:0 20px 50px rgba(50,83,102,.12);overflow:hidden")}>
            <div style={s("display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;padding:22px 26px 16px")}>
                <div style={s("display:flex;align-items:center;gap:10px")}>
                    <h3 style={s("font:800 21px 'Montserrat',sans-serif;color:#1a2b3d;margin:0")}>{title}</h3>
                    {badge}
                </div>
                <button type="button" onClick={onCotizar} className="al-cta" style={s("background:linear-gradient(135deg,#76d845,#4ba646);color:#0e1a24;border:none;font:700 13px 'Montserrat',sans-serif;padding:12px 22px;border-radius:100px;cursor:pointer;box-shadow:0 6px 18px rgba(118,216,69,.32);transition:transform .2s")}>Cotizar este proyecto →</button>
            </div>
            <div className="al-plano" onClick={onOpen} style={{ ...s("margin:0 16px 16px;background:#0d2018;border-radius:18px;cursor:zoom-in"), border: '1px solid ' + borderColor }}>
                <div style={s("position:absolute;top:16px;left:16px;z-index:3;display:flex;flex-direction:column;gap:10px;align-items:flex-start")}>
                    <span style={s("background:#325366;color:#fff;font:800 12px 'Montserrat',sans-serif;letter-spacing:.03em;padding:11px 18px;border-radius:100px;box-shadow:0 6px 18px rgba(50,83,102,.35)")}>VER PLANO DEL PROYECTO</span>
                </div>
                <img src={img} alt={'Plano del loteo ' + title + ' — sitios disponibles en venta en El Tabo, Litoral Central'} />
                <div className="al-plano-hint" style={s("position:absolute;inset:0;display:flex;align-items:flex-end;justify-content:center;padding-bottom:22px;background:linear-gradient(to top,rgba(10,21,32,.5),transparent 45%)")}>
                    <span style={s("background:rgba(255,255,255,.95);color:#1a2b3d;font:700 13px 'Montserrat',sans-serif;padding:11px 22px;border-radius:100px;box-shadow:0 8px 24px rgba(0,0,0,.25)")}>🔍 Ampliar y explorar el plano</span>
                </div>
            </div>
            <p style={s("font:400 12px 'Roboto',sans-serif;color:#94A3B8;margin:0;padding:0 26px 22px;text-align:center")}>Los sitios <b style={s("color:#4b5563")}>disponibles</b> son los que <b style={s("color:#4b5563")}>no están tachados en verde</b>. Amplía el plano para verlos y cotiza — un asesor confirma tu lote.</p>
        </div>
    )
}

const CSS = `
#venta-terrenos *{box-sizing:border-box}
#venta-terrenos{scroll-behavior:smooth}
#venta-terrenos a{color:inherit}
#venta-terrenos img{max-width:100%}
#venta-terrenos .al-nav-link{font:600 14px 'Montserrat',sans-serif;color:rgba(255,255,255,.92);text-decoration:none;padding:6px 2px;transition:color .2s;white-space:nowrap}
#venta-terrenos .al-nav-link:hover{color:#fff}
#venta-terrenos .al-field input,#venta-terrenos .al-field select{width:100%;border:1.5px solid #E5E7EB;border-radius:10px;padding:12px 14px;color:#1a2b3d;background:#fff;font:400 14px 'Roboto',sans-serif;outline:none;transition:border-color .2s,box-shadow .2s}
#venta-terrenos .al-field input:focus,#venta-terrenos .al-field select:focus{border-color:#4ba646;box-shadow:0 0 0 3px rgba(118,216,69,.18)}
#venta-terrenos .al-field select:disabled{background:#f1f3f5;color:#9aa4ad;cursor:not-allowed}
#venta-terrenos .al-field label{font:500 13px 'Montserrat',sans-serif;color:rgba(255,255,255,.88);margin-bottom:6px;display:block}
#venta-terrenos .al-submit:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(50,83,102,.5)}
#venta-terrenos .al-cta:hover{transform:translateY(-2px)}
#venta-terrenos .al-projcard:hover{transform:translateY(-4px)}
#venta-terrenos .al-station:hover{transform:translateY(-4px)}
#venta-terrenos .al-hero-grid{display:grid;grid-template-columns:minmax(320px,1fr) minmax(360px,520px);gap:52px;align-items:center}
#venta-terrenos .al-form-grid{display:grid;grid-template-columns:1fr 1fr}
#venta-terrenos .al-lomas-sizes{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:920px){#venta-terrenos .al-hero-grid{grid-template-columns:1fr;gap:34px}}
@media(max-width:860px){#venta-terrenos .al-desktop-nav{display:none}}
@media(max-width:540px){#venta-terrenos .al-form-grid{grid-template-columns:1fr}}
@media(max-width:460px){#venta-terrenos .al-lomas-sizes{grid-template-columns:1fr}}
#venta-terrenos .al-bg-layer{position:absolute;inset:0;transition:opacity 1.4s ease}
#venta-terrenos .al-bg-img{position:absolute;inset:-5%;background-position:center;background-size:cover;background-repeat:no-repeat}
#venta-terrenos .al-bg-mar{opacity:1}
#venta-terrenos .al-bg-bosque{opacity:0}
#venta-terrenos [data-motion="cine"] .al-bg-img{animation:kenburns 26s ease-in-out infinite alternate}
@keyframes kenburns{0%{transform:scale(1.02) translate(0,0)}100%{transform:scale(1.16) translate(-2.5%,-2%)}}
@keyframes marqueeScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
#venta-terrenos .al-marquee-track{display:flex;gap:18px;width:max-content;animation:marqueeScroll 40s linear infinite}
#venta-terrenos .al-marquee-mask{-webkit-mask-image:linear-gradient(to right,transparent,#000 6%,#000 94%,transparent);mask-image:linear-gradient(to right,transparent,#000 6%,#000 94%,transparent)}
#venta-terrenos .al-mapwrap .leaflet-container{background:#0a1520;font-family:'Roboto',sans-serif}
#venta-terrenos .al-mappin{display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%)}
#venta-terrenos .al-pin-head{white-space:nowrap;font:800 12px 'Montserrat',sans-serif;color:#fff;background:rgba(10,21,32,.92);border:1px solid;border-radius:100px;padding:5px 12px;box-shadow:0 6px 18px rgba(0,0,0,.5);margin-bottom:3px}
#venta-terrenos .al-pin-dot{width:18px;height:18px;border-radius:50% 50% 50% 0;transform:rotate(45deg);border:2.5px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,.5)}
#venta-terrenos .al-videofeat:hover .al-playbig{transform:translate(-50%,-50%) scale(1.08);background:#76d845}
#venta-terrenos .al-plano{position:relative;cursor:pointer;border-radius:14px;overflow:hidden}
#venta-terrenos .al-plano img{display:block;width:100%;transition:transform .5s ease}
#venta-terrenos .al-plano:hover img{transform:scale(1.03)}
#venta-terrenos .al-plano-hint{opacity:0;transition:opacity .3s ease}
#venta-terrenos .al-plano:hover .al-plano-hint{opacity:1}
#venta-terrenos .al-hero-proj:hover{transform:translateY(-3px)}
#venta-terrenos .al-hero-proj:hover img{transform:scale(1.08)}
#venta-terrenos .al-placecard:hover{transform:translateY(-5px);box-shadow:0 18px 44px rgba(0,0,0,.4);border-color:rgba(118,216,69,.8)}
#venta-terrenos .al-placecard:hover img{transform:scale(1.05)}
#venta-terrenos .al-galcard:hover img{transform:scale(1.06)}
#venta-terrenos .al-galcard:hover{border-color:rgba(118,216,69,.7)!important}
@keyframes goalPulse{0%,100%{box-shadow:0 0 0 0 rgba(197,160,89,.5)}70%{box-shadow:0 0 0 14px rgba(197,160,89,0)}}
@keyframes fadeInUp{0%{opacity:0;transform:translateY(24px)}100%{opacity:1;transform:translateY(0)}}
@keyframes pulseGreen{0%{box-shadow:0 0 0 0 rgba(118,216,69,.5)}70%{box-shadow:0 0 0 10px rgba(118,216,69,0)}100%{box-shadow:0 0 0 0 rgba(118,216,69,0)}}
@keyframes shimmerGold{0%{background-position:0% 0%}100%{background-position:200% 0%}}
@media(max-width:900px){#venta-terrenos section{padding-top:60px;padding-bottom:60px}#venta-terrenos #al-satmap{height:380px}}
@media(max-width:640px){#venta-terrenos section{padding-left:16px;padding-right:16px;padding-top:50px;padding-bottom:50px}#venta-terrenos #inicio{padding-top:36px}#venta-terrenos #cotizar{padding:22px;border-radius:20px}#venta-terrenos #al-satmap{height:300px}#venta-terrenos .al-galgrid{columns:2 140px;column-gap:12px}#venta-terrenos .al-station{min-width:0;flex:1 0 30%}#venta-terrenos .al-marquee-track img{width:150px;height:188px}#venta-terrenos .al-videofeat{min-height:280px}}
@media(hover:none){#venta-terrenos .al-plano-hint{opacity:1}}
`
