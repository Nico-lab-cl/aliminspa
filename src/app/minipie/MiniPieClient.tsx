'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { SITE } from '@/lib/constants'
import MetaTrackPageView from '@/components/analytics/MetaTrackPageView'
import { trackMetaEvent } from '@/lib/track'

export default function MiniPieClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Form State
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    region: '',
    ciudad: '',
    terreno: '',
    como: '',
  })
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [showPlan, setShowPlan] = useState(false)

  // Handlers
  const handleField = (field: string) => (e: any) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  const playTestimonial = () => {
    const v = document.getElementById('testimonial-video') as HTMLVideoElement
    const o = document.getElementById('video-overlay')
    if (v) {
      v.setAttribute('controls', 'controls')
      v.muted = false
      v.play().catch(() => {})
    }
    if (o) {
      o.style.opacity = '0'
      o.style.pointerEvents = 'none'
    }
  }

  const openPlan = () => setShowPlan(true)
  const closePlan = () => setShowPlan(false)
  const stopProp = (e: React.MouseEvent) => e.stopPropagation()

  const toForm = () => {
    const el = document.getElementById('registro')
    if (el) {
      const y = el.getBoundingClientRect().top + window.pageYOffset - 64
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  const selectTerreno = (val: string) => () => {
    setForm(s => ({ ...s, terreno: val }))
    setTimeout(toForm, 120)
  }

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

      const utm_data = {
        utm_source: searchParams.get('utm_source') || 'minipie_landing',
        utm_medium: searchParams.get('utm_medium') || 'web',
        utm_campaign: searchParams.get('utm_campaign') || 'minipie_2026',
        utm_content: searchParams.get('utm_content'),
        utm_term: searchParams.get('utm_term'),
      }

      // Map telefono to celular, concatenate region to ciudad, send campaign data in project
      const mappedPayload = {
        nombre: form.nombre,
        email: form.email,
        celular: form.telefono,
        ciudad: form.ciudad + (form.region ? ' (' + form.region + ')' : ''),
        proyecto: 'MINIPIE' + (form.terreno ? ' - ' + form.terreno : ''),
        ...utm_data,
        fbp,
        fbc
      }

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mappedPayload),
      })

      if (!res.ok) throw new Error('Error al enviar')

      // Meta Pixel client-side Lead event
      if (typeof window !== 'undefined' && (window as any).fbq) {
        ;(window as any).fbq('track', 'Lead', {
          content_name: 'MINIPIE',
          content_category: 'Real Estate',
          currency: 'CLP',
        })
      }

      // Meta CAPI server-side Lead event (deduplication)
      trackMetaEvent('Lead', { em: form.email, ph: form.telefono, fn: form.nombre }, {
        content_name: 'MINIPIE',
        content_category: 'Real Estate',
        currency: 'CLP',
      })

      // Identify with CRM
      if (typeof window !== 'undefined' && (window as any).AliminCRM) {
        const nameParts = form.nombre.trim().split(/\s+/)
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''
        ;(window as any).AliminCRM.identify({
          email: form.email,
          firstName,
          lastName,
          phone: form.telefono,
          project: mappedPayload.proyecto,
          source: 'Sitio Web'
        }).catch((err: any) => console.error('CRM Identify Error:', err))
      }

      setStatus('success')
      setForm({ nombre: '', email: '', telefono: '', region: '', ciudad: '', terreno: '', como: '' })

      setTimeout(() => {
        router.push('/gracias')
      }, 900)
    } catch (err) {
      console.error(err)
      setStatus('error')
      setTimeout(() => setStatus('idle'), 4000)
    }
  }

  const toggleFaq = (i: number) => () => {
    setOpenFaq(prev => prev === i ? null : i)
  }

  // Computed values for template variables
  const t200 = form.terreno === '200m²'
  const t390 = form.terreno === '390m²'
  const isLoading = status === 'loading'

  const vNombre = form.nombre
  const vEmail = form.email
  const vTelefono = form.telefono
  const vRegion = form.region
  const vCiudad = form.ciudad
  const vTerreno = form.terreno
  const vComo = form.como

  const onNombre = handleField('nombre')
  const onEmail = handleField('email')
  const onTelefono = handleField('telefono')
  const onRegion = handleField('region')
  const onCiudad = handleField('ciudad')
  const onComo = handleField('como')

  const select200 = selectTerreno('200m²')
  const select390 = selectTerreno('390m²')

  const onTerreno200 = () => setForm(s => ({ ...s, terreno: '200m²' }))
  const onTerreno390 = () => setForm(s => ({ ...s, terreno: '390m²' }))
  const clearTerreno = () => setForm(s => ({ ...s, terreno: '' }))

  const card200Border = t200 ? '2px solid #4ba646' : '2px solid #E5E7EB'
  const card390Border = t390 ? '2px solid #76d845' : '2px solid #E5E7EB'
  const card200Shadow = t200 ? '0 8px 48px rgba(75,166,70,.2)' : '0 4px 20px rgba(0,0,0,.07)'
  const card390Shadow = t390 ? '0 8px 48px rgba(118,216,69,.22)' : '0 4px 20px rgba(0,0,0,.07)'
  const btn200Bg = 'linear-gradient(135deg,#325366,#4ba646)'
  const btn390Bg = 'linear-gradient(135deg,#325366,#76d845)'

  const t200SelectedBg = t200 ? 'rgba(118,216,69,.22)' : 'rgba(255,255,255,.06)'
  const t200SelectedBorder = t200 ? '2px solid #76d845' : '1.5px solid rgba(255,255,255,.12)'
  const t200SelectedColor = t200 ? '#76d845' : 'rgba(255,255,255,.55)'
  const t390SelectedBg = t390 ? 'rgba(118,216,69,.22)' : 'rgba(255,255,255,.06)'
  const t390SelectedBorder = t390 ? '2px solid #76d845' : '1.5px solid rgba(255,255,255,.12)'
  const t390SelectedColor = t390 ? '#76d845' : 'rgba(255,255,255,.55)'

  const terrenoSelected = form.terreno !== ''
  const formVisible = status !== 'success'
  const successVisible = status === 'success'
  const statusError = status === 'error'
  const submitText = isLoading ? 'Enviando...' : 'ASEGURAR MI CUPO →'
  const submitDisabled = isLoading
  const planVisible = showPlan
  const onSubmit = handleSubmit

  const toggleFaq0 = toggleFaq(0)
  const toggleFaq1 = toggleFaq(1)
  const toggleFaq2 = toggleFaq(2)
  const toggleFaq3 = toggleFaq(3)
  const toggleFaq4 = toggleFaq(4)

  const faq0h = openFaq === 0 ? '150px' : '0px'
  const faq1h = openFaq === 1 ? '150px' : '0px'
  const faq2h = openFaq === 2 ? '150px' : '0px'
  const faq3h = openFaq === 3 ? '150px' : '0px'
  const faq4h = openFaq === 4 ? '150px' : '0px'

  const faq0icon = openFaq === 0 ? '−' : '+'
  const faq1icon = openFaq === 1 ? '−' : '+'
  const faq2icon = openFaq === 2 ? '−' : '+'
  const faq3icon = openFaq === 3 ? '−' : '+'
  const faq4icon = openFaq === 4 ? '−' : '+'

  const faq0bg = openFaq === 0 ? '#f0f7e4' : '#fff'
  const faq1bg = openFaq === 1 ? '#f0f7e4' : '#fff'
  const faq2bg = openFaq === 2 ? '#f0f7e4' : '#fff'
  const faq3bg = openFaq === 3 ? '#f0f7e4' : '#fff'
  const faq4bg = openFaq === 4 ? '#f0f7e4' : '#fff'

  // Sticky scrolltelling logic and element registration
  useEffect(() => {
    // ── Setup Videos with local /assets/minipie/ prefix ──
    const setupVideo = (id: string, src: string, autoplay: boolean) => {
      const v = document.getElementById(id) as HTMLVideoElement
      if (!v) return
      v.src = src
      v.muted = true
      v.loop = true
      v.playsInline = true
      v.setAttribute('playsinline', '')
      v.load()
      if (autoplay) {
        const play = () => v.play().catch(() => {})
        v.addEventListener('canplaythrough', play, { once: true })
        setTimeout(play, 400)
      }
    }
    
    setupVideo('hero-video',     '/assets/minipie/final.mp4',       true)
    setupVideo('location-video', '/assets/minipie/1-ff5c0f74.mp4', true)
    setupVideo('terrain-video',  '/assets/minipie/1-ff5c0f74.mp4', true)
    setupVideo('urbano-video',   '/assets/minipie/Rural_terrain_transforming_into_..._202606290523.mp4', true)

    // ── Scrollytelling sticky ──
    const wrap        = document.getElementById('sticky-wrap')
    const panelHero   = document.getElementById('panel-hero')
    const panelUbic   = document.getElementById('panel-ubicacion')
    const overlayHero = document.getElementById('overlay-hero')
    const overlayLoc  = document.getElementById('overlay-loc')
    const heroVid     = document.getElementById('hero-video') as HTMLVideoElement
    const locVid      = document.getElementById('location-video') as HTMLVideoElement
    const terrainVid  = document.getElementById('terrain-video') as HTMLVideoElement
    const dot0        = document.getElementById('dot-0')
    const dot1        = document.getElementById('dot-1')
    const label0      = document.getElementById('label-0')
    const label1      = document.getElementById('label-1')
    const progressBar = document.getElementById('progress-bar')
    const scrollHint  = document.getElementById('scroll-hint')

    let locPlaying = false

    const onScroll = () => {
      if (!wrap) return
      const scrolled = window.pageYOffset
      const wrapTop  = wrap.offsetTop
      const wrapH    = wrap.offsetHeight - window.innerHeight
      const p        = wrapH > 0 ? Math.max(0, Math.min(1, (scrolled - wrapTop) / wrapH)) : 0

      // Crossfade zone: 0.35 → 0.65
      const fade = Math.max(0, Math.min(1, (p - 0.35) / 0.3))

      // ── Progress bar ──
      if (progressBar) progressBar.style.width = `${Math.round(p * 100)}%`

      // ── Videos ──
      if (heroVid) heroVid.style.opacity = String(1 - fade)
      if (locVid)  locVid.style.opacity  = String(fade)

      // ── Overlays ──
      if (overlayHero) overlayHero.style.opacity = String(1 - fade)
      if (overlayLoc)  overlayLoc.style.opacity  = String(fade)

      // ── Panels: slide + fade ──
      if (panelHero) {
        panelHero.style.opacity      = String(1 - fade)
        panelHero.style.transform    = `translateY(${-fade * 28}px)`
        panelHero.style.pointerEvents = fade > 0.5 ? 'none' : 'auto'
      }
      if (panelUbic) {
        panelUbic.style.opacity      = String(fade)
        panelUbic.style.transform    = `translateY(${(1 - fade) * 28}px)`
        panelUbic.style.pointerEvents = fade > 0.5 ? 'auto' : 'none'
      }

      // ── Location video: play/pause ──
      if (fade > 0.05 && !locPlaying) {
        locPlaying = true
        locVid && locVid.play().catch(() => {})
        terrainVid && terrainVid.play().catch(() => {})
      }
      if (fade < 0.02 && locPlaying) {
        locPlaying = false
        locVid && locVid.pause()
        terrainVid && terrainVid.pause()
      }

      // ── Dots + labels ──
      const onPanel1 = fade < 0.5
      if (dot0) {
        dot0.style.width      = onPanel1 ? '28px' : '4px'
        dot0.style.background = onPanel1 ? '#76d845' : 'rgba(255,255,255,.3)'
        dot0.style.boxShadow  = onPanel1 ? '0 0 8px rgba(118,216,69,.6)' : 'none'
      }
      if (dot1) {
        dot1.style.width      = onPanel1 ? '4px' : '28px'
        dot1.style.background = onPanel1 ? 'rgba(255,255,255,.3)' : '#76d845'
        dot1.style.boxShadow  = onPanel1 ? 'none' : '0 0 8px rgba(118,216,69,.6)'
      }
      if (label0) {
        label0.style.color   = onPanel1 ? '#76d845' : 'rgba(255,255,255,.3)'
        label0.style.opacity = onPanel1 ? '1' : '0.4'
      }
      if (label1) {
        label1.style.color   = onPanel1 ? 'rgba(255,255,255,.3)' : '#76d845'
        label1.style.opacity = onPanel1 ? '0.4' : '1'
      }

      // ── Scroll hint ──
      if (scrollHint) {
        scrollHint.style.opacity = String(Math.max(0, 1 - p * 4))
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll() // init

    // ── Persistent nav: enters when exiting sticky hero ──
    const persistentNav = document.getElementById('persistent-nav')
    const stickyWrap    = document.getElementById('sticky-wrap')
    const onNavScroll = () => {
      if (!persistentNav || !stickyWrap) return
      const threshold = stickyWrap.offsetHeight
      if (window.pageYOffset > threshold) {
        persistentNav.style.transform = 'translateY(0)'
      } else {
        persistentNav.style.transform = 'translateY(-100%)'
      }
    }
    window.addEventListener('scroll', onNavScroll, { passive: true })
    onNavScroll()

    // ── Drone videos: autoplay + mute toggle ──
    const droneIds = ['drone-1', 'drone-2']
    droneIds.forEach((id, i) => {
      const v = document.getElementById(id) as HTMLVideoElement
      if (!v) return
      v.muted = true
      v.loop = true
      v.playsInline = true
      v.setAttribute('playsinline', '')
      v.load()
      v.play().catch(() => {})

      const btn = document.getElementById(`mute-${i+1}`)
      if (!btn) return

      const mutedIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M23 9l-6 6M17 9l6 6"/></svg>`
      const unmutedIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`

      const clickHandler = (e: MouseEvent) => {
        e.stopPropagation()
        v.muted = !v.muted
        btn.innerHTML = v.muted ? mutedIcon : unmutedIcon
        btn.style.background = v.muted ? 'rgba(0,0,0,.5)' : 'rgba(118,216,69,.35)'
      }

      btn.addEventListener('click', clickHandler)

      return () => {
        btn.removeEventListener('click', clickHandler)
      }
    })

    // ── Scroll Reveal ──
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement
          el.style.opacity = '1'
          el.style.transform = 'translateY(0)'
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0, rootMargin: '0px' })

    document.querySelectorAll('[data-animate]').forEach(el => {
      const htmlEl = el as HTMLElement
      htmlEl.style.opacity = '0'
      htmlEl.style.transform = 'translateY(28px)'
      htmlEl.style.transition = 'opacity 0.65s cubic-bezier(.16,1,.3,1), transform 0.65s cubic-bezier(.16,1,.3,1)'
      observer.observe(el)
    })

    document.querySelectorAll('[data-animate-stagger]').forEach(container => {
      Array.from(container.children).forEach((child, i) => {
        const htmlChild = child as HTMLElement
        htmlChild.style.opacity = '0'
        htmlChild.style.transform = 'translateY(28px)'
        htmlChild.style.transition = `opacity 0.65s ${i * 0.13}s cubic-bezier(.16,1,.3,1), transform 0.65s ${i * 0.13}s cubic-bezier(.16,1,.3,1)`
        observer.observe(child)
      })
    })

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('scroll', onNavScroll)
    }
  }, [])

  return (
    <div id="minipie-landing">
      <MetaTrackPageView eventName="ViewContent" customData={{ content_name: 'MINIPIE - Lomas del Mar', content_category: 'Real Estate' }} />
      {/* Scope Styles */}
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,700&family=Roboto:wght@300;400;500&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: `
    #minipie-landing *{box-sizing:border-box}
    :where(#minipie-landing) *{margin:0;padding:0}
    #minipie-landing-html-not-used{scroll-behavior:smooth;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
    #minipie-landing{font-family:'Roboto',sans-serif;background:#fff;color:#2C3E50;overflow-x:clip}
    #minipie-landing a{color:inherit;text-decoration:none}
    #minipie-landing img{max-width:100%;display:block}
    #minipie-landing input,#minipie-landing select{font-family:'Roboto',sans-serif;font-size:1rem;transition:border-color .2s,box-shadow .2s}
    #minipie-landing input:focus,#minipie-landing select:focus{border-color:#4ba646!important;box-shadow:0 0 0 3px rgba(75,166,70,.15)!important;outline:none!important}
    #minipie-landing button:hover{opacity:.93}
    #minipie-landing ::-webkit-scrollbar{width:5px}
    #minipie-landing ::-webkit-scrollbar-thumb{background:#76d845;border-radius:3px}
    #minipie-landing ::selection{background:rgba(118,216,69,.25)}

    @keyframes fadeInUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes bounceY{0%,100%{transform:translateY(0) translateX(-50%)}50%{transform:translateY(9px) translateX(-50%)}}
    @keyframes pulseGreen{0%,100%{box-shadow:0 4px 24px rgba(118,216,69,.45)}50%{box-shadow:0 6px 36px rgba(118,216,69,.75)}}
    @keyframes shimmerGold{0%{background-position:-300% center}100%{background-position:300% center}}
    @keyframes scaleIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
    @keyframes spinSlow{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    @keyframes marqueeScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
    #client-marquee:hover .marquee-track{animation-play-state:paused}
    .gr-card{transition:transform .3s cubic-bezier(.16,1,.3,1),box-shadow .3s ease}
    .gr-card:hover{transform:translateY(-5px);box-shadow:0 16px 40px rgba(50,83,102,.16)}
    .client-shot{transition:transform .4s cubic-bezier(.16,1,.3,1)}
    .client-shot:hover{transform:scale(1.03)}

    /* ── Marco verde global en todas las cards ── */
    /* Terreno cards */
    .terrenos-grid>div{border:2px solid rgba(118,216,69,.45)!important;box-shadow:0 0 0 1px rgba(118,216,69,.12),0 8px 32px rgba(0,0,0,.35)!important}
    .terrenos-grid>div:hover{border-color:rgba(118,216,69,.8)!important;box-shadow:0 0 0 1px rgba(118,216,69,.3),0 16px 48px rgba(118,216,69,.18)!important}
    /* Google review cards */
    .gr-card{border:1.5px solid rgba(118,216,69,.35)!important}
    .gr-card:hover{border-color:rgba(118,216,69,.7)!important}
    /* Advisor cards */
    .advisors-grid>div{border:2px solid rgba(118,216,69,.35)!important}
    .advisors-grid>div:hover{border-color:rgba(118,216,69,.75)!important;box-shadow:0 20px 48px rgba(118,216,69,.15)!important}
    /* Testimonial featured card + Sebastian */
    #testimonios .gr-card,.testimonials-grid>div{border:1.5px solid rgba(118,216,69,.35)!important}
    /* Lugares cercanos cards */
    section[data-comment-anchor="5dbf49b5ec-section"] .terrenos-grid>div,
    section[data-comment-anchor="5dbf49b5ec-section"]>div>div>div[style*="border-radius:20px"]{border:2px solid rgba(118,216,69,.4)!important}
    /* FAQ items */
    section #faq-section>div>div,section .faq-item{border:1.5px solid rgba(118,216,69,.25)!important}
    /* Form card */
    #registro .form-2col>div:first-child>div{border:2px solid rgba(118,216,69,.3)!important}

    /* ══ RESPONSIVE SYSTEM ══ */

    /* Nav classes */
    .nav-inner{display:flex;align-items:center;justify-content:space-between;gap:12px;max-width:1280px;margin:0 auto;padding:0 24px;height:64px;width:100%}
    .nav-badge{white-space:nowrap}
    .nav-cta{white-space:nowrap}

    /* Hero */
    .hero-panel-inner{max-width:1160px;margin:0 auto;padding:106px 24px 80px;width:100%}
    .hero-ctas{display:flex;flex-wrap:wrap;gap:14px;margin-bottom:52px}
    .hero-trust{display:flex;flex-wrap:wrap;gap:20px;padding-top:24px;border-top:1px solid rgba(255,255,255,.07)}

    /* Location panel */
    .loc-grid{display:grid;grid-template-columns:1fr 1fr;height:100%}
    .loc-left{padding:100px 48px 60px;display:flex;flex-direction:column;justify-content:center}
    .loc-right{position:relative;overflow:hidden}
    .loc-right video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
    .loc-right .loc-overlay{position:absolute;inset:0;background:linear-gradient(to right,rgba(10,18,28,.6) 0%,transparent 60%)}

    /* Benefits bar */
    .benefits-bar{display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid #E8F0EA}
    .benefit-item{padding:28px;display:flex;align-items:flex-start;gap:16px;border-right:1px solid rgba(255,255,255,.1);transition:background .3s,transform .3s}
    .benefit-item:last-child{border-right:none}

    /* Terrenos */
    .terrenos-section{padding:72px 20px}
    .terrenos-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px}
    .terreno-media{height:220px}

    /* Form grid */
    .form-2col{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,460px),1fr));gap:32px;align-items:start}
    .form-fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-bottom:16px}
    .terreno-btns{display:grid;grid-template-columns:1fr 1fr;gap:12px}

    /* Advisors */
    .advisors-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px}

    /* Testimonials */
    .testimonials-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px}

    /* Drone videos */
    .drone-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}

    /* Footer */
    .footer-inner{max-width:1160px;margin:0 auto}
    .footer-top{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-start;gap:28px;padding-bottom:32px;border-bottom:1px solid rgba(255,255,255,.2)}
    .footer-bottom{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;padding-top:20px}

    /* ── TABLET ≤ 1024px ── */
    @media(max-width:1024px){
      .loc-grid{grid-template-columns:1fr}
      .loc-left{padding:72px 32px 40px}
      .loc-right{height:320px}
      .benefits-bar{grid-template-columns:repeat(2,1fr)}
      .benefit-item:nth-child(2){border-right:none}
      .benefit-item:nth-child(3){border-right:1px solid #E8F0EA;border-top:1px solid #E8F0EA}
      .benefit-item:nth-child(4){border-right:none;border-top:1px solid #E8F0EA}
      .drone-grid{grid-template-columns:1fr}
      .form-2col{grid-template-columns:1fr}
    }

    /* ── MOBILE ≤ 768px ── */
    @media(max-width:768px){
      /* Nav */
      .nav-inner{padding:0 16px;height:56px}
      .nav-badge{display:none}
      .nav-cta{padding:8px 14px!important;font-size:12px!important}
      #main-nav #minipie-landing img{width:32px!important;height:32px!important}
      #main-nav .nav-name{font-size:15px!important}

      /* Hero */
      .hero-panel-inner{padding:72px 20px 24px}
      #panel-hero h1{font-size:clamp(2rem,11vw,2.8rem)!important;margin-bottom:10px!important}
      #panel-hero p{font-size:0.95rem!important;margin-bottom:20px!important;max-width:100%!important}
      #panel-hero .price-cards-row{gap:8px!important;margin-bottom:24px!important}
      #panel-hero .price-cards-row>div{padding:8px 12px!important}
      .hero-ctas{flex-direction:column;gap:8px;margin-bottom:16px!important}
      .hero-ctas>button,.hero-ctas>a{width:100%!important;justify-content:center!important;text-align:center!important;padding:13px 20px!important}
      .hero-trust{gap:10px;padding-top:14px!important;flex-wrap:wrap}
      .hero-trust>div{font-size:12px}
      /* Ocultar tarjeta terrain-video en mobile (panel Ubicación) */
      #terrain-video-card{display:none!important}
      #panel-ubicacion>div{grid-template-columns:1fr!important}
      /* Ocultar badge promo en mobile */
      .hero-promo-badge{display:none!important}
      /* Navbar persistente mobile */
      #persistent-nav>div{padding:0 12px!important;height:52px!important;gap:8px!important}
      #persistent-nav img{width:30px!important;height:30px!important}
      #persistent-nav .nav-name-text{font-size:15px!important}
      #persistent-nav .nav-badge{display:none!important}
      #persistent-nav button{padding:7px 12px!important;font-size:11px!important}
      /* Navbar hero mobile */
      #main-nav>div{padding:0 12px!important;height:52px!important}
      #main-nav img{width:30px!important;height:30px!important}
      #main-nav .nav-name-text{font-size:15px!important}

      /* Loc */
      .loc-left{padding:56px 16px 32px}
      .loc-right{height:220px}

      /* Benefits */
      .benefits-bar{grid-template-columns:1fr 1fr}
      .benefit-item{padding:16px 12px;gap:10px}
      .benefit-item:nth-child(2){border-right:none}
      .benefit-item:nth-child(3){border-top:1px solid #E8F0EA;border-right:1px solid #E8F0EA}
      .benefit-item:nth-child(4){border-top:1px solid #E8F0EA;border-right:none}

      /* Terrenos */
      .terrenos-section{padding:48px 16px!important}
      .terrenos-grid{grid-template-columns:1fr}
      .terreno-media{height:200px}

      /* Form */
      .form-2col{grid-template-columns:1fr;gap:24px}
      .form-fields{grid-template-columns:1fr;gap:12px}
      .terreno-btns{grid-template-columns:1fr 1fr;gap:8px}

      /* Advisors */
      .advisors-grid{grid-template-columns:1fr}
      /* Testimonials */
      .testimonials-grid{grid-template-columns:1fr}
      /* Testimonio featured: video + quote → una columna en mobile */
      .testimonio-featured{grid-template-columns:1fr!important}
      .testimonio-featured>div:first-child{min-height:280px!important}

      /* Generic section padding override */
      .section-pad{padding-left:16px!important;padding-right:16px!important;padding-top:48px!important;padding-bottom:48px!important}
      .section-pad-sm{padding-left:16px!important;padding-right:16px!important;padding-top:40px!important;padding-bottom:40px!important}

      /* Footer */
      .footer-top{flex-direction:column;gap:20px}
      .footer-bottom{flex-direction:column;align-items:flex-start;gap:8px}
      .footer-inner{padding:32px 16px 24px}

      /* WA float */
      #wa-float{bottom:16px!important;right:16px!important;width:50px!important;height:50px!important}
    }

    /* ── SMALL MOBILE ≤ 390px ── */
    @media(max-width:390px){
      .nav-cta span{display:none}
      .terreno-btns{grid-template-columns:1fr}
      .benefit-item .benefit-icon{width:36px!important;height:36px!important;min-width:36px}
      .hero-ctas>button,.hero-ctas>#minipie-landing a{font-size:13px!important;padding:13px 16px!important}
    }

    /* ── LARGE ≥ 1440px ── */
    @media(min-width:1440px){
      .hero-panel-inner{padding:120px 40px 100px}
      .loc-left{padding:120px 64px 80px}
      .terrenos-section{padding:88px 40px}
    }

    /* ── 4K ≥ 2560px ── */
    @media(min-width:2560px){
      .nav-inner{height:80px}
      #main-nav #minipie-landing img{width:56px!important;height:56px!important}
      .hero-panel-inner{padding:160px 60px 120px}
    }
  ` }} />

      {/* Body Content */}
      



<div id="sticky-wrap" style={{"height":"200vh","position":"relative","background":"#0e1a24"}}>
  <div style={{"position":"sticky","top":"0","height":"100vh","overflow":"hidden","background":"#0e1a24"}}>

    
    <video id="hero-video" style={{"position":"absolute","inset":"0","width":"100%","height":"100%","objectFit":"cover","zIndex":"1","transition":"opacity 1s ease"}} preload="auto"></video>

    
    <video id="location-video" style={{"position":"absolute","inset":"0","width":"100%","height":"100%","objectFit":"cover","zIndex":"1","opacity":"0","transition":"opacity 1s ease"}} preload="auto"></video>

    
    <div id="overlay-hero" style={{"position":"absolute","inset":"0","zIndex":"2","transition":"opacity .9s ease","pointerEvents":"none"}}>
      <div style={{"position":"absolute","inset":"0","background":"radial-gradient(ellipse at 50% 40%,rgba(0,0,0,.15) 0%,rgba(0,0,0,.52) 100%)"}}></div>
      <div style={{"position":"absolute","bottom":"0","left":"0","right":"0","height":"62%","background":"linear-gradient(to top,rgba(10,18,28,.75) 0%,transparent 100%)"}}></div>
      <div style={{"position":"absolute","top":"0","left":"0","right":"0","height":"130px","background":"linear-gradient(to bottom,rgba(10,18,28,.5) 0%,transparent 100%)"}}></div>
      <div style={{"position":"absolute","bottom":"0","right":"0","width":"210px","height":"100px","background":"linear-gradient(135deg,transparent 25%,rgba(0,0,0,.94) 100%)"}}></div>
    </div>

    
    <div id="overlay-loc" style={{"position":"absolute","inset":"0","zIndex":"2","opacity":"0","transition":"opacity .9s ease","pointerEvents":"none"}}>
      <div style={{"position":"absolute","inset":"0","background":"linear-gradient(to right,rgba(10,18,28,.88) 0%,rgba(10,18,28,.55) 45%,rgba(10,18,28,.75) 100%)"}}></div>
      <div style={{"position":"absolute","inset":"0","background":"linear-gradient(to bottom,rgba(10,18,28,.45) 0%,transparent 30%,transparent 70%,rgba(10,18,28,.55) 100%)"}}></div>
    </div>

    
    <div id="panel-hero" style={{"position":"absolute","inset":"0","zIndex":"5","display":"flex","alignItems":"center","transition":"opacity .9s ease,transform .9s ease"}}>
      <div className="hero-panel-inner">
        <div className="hero-promo-badge" style={{"animation":"fadeInUp .55s .05s ease both","display":"inline-flex","alignItems":"center","gap":"8px","background":"rgba(239,68,68,.18)","border":"1px solid rgba(239,68,68,.4)","borderRadius":"100px","padding":"5px 14px","marginBottom":"16px"}}>
          <span style={{"width":"7px","height":"7px","background":"#FCA5A5","borderRadius":"50%","display":"inline-block"}}></span>
          <span style={{"font":"700 12px 'Montserrat',sans-serif","color":"#FCA5A5","textTransform":"uppercase","letterSpacing":".1em"}}>Promoción limitada · Última edición</span>
        </div>
        <h1 style={{"animation":"fadeInUp .55s .1s ease both","font":"900 clamp(3rem,8.5vw,6.2rem)/1.0 'Montserrat',sans-serif","color":"#fff","letterSpacing":"-.035em","marginBottom":"18px"}}>
          VUELVE<br />
          <em style={{"fontStyle":"normal","background":"linear-gradient(90deg, rgb(118, 216, 69), rgb(75, 166, 70), rgb(118, 216, 69)) 0% 0% / 200% text","WebkitTextFillColor":"transparent","animation":"3s linear 0s infinite normal none running shimmerGold"}}>MINI PIE</em>&nbsp;</h1>
        <p style={{"animation":"fadeInUp .55s .2s ease both","font":"300 clamp(1rem,2.2vw,1.2rem)/1.7 'Roboto',sans-serif","color":"rgba(255,255,255,.65)","marginBottom":"32px","maxWidth":"540px"}}>
          La última edición. Tu terreno en el litoral central con el pie más accesible del mercado. Sin banco, sin interés.
        </p>
        <div className="price-cards-row" style={{"animation":"fadeInUp .55s .3s ease both","display":"flex","flexWrap":"wrap","gap":"12px","marginBottom":"40px"}}>

          
          <div style={{"background":"rgba(0,0,0,.35)","border":"1px solid rgba(118,216,69,.35)","borderRadius":"14px","padding":"10px 16px","display":"flex","flexDirection":"column","gap":"3px"}}>
            <div style={{"font":"700 10px 'Montserrat',sans-serif","color":"rgba(255,255,255,.45)","textTransform":"uppercase","letterSpacing":".08em"}}>200 m²</div>
            <div style={{"display":"flex","alignItems":"center","gap":"8px"}}>
              <span style={{"font":"600 12px 'Roboto',sans-serif","color":"rgba(255,100,100,.75)","textDecoration":"line-through"}}>$5.500.000</span>
              <span style={{"font":"400 10px 'Montserrat',sans-serif","color":"rgba(255,255,255,.35)"}}>→</span>
              <span style={{"font":"800 16px 'Montserrat',sans-serif","color":"#76d845"}}>$1.500.000</span>
            </div>
            <div style={{"font":"500 10px 'Roboto',sans-serif","color":"rgba(118,216,69,.7)"}}>Ahorra $4.000.000 en el pie</div>
          </div>

          
          <div style={{"background":"rgba(0,0,0,.35)","border":"1px solid rgba(118,216,69,.35)","borderRadius":"14px","padding":"10px 16px","display":"flex","flexDirection":"column","gap":"3px"}}>
            <div style={{"font":"700 10px 'Montserrat',sans-serif","color":"rgba(255,255,255,.45)","textTransform":"uppercase","letterSpacing":".08em"}}>390 m²</div>
            <div style={{"display":"flex","alignItems":"center","gap":"8px"}}>
              <span style={{"font":"600 12px 'Roboto',sans-serif","color":"rgba(255,100,100,.75)","textDecoration":"line-through"}}>$7.500.000</span>
              <span style={{"font":"400 10px 'Montserrat',sans-serif","color":"rgba(255,255,255,.35)"}}>→</span>
              <span style={{"font":"800 16px 'Montserrat',sans-serif","color":"#76d845"}}>$3.000.000</span>
            </div>
            <div style={{"font":"500 10px 'Roboto',sans-serif","color":"rgba(118,216,69,.7)"}}>Ahorra $4.500.000 en el pie</div>
          </div>

        </div>
        <div className="hero-ctas" style={{"animation":"fadeInUp .55s .4s ease both"}}>
          <button onClick={toForm} style={{"background":"linear-gradient(135deg,#76d845 0%,#4ba646 100%)","color":"#fff","border":"none","padding":"15px 32px","borderRadius":"14px","font":"700 15px 'Montserrat',sans-serif","cursor":"pointer","boxShadow":"0 6px 28px rgba(118,216,69,.38)","transition":"transform .2s,box-shadow .2s","letterSpacing":".01em"}}>
            ASEGURAR MI CUPO →
          </button>
          <a href="#terrenos" style={{"background":"rgba(255,255,255,.09)","color":"rgba(255,255,255,.85)","border":"1px solid rgba(255,255,255,.18)","padding":"15px 26px","borderRadius":"14px","font":"600 15px 'Montserrat',sans-serif","cursor":"pointer","transition":"background .2s","display":"flex","alignItems":"center","gap":"6px"}}>
            Ver terrenos <span style={{"fontSize":"16px"}}>↓</span>
          </a>
        </div>
        <div className="hero-trust" style={{"animation":"fadeInUp .55s .5s ease both"}}>
          <div style={{"font":"400 13px 'Roboto',sans-serif","color":"rgba(255,255,255,.5)","display":"flex","alignItems":"center","gap":"7px"}}>
            <span style={{"width":"18px","height":"18px","background":"rgba(118,216,69,.2)","borderRadius":"50%","display":"flex","alignItems":"center","justifyContent":"center","fontSize":"10px","color":"#76d845","flexShrink":"0"}}>✓</span> Sin banco
          </div>
          <div style={{"font":"400 13px 'Roboto',sans-serif","color":"rgba(255,255,255,.5)","display":"flex","alignItems":"center","gap":"7px"}}>
            <span style={{"width":"18px","height":"18px","background":"rgba(118,216,69,.2)","borderRadius":"50%","display":"flex","alignItems":"center","justifyContent":"center","fontSize":"10px","color":"#76d845","flexShrink":"0"}}>✓</span> Rol propio incluido
          </div>
          <div style={{"font":"400 13px 'Roboto',sans-serif","color":"rgba(255,255,255,.5)","display":"flex","alignItems":"center","gap":"7px"}}>
            <span style={{"width":"18px","height":"18px","background":"rgba(118,216,69,.2)","borderRadius":"50%","display":"flex","alignItems":"center","justifyContent":"center","fontSize":"10px","color":"#76d845","flexShrink":"0"}}>✓</span> Agua certificada
          </div>
        </div>
      </div>
    </div>

    
    <div id="panel-ubicacion" style={{"position":"absolute","inset":"0","zIndex":"4","display":"flex","alignItems":"center","opacity":"0","pointerEvents":"none","transition":"opacity .9s ease,transform .9s ease"}}>
      <div style={{"maxWidth":"1200px","margin":"0 auto","padding":"88px 28px 72px","width":"100%","display":"grid","gridTemplateColumns":"1fr 1fr","gap":"52px","alignItems":"center"}}>

        
        <div style={{"textAlign":"left"}}>
          <div style={{"display":"inline-flex","alignItems":"center","gap":"8px","marginBottom":"16px"}}>
            <span style={{"display":"inline-block","width":"28px","height":"2px","background":"linear-gradient(90deg,#76d845,#4ba646)"}}></span>
            <span style={{"font":"600 11px 'Montserrat',sans-serif","color":"#76d845","textTransform":"uppercase","letterSpacing":".14em"}}>Ubicación</span>
          </div>
          <h2 style={{"font":"900 clamp(2rem,4vw,3rem)/1.05 'Montserrat',sans-serif","color":"#fff","marginBottom":"12px","letterSpacing":"-.02em"}}>
            A 1 hora<br />de Santiago
          </h2>
          <p style={{"font":"400 14px/1.7 'Roboto',sans-serif","color":"rgba(255,255,255,.55)","marginBottom":"28px","maxWidth":"380px"}}>
            Lomas del Mar, El Tabo — Litoral Central. Una de las zonas con mayor plusvalía costera de Chile.
          </p>

          
          <div style={{"display":"flex","flexDirection":"column","gap":"12px","marginBottom":"28px"}}>
            <div style={{"display":"flex","alignItems":"center","gap":"12px"}}>
              <div style={{"width":"38px","height":"38px","background":"rgba(118,216,69,.15)","border":"1px solid rgba(118,216,69,.3)","borderRadius":"10px","display":"flex","alignItems":"center","justifyContent":"center","flexShrink":"0"}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#76d845" strokeWidth="2.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              </div>
              <div>
                <div style={{"font":"600 13px 'Montserrat',sans-serif","color":"#fff"}}>El Tabo · Región de Valparaíso</div>
                <div style={{"font":"400 11px 'Roboto',sans-serif","color":"rgba(255,255,255,.4)"}}>Litoral Central, Chile</div>
              </div>
            </div>
            <div style={{"display":"flex","alignItems":"center","gap":"12px"}}>
              <div style={{"width":"38px","height":"38px","background":"rgba(118,216,69,.15)","border":"1px solid rgba(118,216,69,.3)","borderRadius":"10px","display":"flex","alignItems":"center","justifyContent":"center","flexShrink":"0"}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#76d845" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4l3 3"></path></svg>
              </div>
              <div>
                <div style={{"font":"600 13px 'Montserrat',sans-serif","color":"#fff"}}>1 hora desde Santiago</div>
                <div style={{"font":"400 11px 'Roboto',sans-serif","color":"rgba(255,255,255,.4)"}}>Autopista del Sol · Ruta 78</div>
              </div>
            </div>
            <div style={{"display":"flex","alignItems":"center","gap":"12px"}}>
              <div style={{"width":"38px","height":"38px","background":"rgba(118,216,69,.15)","border":"1px solid rgba(118,216,69,.3)","borderRadius":"10px","display":"flex","alignItems":"center","justifyContent":"center","flexShrink":"0"}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#76d845" strokeWidth="2.5" strokeLinecap="round"><path d="M3 17l4-8 4 5 3-3 4 6"></path></svg>
              </div>
              <div>
                <div style={{"font":"600 13px 'Montserrat',sans-serif","color":"#fff"}}>10 min a playa El Tabo</div>
                <div style={{"font":"400 11px 'Roboto',sans-serif","color":"rgba(255,255,255,.4)"}}>Cartagena · El Quisco · Algarrobo</div>
              </div>
            </div>
            <div style={{"display":"flex","alignItems":"center","gap":"12px"}}>
              <div style={{"width":"38px","height":"38px","background":"rgba(118,216,69,.15)","border":"1px solid rgba(118,216,69,.3)","borderRadius":"10px","display":"flex","alignItems":"center","justifyContent":"center","flexShrink":"0"}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#76d845" strokeWidth="2.5" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"></rect><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"></path></svg>
              </div>
              <div>
                <div style={{"font":"600 13px 'Montserrat',sans-serif","color":"#fff"}}>4 años de experiencia</div>
                <div style={{"font":"400 11px 'Roboto',sans-serif","color":"rgba(255,255,255,.4)"}}>Proyectos inmobiliarios en Chile</div>
              </div>
            </div>
            <div style={{"display":"flex","alignItems":"center","gap":"12px"}}>
              <div style={{"width":"38px","height":"38px","background":"rgba(118,216,69,.15)","border":"1px solid rgba(118,216,69,.3)","borderRadius":"10px","display":"flex","alignItems":"center","justifyContent":"center","flexShrink":"0"}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#76d845" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
              </div>
              <div>
                <div style={{"font":"600 13px 'Montserrat',sans-serif","color":"#fff"}}>Sector de alta plusvalía</div>
                <div style={{"font":"400 11px 'Roboto',sans-serif","color":"rgba(255,255,255,.4)"}}>Mayor valorización costera de Chile</div>
              </div>
            </div>
          </div>
        </div>

        
        <div id="terrain-video-card" style={{"position":"relative"}}>

          <div style={{"borderRadius":"20px","overflow":"hidden","position":"relative","boxShadow":"0 24px 64px rgba(0,0,0,.55)","border":"2px solid rgba(118,216,69,.25)","aspectRatio":"4/3"}}>
            <video id="terrain-video" style={{"width":"100%","height":"100%","objectFit":"cover","display":"block"}} muted loop playsInline preload="auto"></video>
            
            <div style={{"position":"absolute","inset":"0","background":"linear-gradient(to bottom,transparent 60%,rgba(10,18,28,.65) 100%)"}}></div>
            
            <div style={{"position":"absolute","top":"14px","left":"14px","background":"rgba(10,18,28,.82)","backdropFilter":"blur(8px)","border":"1px solid rgba(118,216,69,.35)","borderRadius":"100px","padding":"5px 12px","display":"flex","alignItems":"center","gap":"6px"}}>
              <span style={{"width":"6px","height":"6px","background":"#76d845","borderRadius":"50%","display":"inline-block"}}></span>
              <span style={{"font":"600 11px 'Montserrat',sans-serif","color":"#fff"}}>Lomas del Mar · El Tabo</span>
            </div>
            
            <div style={{"position":"absolute","bottom":"14px","left":"14px","right":"14px"}}>
              <div style={{"display":"flex","gap":"8px","flexWrap":"wrap"}}>
                <div style={{"background":"rgba(10,18,28,.82)","backdropFilter":"blur(8px)","border":"1px solid rgba(118,216,69,.3)","borderRadius":"8px","padding":"6px 12px"}}>
                  <div style={{"font":"700 13px 'Montserrat',sans-serif","color":"#76d845"}}>200 m²</div>

                </div>
                <div style={{"background":"rgba(10,18,28,.82)","backdropFilter":"blur(8px)","border":"1px solid rgba(118,216,69,.3)","borderRadius":"8px","padding":"6px 12px"}}>
                  <div style={{"font":"700 13px 'Montserrat',sans-serif","color":"#76d845"}}>390 m²</div>

                </div>
              </div>
            </div>
          </div>

          
          <svg viewBox="0 0 400 20" style={{"width":"100%","height":"20px","display":"block","marginTop":"6px"}} xmlns="http://www.w3.org/2000/svg">
            <line x1="0" y1="10" x2="400" y2="10" stroke="rgba(118,216,69,.3)" strokeWidth="1" strokeDasharray="4,4"></line>
            <line x1="0" y1="4" x2="0" y2="16" stroke="rgba(118,216,69,.4)" strokeWidth="1.5"></line>
            <line x1="400" y1="4" x2="400" y2="16" stroke="rgba(118,216,69,.4)" strokeWidth="1.5"></line>
            <text x="200" y="14" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="9" fill="rgba(118,216,69,.6)" font-weight="600">TERRENO LOMAS DEL MAR · LITORAL CENTRAL</text>
          </svg>
        </div>

      </div>
    </div>

    
    <nav id="main-nav" style={{"position":"absolute","top":"0","left":"0","right":"0","zIndex":"20","background":"linear-gradient(to bottom,rgba(0,0,0,.52) 0%,transparent 100%)"}}>
      <div className="nav-inner">
        <div style={{"display":"flex","alignItems":"center","gap":"12px","flexShrink":"0"}}>
          <img src="/assets/minipie/favicon (1).png" alt="Alimin" style={{"width":"50px","height":"50px","objectFit":"contain","display":"block"}} />
          <div className="nav-name-text" style={{"font":"900 24px/1 'Montserrat',sans-serif","color":"#fff","letterSpacing":"-.02em"}}>ALIMIN</div>
        </div>
        <div style={{"display":"flex","alignItems":"center","gap":"8px"}}>
          <div className="nav-badge" style={{"background":"rgba(239,68,68,.15)","border":"1px solid rgba(239,68,68,.35)","borderRadius":"100px","padding":"4px 12px","font":"700 11px 'Montserrat',sans-serif","color":"#FCA5A5"}}>⚠ CUPOS LIMITADOS</div>
          <button onClick={toForm} style={{"background":"linear-gradient(135deg,#76d845,#4ba646)","color":"#fff","border":"none","padding":"10px 20px","borderRadius":"100px","font":"700 13px 'Montserrat',sans-serif","cursor":"pointer","whiteSpace":"nowrap","boxShadow":"0 4px 16px rgba(118,216,69,.4)"}}>
            Asegurar Cupo
          </button>
        </div>
      </div>
    </nav>

    
    <div style={{"position":"absolute","top":"0","left":"0","right":"0","height":"3px","background":"rgba(255,255,255,.1)","zIndex":"25"}}>
      <div id="progress-bar" style={{"height":"100%","width":"0%","background":"linear-gradient(90deg,#76d845,#4ba646)","borderRadius":"0 2px 2px 0","transition":"width .1s linear"}}></div>
    </div>

    
    <div style={{"position":"absolute","bottom":"28px","left":"50%","transform":"translateX(-50%)","zIndex":"20","display":"flex","flexDirection":"column","alignItems":"center","gap":"10px"}}>
      
      <div style={{"display":"flex","alignItems":"center","gap":"20px"}}>
        <div style={{"display":"flex","flexDirection":"column","alignItems":"center","gap":"5px"}}>
          <div id="dot-0" style={{"width":"28px","height":"4px","background":"#76d845","borderRadius":"3px","transition":"all .45s ease","boxShadow":"0 0 8px rgba(118,216,69,.6)"}}></div>
          <span id="label-0" style={{"font":"700 9px 'Montserrat',sans-serif","color":"#76d845","textTransform":"uppercase","letterSpacing":".08em","transition":"opacity .45s ease","whiteSpace":"nowrap"}}>Mini Pie</span>
        </div>
        <div style={{"display":"flex","flexDirection":"column","alignItems":"center","gap":"5px"}}>
          <div id="dot-1" style={{"width":"4px","height":"4px","background":"rgba(255,255,255,.3)","borderRadius":"3px","transition":"all .45s ease"}}></div>
          <span id="label-1" style={{"font":"700 9px 'Montserrat',sans-serif","color":"rgba(255,255,255,.3)","textTransform":"uppercase","letterSpacing":".08em","transition":"opacity .45s ease","whiteSpace":"nowrap"}}>Ubicación</span>
        </div>
      </div>
      
      <div id="scroll-hint" style={{"display":"flex","flexDirection":"column","alignItems":"center","gap":"4px","transition":"opacity .5s ease"}}>
        <span style={{"font":"500 10px 'Roboto',sans-serif","color":"rgba(255,255,255,.4)","letterSpacing":".06em"}}>SCROLL PARA VER MÁS</span>
        <svg width="16" height="10" viewBox="0 0 16 10" fill="none"><path d="M1 1l7 7 7-7" stroke="rgba(255,255,255,.35)" strokeWidth="2" strokeLinecap="round"></path></svg>
      </div>
    </div>

    

  </div>
</div>


<nav id="persistent-nav" style={{"position":"fixed","top":"0","left":"0","right":"0","zIndex":"200","background":"linear-gradient(135deg,#3a9e48 0%,#4ba646 40%,#62c247 100%)","backdropFilter":"blur(12px)","WebkitBackdropFilter":"blur(12px)","borderBottom":"2px solid rgba(255,255,255,.2)","transform":"translateY(-100%)","transition":"transform .4s cubic-bezier(.16,1,.3,1)","boxShadow":"0 4px 24px rgba(75,166,70,.5)"}}>
  <div style={{"maxWidth":"1160px","margin":"0 auto","padding":"0 24px","height":"68px","display":"flex","alignItems":"center","justifyContent":"space-between","gap":"12px"}}>
    <div style={{"display":"flex","alignItems":"center","gap":"12px","flexShrink":"0"}}>
      <img src="/assets/minipie/favicon (1).png" alt="Alimin" style={{"width":"44px","height":"44px","objectFit":"contain","display":"block"}} />
      <div>
        <div className="nav-name-text" style={{"font":"900 22px/1 'Montserrat',sans-serif","color":"#fff","letterSpacing":"-.02em"}}>ALIMIN</div>
      </div>
    </div>
    <div style={{"display":"flex","alignItems":"center","gap":"10px"}}>
      <div className="nav-badge" style={{"display":"flex","alignItems":"center","gap":"7px","background":"rgba(0,0,0,.18)","border":"1px solid rgba(255,255,255,.3)","borderRadius":"100px","padding":"5px 14px","font":"700 11px 'Montserrat',sans-serif","color":"#fff"}}>
        <span style={{"width":"7px","height":"7px","background":"#fff","borderRadius":"50%","display":"inline-block","opacity":".85"}}></span>
        CUPOS LIMITADOS
      </div>
      <button onClick={toForm} style={{"background":"#fff","color":"#2d7a3a","border":"none","padding":"10px 20px","borderRadius":"100px","font":"700 13px 'Montserrat',sans-serif","cursor":"pointer","whiteSpace":"nowrap","boxShadow":"0 4px 16px rgba(0,0,0,.2)","letterSpacing":".01em"}}>
        Asegurar Cupo &rarr;
      </button>
    </div>
  </div>
</nav>

<section style={{"position":"relative","overflow":"hidden","padding":"0","background":"#0e1a24"}}>
  
  <div style={{"position":"absolute","inset":"0","background":"url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop&q=80') center/cover no-repeat"}}></div>

  <div style={{"position":"absolute","inset":"0","background":"rgba(18,37,58,.87)"}}></div>

  <div className="benefits-bar" style={{"position":"relative","zIndex":"1","maxWidth":"1160px","margin":"0 auto"}}>

    
    <div className="benefit-item" style={{"textAlign":"left","cursor":"default"}}  data-animate="">
      <div style={{"width":"52px","height":"52px","background":"linear-gradient(135deg,#76d845,#4ba646)","borderRadius":"16px","display":"flex","alignItems":"center","justifyContent":"center","flexShrink":"0","boxShadow":"0 6px 20px rgba(118,216,69,.45)"}}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
      </div>
      <div>
        <div style={{"font":"800 22px 'Montserrat',sans-serif","color":"#fff","lineHeight":"1","marginBottom":"3px"}}>Pie desde</div>
        <div style={{"font":"700 11px 'Montserrat',sans-serif","color":"#76d845","textTransform":"uppercase","letterSpacing":".06em","marginBottom":"4px"}}>$1.500.000 CLP</div>
        <div style={{"font":"400 12px 'Roboto',sans-serif","color":"rgba(255,255,255,.6)","lineHeight":"1.5"}}>El pie más bajo<br />del litoral central</div>
      </div>
    </div>

    
    <div className="benefit-item" style={{"textAlign":"left","cursor":"default"}}  data-animate="">
      <div style={{"width":"52px","height":"52px","background":"linear-gradient(135deg,#76d845,#4ba646)","borderRadius":"16px","display":"flex","alignItems":"center","justifyContent":"center","flexShrink":"0","boxShadow":"0 6px 20px rgba(118,216,69,.45)"}}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
      </div>
      <div>
        <div style={{"font":"800 24px 'Montserrat',sans-serif","color":"#fff","lineHeight":"1","marginBottom":"3px"}}>Pesos</div>
        <div style={{"font":"700 11px 'Montserrat',sans-serif","color":"#76d845","textTransform":"uppercase","letterSpacing":".06em","marginBottom":"4px"}}>No en UF</div>
        <div style={{"font":"400 12px 'Roboto',sans-serif","color":"rgba(255,255,255,.6)","lineHeight":"1.5"}}>Precios fijos,<br />sin sorpresas</div>
      </div>
    </div>

    
    <div className="benefit-item" style={{"textAlign":"left","cursor":"default"}}  data-animate="">
      <div style={{"width":"52px","height":"52px","background":"linear-gradient(135deg,#76d845,#4ba646)","borderRadius":"16px","display":"flex","alignItems":"center","justifyContent":"center","flexShrink":"0","boxShadow":"0 6px 20px rgba(118,216,69,.45)"}}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
      </div>
      <div>
        <div style={{"font":"800 18px/1.2 'Montserrat',sans-serif","color":"#fff","marginBottom":"3px"}}>No nos importa<br />tu Dicom</div>
        <div style={{"font":"700 11px 'Montserrat',sans-serif","color":"#76d845","textTransform":"uppercase","letterSpacing":".06em","marginBottom":"4px"}}>Sin evaluación bancaria</div>
        <div style={{"font":"400 12px 'Roboto',sans-serif","color":"rgba(255,255,255,.6)","lineHeight":"1.5"}}>Aprobación 100% propia</div>
      </div>
    </div>

    
    <div className="benefit-item" style={{"textAlign":"left","cursor":"default"}}  data-animate="">
      <div style={{"width":"52px","height":"52px","background":"linear-gradient(135deg,#76d845,#4ba646)","borderRadius":"16px","display":"flex","alignItems":"center","justifyContent":"center","flexShrink":"0","boxShadow":"0 6px 20px rgba(118,216,69,.45)"}}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"></path></svg>
      </div>
      <div>
        <div style={{"font":"800 22px 'Montserrat',sans-serif","color":"#fff","lineHeight":"1","marginBottom":"3px"}}>Crédito directo</div>
        <div style={{"font":"700 11px 'Montserrat',sans-serif","color":"#76d845","textTransform":"uppercase","letterSpacing":".06em","marginBottom":"4px"}}>Sin banco</div>
        <div style={{"font":"400 12px 'Roboto',sans-serif","color":"rgba(255,255,255,.65)","lineHeight":"1.5"}} data-comment-anchor-extra="8397cb5da8-div">Financiamiento 100% por parte de la inmobiliaria</div>
      </div>
    </div>

  </div>
</section>


<section id="terrenos" style={{"position":"relative","overflow":"hidden","padding":"72px 20px","background":"#0e1a24"}}>
  
  <div style={{"position":"absolute","inset":"0","background":"url('https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1600&auto=format&fit=crop&q=80') center/cover no-repeat"}}></div>
  
  <div style={{"position":"absolute","inset":"0","background":"linear-gradient(160deg,rgba(10,25,40,.80) 0%,rgba(14,30,48,.72) 55%,rgba(8,20,32,.82) 100%)"}}></div>
  
  <div style={{"position":"absolute","top":"-120px","right":"-80px","width":"440px","height":"440px","background":"radial-gradient(circle,rgba(118,216,69,.08) 0%,transparent 70%)","borderRadius":"50%","pointerEvents":"none"}}></div>
  <div style={{"position":"absolute","bottom":"-80px","left":"-60px","width":"320px","height":"320px","background":"radial-gradient(circle,rgba(50,83,102,.2) 0%,transparent 70%)","borderRadius":"50%","pointerEvents":"none"}}></div>
  <div className="footer-inner" style={{"maxWidth":"1160px","margin":"0 auto"}}>
    
    <div style={{"textAlign":"center","marginBottom":"48px"}} data-animate="">
      <div style={{"display":"inline-flex","alignItems":"center","gap":"8px","marginBottom":"14px"}}>
        <span style={{"display":"inline-block","width":"32px","height":"2px","background":"linear-gradient(90deg,#76d845,#4ba646)"}}></span>
        <span style={{"font":"600 12px 'Montserrat',sans-serif","color":"#76d845","textTransform":"uppercase","letterSpacing":".12em"}}>Elige tu terreno</span>
        <span style={{"display":"inline-block","width":"32px","height":"2px","background":"linear-gradient(90deg,#4ba646,#76d845)"}}></span>
      </div>
      <h2 style={{"font":"800 clamp(1.8rem,3.5vw,2.6rem)/1.2 'Montserrat',sans-serif","color":"#fff","marginBottom":"12px"}}>Tu terreno en el Litoral Central</h2>
      <p style={{"font":"400 16px/1.7 'Roboto',sans-serif","color":"rgba(255,255,255,.6)","maxWidth":"560px","margin":"0 auto"}}>Dos opciones de terreno, mismo precio de cuota mensual. Elige el que se adapta a tu proyecto de vida.</p>
    </div>

    
    <div className="terrenos-grid" data-animate-stagger="">

      
      <div style={{"background":"rgba(14,26,36,.75)","backdropFilter":"blur(16px)","borderRadius":"22px","overflow":"hidden","border":card200Border,"boxShadow":card200Shadow,"transition":"border-color .3s,box-shadow .3s,transform .3s"}} >
        
        <div style={{"background":"linear-gradient(180deg,#EAF3EC 0%,#DDF0E2 100%)","padding":"0","overflow":"hidden","position":"relative","height":"220px"}}>
          <svg viewBox="0 0 360 230" xmlns="http://www.w3.org/2000/svg" style={{"width":"100%","height":"100%","display":"block"}}>
            
            <rect width="360" height="230" fill="#EAF3EC"></rect>
            
            <rect x="0" y="192" width="360" height="38" fill="#2d6b35"></rect>
            <circle cx="22" cy="212" r="13" fill="#1a4a22" opacity="0.85"></circle>
            <circle cx="22" cy="212" r="8" fill="#2d6b35" opacity="0.7"></circle>
            <circle cx="65" cy="215" r="11" fill="#1a4a22" opacity="0.8"></circle>
            <circle cx="110" cy="210" r="14" fill="#1a4a22" opacity="0.85"></circle>
            <circle cx="110" cy="210" r="9" fill="#3a7a40" opacity="0.6"></circle>
            <circle cx="160" cy="214" r="10" fill="#1a4a22" opacity="0.75"></circle>
            <circle cx="210" cy="211" r="13" fill="#1a4a22" opacity="0.85"></circle>
            <circle cx="255" cy="215" r="11" fill="#1a4a22" opacity="0.8"></circle>
            <circle cx="300" cy="210" r="14" fill="#1a4a22" opacity="0.85"></circle>
            <circle cx="340" cy="213" r="10" fill="#1a4a22" opacity="0.75"></circle>
            
            <rect x="0" y="18" width="68" height="174" fill="#b8ddb8" stroke="#7ab87a" strokeWidth="0.8" strokeDasharray="5,3"></rect>
            <text x="34" y="108" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="8" fill="#4a8a4a" transform="rotate(-90 34 108)">VECINO</text>
            <rect x="282" y="18" width="78" height="174" fill="#b8ddb8" stroke="#7ab87a" strokeWidth="0.8" strokeDasharray="5,3"></rect>
            <text x="321" y="108" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="8" fill="#4a8a4a" transform="rotate(90 321 108)">VECINO</text>
            
            <rect x="72" y="18" width="206" height="174" fill="#C8E6CB" rx="2"></rect>
            <rect x="72" y="18" width="206" height="174" fill="none" stroke="#4ba646" strokeWidth="2.5" strokeDasharray="10,5" rx="2"></rect>
            
            <circle cx="100" cy="44" r="16" fill="#325366" opacity="0.55"></circle>
            <circle cx="100" cy="44" r="10" fill="#3d7a9a" opacity="0.45"></circle>
            <circle cx="254" cy="44" r="16" fill="#325366" opacity="0.55"></circle>
            <circle cx="254" cy="44" r="10" fill="#3d7a9a" opacity="0.45"></circle>
            <circle cx="100" cy="166" r="13" fill="#325366" opacity="0.5"></circle>
            <circle cx="100" cy="166" r="8" fill="#3d7a9a" opacity="0.4"></circle>
            <circle cx="254" cy="166" r="13" fill="#325366" opacity="0.5"></circle>
            <circle cx="254" cy="166" r="8" fill="#3d7a9a" opacity="0.4"></circle>
            
            <text x="175" y="105" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="42" font-weight="900" fill="#325366" opacity="0.18">200</text>
            <text x="175" y="128" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="18" font-weight="700" fill="#325366" opacity="0.18">M²</text>
            
            <line x1="72" y1="9" x2="278" y2="9" stroke="#4ba646" strokeWidth="1.5"></line>
            <line x1="72" y1="5" x2="72" y2="13" stroke="#4ba646" strokeWidth="1.5"></line>
            <line x1="278" y1="5" x2="278" y2="13" stroke="#4ba646" strokeWidth="1.5"></line>
            <rect x="145" y="3" width="60" height="13" fill="#EAF3EC" rx="2"></rect>
            <text x="175" y="12" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="10" font-weight="700" fill="#4ba646">10 metros</text>
            
            <line x1="289" y1="18" x2="289" y2="192" stroke="#4ba646" strokeWidth="1.5"></line>
            <line x1="285" y1="18" x2="293" y2="18" stroke="#4ba646" strokeWidth="1.5"></line>
            <line x1="285" y1="192" x2="293" y2="192" stroke="#4ba646" strokeWidth="1.5"></line>
            <rect x="295" y="96" width="12" height="60" fill="#EAF3EC" rx="2"></rect>
            <text x="300" y="130" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="10" font-weight="700" fill="#4ba646" transform="rotate(90 300 115)">20 metros</text>
            
            <circle cx="336" cy="30" r="14" fill="white" stroke="#4ba646" strokeWidth="1.5" opacity="0.95"></circle>
            <polygon points="336,16 332,28 336,25 340,28" fill="#4ba646"></polygon>
            <text x="336" y="36" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="9" font-weight="800" fill="#4ba646">N</text>
            
            <line x1="72" y1="220" x2="122" y2="220" stroke="#888" strokeWidth="1.5"></line>
            <line x1="72" y1="217" x2="72" y2="223" stroke="#888" strokeWidth="1.5"></line>
            <line x1="122" y1="217" x2="122" y2="223" stroke="#888" strokeWidth="1.5"></line>
            <text x="97" y="215" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="8" fill="#888">5 m</text>
          </svg>
          
          <div style={{"position":"absolute","top":"12px","left":"14px","background":"rgba(50,83,102,.9)","backdropFilter":"blur(8px)","color":"#fff","padding":"5px 12px","borderRadius":"100px","font":"700 11px 'Montserrat',sans-serif","display":"flex","alignItems":"center","gap":"5px"}}>
            <span style={{"width":"6px","height":"6px","background":"#76d845","borderRadius":"50%","display":"inline-block"}}></span> 200 M²
          </div>
        </div>

        
        <div style={{"padding":"28px"}}>
          
          <div style={{"display":"flex","alignItems":"center","gap":"10px","marginBottom":"16px","flexWrap":"wrap"}}>
            <div style={{"flex":"1","minWidth":"0"}}>
              <h3 style={{"font":"800 26px 'Montserrat',sans-serif","color":"#fff","lineHeight":"1","marginBottom":"2px"}}>200 M²</h3>
            </div>
            <div style={{"background":"rgba(0,0,0,.4)","border":"1px solid rgba(118,216,69,.3)","borderRadius":"12px","padding":"8px 14px","textAlign":"right"}}>
              <div style={{"font":"600 10px 'Montserrat',sans-serif","color":"rgba(255,255,255,.45)","textTransform":"uppercase","letterSpacing":".08em","marginBottom":"3px"}}>Pie desde</div>
              <div style={{"display":"flex","alignItems":"center","gap":"7px"}}>
                <span style={{"font":"600 13px 'Roboto',sans-serif","color":"rgba(255,100,100,.8)","textDecoration":"line-through"}}>$5.500.000</span>
                <span style={{"font":"900 20px 'Montserrat',sans-serif","color":"#76d845"}}>$1.500.000</span>
              </div>
              <div style={{"font":"500 10px 'Roboto',sans-serif","color":"rgba(118,216,69,.75)","marginTop":"2px"}}>Ahorra $4.000.000</div>
            </div>
          </div>

          
          <div style={{"background":"rgba(255,255,255,.07)","border":"1px solid rgba(255,255,255,.1)","borderRadius":"12px","padding":"16px","marginBottom":"18px"}}>
            <div style={{"font":"600 11px 'Montserrat',sans-serif","color":"rgba(255,255,255,.4)","textTransform":"uppercase","letterSpacing":".08em","marginBottom":"12px"}}>Detalle financiero</div>
            <div style={{"display":"flex","flexDirection":"column","gap":"9px"}}>
              <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center","paddingBottom":"8px","borderBottom":"1px solid rgba(255,255,255,.08)"}}>
                <span style={{"font":"400 14px 'Roboto',sans-serif","color":"rgba(255,255,255,.55)"}}>Valor total</span>
                <span style={{"font":"700 15px 'Montserrat',sans-serif","color":"#fff"}}>$40.990.000</span>
              </div>
              <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center","paddingBottom":"8px","borderBottom":"1px solid rgba(255,255,255,.08)"}}>
                <span style={{"font":"400 14px 'Roboto',sans-serif","color":"rgba(255,255,255,.55)"}}>% Financiado</span>
                <span style={{"font":"700 15px 'Montserrat',sans-serif","color":"#76d845"}}>96,34%</span>
              </div>
              <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center","paddingBottom":"8px","borderBottom":"1px solid rgba(255,255,255,.08)"}}>
                <span style={{"font":"400 14px 'Roboto',sans-serif","color":"rgba(255,255,255,.55)"}}>Cuota mensual</span>
                <span style={{"font":"700 15px 'Montserrat',sans-serif","color":"#fff"}}>$550.000</span>
              </div>
              <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center","paddingBottom":"8px","borderBottom":"1px solid rgba(255,255,255,.08)"}}>
                <span style={{"font":"400 14px 'Roboto',sans-serif","color":"rgba(255,255,255,.55)"}}>Plazo</span>
                <span style={{"font":"700 15px 'Montserrat',sans-serif","color":"#fff"}}>71 cuotas</span>
              </div>
              <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center"}}>
                <span style={{"font":"400 14px 'Roboto',sans-serif","color":"rgba(255,255,255,.55)"}}>Al contado</span>
                <span style={{"font":"700 15px 'Montserrat',sans-serif","color":"#76d845"}}>$26.000.000</span>
              </div>
            </div>
          </div>

          
          <div style={{"display":"flex","flexWrap":"wrap","gap":"6px","marginBottom":"20px"}}>
            <span style={{"background":"rgba(118,216,69,.15)","color":"#b8f07a","padding":"4px 10px","borderRadius":"100px","font":"600 11px 'Montserrat',sans-serif","border":"1px solid rgba(118,216,69,.25)"}}>✓ Rol propio</span>
            <span style={{"background":"rgba(118,216,69,.15)","color":"#b8f07a","padding":"4px 10px","borderRadius":"100px","font":"600 11px 'Montserrat',sans-serif","border":"1px solid rgba(118,216,69,.25)"}}>✓ Agua cert.</span>
            <span style={{"background":"rgba(118,216,69,.15)","color":"#b8f07a","padding":"4px 10px","borderRadius":"100px","font":"600 11px 'Montserrat',sans-serif","border":"1px solid rgba(118,216,69,.25)"}}>✓ Luz eléctrica</span>
            <span style={{"background":"rgba(118,216,69,.15)","color":"#b8f07a","padding":"4px 10px","borderRadius":"100px","font":"600 11px 'Montserrat',sans-serif","border":"1px solid rgba(118,216,69,.25)"}}>✓ Portón auto.</span>
          </div>

          
          <button onClick={select200} style={{"width":"100%","background":btn200Bg,"color":"#fff","border":"none","padding":"14px","borderRadius":"12px","font":"700 14px 'Montserrat',sans-serif","cursor":"pointer","transition":"background .25s,transform .2s,box-shadow .2s","letterSpacing":".01em","boxShadow":"0 4px 16px rgba(50,83,102,.3)"}}>
            Quiero el terreno de 200 m² →
          </button>
        </div>
      </div>

      
      <div style={{"background":"rgba(14,26,36,.75)","backdropFilter":"blur(16px)","borderRadius":"22px","overflow":"hidden","border":card390Border,"boxShadow":card390Shadow,"transition":"border-color .3s,box-shadow .3s,transform .3s","position":"relative"}} >
        
        <div style={{"position":"absolute","top":"14px","right":"14px","zIndex":"10","background":"linear-gradient(135deg,#76d845,#4ba646)","color":"#fff","padding":"5px 14px","borderRadius":"100px","font":"700 11px 'Montserrat',sans-serif","boxShadow":"0 4px 12px rgba(118,216,69,.5)"}}>
          ✦ MÁS POPULAR
        </div>

        
        <div style={{"background":"linear-gradient(180deg,#FDF6E3 0%,#F8EDCA 100%)","padding":"0","overflow":"hidden","position":"relative","height":"220px"}}>
          <svg viewBox="0 0 360 230" xmlns="http://www.w3.org/2000/svg" style={{"width":"100%","height":"100%","display":"block"}}>
            
            <rect width="360" height="230" fill="#FDF6E3"></rect>
            
            <rect x="0" y="192" width="360" height="38" fill="#2d6b35"></rect>
            <circle cx="20" cy="213" r="12" fill="#1a4a22" opacity="0.85"></circle>
            <circle cx="55" cy="210" r="14" fill="#1a4a22" opacity="0.8"></circle>
            <circle cx="55" cy="210" r="9" fill="#3a7a40" opacity="0.6"></circle>
            <circle cx="100" cy="215" r="11" fill="#1a4a22" opacity="0.75"></circle>
            <circle cx="150" cy="211" r="13" fill="#1a4a22" opacity="0.85"></circle>
            <circle cx="200" cy="214" r="10" fill="#1a4a22" opacity="0.8"></circle>
            <circle cx="245" cy="210" r="14" fill="#1a4a22" opacity="0.85"></circle>
            <circle cx="290" cy="213" r="11" fill="#1a4a22" opacity="0.75"></circle>
            <circle cx="335" cy="211" r="12" fill="#1a4a22" opacity="0.8"></circle>
            
            <rect x="0" y="18" width="44" height="174" fill="#F5EDD5" stroke="#D4C090" strokeWidth="0.8" strokeDasharray="5,3"></rect>
            <text x="22" y="108" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="8" fill="#B8A870" transform="rotate(-90 22 108)">VECINO</text>
            <rect x="308" y="18" width="52" height="174" fill="#F5EDD5" stroke="#D4C090" strokeWidth="0.8" strokeDasharray="5,3"></rect>
            <text x="334" y="108" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="8" fill="#B8A870" transform="rotate(90 334 108)">VECINO</text>
            
            <rect x="48" y="18" width="256" height="174" fill="#F0E0A8" rx="2"></rect>
            <rect x="48" y="18" width="256" height="174" fill="none" stroke="#76d845" strokeWidth="2.5" strokeDasharray="10,5" rx="2"></rect>
            
            <circle cx="80" cy="46" r="17" fill="#325366" opacity="0.45"></circle>
            <circle cx="80" cy="46" r="11" fill="#A88B3A" opacity="0.4"></circle>
            <circle cx="280" cy="46" r="17" fill="#325366" opacity="0.45"></circle>
            <circle cx="280" cy="46" r="11" fill="#A88B3A" opacity="0.4"></circle>
            <circle cx="80" cy="166" r="14" fill="#325366" opacity="0.4"></circle>
            <circle cx="80" cy="166" r="9" fill="#A88B3A" opacity="0.35"></circle>
            <circle cx="280" cy="166" r="14" fill="#325366" opacity="0.4"></circle>
            <circle cx="280" cy="166" r="9" fill="#A88B3A" opacity="0.35"></circle>
            <circle cx="176" cy="46" r="12" fill="#325366" opacity="0.35"></circle>
            <circle cx="176" cy="166" r="12" fill="#325366" opacity="0.35"></circle>
            
            <text x="176" y="105" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="42" font-weight="900" fill="#325366" opacity="0.18">390</text>
            <text x="176" y="128" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="18" font-weight="700" fill="#325366" opacity="0.18">M²</text>
            
            <line x1="48" y1="9" x2="304" y2="9" stroke="#76d845" strokeWidth="1.5"></line>
            <line x1="48" y1="5" x2="48" y2="13" stroke="#76d845" strokeWidth="1.5"></line>
            <line x1="304" y1="5" x2="304" y2="13" stroke="#76d845" strokeWidth="1.5"></line>
            <rect x="145" y="3" width="62" height="13" fill="#FDF6E3" rx="2"></rect>
            <text x="176" y="12" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="10" font-weight="700" fill="#76d845">15 metros</text>
            
            <line x1="315" y1="18" x2="315" y2="192" stroke="#76d845" strokeWidth="1.5"></line>
            <line x1="311" y1="18" x2="319" y2="18" stroke="#76d845" strokeWidth="1.5"></line>
            <line x1="311" y1="192" x2="319" y2="192" stroke="#76d845" strokeWidth="1.5"></line>
            <rect x="321" y="96" width="12" height="60" fill="#FDF6E3" rx="2"></rect>
            <text x="326" y="130" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="10" font-weight="700" fill="#76d845" transform="rotate(90 326 115)">26 metros</text>
            
            <circle cx="336" cy="30" r="14" fill="white" stroke="#76d845" strokeWidth="1.5" opacity="0.95"></circle>
            <polygon points="336,16 332,28 336,25 340,28" fill="#76d845"></polygon>
            <text x="336" y="36" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="9" font-weight="800" fill="#76d845">N</text>
            
            <line x1="48" y1="220" x2="106" y2="220" stroke="#888" strokeWidth="1.5"></line>
            <line x1="48" y1="217" x2="48" y2="223" stroke="#888" strokeWidth="1.5"></line>
            <line x1="106" y1="217" x2="106" y2="223" stroke="#888" strokeWidth="1.5"></line>
            <text x="77" y="215" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="8" fill="#888">5 m</text>
          </svg>
          <div style={{"position":"absolute","top":"12px","left":"14px","background":"rgba(50,83,102,.88)","backdropFilter":"blur(8px)","color":"#fff","padding":"5px 12px","borderRadius":"100px","font":"700 11px 'Montserrat',sans-serif","display":"flex","alignItems":"center","gap":"5px"}}>
            <span style={{"width":"6px","height":"6px","background":"#FDE68A","borderRadius":"50%","display":"inline-block"}}></span> 390 M²
          </div>
        </div>

        
        <div style={{"padding":"28px"}}>
          
          <div style={{"display":"flex","alignItems":"center","gap":"10px","marginBottom":"16px","flexWrap":"wrap"}}>
            <div style={{"flex":"1","minWidth":"0"}}>
              <h3 style={{"font":"800 26px 'Montserrat',sans-serif","color":"#fff","lineHeight":"1","marginBottom":"2px"}}>390 M²</h3>
            </div>
            <div style={{"background":"rgba(0,0,0,.4)","border":"1px solid rgba(118,216,69,.3)","borderRadius":"12px","padding":"8px 14px","textAlign":"right"}}>
              <div style={{"font":"600 10px 'Montserrat',sans-serif","color":"rgba(255,255,255,.45)","textTransform":"uppercase","letterSpacing":".08em","marginBottom":"3px"}}>Pie desde</div>
              <div style={{"display":"flex","alignItems":"center","gap":"7px"}}>
                <span style={{"font":"600 13px 'Roboto',sans-serif","color":"rgba(255,100,100,.8)","textDecoration":"line-through"}}>$7.500.000</span>
                <span style={{"font":"900 20px 'Montserrat',sans-serif","color":"#76d845"}}>$3.000.000</span>
              </div>
              <div style={{"font":"500 10px 'Roboto',sans-serif","color":"rgba(118,216,69,.75)","marginTop":"2px"}}>Ahorra $4.500.000</div>
            </div>
          </div>

          
          <div style={{"background":"rgba(255,255,255,.07)","border":"1px solid rgba(255,255,255,.1)","borderRadius":"12px","padding":"16px","marginBottom":"18px"}}>
            <div style={{"font":"600 11px 'Montserrat',sans-serif","color":"rgba(255,255,255,.4)","textTransform":"uppercase","letterSpacing":".08em","marginBottom":"12px"}}>Detalle financiero</div>
            <div style={{"display":"flex","flexDirection":"column","gap":"9px"}}>
              <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center","paddingBottom":"8px","borderBottom":"1px solid rgba(255,255,255,.08)"}}>
                <span style={{"font":"400 14px 'Roboto',sans-serif","color":"rgba(255,255,255,.55)"}}>Valor total</span>
                <span style={{"font":"700 15px 'Montserrat',sans-serif","color":"#fff"}}>$50.990.000</span>
              </div>
              <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center","paddingBottom":"8px","borderBottom":"1px solid rgba(255,255,255,.08)"}}>
                <span style={{"font":"400 14px 'Roboto',sans-serif","color":"rgba(255,255,255,.55)"}}>% Financiado</span>
                <span style={{"font":"700 15px 'Montserrat',sans-serif","color":"#76d845"}}>94,12%</span>
              </div>
              <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center","paddingBottom":"8px","borderBottom":"1px solid rgba(255,255,255,.08)"}}>
                <span style={{"font":"400 14px 'Roboto',sans-serif","color":"rgba(255,255,255,.55)"}}>Cuota mensual</span>
                <span style={{"font":"700 15px 'Montserrat',sans-serif","color":"#fff"}}>$550.000</span>
              </div>
              <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center","paddingBottom":"8px","borderBottom":"1px solid rgba(255,255,255,.08)"}}>
                <span style={{"font":"400 14px 'Roboto',sans-serif","color":"rgba(255,255,255,.55)"}}>Plazo</span>
                <span style={{"font":"700 15px 'Montserrat',sans-serif","color":"#fff"}}>87 cuotas</span>
              </div>
              <div style={{"display":"flex","justifyContent":"space-between","alignItems":"center"}}>
                <span style={{"font":"400 14px 'Roboto',sans-serif","color":"rgba(255,255,255,.55)"}}>Al contado</span>
                <span style={{"font":"700 15px 'Montserrat',sans-serif","color":"#76d845"}}>$35.000.000</span>
              </div>
            </div>
          </div>

          <div style={{"display":"flex","flexWrap":"wrap","gap":"6px","marginBottom":"20px"}}>
            <span style={{"background":"rgba(118,216,69,.15)","color":"#b8f07a","padding":"4px 10px","borderRadius":"100px","font":"600 11px 'Montserrat',sans-serif","border":"1px solid rgba(118,216,69,.25)"}}>✓ Rol propio</span>
            <span style={{"background":"rgba(118,216,69,.15)","color":"#b8f07a","padding":"4px 10px","borderRadius":"100px","font":"600 11px 'Montserrat',sans-serif","border":"1px solid rgba(118,216,69,.25)"}}>✓ Agua cert.</span>
            <span style={{"background":"rgba(118,216,69,.15)","color":"#b8f07a","padding":"4px 10px","borderRadius":"100px","font":"600 11px 'Montserrat',sans-serif","border":"1px solid rgba(118,216,69,.25)"}}>✓ Luz eléctrica</span>
            <span style={{"background":"rgba(118,216,69,.15)","color":"#b8f07a","padding":"4px 10px","borderRadius":"100px","font":"600 11px 'Montserrat',sans-serif","border":"1px solid rgba(118,216,69,.25)"}}>✓ Portón auto.</span>
          </div>

          <button onClick={select390} style={{"width":"100%","background":btn390Bg,"color":"#fff","border":"none","padding":"14px","borderRadius":"12px","font":"700 14px 'Montserrat',sans-serif","cursor":"pointer","transition":"background .25s,transform .2s,box-shadow .2s","letterSpacing":".01em","boxShadow":"0 4px 16px rgba(50,83,102,.35)"}}>
            Quiero el terreno de 390 m² →
          </button>
        </div>
      </div>
    </div>

    
    <div style={{"textAlign":"center","marginTop":"24px"}} data-animate="">
      <p style={{"font":"400 13px 'Roboto',sans-serif","color":"rgba(255,255,255,.4)"}}>Misma cuota mensual en ambos terrenos · Financiamiento directo Alimin · Sin banco · Sin aval</p>
    </div>
  </div>
</section>


<section id="el-proyecto" style={{"position":"relative","overflow":"hidden","background":"#1a3d1a","padding":"80px 20px"}}>
  
  <div style={{"position":"absolute","inset":"0","background":"url('https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&auto=format&fit=crop&q=80') center/cover no-repeat"}}></div>
  <div style={{"position":"absolute","inset":"0","background":"linear-gradient(160deg,rgba(10,22,12,.82) 0%,rgba(118,216,69,.08) 50%,rgba(50,83,102,.55) 100%)"}}></div>
  
  <div style={{"position":"absolute","top":"-120px","right":"-80px","width":"420px","height":"420px","background":"radial-gradient(circle,rgba(118,216,69,.07) 0%,transparent 70%)","borderRadius":"50%","pointerEvents":"none"}}></div>
  <div style={{"position":"absolute","bottom":"-80px","left":"-60px","width":"320px","height":"320px","background":"radial-gradient(circle,rgba(50,83,102,.15) 0%,transparent 70%)","borderRadius":"50%","pointerEvents":"none"}}></div>

  <div style={{"maxWidth":"1280px","margin":"0 auto","position":"relative","zIndex":"1"}}>
    
    <div style={{"textAlign":"center","marginBottom":"48px"}} data-animate="">
      <div style={{"display":"inline-flex","alignItems":"center","gap":"8px","marginBottom":"14px"}}>
        <span style={{"display":"inline-block","width":"32px","height":"2px","background":"linear-gradient(90deg,#76d845,#4ba646)"}}></span>
        <span style={{"font":"600 12px 'Montserrat',sans-serif","color":"#76d845","textTransform":"uppercase","letterSpacing":".12em"}}>Vista desde dron</span>
        <span style={{"display":"inline-block","width":"32px","height":"2px","background":"linear-gradient(90deg,#4ba646,#76d845)"}}></span>
      </div>
      <h2 style={{"font":"800 clamp(1.8rem,3.5vw,2.8rem)/1.2 'Montserrat',sans-serif","color":"#fff","marginBottom":"12px"}}>Lomas del Mar</h2>
      <p style={{"font":"400 15px/1.7 'Roboto',sans-serif","color":"rgba(255,255,255,.55)","maxWidth":"520px","margin":"0 auto"}}>Recorre el proyecto desde el aire. Toca para activar el sonido y explorar cada detalle del terreno.</p>
    </div>

    
    <div className="drone-grid" data-animate-stagger="">

      
      <div style={{"position":"relative","borderRadius":"20px","overflow":"hidden","background":"#071510","boxShadow":"0 20px 60px rgba(0,0,0,.5)","border":"2px solid rgba(118,216,69,.4)","aspectRatio":"16/9","cursor":"pointer"}} id="vcard-1">
        <video id="drone-1" src="/assets/minipie/video_terreno_1.webm" style={{"position":"absolute","inset":"0","width":"100%","height":"100%","objectFit":"cover","display":"block"}} muted loop playsInline preload="auto"></video>
        
        <div style={{"position":"absolute","inset":"0","background":"linear-gradient(to top,rgba(10,21,32,.75) 0%,transparent 45%)","pointerEvents":"none"}}></div>
        
        <div style={{"position":"absolute","top":"16px","left":"16px","display":"flex","alignItems":"center","gap":"7px","background":"rgba(118,216,69,.2)","border":"1px solid rgba(118,216,69,.4)","backdropFilter":"blur(8px)","borderRadius":"100px","padding":"5px 12px"}}>
          <span style={{"width":"7px","height":"7px","background":"#76d845","borderRadius":"50%","display":"inline-block","animation":"pulseGreen 2s ease-in-out infinite"}}></span>
          <span style={{"font":"700 10px 'Montserrat',sans-serif","color":"#b8f07a","textTransform":"uppercase","letterSpacing":".08em"}}>Vista 1 · Dron</span>
        </div>
        
        <button id="mute-1" style={{"position":"absolute","top":"14px","right":"14px","width":"36px","height":"36px","background":"rgba(0,0,0,.5)","border":"1px solid rgba(255,255,255,.2)","backdropFilter":"blur(8px)","borderRadius":"50%","display":"flex","alignItems":"center","justifyContent":"center","cursor":"pointer","zIndex":"5","color":"#fff","transition":"background .2s"}}>
          <svg id="icon-mute-1" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M23 9l-6 6M17 9l6 6"></path></svg>
        </button>
        
        <div style={{"position":"absolute","bottom":"20px","left":"20px","right":"60px","pointerEvents":"none"}}>
          <div style={{"font":"700 18px 'Montserrat',sans-serif","color":"#fff","marginBottom":"3px"}}>Terreno Lomas del Mar</div>
          <div style={{"font":"400 12px 'Roboto',sans-serif","color":"rgba(255,255,255,.6)"}}>El Tabo · Litoral Central · Vista panorámica</div>
        </div>
      </div>

      
      <div style={{"position":"relative","borderRadius":"20px","overflow":"hidden","background":"#071510","boxShadow":"0 20px 60px rgba(0,0,0,.5)","border":"2px solid rgba(118,216,69,.4)","aspectRatio":"16/9","cursor":"pointer"}} id="vcard-2">
        <video id="drone-2" src="/assets/minipie/video_terreno_2.webm" style={{"position":"absolute","inset":"0","width":"100%","height":"100%","objectFit":"cover","display":"block"}} muted loop playsInline preload="auto"></video>
        
        <div style={{"position":"absolute","inset":"0","background":"linear-gradient(to top,rgba(10,21,32,.75) 0%,transparent 45%)","pointerEvents":"none"}}></div>
        
        <div style={{"position":"absolute","top":"16px","left":"16px","display":"flex","alignItems":"center","gap":"7px","background":"rgba(118,216,69,.2)","border":"1px solid rgba(118,216,69,.4)","backdropFilter":"blur(8px)","borderRadius":"100px","padding":"5px 12px"}}>
          <span style={{"width":"7px","height":"7px","background":"#76d845","borderRadius":"50%","display":"inline-block","animation":"pulseGreen 2s ease-in-out infinite"}}></span>
          <span style={{"font":"700 10px 'Montserrat',sans-serif","color":"#b8f07a","textTransform":"uppercase","letterSpacing":".08em"}}>Vista 2 · Dron</span>
        </div>
        
        <button id="mute-2" style={{"position":"absolute","top":"14px","right":"14px","width":"36px","height":"36px","background":"rgba(0,0,0,.5)","border":"1px solid rgba(255,255,255,.2)","backdropFilter":"blur(8px)","borderRadius":"50%","display":"flex","alignItems":"center","justifyContent":"center","cursor":"pointer","zIndex":"5","color":"#fff","transition":"background .2s"}}>
          <svg id="icon-mute-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M23 9l-6 6M17 9l6 6"></path></svg>
        </button>
        
        <div style={{"position":"absolute","bottom":"20px","left":"20px","right":"60px","pointerEvents":"none"}}>
          <div style={{"font":"700 18px 'Montserrat',sans-serif","color":"#fff","marginBottom":"3px"}}>Acceso y Urbanización</div>
          <div style={{"font":"400 12px 'Roboto',sans-serif","color":"rgba(255,255,255,.6)"}}>El Tabo · Litoral Central · Vista aérea del proyecto</div>
        </div>
      </div>
    </div>

    
    <div style={{"display":"flex","flexWrap":"wrap","justifyContent":"center","gap":"40px","marginTop":"44px","paddingTop":"40px","borderTop":"1px solid rgba(255,255,255,.07)"}} data-animate="">
      <div style={{"textAlign":"center"}}>
        <div style={{"font":"800 clamp(1.4rem,2.5vw,2rem) 'Montserrat',sans-serif","color":"#76d845","marginBottom":"4px"}}>Terrenos 200m² y 390m²</div>
        <div style={{"font":"400 13px 'Roboto',sans-serif","color":"rgba(255,255,255,.45)"}}>Dos opciones de terreno disponibles</div>
      </div>
      <div style={{"width":"1px","background":"rgba(255,255,255,.1)","alignSelf":"stretch"}}></div>
      <div style={{"textAlign":"center"}}>
        <div style={{"font":"800 28px 'Montserrat',sans-serif","color":"#76d845","marginBottom":"4px"}}>El Tabo</div>
        <div style={{"font":"400 13px 'Roboto',sans-serif","color":"rgba(255,255,255,.45)"}}>Litoral Central</div>
      </div>
      <div style={{"width":"1px","background":"rgba(255,255,255,.1)","alignSelf":"stretch"}}></div>
      <div style={{"textAlign":"center"}}>
        <div style={{"font":"800 28px 'Montserrat',sans-serif","color":"#76d845","marginBottom":"4px"}}>Urbanizado</div>
        <div style={{"font":"400 13px 'Roboto',sans-serif","color":"rgba(255,255,255,.45)"}}>Agua · Luz · Portón</div>
      </div>
    </div>
  </div>
</section>


<section style={{"position":"relative","padding":"80px 20px","overflow":"hidden","background":"#0a1520"}}>
  
  <div style={{"position":"absolute","inset":"0","background":"url('https://images.unsplash.com/photo-1476610182048-b716b8518aae?w=1920&auto=format&fit=crop&q=85') center 50%/cover no-repeat"}}></div>
  
  <div style={{"position":"absolute","inset":"0","background":"linear-gradient(160deg,rgba(10,21,32,.82) 0%,rgba(12,26,40,.75) 50%,rgba(10,21,32,.85) 100%)"}}></div>
  
  <div style={{"position":"absolute","top":"-80px","right":"-60px","width":"360px","height":"360px","background":"radial-gradient(circle,rgba(118,216,69,.12) 0%,transparent 70%)","borderRadius":"50%","pointerEvents":"none"}}></div>
  <div style={{"maxWidth":"1280px","margin":"0 auto","position":"relative","zIndex":"1"}}>
    
    <div style={{"textAlign":"center","marginBottom":"52px"}} data-animate="">
      <div style={{"display":"inline-flex","alignItems":"center","gap":"8px","marginBottom":"14px"}}>
        <span style={{"display":"inline-block","width":"32px","height":"2px","background":"linear-gradient(90deg,#76d845,#4ba646)"}}></span>
        <span style={{"font":"600 12px 'Montserrat',sans-serif","color":"#76d845","textTransform":"uppercase","letterSpacing":".12em"}}>Zona de alta plusvalía</span>
        <span style={{"display":"inline-block","width":"32px","height":"2px","background":"linear-gradient(90deg,#4ba646,#76d845)"}}></span>
      </div>
      <h2 style={{"font":"800 clamp(1.8rem,3.5vw,2.6rem)/1.2 'Montserrat',sans-serif","color":"#fff","marginBottom":"12px"}}>Todo lo que te espera<br />a minutos de tu terreno</h2>
      <p style={{"font":"400 15px/1.7 'Roboto',sans-serif","color":"rgba(255,255,255,.5)","maxWidth":"520px","margin":"0 auto"}}>Lomas del Mar está rodeado de los destinos más icónicos del Litoral Central de Chile.</p>
    </div>

    
    <div style={{"display":"grid","gridTemplateColumns":"repeat(auto-fit,minmax(260px,1fr))","gap":"16px"}} data-animate-stagger="">

      
      <div style={{"position":"relative","borderRadius":"20px","overflow":"hidden","aspectRatio":"3/4","cursor":"default","transition":"transform .35s cubic-bezier(.16,1,.3,1),box-shadow .35s","border":"2px solid rgba(118,216,69,.4)"}} >
        <img src="/assets/minipie/pasted-1782761706285-0.png" alt="Playa El Tabo" style={{"position":"absolute","inset":"0","width":"100%","height":"100%","objectFit":"cover","display":"block","transition":"transform .6s ease"}}  />
        
        <div style={{"position":"absolute","inset":"0","background":"linear-gradient(to top,rgba(10,18,28,.92) 0%,rgba(10,18,28,.3) 45%,transparent 100%)"}}></div>
        
        <div style={{"position":"absolute","top":"14px","left":"14px","background":"rgba(118,216,69,.9)","backdropFilter":"blur(8px)","borderRadius":"100px","padding":"5px 12px","font":"700 11px 'Montserrat',sans-serif","color":"#fff"}}>📍 5 min</div>
        
        <div style={{"position":"absolute","bottom":"0","left":"0","right":"0","padding":"24px 20px"}}>
          <div style={{"font":"700 10px 'Montserrat',sans-serif","color":"rgba(255,255,255,.55)","textTransform":"uppercase","letterSpacing":".1em","marginBottom":"5px"}}>Playa</div>
          <div style={{"font":"800 22px 'Montserrat',sans-serif","color":"#fff","lineHeight":"1.1","marginBottom":"6px"}}>El Tabo</div>
          <div style={{"font":"400 13px 'Roboto',sans-serif","color":"rgba(255,255,255,.6)","lineHeight":"1.5"}}>Playa icónica del litoral con arena extensa y aguas del Pacífico</div>
        </div>
      </div>

      
      <div style={{"position":"relative","borderRadius":"20px","overflow":"hidden","aspectRatio":"3/4","cursor":"default","transition":"transform .35s cubic-bezier(.16,1,.3,1),box-shadow .35s","border":"2px solid rgba(118,216,69,.4)"}} >
        <img src="/assets/minipie/pasted-1782761902415-0.png" alt="Quebrada de Córdova" style={{"position":"absolute","inset":"0","width":"100%","height":"100%","objectFit":"cover","display":"block","transition":"transform .6s ease"}}  />
        <div style={{"position":"absolute","inset":"0","background":"linear-gradient(to top,rgba(10,18,28,.92) 0%,rgba(10,18,28,.3) 45%,transparent 100%)"}}></div>
        <div style={{"position":"absolute","top":"14px","left":"14px","background":"rgba(118,216,69,.9)","backdropFilter":"blur(8px)","borderRadius":"100px","padding":"5px 12px","font":"700 11px 'Montserrat',sans-serif","color":"#fff"}}>📍 8 min</div>
        <div style={{"position":"absolute","bottom":"0","left":"0","right":"0","padding":"24px 20px"}}>
          <div style={{"font":"700 10px 'Montserrat',sans-serif","color":"rgba(255,255,255,.55)","textTransform":"uppercase","letterSpacing":".1em","marginBottom":"5px"}}>Naturaleza</div>
          <div style={{"font":"800 22px 'Montserrat',sans-serif","color":"#fff","lineHeight":"1.1","marginBottom":"6px"}}>Quebrada de Córdova</div>
          <div style={{"font":"400 13px 'Roboto',sans-serif","color":"rgba(255,255,255,.6)","lineHeight":"1.5"}}>Paisaje natural único donde el río se une al océano Pacífico</div>
        </div>
      </div>

      
      <div style={{"position":"relative","borderRadius":"20px","overflow":"hidden","aspectRatio":"3/4","cursor":"default","transition":"transform .35s cubic-bezier(.16,1,.3,1),box-shadow .35s","border":"2px solid rgba(118,216,69,.4)"}} >
        <img src="/assets/minipie/pasted-1782761935471-0.png" alt="Isla Negra — Casa de Pablo Neruda" style={{"position":"absolute","inset":"0","width":"100%","height":"100%","objectFit":"cover","display":"block","transition":"transform .6s ease"}}  />
        <div style={{"position":"absolute","inset":"0","background":"linear-gradient(to top,rgba(10,18,28,.92) 0%,rgba(10,18,28,.3) 45%,transparent 100%)"}}></div>
        <div style={{"position":"absolute","top":"14px","left":"14px","background":"rgba(118,216,69,.9)","backdropFilter":"blur(8px)","borderRadius":"100px","padding":"5px 12px","font":"700 11px 'Montserrat',sans-serif","color":"#fff"}}>📍 12 min</div>
        <div style={{"position":"absolute","bottom":"0","left":"0","right":"0","padding":"24px 20px"}}>
          <div style={{"font":"700 10px 'Montserrat',sans-serif","color":"rgba(255,255,255,.55)","textTransform":"uppercase","letterSpacing":".1em","marginBottom":"5px"}}>Cultura · Patrimonio</div>
          <div style={{"font":"800 22px 'Montserrat',sans-serif","color":"#fff","lineHeight":"1.1","marginBottom":"6px"}}>Isla Negra</div>
          <div style={{"font":"400 13px 'Roboto',sans-serif","color":"rgba(255,255,255,.6)","lineHeight":"1.5"}}>La casa de Pablo Neruda, Patrimonio Mundial de la UNESCO</div>
        </div>
      </div>

      
      <div style={{"position":"relative","borderRadius":"20px","overflow":"hidden","aspectRatio":"3/4","cursor":"default","transition":"transform .35s cubic-bezier(.16,1,.3,1),box-shadow .35s","border":"2px solid rgba(118,216,69,.4)"}} >
        <img src="/assets/minipie/pasted-1782761947129-0.png" alt="Algarrobo — La piscina más grande del mundo" style={{"position":"absolute","inset":"0","width":"100%","height":"100%","objectFit":"cover","display":"block","transition":"transform .6s ease"}}  />
        <div style={{"position":"absolute","inset":"0","background":"linear-gradient(to top,rgba(10,18,28,.92) 0%,rgba(10,18,28,.3) 45%,transparent 100%)"}}></div>
        <div style={{"position":"absolute","top":"14px","left":"14px","background":"rgba(118,216,69,.9)","backdropFilter":"blur(8px)","borderRadius":"100px","padding":"5px 12px","font":"700 11px 'Montserrat',sans-serif","color":"#fff"}}>📍 20 min</div>
        <div style={{"position":"absolute","bottom":"0","left":"0","right":"0","padding":"24px 20px"}}>
          <div style={{"font":"700 10px 'Montserrat',sans-serif","color":"rgba(255,255,255,.55)","textTransform":"uppercase","letterSpacing":".1em","marginBottom":"5px"}}>Turismo · Recreación</div>
          <div style={{"font":"800 22px 'Montserrat',sans-serif","color":"#fff","lineHeight":"1.1","marginBottom":"6px"}}>Algarrobo</div>
          <div style={{"font":"400 13px 'Roboto',sans-serif","color":"rgba(255,255,255,.6)","lineHeight":"1.5"}}>La piscina más grande del mundo · Playas exclusivas del Litoral</div>
        </div>
      </div>

    </div>

    
    <div style={{"textAlign":"center","marginTop":"52px"}} data-animate="">
      <button onClick={toForm} style={{"background":"linear-gradient(135deg,#76d845,#4ba646)","color":"#fff","border":"none","padding":"16px 40px","borderRadius":"14px","font":"700 16px 'Montserrat',sans-serif","cursor":"pointer","boxShadow":"0 8px 32px rgba(118,216,69,.4)","letterSpacing":".02em"}}>
        Quiero mi terreno aquí →
      </button>
      <p style={{"font":"400 12px 'Roboto',sans-serif","color":"rgba(255,255,255,.3)","marginTop":"12px"}}>Todo esto a minutos de Lomas del Mar</p>
    </div>
  </div>
</section>


<section id="testimonios" style={{"position":"relative","overflow":"hidden","background":"#f5f9f0","padding":"72px 0 0"}}>
  
  <div style={{"position":"absolute","top":"-100px","left":"-80px","width":"380px","height":"380px","background":"radial-gradient(circle,rgba(118,216,69,.1) 0%,transparent 70%)","borderRadius":"50%","pointerEvents":"none"}}></div>
  <div style={{"position":"absolute","top":"200px","right":"-100px","width":"340px","height":"340px","background":"radial-gradient(circle,rgba(50,83,102,.08) 0%,transparent 70%)","borderRadius":"50%","pointerEvents":"none"}}></div>

  <div style={{"maxWidth":"1160px","margin":"0 auto","padding":"0 20px","position":"relative","zIndex":"1"}}>
    
    <div style={{"textAlign":"center","marginBottom":"40px"}} data-animate="">
      <div style={{"display":"inline-flex","alignItems":"center","gap":"8px","marginBottom":"14px"}}>
        <span style={{"display":"inline-block","width":"32px","height":"2px","background":"linear-gradient(90deg,#76d845,#4ba646)"}}></span>
        <span style={{"font":"600 12px 'Montserrat',sans-serif","color":"#4ba646","textTransform":"uppercase","letterSpacing":".12em"}}>Clientes felices</span>
        <span style={{"display":"inline-block","width":"32px","height":"2px","background":"linear-gradient(90deg,#4ba646,#76d845)"}}></span>
      </div>
      <h2 style={{"font":"800 clamp(1.8rem,3.5vw,2.6rem)/1.2 'Montserrat',sans-serif","color":"#1a2b3d","marginBottom":"18px"}}>Lo que dicen nuestros clientes</h2>
      
      <div style={{"display":"inline-flex","alignItems":"center","gap":"14px","background":"#fff","border":"1px solid #e3ebe0","borderRadius":"100px","padding":"10px 24px","boxShadow":"0 6px 20px rgba(50,83,102,.08)"}}>
        <svg viewBox="0 0 24 24" width="24" height="24" style={{"flexShrink":"0"}}><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path></svg>
        <div style={{"textAlign":"left","borderLeft":"1px solid #eee","paddingLeft":"14px"}}>
          <div style={{"font":"600 14px 'Montserrat',sans-serif","color":"#1a2b3d"}}>Reseñas reales de Google</div>
          <div style={{"font":"400 11px 'Roboto',sans-serif","color":"#94A3B8"}}>Lo que dicen nuestros clientes</div>
        </div>
      </div>
    </div>

    
    <div className="testimonio-featured" style={{"display":"grid","gridTemplateColumns":"1fr 1fr","gap":"24px","marginBottom":"24px"}} data-animate="">

      
      <div style={{"position":"relative","borderRadius":"22px","overflow":"hidden","background":"#0e1a24","boxShadow":"0 16px 48px rgba(14,26,36,.28)","minHeight":"420px"}}>
        <video id="testimonial-video" src="/assets/minipie/testimonio-video.mp4" playsInline preload="metadata" style={{"width":"100%","height":"100%","objectFit":"cover","display":"block","position":"absolute","inset":"0"}}></video>
        
        <div id="video-overlay" onClick={playTestimonial} style={{"position":"absolute","inset":"0","zIndex":"2","cursor":"pointer","display":"flex","flexDirection":"column","justifyContent":"flex-end","background":"linear-gradient(to top,rgba(14,26,36,.85) 0%,rgba(14,26,36,.1) 45%,rgba(14,26,36,.35) 100%)","transition":"opacity .4s ease"}}>
          
          <div style={{"position":"absolute","top":"50%","left":"50%","transform":"translate(-50%,-50%)","width":"72px","height":"72px","background":"rgba(118,216,69,.95)","borderRadius":"50%","display":"flex","alignItems":"center","justifyContent":"center","boxShadow":"0 8px 28px rgba(118,216,69,.5)"}}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff" style={{"marginLeft":"4px"}}><path d="M8 5v14l11-7z"></path></svg>
          </div>
          
          <div style={{"position":"relative","padding":"24px","zIndex":"1"}}>
            <div style={{"display":"inline-flex","alignItems":"center","gap":"6px","background":"rgba(118,216,69,.2)","border":"1px solid rgba(118,216,69,.4)","borderRadius":"100px","padding":"4px 12px","marginBottom":"10px"}}>
              <span style={{"width":"7px","height":"7px","background":"#76d845","borderRadius":"50%","display":"inline-block"}}></span>
              <span style={{"font":"700 10px 'Montserrat',sans-serif","color":"#b8f07a","textTransform":"uppercase","letterSpacing":".08em"}}>Video testimonio</span>
            </div>
            <div style={{"font":"800 19px 'Montserrat',sans-serif","color":"#fff","lineHeight":"1.2","marginBottom":"4px"}}>Un cliente de Arena y Sol</div>
            <div style={{"font":"400 13px 'Roboto',sans-serif","color":"rgba(255,255,255,.7)"}}>Su experiencia invirtiendo con Alimin · Toca para reproducir</div>
          </div>
        </div>
      </div>

      
      <div style={{"background":"linear-gradient(155deg,#325366 0%,#1a2b3d 100%)","borderRadius":"22px","padding":"36px","display":"flex","flexDirection":"column","justifyContent":"space-between","boxShadow":"0 16px 48px rgba(50,83,102,.25)","position":"relative","overflow":"hidden","border":"2px solid rgba(118,216,69,.4)"}}>
        <div style={{"position":"absolute","top":"24px","right":"28px","font":"900 90px 'Montserrat',serif","color":"rgba(118,216,69,.14)","lineHeight":"1"}}>"</div>
        <div style={{"position":"relative","zIndex":"1"}}>
          <div style={{"display":"flex","alignItems":"center","gap":"10px","marginBottom":"18px"}}>
            <span style={{"color":"#FBBC04","fontSize":"15px","letterSpacing":"1px"}}>★★★★★</span>
            <span style={{"font":"400 12px 'Roboto',sans-serif","color":"rgba(255,255,255,.5)"}}>Hace 50 semanas</span>
          </div>
          <p style={{"font":"400 17px/1.7 'Roboto',sans-serif","color":"#fff","marginBottom":"24px"}}>"Excelente lugar, amo mi terreno aquí en El Tabo. Desde que invertí con ustedes mi vida mejoró radicalmente. Me costó mucho confiar pero me atreví a dar el primer paso y ahora estoy feliz. ¡Muchas gracias por esta oportunidad!"</p>
        </div>
        <div style={{"display":"flex","alignItems":"center","gap":"12px","position":"relative","zIndex":"1"}}>
          <div style={{"width":"46px","height":"46px","borderRadius":"50%","background":"linear-gradient(135deg,#6ac28f,#4ba646)","display":"flex","alignItems":"center","justifyContent":"center","font":"700 16px 'Montserrat',sans-serif","color":"#fff","flexShrink":"0"}}>SU</div>
          <div style={{"flex":"1"}}>
            <div style={{"display":"flex","alignItems":"center","gap":"6px"}}>
              <span style={{"font":"700 15px 'Montserrat',sans-serif","color":"#fff"}}>Sebastián Ullbrish</span>
              <svg viewBox="0 0 24 24" width="15" height="15" style={{"flexShrink":"0"}}><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path></svg>
            </div>
            <div style={{"font":"400 12px 'Roboto',sans-serif","color":"rgba(255,255,255,.5)"}}>2 opiniones · 18 fotos</div>
          </div>
        </div>
      </div>
    </div>

    
    <div className="testimonials-grid" style={{"paddingBottom":"64px"}} data-animate-stagger="">

      
      <div className="gr-card" style={{"background":"#fff","borderRadius":"18px","padding":"26px","boxShadow":"0 4px 20px rgba(50,83,102,.07)","border":"1px solid #eef3ec"}}>
        <div style={{"display":"flex","alignItems":"center","gap":"12px","marginBottom":"14px"}}>
          <div style={{"width":"44px","height":"44px","borderRadius":"50%","background":"linear-gradient(135deg,#4ba646,#325366)","display":"flex","alignItems":"center","justifyContent":"center","font":"700 15px 'Montserrat',sans-serif","color":"#fff","flexShrink":"0"}}>LB</div>
          <div style={{"flex":"1","minWidth":"0"}}>
            <div style={{"display":"flex","alignItems":"center","gap":"5px"}}><span style={{"font":"600 14px 'Montserrat',sans-serif","color":"#1a2b3d"}}>Liz Beth</span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></div>
            <div style={{"font":"400 11px 'Roboto',sans-serif","color":"#94A3B8"}}>Local Guide · 14 opiniones</div>
          </div>
          <svg viewBox="0 0 24 24" width="20" height="20" style={{"flexShrink":"0"}}><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path></svg>
        </div>
        <div style={{"display":"flex","alignItems":"center","gap":"8px","marginBottom":"10px"}}><span style={{"color":"#FBBC04","fontSize":"15px","letterSpacing":"1px"}}>★★★★★</span><span style={{"font":"400 12px 'Roboto',sans-serif","color":"#94A3B8"}}>Hace 16 semanas</span></div>
        <p style={{"font":"400 14px/1.6 'Roboto',sans-serif","color":"#4B5563"}}>Excelente experiencia. Trámite rápido, ágil y muy confiable. Todo fue claro y bien gestionado 😊</p>
      </div>

      
      <div className="gr-card" style={{"background":"#fff","borderRadius":"18px","padding":"26px","boxShadow":"0 4px 20px rgba(50,83,102,.07)","border":"1px solid #eef3ec"}}>
        <div style={{"display":"flex","alignItems":"center","gap":"12px","marginBottom":"14px"}}>
          <div style={{"width":"44px","height":"44px","borderRadius":"50%","background":"linear-gradient(135deg,#76d845,#4ba646)","display":"flex","alignItems":"center","justifyContent":"center","font":"700 15px 'Montserrat',sans-serif","color":"#fff","flexShrink":"0"}}>RC</div>
          <div style={{"flex":"1","minWidth":"0"}}>
            <div style={{"display":"flex","alignItems":"center","gap":"5px"}}><span style={{"font":"600 14px 'Montserrat',sans-serif","color":"#1a2b3d"}}>Romina Cabrera</span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></div>
            <div style={{"font":"400 11px 'Roboto',sans-serif","color":"#94A3B8"}}>2 opiniones · 11 fotos</div>
          </div>
          <svg viewBox="0 0 24 24" width="20" height="20" style={{"flexShrink":"0"}}><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path></svg>
        </div>
        <div style={{"display":"flex","alignItems":"center","gap":"8px","marginBottom":"10px"}}><span style={{"color":"#FBBC04","fontSize":"15px","letterSpacing":"1px"}}>★★★★★</span><span style={{"font":"400 12px 'Roboto',sans-serif","color":"#94A3B8"}}>Hace 16 semanas</span></div>
        <p style={{"font":"400 14px/1.6 'Roboto',sans-serif","color":"#4B5563"}}>Excelente experiencia, la gestión fue rápida y eficaz, me tenían al tanto de todo. ¡Feliz con mi inversión!</p>
      </div>

      
      <div className="gr-card" style={{"background":"#fff","borderRadius":"18px","padding":"26px","boxShadow":"0 4px 20px rgba(50,83,102,.07)","border":"1px solid #eef3ec"}}>
        <div style={{"display":"flex","alignItems":"center","gap":"12px","marginBottom":"14px"}}>
          <div style={{"width":"44px","height":"44px","borderRadius":"50%","background":"linear-gradient(135deg,#325366,#6ac28f)","display":"flex","alignItems":"center","justifyContent":"center","font":"700 15px 'Montserrat',sans-serif","color":"#fff","flexShrink":"0"}}>AP</div>
          <div style={{"flex":"1","minWidth":"0"}}>
            <div style={{"display":"flex","alignItems":"center","gap":"5px"}}><span style={{"font":"600 14px 'Montserrat',sans-serif","color":"#1a2b3d"}}>Álvaro Pinto</span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></div>
            <div style={{"font":"400 11px 'Roboto',sans-serif","color":"#94A3B8"}}>2 opiniones</div>
          </div>
          <svg viewBox="0 0 24 24" width="20" height="20" style={{"flexShrink":"0"}}><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path></svg>
        </div>
        <div style={{"display":"flex","alignItems":"center","gap":"8px","marginBottom":"10px"}}><span style={{"color":"#FBBC04","fontSize":"15px","letterSpacing":"1px"}}>★★★★★</span><span style={{"font":"400 12px 'Roboto',sans-serif","color":"#94A3B8"}}>Hace 16 semanas</span></div>
        <p style={{"font":"400 14px/1.6 'Roboto',sans-serif","color":"#4B5563"}}>Muy responsables, todo genial. La gestión fue fantástica y el terreno está en perfectas condiciones. ¡Los recomiendo!</p>
      </div>

      
      <div className="gr-card" style={{"background":"#fff","borderRadius":"18px","padding":"26px","boxShadow":"0 4px 20px rgba(50,83,102,.07)","border":"1px solid #eef3ec"}}>
        <div style={{"display":"flex","alignItems":"center","gap":"12px","marginBottom":"14px"}}>
          <div style={{"width":"44px","height":"44px","borderRadius":"50%","background":"linear-gradient(135deg,#4ba646,#76d845)","display":"flex","alignItems":"center","justifyContent":"center","font":"700 15px 'Montserrat',sans-serif","color":"#fff","flexShrink":"0"}}>RB</div>
          <div style={{"flex":"1","minWidth":"0"}}>
            <div style={{"display":"flex","alignItems":"center","gap":"5px"}}><span style={{"font":"600 14px 'Montserrat',sans-serif","color":"#1a2b3d"}}>Reina Barrios</span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></div>
            <div style={{"font":"400 11px 'Roboto',sans-serif","color":"#94A3B8"}}>Local Guide · 16 opiniones</div>
          </div>
          <svg viewBox="0 0 24 24" width="20" height="20" style={{"flexShrink":"0"}}><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path></svg>
        </div>
        <div style={{"display":"flex","alignItems":"center","gap":"8px","marginBottom":"10px"}}><span style={{"color":"#FBBC04","fontSize":"15px","letterSpacing":"1px"}}>★★★★★</span><span style={{"font":"400 12px 'Roboto',sans-serif","color":"#94A3B8"}}>Hace 3 meses</span></div>
        <p style={{"font":"400 14px/1.6 'Roboto',sans-serif","color":"#4B5563"}}>Muy buenos los proyectos, cerca al centro del Tabo, opciones de pago y fácil de llegar.</p>
      </div>
    </div>
  </div>

  
  <div style={{"position":"relative","overflow":"hidden","background":"#edf7e0","padding":"48px 0 56px"}}>
    
    <div style={{"position":"absolute","inset":"0","background":"linear-gradient(160deg,#edf7e0 0%,#f2fce8 50%,#e4f5d4 100%)"}}></div>
    <div style={{"position":"relative","zIndex":"1","textAlign":"center","marginBottom":"28px","padding":"0 20px"}}>
      <h3 style={{"font":"800 clamp(1.4rem,3vw,2rem) 'Montserrat',sans-serif","color":"#1a2b1a"}}>Nuestros nuevos clientes en Lomas del Mar</h3>
    </div>
    <div id="client-marquee" style={{"position":"relative","zIndex":"1","overflow":"hidden","width":"100%","WebkitMaskImage":"linear-gradient(to right,transparent,#000 6%,#000 94%,transparent)","maskImage":"linear-gradient(to right,transparent,#000 6%,#000 94%,transparent)"}}>
      <div className="marquee-track" style={{"display":"flex","gap":"18px","width":"max-content","animation":"marqueeScroll 38s linear infinite","padding":"0 9px"}}>
        <img className="client-shot" src="/assets/minipie/testimonio-1.webp" alt="Cliente Alimin" style={{"width":"236px","height":"295px","objectFit":"cover","borderRadius":"16px","flexShrink":"0","boxShadow":"0 8px 28px rgba(0,0,0,.35)"}} />
        <img className="client-shot" src="/assets/minipie/testimonio-2.webp" alt="Cliente Alimin" style={{"width":"236px","height":"295px","objectFit":"cover","borderRadius":"16px","flexShrink":"0","boxShadow":"0 8px 28px rgba(0,0,0,.35)"}} />
        <img className="client-shot" src="/assets/minipie/testimonio-3.webp" alt="Cliente Alimin" style={{"width":"236px","height":"295px","objectFit":"cover","borderRadius":"16px","flexShrink":"0","boxShadow":"0 8px 28px rgba(0,0,0,.35)"}} />
        <img className="client-shot" src="/assets/minipie/testimonio-4.webp" alt="Cliente Alimin" style={{"width":"236px","height":"295px","objectFit":"cover","borderRadius":"16px","flexShrink":"0","boxShadow":"0 8px 28px rgba(0,0,0,.35)"}} />
        <img className="client-shot" src="/assets/minipie/testimonio-5.webp" alt="Cliente Alimin" style={{"width":"236px","height":"295px","objectFit":"cover","borderRadius":"16px","flexShrink":"0","boxShadow":"0 8px 28px rgba(0,0,0,.35)"}} />
        <img className="client-shot" src="/assets/minipie/testimonio-6.webp" alt="Cliente Alimin" style={{"width":"236px","height":"295px","objectFit":"cover","borderRadius":"16px","flexShrink":"0","boxShadow":"0 8px 28px rgba(0,0,0,.35)"}} />
        <img className="client-shot" src="/assets/minipie/testimonio-1.webp" alt="Cliente Alimin" style={{"width":"236px","height":"295px","objectFit":"cover","borderRadius":"16px","flexShrink":"0","boxShadow":"0 8px 28px rgba(0,0,0,.35)"}} />
        <img className="client-shot" src="/assets/minipie/testimonio-2.webp" alt="Cliente Alimin" style={{"width":"236px","height":"295px","objectFit":"cover","borderRadius":"16px","flexShrink":"0","boxShadow":"0 8px 28px rgba(0,0,0,.35)"}} />
        <img className="client-shot" src="/assets/minipie/testimonio-3.webp" alt="Cliente Alimin" style={{"width":"236px","height":"295px","objectFit":"cover","borderRadius":"16px","flexShrink":"0","boxShadow":"0 8px 28px rgba(0,0,0,.35)"}} />
        <img className="client-shot" src="/assets/minipie/testimonio-4.webp" alt="Cliente Alimin" style={{"width":"236px","height":"295px","objectFit":"cover","borderRadius":"16px","flexShrink":"0","boxShadow":"0 8px 28px rgba(0,0,0,.35)"}} />
        <img className="client-shot" src="/assets/minipie/testimonio-5.webp" alt="Cliente Alimin" style={{"width":"236px","height":"295px","objectFit":"cover","borderRadius":"16px","flexShrink":"0","boxShadow":"0 8px 28px rgba(0,0,0,.35)"}} />
        <img className="client-shot" src="/assets/minipie/testimonio-6.webp" alt="Cliente Alimin" style={{"width":"236px","height":"295px","objectFit":"cover","borderRadius":"16px","flexShrink":"0","boxShadow":"0 8px 28px rgba(0,0,0,.35)"}} />
      </div>
    </div>
  </div>
</section>


<section id="registro" style={{"position":"relative","background":"#0a1520","padding":"80px 20px","overflow":"hidden"}}>
  
  <div style={{"position":"absolute","inset":"0","background":"url('https://images.unsplash.com/photo-1439405326854-014607f694d7?w=1600&auto=format&fit=crop&q=80') center/cover no-repeat"}}></div>
  <div style={{"position":"absolute","inset":"0","background":"rgba(10,21,32,.60)"}}></div>
  

  <div style={{"maxWidth":"1280px","margin":"0 auto","position":"relative","zIndex":"1"}}>
    
    <div style={{"textAlign":"center","marginBottom":"44px"}}>
      <div style={{"display":"inline-flex","alignItems":"center","gap":"10px","background":"rgba(118,216,69,.15)","border":"1px solid rgba(118,216,69,.3)","borderRadius":"100px","padding":"6px 18px","marginBottom":"18px"}}>
        <span style={{"width":"8px","height":"8px","background":"#76d845","borderRadius":"50%","animation":"pulseGreen 2s ease-in-out infinite","display":"inline-block"}}></span>
        <span style={{"font":"600 12px 'Montserrat',sans-serif","color":"#4ba646","letterSpacing":".08em","textTransform":"uppercase"}}>CUPOS LIMITADOS · Regístrate ahora</span>
      </div>
      <h2 style={{"font":"800 clamp(1.8rem,4vw,2.8rem)/1.1 'Montserrat',sans-serif","color":"#fff","marginBottom":"14px"}}>Asegura tu Cupo Mini Pie</h2>
      <p style={{"font":"400 15px/1.6 'Roboto',sans-serif","color":"rgba(255,255,255,.6)","maxWidth":"480px","margin":"0 auto"}}>Completa el formulario y un asesor te contactará en menos de 24 horas para guiarte en el proceso.</p>
    </div>

    
    <div className="form-2col">

      
      <div>
        {formVisible && (
      <div style={{"background":"rgba(14,26,36,.82)","backdropFilter":"blur(24px)","border":"1px solid rgba(118,216,69,.2)","borderRadius":"24px","padding":"40px","boxShadow":"0 24px 64px rgba(0,0,0,.4)"}}>
        
        {terrenoSelected && (
          <div style={{"display":"flex","alignItems":"center","gap":"8px","background":"#eaf7d8","border":"1.5px solid #4ba646","borderRadius":"10px","padding":"10px 16px","marginBottom":"24px"}}>
            <span style={{"fontSize":"16px"}}>✅</span>
            <span style={{"font":"600 13px 'Montserrat',sans-serif","color":"#325366"}}>Terreno seleccionado: {vTerreno}</span>
            <button onClick={clearTerreno} style={{"marginLeft":"auto","background":"none","border":"none","color":"#6B7280","font":"400 12px 'Roboto',sans-serif","cursor":"pointer"}}>Cambiar</button>
          </div>
        )}

        <form onSubmit={onSubmit}>
          
          <div className="form-fields">
            
            <div style={{"display":"flex","flexDirection":"column","gap":"6px"}}>
              <label style={{"font":"500 13px 'Montserrat',sans-serif","color":"rgba(255,255,255,.85)"}}>Nombre completo *</label>
              <input type="text" value={vNombre} onInput={onNombre} placeholder="Tu nombre y apellido" required style={{"border":"1.5px solid #E5E7EB","borderRadius":"10px","padding":"12px 14px","color":"#1a2b3d","background":"#fff","width":"100%"}} />
            </div>
            
            <div style={{"display":"flex","flexDirection":"column","gap":"6px"}}>
              <label style={{"font":"500 13px 'Montserrat',sans-serif","color":"rgba(255,255,255,.85)"}}>Correo electrónico *</label>
              <input type="email" value={vEmail} onInput={onEmail} placeholder="ejemplo@correo.com" required style={{"border":"1.5px solid #E5E7EB","borderRadius":"10px","padding":"12px 14px","color":"#1a2b3d","background":"#fff","width":"100%"}} />
            </div>
            
            <div style={{"display":"flex","flexDirection":"column","gap":"6px"}}>
              <label style={{"font":"500 13px 'Montserrat',sans-serif","color":"rgba(255,255,255,.85)"}}>Teléfono / WhatsApp *</label>
              <input type="tel" value={vTelefono} onInput={onTelefono} placeholder="+56 9 1234 5678" required style={{"border":"1.5px solid #E5E7EB","borderRadius":"10px","padding":"12px 14px","color":"#1a2b3d","background":"#fff","width":"100%"}} />
            </div>
            
            <div style={{"display":"flex","flexDirection":"column","gap":"6px"}}>
              <label style={{"font":"500 13px 'Montserrat',sans-serif","color":"rgba(255,255,255,.85)"}}>Región *</label>
              <select value={vRegion} onChange={onRegion} required style={{"border":"1.5px solid #E5E7EB","borderRadius":"10px","padding":"12px 14px","color":"#1a2b3d","background":"#fff","width":"100%","appearance":"none","WebkitAppearance":"none"}}>
                <option value="">Selecciona tu región</option>
                <option value="Arica y Parinacota">Arica y Parinacota</option>
                <option value="Tarapacá">Tarapacá</option>
                <option value="Antofagasta">Antofagasta</option>
                <option value="Atacama">Atacama</option>
                <option value="Coquimbo">Coquimbo</option>
                <option value="Valparaíso">Valparaíso</option>
                <option value="Metropolitana">Región Metropolitana</option>
                <option value="O'Higgins">Lib. Gral. B. O'Higgins</option>
                <option value="Maule">Maule</option>
                <option value="Ñuble">Ñuble</option>
                <option value="Biobío">Biobío</option>
                <option value="Araucanía">La Araucanía</option>
                <option value="Los Ríos">Los Ríos</option>
                <option value="Los Lagos">Los Lagos</option>
                <option value="Aysén">Aysén</option>
                <option value="Magallanes">Magallanes y Antártica</option>
              </select>
            </div>
            
            <div style={{"display":"flex","flexDirection":"column","gap":"6px"}}>
              <label style={{"font":"500 13px 'Montserrat',sans-serif","color":"rgba(255,255,255,.85)"}}>Ciudad *</label>
              <input type="text" value={vCiudad} onInput={onCiudad} placeholder="¿Desde dónde nos escribes?" required style={{"border":"1.5px solid #E5E7EB","borderRadius":"10px","padding":"12px 14px","color":"#1a2b3d","background":"#fff","width":"100%"}} />
            </div>
            
            <div style={{"display":"flex","flexDirection":"column","gap":"6px"}}>
              <label style={{"font":"500 13px 'Montserrat',sans-serif","color":"rgba(255,255,255,.85)"}}>¿Cómo nos conociste?</label>
              <select value={vComo} onChange={onComo} style={{"border":"1.5px solid #E5E7EB","borderRadius":"10px","padding":"12px 14px","color":"#1a2b3d","background":"#fff","width":"100%","appearance":"none","WebkitAppearance":"none"}}>
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

          
          <div style={{"marginBottom":"24px"}}>
            <label style={{"font":"500 13px 'Montserrat',sans-serif","color":"rgba(255,255,255,.85)","display":"block","marginBottom":"10px"}}>Terreno de interés *</label>
            <div className="terreno-btns">
              <button type="button" onClick={onTerreno200} style={{"background":t200SelectedBg,"border":t200SelectedBorder,"borderRadius":"12px","padding":"14px 16px","cursor":"pointer","transition":"all .2s","textAlign":"left","backdropFilter":"blur(8px)"}}>
                <div style={{"font":"700 16px 'Montserrat',sans-serif","color":t200SelectedColor,"marginBottom":"2px"}}>200 m²</div>
                <div style={{"font":"400 12px 'Roboto',sans-serif","color":"#9CA3AF"}}>Pie $1.500.000 · 71 cuotas $550K</div>
              </button>
              <button type="button" onClick={onTerreno390} style={{"background":t390SelectedBg,"border":t390SelectedBorder,"borderRadius":"12px","padding":"14px 16px","cursor":"pointer","transition":"all .2s","textAlign":"left","backdropFilter":"blur(8px)"}}>
                <div style={{"font":"700 16px 'Montserrat',sans-serif","color":t390SelectedColor,"marginBottom":"2px"}}>390 m² ✦</div>
                <div style={{"font":"400 12px 'Roboto',sans-serif","color":"#9CA3AF"}}>Pie $3.000.000 · 87 cuotas $550K</div>
              </button>
            </div>
          </div>

          
          <button type="submit" disabled={submitDisabled} style={{"width":"100%","background":"linear-gradient(135deg,#325366,#4ba646)","color":"#fff","border":"none","padding":"16px","borderRadius":"14px","font":"700 16px 'Montserrat',sans-serif","cursor":"pointer","letterSpacing":".02em","boxShadow":"0 6px 24px rgba(50,83,102,.35)","transition":"all .25s"}}>
            {submitText}
          </button>

          
          {statusError && (
            <div style={{"marginTop":"14px","padding":"12px 16px","background":"#FEF2F2","border":"1px solid #FECACA","borderRadius":"10px","font":"400 13px 'Roboto',sans-serif","color":"#991B1B","textAlign":"center"}}>
              ❌ Hubo un error. Por favor inténtalo de nuevo.
            </div>
          )}

          <p style={{"textAlign":"center","marginTop":"14px","font":"400 12px 'Roboto',sans-serif","color":"rgba(255,255,255,.35)"}}>🔒 Tus datos están seguros · Al registrarte aceptas nuestros términos · Sin spam</p>
        </form>
      </div>
    )}

    
    {successVisible && (
      <div style={{"background":"rgba(255,255,255,.97)","borderRadius":"24px","padding":"60px 40px","textAlign":"center","boxShadow":"0 24px 64px rgba(0,0,0,.25)","animation":"scaleIn .5s ease both"}}>
        <div style={{"width":"72px","height":"72px","background":"linear-gradient(135deg,#eaf7d8,#C8E6CB)","borderRadius":"50%","margin":"0 auto 20px","display":"flex","alignItems":"center","justifyContent":"center","fontSize":"32px"}}>✅</div>
        <h3 style={{"font":"800 26px 'Montserrat',sans-serif","color":"#1a2b3d","marginBottom":"10px"}}>¡Registro exitoso!</h3>
        <p style={{"font":"400 15px 'Roboto',sans-serif","color":"#64748B"}}>Un asesor te contactará en breve. Redirigiendo a /gracias...</p>
      </div>
      )}
      </div>

      
      <div>
        
        <div style={{"borderRadius":"20px","overflow":"hidden","position":"relative","background":"#071510","boxShadow":"0 20px 60px rgba(0,0,0,.5)","border":"2px solid rgba(118,216,69,.4)","marginBottom":"20px"}}>
          <video id="urbano-video" src="/assets/minipie/Rural_terrain_transforming_into_..._202606290523.mp4" style={{"width":"100%","display":"block","maxHeight":"420px","objectFit":"cover"}} muted loop playsInline preload="auto"></video>
          <div style={{"position":"absolute","inset":"0","background":"linear-gradient(to top,rgba(10,21,32,.8) 0%,transparent 50%)","pointerEvents":"none"}}></div>
          <div style={{"position":"absolute","bottom":"18px","left":"18px"}}>
            <div style={{"font":"700 9px 'Montserrat',sans-serif","color":"#76d845","textTransform":"uppercase","letterSpacing":".1em","marginBottom":"4px"}}>🔴 EN PROGRESO</div>
            <div style={{"font":"700 16px 'Montserrat',sans-serif","color":"#fff"}}>Urbanización en marcha</div>
            <div style={{"font":"400 12px 'Roboto',sans-serif","color":"rgba(255,255,255,.6)"}}>Lomas del Mar · El Tabo · 2026</div>
          </div>
        </div>

        
        <div style={{"background":"rgba(118,216,69,.15)","border":"1.5px solid rgba(118,216,69,.3)","borderRadius":"16px","padding":"20px 24px","display":"flex","alignItems":"center","gap":"16px","marginBottom":"16px"}}>
          <div style={{"font":"900 36px/1 'Montserrat',sans-serif","color":"#76d845"}}>+50%</div>
          <div>
            <div style={{"font":"700 14px 'Montserrat',sans-serif","color":"#fff","marginBottom":"2px"}}>de terrenos ya vendidos</div>
            <div style={{"font":"400 12px 'Roboto',sans-serif","color":"rgba(255,255,255,.55)"}}>Los cupos se agotan rápido · ¡Asegura el tuyo!</div>
          </div>
        </div>

        
        <button onClick={openPlan} style={{"width":"100%","background":"rgba(255,255,255,.08)","border":"1.5px solid rgba(255,255,255,.2)","color":"#fff","padding":"14px 20px","borderRadius":"14px","font":"700 14px 'Montserrat',sans-serif","cursor":"pointer","display":"flex","alignItems":"center","justifyContent":"center","gap":"10px","transition":"background .25s"}} >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><polyline points="3 9 21 9"></polyline><path d="M9 21V9"></path></svg>
          Ver plano del proyecto →
        </button>
      </div>

    </div>
    
  </div>
</section>


{planVisible && (
  <div onClick={closePlan} style={{"position":"fixed","inset":"0","zIndex":"9999","background":"rgba(0,0,0,.88)","display":"flex","alignItems":"center","justifyContent":"center","padding":"20px","cursor":"zoom-out"}}>
    <div onClick={stopProp} style={{"position":"relative","maxWidth":"1100px","width":"100%","cursor":"default"}}>
      <img src="/assets/minipie/plano-loteo.jpeg" alt="Plano Lomas del Mar" style={{"width":"100%","borderRadius":"16px","display":"block","boxShadow":"0 32px 80px rgba(0,0,0,.6)"}} />
      <button onClick={closePlan} style={{"position":"absolute","top":"-14px","right":"-14px","width":"40px","height":"40px","background":"#76d845","border":"none","borderRadius":"50%","cursor":"pointer","display":"flex","alignItems":"center","justifyContent":"center","font":"700 20px 'Montserrat',sans-serif","color":"#fff","boxShadow":"0 4px 16px rgba(0,0,0,.4)"}}>×</button>
      <div style={{"textAlign":"center","marginTop":"14px","font":"600 13px 'Montserrat',sans-serif","color":"rgba(255,255,255,.6)"}}>Plano de loteo · Lomas del Mar · El Tabo · Toca fuera para cerrar</div>
    </div>
  </div>
)}


<section style={{"position":"relative","background":"#0a1520","padding":"64px 20px 0","overflow":"hidden"}}>
  <div style={{"position":"absolute","inset":"0","background":"url('https://images.pexels.com/photos/167699/pexels-photo-167699.jpeg?auto=compress&cs=tinysrgb&w=1920') center/cover no-repeat"}}></div>
  <div style={{"position":"absolute","inset":"0","background":"linear-gradient(160deg,rgba(10,21,32,.72) 0%,rgba(12,28,44,.60) 50%,rgba(10,21,32,.72) 100%)"}}></div>
  <div style={{"maxWidth":"1160px","margin":"0 auto","position":"relative","zIndex":"1"}}>
    <div style={{"textAlign":"center","marginBottom":"36px"}} data-animate="">
      <div style={{"display":"inline-flex","alignItems":"center","gap":"8px","marginBottom":"12px"}}>
        <span style={{"display":"inline-block","width":"32px","height":"2px","background":"linear-gradient(90deg,#76d845,#4ba646)"}}></span>
        <span style={{"font":"600 12px 'Montserrat',sans-serif","color":"#76d845","textTransform":"uppercase","letterSpacing":".12em"}}>Dónde estamos</span>
        <span style={{"display":"inline-block","width":"32px","height":"2px","background":"linear-gradient(90deg,#4ba646,#76d845)"}}></span>
      </div>
      <h2 style={{"font":"800 clamp(1.6rem,3vw,2.2rem)/1.2 'Montserrat',sans-serif","color":"#fff","marginBottom":"8px"}}>Lomas del Mar · El Tabo</h2>
      <p style={{"font":"400 14px 'Roboto',sans-serif","color":"rgba(255,255,255,.45)"}}>📍 Litoral Central · Región de Valparaíso · 1 hora de Santiago</p>
    </div>
    <div style={{"borderRadius":"20px","overflow":"hidden","border":"2px solid rgba(118,216,69,.4)","boxShadow":"0 16px 48px rgba(0,0,0,.5)"}}>
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3328.7!2d-71.6181184!3d-33.4617574!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x966215007f8800b9%3A0x952d8553bda618e5!2sLomas%20Del%20Mar%20-%20Alimin!5e1!3m2!1ses!2scl!4v1719000000000"
        width="100%"
        height="480"
        style={{"border":"0","display":"block"}}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Lomas del Mar - Alimin · El Tabo, Litoral Central"
      ></iframe>
    </div>
    <div style={{"display":"flex","flexWrap":"wrap","justifyContent":"center","gap":"24px","padding":"28px 0 64px"}}>
      <div style={{"display":"flex","alignItems":"center","gap":"8px","font":"400 13px 'Roboto',sans-serif","color":"rgba(255,255,255,.55)"}}>
        <span style={{"color":"#76d845","fontSize":"15px"}}>🚗</span> 1 hora desde Santiago por Ruta 78
      </div>
      <div style={{"display":"flex","alignItems":"center","gap":"8px","font":"400 13px 'Roboto',sans-serif","color":"rgba(255,255,255,.55)"}}>
        <span style={{"color":"#76d845","fontSize":"15px"}}>🏖</span> 10 min a playa El Tabo
      </div>
      <div style={{"display":"flex","alignItems":"center","gap":"8px","font":"400 13px 'Roboto',sans-serif","color":"rgba(255,255,255,.55)"}}>
        <span style={{"color":"#76d845","fontSize":"15px"}}>🌲</span> Zona residencial tranquila
      </div>
      <div style={{"display":"flex","alignItems":"center","gap":"8px","font":"400 13px 'Roboto',sans-serif","color":"rgba(255,255,255,.55)"}}>
        <span style={{"color":"#76d845","fontSize":"15px"}}>📈</span> Alta plusvalía del litoral central
      </div>
    </div>
  </div>
</section>


<section style={{"background":"linear-gradient(160deg,#eaf7d8 0%,#f2fce8 50%,#e4f5d4 100%)","padding":"72px 20px"}}>
  <div style={{"maxWidth":"720px","margin":"0 auto"}}>
    <div style={{"textAlign":"center","marginBottom":"44px"}} data-animate="">
      <div style={{"display":"inline-flex","alignItems":"center","gap":"8px","marginBottom":"14px"}}>
        <span style={{"display":"inline-block","width":"32px","height":"2px","background":"linear-gradient(90deg,#76d845,#4ba646)"}}></span>
        <span style={{"font":"600 12px 'Montserrat',sans-serif","color":"#76d845","textTransform":"uppercase","letterSpacing":".12em"}}>Preguntas frecuentes</span>
        <span style={{"display":"inline-block","width":"32px","height":"2px","background":"linear-gradient(90deg,#4ba646,#76d845)"}}></span>
      </div>
      <h2 style={{"font":"800 clamp(1.8rem,3.5vw,2.6rem)/1.2 'Montserrat',sans-serif","color":"#1a2b3d"}}>¿Tienes dudas?</h2>
    </div>
    <div style={{"display":"flex","flexDirection":"column","gap":"8px"}} data-animate-stagger="">
      
      <div style={{"background":faq0bg,"borderRadius":"14px","border":"1.5px solid #e0eecc","overflow":"hidden","transition":"background .25s"}}>
        <button onClick={toggleFaq0} style={{"width":"100%","display":"flex","justifyContent":"space-between","alignItems":"center","padding":"18px 22px","background":"none","border":"none","cursor":"pointer","textAlign":"left","gap":"12px"}}>
          <span style={{"font":"600 15px 'Montserrat',sans-serif","color":"#1a2b3d"}}>¿Qué es el Mini Pie y por qué es especial?</span>
          <span style={{"font":"700 22px 'Montserrat',sans-serif","color":"#4ba646","flexShrink":"0","transition":"transform .3s"}}>{faq0icon}</span>
        </button>
        <div style={{"maxHeight":faq0h,"overflow":"hidden","transition":"max-height .35s cubic-bezier(.16,1,.3,1)"}}>
          <p style={{"padding":"0 22px 18px","font":"400 14px/1.7 'Roboto',sans-serif","color":"#4B5563"}}>El Mini Pie es una promoción exclusiva de Alimin que reduce al mínimo el pie inicial de tu terreno: desde $1.500.000 para terrenos de 200 m² y $3.000.000 para 390 m². Es una edición limitada que vuelve por última vez, con cupos muy reducidos.</p>
        </div>
      </div>
      
      <div style={{"background":faq1bg,"borderRadius":"14px","border":"1.5px solid #e0eecc","overflow":"hidden","transition":"background .25s"}}>
        <button onClick={toggleFaq1} style={{"width":"100%","display":"flex","justifyContent":"space-between","alignItems":"center","padding":"18px 22px","background":"none","border":"none","cursor":"pointer","textAlign":"left","gap":"12px"}}>
          <span style={{"font":"600 15px 'Montserrat',sans-serif","color":"#1a2b3d"}}>¿Cómo funciona el financiamiento?</span>
          <span style={{"font":"700 22px 'Montserrat',sans-serif","color":"#4ba646","flexShrink":"0"}}>{faq1icon}</span>
        </button>
        <div style={{"maxHeight":faq1h,"overflow":"hidden","transition":"max-height .35s cubic-bezier(.16,1,.3,1)"}}>
          <p style={{"padding":"0 22px 18px","font":"400 14px/1.7 'Roboto',sans-serif","color":"#4B5563"}}>Pagas el pie inicial y el saldo se financia directamente con Alimin. Sin banco, sin aval. El saldo se divide en cuotas mensuales de $550.000 a 0% de interés: 71+1 cuotas para 200 m² y 87+1 cuotas para 390 m².</p>
        </div>
      </div>
      
      <div style={{"background":faq2bg,"borderRadius":"14px","border":"1.5px solid #e0eecc","overflow":"hidden","transition":"background .25s"}}>
        <button onClick={toggleFaq2} style={{"width":"100%","display":"flex","justifyContent":"space-between","alignItems":"center","padding":"18px 22px","background":"none","border":"none","cursor":"pointer","textAlign":"left","gap":"12px"}}>
          <span style={{"font":"600 15px 'Montserrat',sans-serif","color":"#1a2b3d"}}>¿Puedo comprar sin historial crediticio?</span>
          <span style={{"font":"700 22px 'Montserrat',sans-serif","color":"#4ba646","flexShrink":"0"}}>{faq2icon}</span>
        </button>
        <div style={{"maxHeight":faq2h,"overflow":"hidden","transition":"max-height .35s cubic-bezier(.16,1,.3,1)"}}>
          <p style={{"padding":"0 22px 18px","font":"400 14px/1.7 'Roboto',sans-serif","color":"#4B5563"}}>Sí. El financiamiento es directo con Alimin, sin evaluación bancaria. No importa si tienes DICOM u otro historial crediticio complejo. Nuestro equipo evalúa cada caso de forma personalizada para encontrar la solución ideal.</p>
        </div>
      </div>
      
      <div style={{"background":faq3bg,"borderRadius":"14px","border":"1.5px solid #e0eecc","overflow":"hidden","transition":"background .25s"}}>
        <button onClick={toggleFaq3} style={{"width":"100%","display":"flex","justifyContent":"space-between","alignItems":"center","padding":"18px 22px","background":"none","border":"none","cursor":"pointer","textAlign":"left","gap":"12px"}}>
          <span style={{"font":"600 15px 'Montserrat',sans-serif","color":"#1a2b3d"}}>¿Qué incluye la urbanización de Lomas del Mar?</span>
          <span style={{"font":"700 22px 'Montserrat',sans-serif","color":"#4ba646","flexShrink":"0"}}>{faq3icon}</span>
        </button>
        <div style={{"maxHeight":faq3h,"overflow":"hidden","transition":"max-height .35s cubic-bezier(.16,1,.3,1)"}}>
          <p style={{"padding":"0 22px 18px","font":"400 14px/1.7 'Roboto',sans-serif","color":"#4B5563"}}>Cada terreno incluye: rol propio inscrito en el Conservador de Bienes Raíces, agua potable certificada por SEREMI de Salud, empalme eléctrico en el frontis del lote, portón automático de acceso y calle interior pavimentada.</p>
        </div>
      </div>
      
      <div style={{"background":faq4bg,"borderRadius":"14px","border":"1.5px solid #e0eecc","overflow":"hidden","transition":"background .25s"}}>
        <button onClick={toggleFaq4} style={{"width":"100%","display":"flex","justifyContent":"space-between","alignItems":"center","padding":"18px 22px","background":"none","border":"none","cursor":"pointer","textAlign":"left","gap":"12px"}}>
          <span style={{"font":"600 15px 'Montserrat',sans-serif","color":"#1a2b3d"}}>¿Puedo visitar el terreno antes de comprar?</span>
          <span style={{"font":"700 22px 'Montserrat',sans-serif","color":"#4ba646","flexShrink":"0"}}>{faq4icon}</span>
        </button>
        <div style={{"maxHeight":faq4h,"overflow":"hidden","transition":"max-height .35s cubic-bezier(.16,1,.3,1)"}}>
          <p style={{"padding":"0 22px 18px","font":"400 14px/1.7 'Roboto',sans-serif","color":"#4B5563"}}>¡Por supuesto! Coordinamos visitas guiadas con nuestro equipo de asesores. Puedes ver el proyecto en persona y elegir tu lote favorito. Solo regístrate y uno de nuestros asesores te agenda la visita.</p>
        </div>
      </div>
    </div>
  </div>
</section>


<section style={{"position":"relative","overflow":"hidden","background":"#12253a","padding":"72px 20px"}}>
  
  <div style={{"position":"absolute","inset":"0","background":"url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop&q=80') center/cover no-repeat"}}></div>
  <div style={{"position":"absolute","inset":"0","background":"rgba(18,37,58,.82)"}}></div>
  <div style={{"maxWidth":"1160px","margin":"0 auto","position":"relative","zIndex":"1"}}>
    <div style={{"textAlign":"center","marginBottom":"44px"}} data-animate="">
      <div style={{"display":"inline-flex","alignItems":"center","gap":"8px","marginBottom":"14px"}}>
        <span style={{"display":"inline-block","width":"32px","height":"2px","background":"linear-gradient(90deg,#76d845,#4ba646)"}}></span>
        <span style={{"font":"600 12px 'Montserrat',sans-serif","color":"#76d845","textTransform":"uppercase","letterSpacing":".12em"}}>Equipo comercial</span>
        <span style={{"display":"inline-block","width":"32px","height":"2px","background":"linear-gradient(90deg,#4ba646,#76d845)"}}></span>
      </div>
      <h2 style={{"font":"800 clamp(1.8rem,3.5vw,2.6rem)/1.2 'Montserrat',sans-serif","color":"#fff","marginBottom":"12px"}}>Habla con un asesor ahora</h2>
      <p style={{"font":"400 15px 'Roboto',sans-serif","color":"rgba(255,255,255,.5)","maxWidth":"480px","margin":"0 auto"}}>Contáctanos directamente por WhatsApp. Respondemos en minutos.</p>
    </div>
    <div className="advisors-grid" data-animate-stagger="">

      
      <div style={{"background":"rgba(255,255,255,.06)","border":"1px solid rgba(255,255,255,.12)","borderRadius":"22px","overflow":"hidden","transition":"all .3s"}} >
        
        <div style={{"position":"relative","height":"360px","overflow":"hidden"}}>
          <img src="/assets/minipie/Marcela.png" alt="Marcela Escobar" style={{"width":"100%","height":"100%","objectFit":"contain","objectPosition":"center bottom","display":"block","background":"#0a1a26"}} />
          <div style={{"position":"absolute","inset":"0","background":"linear-gradient(to top,rgba(14,26,36,.92) 0%,rgba(14,26,36,.1) 55%,transparent 100%)"}}></div>
          <div style={{"position":"absolute","bottom":"20px","left":"22px"}}>
            <div style={{"font":"600 10px 'Montserrat',sans-serif","color":"#76d845","textTransform":"uppercase","letterSpacing":".1em","marginBottom":"4px"}}>Asesora inmobiliaria</div>
            <div style={{"font":"800 22px 'Montserrat',sans-serif","color":"#fff"}}>Marcela Escobar</div>
          </div>
        </div>
        
        <div style={{"padding":"22px"}}>
          <p style={{"font":"400 13px/1.6 'Roboto',sans-serif","color":"rgba(255,255,255,.55)","marginBottom":"16px"}}>Te asesora con soluciones rápidas y transparentes para asegurar tu inversión en Lomas del Mar.</p>
          <div style={{"display":"flex","alignItems":"center","gap":"7px","marginBottom":"16px"}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#76d845" strokeWidth="2.5" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.6 19.79 19.79 0 0 1 1.62 5a2 2 0 0 1 1.99-2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.09"></path></svg>
            <span style={{"font":"400 13px 'Roboto',sans-serif","color":"rgba(255,255,255,.45)"}}>+56 9 5665 4833</span>
          </div>
          <a href="https://wa.me/56956654833?text=Hola%20Marcela%2C%20vengo%20de%20la%20web%20y%20estoy%20interesado%20en%20la%20promo%20Mini%20Pie%20%F0%9F%8C%B2%20de%20Lomas%20del%20Mar" target="_blank" rel="noopener noreferrer" style={{"display":"flex","alignItems":"center","justifyContent":"center","gap":"8px","width":"100%","background":"linear-gradient(135deg,#25D366,#1aad54)","color":"#fff","padding":"13px","borderRadius":"12px","font":"700 14px 'Montserrat',sans-serif","boxShadow":"0 4px 16px rgba(37,211,102,.3)","transition":"all .25s"}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"></path></svg>
            WhatsApp con Marcela
          </a>
        </div>
      </div>

      
      <div style={{"background":"rgba(255,255,255,.06)","border":"1px solid rgba(255,255,255,.12)","borderRadius":"22px","overflow":"hidden","transition":"all .3s"}} >
        
        <div style={{"position":"relative","height":"360px","overflow":"hidden"}}>
          <img src="/assets/minipie/Orlando.png" alt="Orlando Costa" style={{"width":"100%","height":"100%","objectFit":"contain","objectPosition":"center bottom","display":"block","background":"#0a1a26"}} />
          <div style={{"position":"absolute","inset":"0","background":"linear-gradient(to top,rgba(14,26,36,.92) 0%,rgba(14,26,36,.1) 55%,transparent 100%)"}}></div>
          <div style={{"position":"absolute","bottom":"20px","left":"22px"}}>
            <div style={{"font":"600 10px 'Montserrat',sans-serif","color":"#76d845","textTransform":"uppercase","letterSpacing":".1em","marginBottom":"4px"}}>Asesor inmobiliario</div>
            <div style={{"font":"800 22px 'Montserrat',sans-serif","color":"#fff"}}>Orlando Costa</div>
          </div>
        </div>
        
        <div style={{"padding":"22px"}}>
          <p style={{"font":"400 13px/1.6 'Roboto',sans-serif","color":"rgba(255,255,255,.55)","marginBottom":"16px"}}>Te acompaña paso a paso para encontrar el lote ideal para tu familia en Lomas del Mar.</p>
          <div style={{"display":"flex","alignItems":"center","gap":"7px","marginBottom":"16px"}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#76d845" strokeWidth="2.5" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.6 19.79 19.79 0 0 1 1.62 5a2 2 0 0 1 1.99-2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.09"></path></svg>
            <span style={{"font":"400 13px 'Roboto',sans-serif","color":"rgba(255,255,255,.45)"}}>+56 9 7307 7128</span>
          </div>
          <a href="https://wa.me/56973077128?text=Hola%20Orlando%2C%20vengo%20de%20la%20web%20y%20estoy%20interesado%20en%20la%20promo%20Mini%20Pie%20%F0%9F%8C%B2%20de%20Lomas%20del%20Mar" target="_blank" rel="noopener noreferrer" style={{"display":"flex","alignItems":"center","justifyContent":"center","gap":"8px","width":"100%","background":"linear-gradient(135deg,#25D366,#1aad54)","color":"#fff","padding":"13px","borderRadius":"12px","font":"700 14px 'Montserrat',sans-serif","boxShadow":"0 4px 16px rgba(37,211,102,.3)","transition":"all .25s"}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"></path></svg>
            WhatsApp con Orlando
          </a>
        </div>
      </div>
    </div>

</div></section>


<footer style={{"background":"#4ba646","padding":"48px 20px 36px","borderTop":"2px solid rgba(255,255,255,.15)"}}>
  <div className="footer-inner" style={{"maxWidth":"1160px","margin":"0 auto"}}>
    
    <div className="footer-top">
      
      <div style={{"display":"flex","alignItems":"center","gap":"14px"}}>
        <img src="/assets/minipie/favicon (1).png" alt="Alimin" style={{"width":"54px","height":"54px","objectFit":"contain","display":"block"}} />
        <div>
          <div style={{"font":"900 28px/1 'Montserrat',sans-serif","color":"#fff","letterSpacing":"-.02em"}}>ALIMIN</div>
          <div style={{"font":"700 12px 'Roboto',sans-serif","color":"#0a2a0a","marginTop":"3px"}}>Inmobiliaria SpA</div>
          <div style={{"font":"600 11px 'Roboto',sans-serif","color":"rgba(255,255,255,.9)","marginTop":"1px"}}>Litoral Central, Chile</div>
        </div>
      </div>
      
      <div style={{"display":"flex","flexDirection":"column","gap":"14px"}}>
        <div style={{"display":"flex","alignItems":"center","gap":"9px"}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#76d845" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
          <a href="mailto:bienesraices@aliminspa.cl" style={{"font":"700 14px 'Roboto',sans-serif","color":"#fff","textDecoration":"none"}}>bienesraices@aliminspa.cl</a>
        </div>
        
        <div style={{"display":"flex","gap":"12px","alignItems":"center"}}>
          <span style={{"font":"700 12px 'Roboto',sans-serif","color":"rgba(255,255,255,.9)"}}>Síguenos:</span>
          <a href="https://www.instagram.com/aliminspa" target="_blank" rel="noopener" style={{"width":"36px","height":"36px","background":"rgba(255,255,255,.08)","border":"1px solid rgba(255,255,255,.12)","borderRadius":"10px","display":"flex","alignItems":"center","justifyContent":"center","color":"#fff","transition":"background .2s"}} >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"></circle></svg>
          </a>
          <a href="https://www.facebook.com/aliminspa" target="_blank" rel="noopener" style={{"width":"36px","height":"36px","background":"rgba(255,255,255,.08)","border":"1px solid rgba(255,255,255,.12)","borderRadius":"10px","display":"flex","alignItems":"center","justifyContent":"center","color":"#fff","transition":"background .2s"}} >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
          </a>
          <a href="https://www.tiktok.com/@aliminspa" target="_blank" rel="noopener" style={{"width":"36px","height":"36px","background":"rgba(255,255,255,.08)","border":"1px solid rgba(255,255,255,.12)","borderRadius":"10px","display":"flex","alignItems":"center","justifyContent":"center","color":"#fff","transition":"background .2s"}} >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.81a8.2 8.2 0 0 0 4.77 1.51V6.87a4.86 4.86 0 0 1-1-.18z"></path></svg>
          </a>
        </div>
      </div>
    </div>
    
    <div className="footer-bottom">
      <span style={{"font":"600 12px 'Roboto',sans-serif","color":"rgba(255,255,255,.85)"}}>© 2026 Alimin SpA · aliminspa.cl/minipie · Todos los derechos reservados</span>
      <span style={{"font":"600 11px 'Roboto',sans-serif","color":"rgba(255,255,255,.7)"}}>Promoción sujeta a disponibilidad de cupos</span>
    </div>
  </div>
</footer>


<a href="https://wa.me/56956654833?text=Hola%2C%20vengo%20de%20la%20web%20y%20quiero%20info%20sobre%20Mini%20Pie%20%F0%9F%8C%B2" target="_blank" rel="noopener noreferrer" id="wa-float" style={{"position":"fixed","bottom":"24px","right":"24px","width":"58px","height":"58px","background":"linear-gradient(135deg,#25D366,#1aad54)","borderRadius":"50%","display":"flex","alignItems":"center","justifyContent":"center","boxShadow":"0 4px 24px rgba(118,216,69,.45)","zIndex":"999","animation":"pulseGreen 2.8s ease-in-out infinite","transition":"transform .2s"}}>
  <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"></path></svg>
</a>

    </div>
  )
}
