/**
 * Visor del plano cenital con los lotes tocables.
 *
 * La foto es cenital —mirando recto hacia abajo— así que el mapa es plano: se
 * arrastra y se hace zoom sobre la imagen, como cualquier mapa. No hay nada
 * que proyectar.
 *
 * Eso resuelve de una vez tres cosas que con la panorámica no tenían arreglo.
 * Una foto plana no tiene punto debajo de la cámara, así que no hay cono ciego
 * ni disco en el centro. No hace falta saber dónde estaba el dron, porque no
 * se proyecta. Y la orientación es la que es: nadie tiene que girar nada para
 * que las casas queden donde están.
 *
 * Los lotes no son geometría: son un mapa de identificadores del mismo tamaño
 * que la foto, con un número por recinto, sacado de las líneas que ya vienen
 * dibujadas. Sirve para dos cosas a la vez: saber qué lote hay bajo el cursor
 * (se lee el píxel) y pintar solo ese lote (lo compara el shader). Los bordes
 * salen exactos porque son los del propio dibujo.
 */

import * as THREE from 'three'

/** Cuánto ancho de la imagen se ve: el mínimo es el acercamiento a un lote. */
const ZOOM_MIN = 0.035, ZOOM_MAX = 1

/** Para el picking basta media resolución: un lote son decenas de píxeles. */
const PICK_DIV = 2

const SEL = new THREE.Color(0x76d845)
const HOV = new THREE.Color(0xb9e79a)
const SOLD = new THREE.Color(0xe5484d)

class PlanoLotes extends HTMLElement {
    connectedCallback() {
        if (this._arrancado) {
            if (this._cuadro && !this._raf) this._raf = requestAnimationFrame(this._cuadro)
            return
        }
        this._arrancado = true
        this.style.display = 'block'
        this.style.position = 'relative'
        this.style.overflow = 'hidden'
        this._boot().catch(e => console.error('plano-lotes', e))
    }

    disconnectedCallback() {
        // Sin esto la GPU sigue dibujando una escena que ya no está en pantalla.
        if (this._raf) cancelAnimationFrame(this._raf)
        this._raf = 0
    }

    /** Suelta la GPU. La llama el envoltorio al desmontar la página. */
    destruir() {
        this.disconnectedCallback()
        this.renderer?.dispose()
    }

    async _boot() {
        const [datos, planoTex, mapa] = await Promise.all([
            fetch(this.getAttribute('lotes')).then(r => r.json()),
            cargarTextura(this.getAttribute('plano')),
            cargarMapa(this.getAttribute('mapa'))
        ])

        this.lotes = datos.lotes
        this.porId = new Map(this.lotes.map(l => [l.id, l]))
        this._pick = mapa
        this._sel = 0
        this._hov = 0
        this._filtro = {}
        this._relacion = datos.ancho / datos.alto

        const renderer = new THREE.WebGLRenderer({ antialias: true })
        renderer.setPixelRatio(Math.min(devicePixelRatio, this.getAttribute('quality') === 'baja' ? 1.5 : 2))
        renderer.outputColorSpace = THREE.SRGBColorSpace
        this.appendChild(renderer.domElement)
        Object.assign(renderer.domElement.style, {
            width: '100%', height: '100%', display: 'block', cursor: 'grab', touchAction: 'none'
        })

        const scene = new THREE.Scene()
        const cam = new THREE.Camera()

        /* Estado de cada lote en una tabla de una fila: el shader la consulta
           por identificador. Así el tinte de los 204 lotes se cambia sin tocar
           geometría ni recompilar nada. */
        const N = this.lotes.reduce((m, l) => Math.max(m, l.id), 0) + 1
        this._tabla = new Uint8Array(N * 4)
        const tablaTex = new THREE.DataTexture(this._tabla, N, 1, THREE.RGBAFormat)
        tablaTex.needsUpdate = true
        tablaTex.minFilter = tablaTex.magFilter = THREE.NearestFilter

        const idTex = new THREE.Texture(mapa.imagen)
        idTex.minFilter = idTex.magFilter = THREE.NearestFilter
        idTex.generateMipmaps = false
        idTex.colorSpace = THREE.NoColorSpace   // son números, no color
        idTex.needsUpdate = true

        this._mat = new THREE.ShaderMaterial({
            uniforms: {
                plano: { value: planoTex },
                ids: { value: idTex },
                tabla: { value: tablaTex },
                nTabla: { value: N },
                sel: { value: 0 },
                hov: { value: 0 },
                colSel: { value: new THREE.Vector3(SEL.r, SEL.g, SEL.b) },
                colHov: { value: new THREE.Vector3(HOV.r, HOV.g, HOV.b) },
                centro: { value: new THREE.Vector2(0.5, 0.5) },
                zona: { value: new THREE.Vector2(1, 1) },
                fondo: { value: new THREE.Vector3(0.04, 0.07, 0.1) }
            },
            depthTest: false,
            depthWrite: false,
            vertexShader: `
                varying vec2 vNdc;
                void main() {
                    vNdc = position.xy;
                    gl_Position = vec4(position.xy, 0.999, 1.0);
                }`,
            fragmentShader: `
                precision highp float;
                uniform sampler2D plano;
                uniform sampler2D ids;
                uniform sampler2D tabla;
                uniform float nTabla, sel, hov;
                uniform vec3 colSel, colHov, fondo;
                uniform vec2 centro, zona;
                varying vec2 vNdc;

                void main() {
                    /* De la pantalla a la imagen. La v de la imagen crece hacia
                       abajo y la de la textura hacia arriba, de ahí el 1.0 -. */
                    vec2 uv = centro + vec2(vNdc.x, -vNdc.y) * zona * 0.5;
                    if (any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) {
                        gl_FragColor = vec4(fondo, 1.0);
                        return;
                    }
                    vec2 tuv = vec2(uv.x, 1.0 - uv.y);
                    vec3 col = texture2D(plano, tuv).rgb;

                    vec2 e = texture2D(ids, tuv).rg;
                    float id = floor(e.r * 255.0 + 0.5) + floor(e.g * 255.0 + 0.5) * 256.0;
                    if (id > 0.5) {
                        vec4 st = texture2D(tabla, vec2((id + 0.5) / nTabla, 0.5));
                        vec3 tinte = st.rgb;
                        float fuerza = st.a;
                        if (abs(id - sel) < 0.5) { tinte = colSel; fuerza = 0.5; }
                        else if (abs(id - hov) < 0.5) { tinte = colHov; fuerza = 0.3; }
                        col = mix(col, tinte, fuerza);
                    }
                    gl_FragColor = vec4(col, 1.0);
                    /* La textura viene marcada como sRGB, así que al muestrearla
                       three.js la pasa a lineal. Con un material propio nadie la
                       devuelve al espacio de salida, y la foto sale oscura. */
                    #include <colorspace_fragment>
                }`
        })

        const telon = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this._mat)
        telon.frustumCulled = false
        scene.add(telon)

        Object.assign(this, { renderer, scene, cam })

        const enc = this._encuadre()
        this._cu = enc.u; this._cv = enc.v; this._z = enc.z
        this._cine = false

        this._controles()
        this._etiquetas()

        const encajar = () => {
            const w = this.clientWidth || 800, h = this.clientHeight || 600
            if (w === this._w && h === this._h) return
            this._w = w; this._h = h
            renderer.setSize(w, h, false)
            this._sucio = true
        }
        encajar()
        new ResizeObserver(encajar).observe(this)

        /* Bucle propio en vez de renderer.setAnimationLoop: el envoltorio React
           apaga ese bucle en su limpieza —está escrito para el visor anterior—
           y dejaría la escena congelada en el primer cuadro. */
        let previo = performance.now()
        this._cuadro = now => {
            if (!this.isConnected) { this._raf = 0; return }
            this._raf = requestAnimationFrame(this._cuadro)
            const dt = Math.min(0.05, (now - previo) / 1000)
            previo = now
            encajar()
            this._animar(dt)
            this._acotar()
            this._mat.uniforms.centro.value.set(this._cu, this._cv)
            this._mat.uniforms.zona.value.set(this._z, this._alto())
            renderer.render(scene, cam)
            try { this._colocarEtiquetas() } catch (e) { this.etiquetas = null }
        }
        this._raf = requestAnimationFrame(this._cuadro)

        this._pintar()

        const conNumero = this.lotes.filter(l => l.n != null)
        const enVenta = conNumero.length ? conNumero : this.lotes
        const porEtapa = {}
        for (const l of enVenta) {
            const e = (porEtapa[l.stage] ||= { total: 0, disponibles: 0 })
            e.total++
            if (!l.sold) e.disponibles++
        }
        this.dispatchEvent(new CustomEvent('ready', {
            detail: {
                calibrado: true,
                layer: 'dron',
                provisional: !!datos.provisional,
                conteo: {
                    total: enVenta.length,
                    disponibles: enVenta.filter(l => !l.sold).length,
                    porEtapa
                }
            }
        }))
    }

    // ---------- encuadre ----------

    /** Alto de la zona visible, en fracción de imagen, sin deformar la foto. */
    _alto() {
        const c = (this.clientWidth || 1280) / (this.clientHeight || 720)
        return this._z * this._relacion / c
    }

    /** Mantiene la zona visible dentro de la imagen. */
    _acotar() {
        this._z = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, this._z))
        let h = this._alto()
        if (h > 1) { this._z *= 1 / h; h = this._alto() }   // no mostrar más alto que la foto
        const mx = this._z / 2, my = h / 2
        this._cu = mx * 2 >= 1 ? 0.5 : Math.max(mx, Math.min(1 - mx, this._cu))
        this._cv = my * 2 >= 1 ? 0.5 : Math.max(my, Math.min(1 - my, this._cv))
    }

    /** Encuadre que deja a la vista un grupo de lotes, con un poco de aire. */
    _encuadre(lotes = this.lotes) {
        const lista = lotes && lotes.length ? lotes : this.lotes
        let x0 = 1, y0 = 1, x1 = 0, y1 = 0
        for (const l of lista) {
            const c = l.caja
            if (c[0] < x0) x0 = c[0]
            if (c[1] < y0) y0 = c[1]
            if (c[2] > x1) x1 = c[2]
            if (c[3] > y1) y1 = c[3]
        }
        const u = (x0 + x1) / 2, v = (y0 + y1) / 2
        const c = (this.clientWidth || 1280) / (this.clientHeight || 720)
        // El zoom lo manda el lado que peor entra.
        const z = Math.max((x1 - x0), (y1 - y0) * c / this._relacion) * 1.14
        return { u, v, z: Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z)) }
    }

    // ---------- arrastrar y acercarse ----------

    _controles() {
        const lienzo = this.renderer.domElement
        let arrastrando = false, px = 0, py = 0, movido = 0
        const dedos = new Map()
        let sep0 = 0, z0 = 0

        lienzo.addEventListener('pointerdown', e => {
            dedos.set(e.pointerId, e)
            if (dedos.size === 2) {
                const [a, b] = [...dedos.values()]
                sep0 = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
                z0 = this._z
                arrastrando = false
                return
            }
            arrastrando = true; movido = 0
            px = e.clientX; py = e.clientY
            lienzo.setPointerCapture(e.pointerId)
            lienzo.style.cursor = 'grabbing'
            this._cine = false
            this._destino = null
        })

        lienzo.addEventListener('pointermove', e => {
            if (dedos.has(e.pointerId)) dedos.set(e.pointerId, e)
            if (dedos.size === 2) {
                const [a, b] = [...dedos.values()]
                const sep = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
                if (sep0 > 10) { this._z = z0 * sep0 / sep; this._sucio = true }
                return
            }
            if (!arrastrando) {
                const id = this.idEn(e.clientX, e.clientY)
                if (id !== this._hov) { this._hov = id; this._pintar(); this._sucio = true }
                lienzo.style.cursor = id ? 'pointer' : 'grab'
                return
            }
            const dx = e.clientX - px, dy = e.clientY - py
            px = e.clientX; py = e.clientY
            movido += Math.abs(dx) + Math.abs(dy)
            this._cu -= dx / (this.clientWidth || 1) * this._z
            this._cv -= dy / (this.clientHeight || 1) * this._alto()
            this._sucio = true
        })

        const soltar = e => {
            dedos.delete(e.pointerId)
            if (!arrastrando) return
            arrastrando = false
            lienzo.style.cursor = 'grab'
            try { lienzo.releasePointerCapture(e.pointerId) } catch { }
            // Un arrastre no es un clic: sin esto, mover el mapa abre una ficha.
            if (movido < 6) this._tocar(e.clientX, e.clientY)
        }
        lienzo.addEventListener('pointerup', soltar)
        lienzo.addEventListener('pointercancel', e => { dedos.delete(e.pointerId); arrastrando = false })
        lienzo.addEventListener('pointerleave', () => {
            if (this._hov) { this._hov = 0; this._pintar(); this._sucio = true }
        })

        lienzo.addEventListener('wheel', e => {
            e.preventDefault()
            this._cine = false
            this._destino = null
            /* Acercarse hacia el cursor y no hacia el centro: el punto que está
               bajo el puntero se queda donde está. */
            const r = lienzo.getBoundingClientRect()
            const nx = (e.clientX - r.left) / r.width - 0.5
            const ny = (e.clientY - r.top) / r.height - 0.5
            const antesU = this._cu + nx * this._z
            const antesV = this._cv + ny * this._alto()
            this._z = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, this._z * Math.exp(e.deltaY * 0.0015)))
            this._cu = antesU - nx * this._z
            this._cv = antesV - ny * this._alto()
            this._sucio = true
        }, { passive: false })
    }

    _animar(dt) {
        if (this._destino) {
            const d = this._destino
            d.t = Math.min(1, d.t + dt / d.dur)
            // Cúbico simétrico: sale y llega suave, como una cámara de verdad.
            const k = d.t < 0.5 ? 4 * d.t ** 3 : 1 - (-2 * d.t + 2) ** 3 / 2
            this._cu = d.u0 + (d.u1 - d.u0) * k
            this._cv = d.v0 + (d.v1 - d.v0) * k
            this._z = d.z0 + (d.z1 - d.z0) * k
            this._sucio = true
            if (d.t >= 1) this._destino = null
        }
    }

    _volarA(enc, dur = 1) {
        this._cine = false
        this._destino = {
            t: 0, dur,
            u0: this._cu, u1: enc.u,
            v0: this._cv, v1: enc.v,
            z0: this._z, z1: enc.z
        }
    }

    // ---------- qué lote hay acá ----------

    /** Coordenadas de imagen de un punto de la pantalla. */
    _uvEn(clientX, clientY) {
        const r = this.renderer.domElement.getBoundingClientRect()
        return [
            this._cu + ((clientX - r.left) / r.width - 0.5) * this._z,
            this._cv + ((clientY - r.top) / r.height - 0.5) * this._alto()
        ]
    }

    /** Identificador de lote bajo un punto de la pantalla, o 0. */
    idEn(clientX, clientY) {
        const [u, v] = this._uvEn(clientX, clientY)
        if (u < 0 || u > 1 || v < 0 || v > 1) return 0
        const { datos, W, H } = this._pick
        const x = Math.min(W - 1, Math.max(0, Math.floor(u * W)))
        const y = Math.min(H - 1, Math.max(0, Math.floor(v * H)))
        const i = (y * W + x) * 4
        const id = datos[i] + datos[i + 1] * 256
        return this.porId.has(id) ? id : 0
    }

    _tocar(clientX, clientY) {
        const id = this.idEn(clientX, clientY)
        if (!id) return
        const l = this.porId.get(id)
        this._sel = id
        this._pintar()
        this._sucio = true
        this.focusLot(id)
        this.dispatchEvent(new CustomEvent('lotpick', {
            detail: {
                id: l.id, n: l.n, stage: l.stage, area: l.area,
                sold: !!l.sold, price: null, cx: 0, cy: 0
            }
        }))
    }

    // ---------- pintado ----------

    _pintar() {
        const t = this._tabla
        t.fill(0)
        for (const l of this.lotes) {
            const i = l.id * 4
            /* Fuera de la etapa elegida el lote se apaga un poco. Es lo único
               que se pinta en reposo: el plano ya está dibujado en la foto y
               taparlo con rectángulos de color lo ensucia. */
            if (!this._enFiltro(l)) {
                t[i] = 6; t[i + 1] = 12; t[i + 2] = 20; t[i + 3] = 95
            } else if (l.sold && this._marcarVendidos) {
                t[i] = SOLD.r * 255; t[i + 1] = SOLD.g * 255; t[i + 2] = SOLD.b * 255; t[i + 3] = 70
            }
        }
        if (this._mat) {
            this._mat.uniforms.tabla.value.needsUpdate = true
            this._mat.uniforms.sel.value = this._sel
            this._mat.uniforms.hov.value = this._hov
        }
    }

    _enFiltro(l) {
        const f = this._filtro || {}
        if (f.stage && l.stage !== f.stage) return false
        return true
    }

    // ---------- números ----------

    _etiquetas() {
        const capa = document.createElement('div')
        Object.assign(capa.style, {
            position: 'absolute', inset: '0', pointerEvents: 'none', overflow: 'hidden'
        })
        this.appendChild(capa)
        this.etiquetas = this.lotes.map(l => {
            const el = document.createElement('div')
            el.textContent = l.n ?? '·'
            Object.assign(el.style, {
                position: 'absolute', left: '0', top: '0',
                transform: 'translate3d(-9999px,-9999px,0)',
                whiteSpace: 'nowrap', willChange: 'transform', visibility: 'hidden',
                font: '700 11px Montserrat, sans-serif', letterSpacing: '.02em',
                padding: '2px 6px', borderRadius: '6px',
                background: 'rgba(10,18,28,.78)', color: 'rgba(255,255,255,.95)',
                border: '1px solid rgba(118,216,69,.45)'
            })
            capa.appendChild(el)
            return { el, l }
        })
    }

    _colocarEtiquetas() {
        if (!this.etiquetas || !this._sucio) return
        this._sucio = false
        const w = this.clientWidth, h = this.clientHeight
        const alto = this._alto()
        for (const E of this.etiquetas) {
            const l = E.l
            /* En la página solo se ve el número del lote apuntado y el del
               elegido. En el editor, todos. */
            const vivo = this._todosLosNumeros || this._sel === l.id || this._hov === l.id
            if (!vivo || !this._enFiltro(l)) {
                if (E.on) { E.el.style.visibility = 'hidden'; E.on = false }
                continue
            }
            const x = ((l.u - this._cu) / this._z + 0.5) * w
            const y = ((l.v - this._cv) / alto + 0.5) * h
            if (x < -40 || y < -20 || x > w + 40 || y > h + 20) {
                if (E.on) { E.el.style.visibility = 'hidden'; E.on = false }
                continue
            }
            E.el.style.transform =
                `translate3d(${Math.round(x)}px,${Math.round(y)}px,0) translate(-50%,-50%)`
            if (!E.on) { E.el.style.visibility = 'visible'; E.on = true }
        }
    }

    // ---------- lo que usa la página ----------

    focusLot(id) {
        const l = this.porId.get(id)
        if (!l) return
        const c = l.caja
        const anc = (this.clientWidth || 1280) / (this.clientHeight || 720)
        const z = Math.max((c[2] - c[0]), (c[3] - c[1]) * anc / this._relacion) * 4.5
        this._volarA({ u: l.u, v: l.v, z: Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z)) }, 1.1)
    }

    select(id) {
        this._sel = this.porId.has(id) ? id : 0
        this._pintar()
        this._sucio = true
        if (this._sel) this.focusLot(this._sel)
    }

    clear() {
        this._sel = 0
        this._pintar()
        this._sucio = true
        this.resetView()
    }

    resetView() {
        this._volarA(this._encuadre(this.lotes.filter(l => this._enFiltro(l))))
    }

    setFilter(f) {
        this._filtro = f || {}
        this._pintar()
        this._sucio = true
        // Elegir una etapa además acerca la cámara a esa etapa.
        if (!this._sel) this._volarA(this._encuadre(this.lotes.filter(l => this._enFiltro(l))))
    }

    setNumbers(todos) {
        this._todosLosNumeros = !!todos && this.getAttribute('editor') === '1'
        this._sucio = true
    }

    /* El visor de terreno tenía capas, modos, calce y edición sobre el mapa.
       Acá no hay nada de eso, pero la página todavía llama a estos métodos: se
       dejan sin efecto para no obligarla a saber qué visor le tocó. */
    cinematic() { }
    setLayer() { }
    setMode() { }
    setEnv() { }
    setAlign() { }
    topDown() { }
    nudgeYaw() { }
    nudgeAlt() { }
    setPanoYaw() { }
    setEditor() { }
    setMezcla() { }
    setDragMode() { }
    orbit() { }
    dolly(f) { this._z = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, this._z * f)); this._sucio = true }
    get dem() { return null }
    height() { return 0 }
}

function cargarTextura(src) {
    return new Promise((res, rej) => {
        new THREE.TextureLoader().load(src, t => {
            t.colorSpace = THREE.SRGBColorSpace
            t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
            t.minFilter = THREE.LinearMipmapLinearFilter
            t.magFilter = THREE.LinearFilter
            t.anisotropy = 8
            res(t)
        }, undefined, rej)
    })
}

/**
 * El mapa de identificadores, en la GPU para pintar y en la CPU para saber qué
 * hay bajo el cursor. Se lee a media resolución y con el suavizado apagado: un
 * identificador interpolado es otro identificador.
 */
function cargarMapa(src) {
    return new Promise((res, rej) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
            const W = Math.round(img.width / PICK_DIV), H = Math.round(img.height / PICK_DIV)
            const c = document.createElement('canvas')
            c.width = W; c.height = H
            const g = c.getContext('2d', { willReadFrequently: true })
            g.imageSmoothingEnabled = false
            g.drawImage(img, 0, 0, W, H)
            res({ imagen: img, datos: g.getImageData(0, 0, W, H).data, W, H })
        }
        img.onerror = rej
        img.src = src
    })
}

if (!customElements.get('plano-lotes')) customElements.define('plano-lotes', PlanoLotes)

export default PlanoLotes
