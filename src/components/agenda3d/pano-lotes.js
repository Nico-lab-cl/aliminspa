/**
 * Visor de la panorámica del dron con los lotes tocables.
 *
 * No proyecta nada. La cámara se queda donde estaba el dron y el visitante
 * gira y hace zoom: lo que se ve es la foto tal cual, sin reproyectar, así que
 * es nítida en todas partes y no hay que saber dónde estaba el dron.
 *
 * El visor anterior estiraba esta misma panorámica sobre un terreno y la
 * miraba desde otra posición. Eso agrandaba el cono ciego del nadir —15° de
 * foto convertidos en media pantalla— y obligaba a adivinar la posición del
 * vuelo. Mirándola de frente, esos 15° vuelven a ser 15°.
 *
 * Los lotes no son geometría: son un mapa de identificadores del mismo tamaño
 * que la panorámica, con un número por recinto, sacado de las líneas que ya
 * vienen dibujadas en la foto. Sirve para dos cosas a la vez: saber qué lote
 * hay bajo el cursor (se lee el píxel) y pintar solo ese lote (lo compara el
 * shader). Los bordes salen exactos porque son los del propio dibujo.
 */

import * as THREE from 'three'

const RAD = Math.PI / 180
const TAU = Math.PI * 2

/** Campo visual: mínimo es el acercamiento a un lote, máximo la vista general. */
const FOV_MIN = 16, FOV_MAX = 82

const PITCH_MAX = 8 * RAD

/**
 * Depresión a partir de la cual la foto ya no sirve.
 *
 * El vuelo no alcanzó el nadir: el stitch llega a 4° de mirar hacia abajo y el
 * detalle se derrumba pasados los 83° de depresión. Ese cono no se puede
 * rellenar con nada. En una equirectangular todas las direcciones convergen en
 * el polo, así que lo que se ponga ahí es constante a lo largo de la fila —y
 * sale un disco— o varía —y sale una estrella de rayos—. Se probaron ocho
 * rellenos y los ocho se ven.
 *
 * Como la cámara está en el punto del vuelo, hay una salida que antes no
 * existía: no mirarlo nunca. El cabeceo se limita para que el borde de abajo
 * del cuadro no baje de acá, y el cono ciego queda siempre fuera de pantalla.
 * El loteo llega a 80° de depresión, así que entra entero igual.
 */
const PITCH_MIN = -88 * RAD

/** Para el picking basta media resolución: un lote son decenas de píxeles. */
const PICK_DIV = 2

const SEL = new THREE.Color(0x76d845)
const HOV = new THREE.Color(0xb9e79a)
const SOLD = new THREE.Color(0xe5484d)

class PanoLotes extends HTMLElement {
    connectedCallback() {
        if (this._arrancado) {
            // Volvió al DOM: se retoma el bucle sin rearmar nada.
            if (this._cuadro && !this._raf) this._raf = requestAnimationFrame(this._cuadro)
            return
        }
        this._arrancado = true
        this.style.display = 'block'
        this.style.position = 'relative'
        this.style.overflow = 'hidden'
        this._boot().catch(e => console.error('pano-lotes', e))
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
        const [celdas, panoTex, mapa, sueloTex, suelo] = await Promise.all([
            fetch(this.getAttribute('celdas')).then(r => r.json()),
            cargarTextura(this.getAttribute('pano')),
            cargarMapa(this.getAttribute('mapa')),
            cargarTextura(this.getAttribute('suelo')).catch(() => null),
            fetch(this.getAttribute('suelo-datos')).then(r => r.json()).catch(() => null)
        ])
        /* Sin el trozo de suelo el visor sigue andando: se limita el cabeceo
           como antes y el cono ciego se queda fuera de cuadro. */
        this._suelo = sueloTex && suelo ? suelo : null

        this.celdas = celdas.celdas
        this.porId = new Map(this.celdas.map(c => [c.id, c]))
        this._pick = mapa                       // { datos, W, H } para leer el id
        this._sel = 0
        this._hov = 0
        this._filtro = {}

        const renderer = new THREE.WebGLRenderer({ antialias: true })
        renderer.setPixelRatio(Math.min(devicePixelRatio, this.getAttribute('quality') === 'baja' ? 1.5 : 2))
        renderer.outputColorSpace = THREE.SRGBColorSpace
        this.appendChild(renderer.domElement)
        Object.assign(renderer.domElement.style, {
            width: '100%', height: '100%', display: 'block', cursor: 'grab', touchAction: 'none'
        })

        const scene = new THREE.Scene()
        const cam = new THREE.PerspectiveCamera(FOV_MAX, 1, 0.1, 10)

        /* Estado de cada lote en una tabla de una fila: el shader la consulta
           por identificador. Así el tinte de los 131 lotes se cambia sin tocar
           geometría ni recompilar nada. */
        const N = this.celdas.reduce((m, c) => Math.max(m, c.id), 0) + 1
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
                pano: { value: panoTex },
                ids: { value: idTex },
                tabla: { value: tablaTex },
                nTabla: { value: N },
                sel: { value: 0 },
                hov: { value: 0 },
                colSel: { value: new THREE.Vector3(SEL.r, SEL.g, SEL.b) },
                colHov: { value: new THREE.Vector3(HOV.r, HOV.g, HOV.b) },
                invProj: { value: new THREE.Matrix4() },
                camRot: { value: new THREE.Matrix3() },
                suelo: { value: sueloTex || panoTex },
                haySuelo: { value: this._suelo ? 1 : 0 },
                alt: { value: this._suelo ? this._suelo.alt : 100 },
                lado: { value: this._suelo ? this._suelo.lado : 100 },
                giro: { value: this._suelo ? this._suelo.yaw * RAD : 0 },
                depDesde: { value: (this._suelo ? this._suelo.desde : 77) * RAD },
                depHasta: { value: (this._suelo ? this._suelo.hasta : 85) * RAD }
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
                uniform sampler2D pano;
                uniform sampler2D ids;
                uniform sampler2D tabla;
                uniform float nTabla, sel, hov;
                uniform vec3 colSel, colHov;
                uniform mat4 invProj;
                uniform mat3 camRot;
                uniform sampler2D suelo;
                uniform float haySuelo, alt, lado, giro, depDesde, depHasta;
                varying vec2 vNdc;

                const float PI = 3.14159265359;
                const float TAU = 6.2831853072;

                /** Identificador de celda en unas coordenadas de la panorámica. */
                float idEn(vec2 uv) {
                    vec2 e = texture2D(ids, uv).rg;
                    return floor(e.r * 255.0 + 0.5) + floor(e.g * 255.0 + 0.5) * 256.0;
                }

                /** De un punto del suelo, en metros desde el dron, a la panorámica. */
                vec2 aPano(vec2 m) {
                    float r = max(0.5, length(m));
                    float t = atan(m.y, m.x);
                    float u = 0.5 - t / TAU + giro / TAU;
                    float dep = atan(alt / r);
                    return vec2(fract(u), 0.5 - dep / PI);
                }

                void main() {
                    /* Rayo exacto por píxel a partir de las matrices de la
                       cámara. Con una esfera teselada la dirección sale
                       interpolada y el plano dibujado se dobla en las costuras. */
                    vec4 p = invProj * vec4(vNdc, -1.0, 1.0);
                    vec3 d = normalize(camRot * normalize(p.xyz / p.w));

                    vec2 uv = vec2(
                        atan(d.x, d.z) / ${TAU.toFixed(10)} + 0.5,
                        0.5 + asin(clamp(d.y, -1.0, 1.0)) / PI);

                    vec3 col = texture2D(pano, uv).rgb;

                    /* Punto ciego del vuelo. La panorámica no llega al nadir,
                       y ahí dentro no se puede rellenar: en el polo todas las
                       direcciones convergen en un punto, así que cualquier
                       relleno sale como un disco o como una estrella.

                       Fuera de la panorámica sí. El rayo se cruza con el suelo
                       y se lee un trozo de foto cenital en metros, que no
                       converge en ninguna parte. Es lo mismo que hacía el mapa
                       anterior abriendo el manto bajo el dron, pero resuelto
                       por píxel en vez de con una capa por debajo. */
                    if (haySuelo > 0.5 && d.y < 0.0) {
                        float dep = asin(clamp(-d.y, 0.0, 1.0));
                        float mezcla = smoothstep(depDesde, depHasta, dep);
                        if (mezcla > 0.001) {
                            float r = alt * length(d.xz) / max(1e-4, -d.y);
                            float t = giro - atan(d.x, d.z);
                            vec2 mundo = vec2(cos(t), sin(t)) * r;
                            vec2 uvSuelo = mundo / lado + 0.5;
                            if (all(greaterThan(uvSuelo, vec2(0.0))) &&
                                all(lessThan(uvSuelo, vec2(1.0)))) {
                                // La fila 0 del trozo es el borde -lado/2 en Z.
                                vec3 c = texture2D(suelo, vec2(uvSuelo.x, 1.0 - uvSuelo.y)).rgb;

                                /* Dentro del relleno la foto ya no trae los
                                   deslindes dibujados, y los lotes quedarían
                                   sin borde justo en el medio. Se vuelven a
                                   trazar desde el mapa de identificadores,
                                   comparando el lote de este punto con el de
                                   sus vecinos a 0,8 m. Al medirlo en metros y
                                   no en píxeles de la panorámica, el trazo
                                   sale del mismo grosor en todas partes. */
                                float aqui = idEn(aPano(mundo));
                                float dx = idEn(aPano(mundo + vec2(0.8, 0.0)));
                                float dz = idEn(aPano(mundo + vec2(0.0, 0.8)));
                                float borde = (abs(aqui - dx) > 0.5 || abs(aqui - dz) > 0.5) ? 1.0 : 0.0;
                                c = mix(c, vec3(0.93), borde * 0.85);

                                col = mix(col, c, mezcla);
                            }
                        }
                    }

                    vec2 e = texture2D(ids, uv).rg;
                    float id = floor(e.r * 255.0 + 0.5) + floor(e.g * 255.0 + 0.5) * 256.0;
                    if (id > 0.5) {
                        vec4 st = texture2D(tabla, vec2((id + 0.5) / nTabla, 0.5));
                        vec3 tinte = st.rgb;
                        float fuerza = st.a;
                        if (abs(id - sel) < 0.5) { tinte = colSel; fuerza = 0.5; }
                        else if (abs(id - hov) < 0.5) { tinte = colHov; fuerza = 0.28; }
                        col = mix(col, tinte, fuerza);
                    }
                    gl_FragColor = vec4(col, 1.0);
                    /* La textura viene marcada como sRGB, así que al muestrearla
                       three.js la pasa a lineal. Con un material propio nadie la
                       devuelve al espacio de salida, y la foto sale oscura: hay
                       que pedir la conversión a mano. */
                    #include <colorspace_fragment>
                }`
        })

        const telon = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this._mat)
        telon.frustumCulled = false
        scene.add(telon)

        Object.assign(this, { renderer, scene, cam })

        // Vista de entrada: el loteo llenando el cuadro.
        const enc = this._encuadre()
        this._yaw = enc.yaw
        this._pitch = enc.pitch
        this._fov = enc.fov
        /* Arranca girando despacio. Con los lotes repartidos en toda la vuelta,
           girar no es un adorno: es la única forma de verlos todos, y el giro
           lo dice sin tener que explicarlo. Se detiene al primer toque. */
        this._cine = true

        this._controles()
        this._etiquetas()

        const encajar = () => {
            const w = this.clientWidth || 800, h = this.clientHeight || 600
            if (w === this._w && h === this._h) return
            this._w = w; this._h = h
            cam.aspect = w / h
            renderer.setSize(w, h, false)
        }
        encajar()
        new ResizeObserver(encajar).observe(this)

        /* Bucle propio en vez de renderer.setAnimationLoop: el envoltorio React
           apaga ese bucle en su limpieza —está escrito para el visor anterior—
           y en desarrollo, con el doble montaje de StrictMode, deja la escena
           congelada en el primer cuadro. Acá el ciclo de vida lo lleva el
           elemento: arranca al conectarse y se detiene al salir del DOM. */
        let previo = performance.now()
        this._cuadro = now => {
            if (!this.isConnected) { this._raf = 0; return }
            this._raf = requestAnimationFrame(this._cuadro)
            const dt = Math.min(0.05, (now - previo) / 1000)
            previo = now
            encajar()
            this._animar(dt)
            /* Después de animar y antes de dibujar: al alejarse, el tope sube
               y hay que arrastrar el cabeceo con él. */
            this._pitch = Math.min(PITCH_MAX, Math.max(this._topePitch(), this._pitch))
            cam.fov = this._fov
            cam.updateProjectionMatrix()
            cam.quaternion.setFromRotationMatrix(
                new THREE.Matrix4().lookAt(
                    new THREE.Vector3(0, 0, 0), this._mirada(), new THREE.Vector3(0, 1, 0)))
            cam.updateMatrixWorld()
            this._mat.uniforms.invProj.value.copy(cam.projectionMatrixInverse)
            this._mat.uniforms.camRot.value.setFromMatrix4(cam.matrixWorld)
            renderer.render(scene, cam)
            try { this._colocarEtiquetas() } catch (e) { this.etiquetas = null }
        }
        this._raf = requestAnimationFrame(this._cuadro)

        this._pintar()

        const enVenta = this.celdas.filter(c => c.n != null)
        const porEtapa = {}
        for (const c of enVenta) {
            const e = (porEtapa[c.stage] ||= { total: 0, disponibles: 0 })
            e.total++
            if (!c.sold) e.disponibles++
        }
        this.dispatchEvent(new CustomEvent('ready', {
            detail: {
                calibrado: true,
                layer: 'dron',
                provisional: !!celdas.provisional,
                conteo: {
                    total: enVenta.length,
                    disponibles: enVenta.filter(c => !c.sold).length,
                    porEtapa
                }
            }
        }))
    }

    // ---------- direcciones ----------

    /** Dirección unitaria hacia una celda, desde su centro en la panorámica. */
    _dir(c) {
        const th = (c.u - 0.5) * TAU
        const el = (0.5 - c.v) * Math.PI      // v va desde arriba; el shader usa el mismo eje
        const ce = Math.cos(el)
        return new THREE.Vector3(Math.sin(th) * ce, Math.sin(el), Math.cos(th) * ce)
    }

    /**
     * Cabeceo mínimo. Fijo, casi el nadir.
     *
     * Antes era dinámico y dependía del campo, porque el cono ciego se evitaba
     * no mirándolo: había que apuntar más arriba cuanto más ancho el cuadro.
     * Ahora el cono se rellena con el trozo de suelo, así que se puede mirar
     * hacia abajo sin más. Los dos grados que faltan para el nadir son para no
     * dejar la cámara mirando paralela a su propio eje vertical.
     */
    _topePitch() {
        return PITCH_MIN
    }

    _mirada() {
        const cp = Math.cos(this._pitch)
        return new THREE.Vector3(
            Math.sin(this._yaw) * cp, Math.sin(this._pitch), Math.cos(this._yaw) * cp)
    }

    /**
     * Encuadre de entrada: apunta al centro de masa de los lotes y abre el
     * campo justo lo necesario para que entren todos.
     *
     * El campo no se deja fijo porque un encuadre de más se paga caro: en una
     * proyección rectilínea las esquinas de un campo ancho se estiran mucho, y
     * el loteo queda chico en el medio rodeado de cerro.
     */
    /**
     * Encuadre que deja a la vista un grupo de lotes.
     *
     * Los lotes rodean al dron: el vuelo quedó sobre el medio del loteo, así
     * que hay terreno en los 360°, con un solo hueco de 24° de rumbo. Eso tiene
     * dos consecuencias que mandan sobre todo lo demás.
     *
     * La primera es que ninguna vista los muestra todos: un tercio siempre
     * queda a la espalda. La segunda es que abrir el campo no ayuda. Medido:
     * de 46° a 82° de campo entran los mismos 88 lotes, porque los que faltan
     * no están lejos sino detrás. Abrir de más solo achica lo que sí se ve.
     *
     * Por eso el campo no se elige para que entre todo, sino que se cierra
     * hasta el último grado que no cuesta lotes. Y el rumbo tampoco sale del
     * centro de masa —con lotes en toda la vuelta ese centro no significa
     * nada— sino de probar la vuelta entera y quedarse con la dirección desde
     * la que se ven más.
     */
    _encuadre(celdas = this.celdas) {
        const lista = celdas && celdas.length ? celdas : this.celdas
        const dirs = lista.map(c => this._dir(c))
        const aspecto = Math.max(0.5, (this.clientWidth || 1280) / (this.clientHeight || 720))
        const ARRIBA = new THREE.Vector3(0, 1, 0)

        // Altura media del grupo: el cabeceo sale de ahí, y el tope lo corrige.
        let elev = 0
        for (const d of dirs) elev += Math.asin(Math.max(-1, Math.min(1, d.y)))
        elev /= Math.max(1, dirs.length)

        const cabeceo = () => Math.max(PITCH_MIN, Math.min(PITCH_MAX, elev))

        /** Cuántos lotes del grupo caen dentro del cuadro. */
        const dentro = (yaw, fov) => {
            const pitch = cabeceo()
            const cp = Math.cos(pitch)
            const f = new THREE.Vector3(Math.sin(yaw) * cp, Math.sin(pitch), Math.cos(yaw) * cp)
            const der = new THREE.Vector3().crossVectors(ARRIBA, f).normalize()
            const arr = new THREE.Vector3().crossVectors(f, der)
            const t = Math.tan(fov * RAD / 2)
            let n = 0
            for (const d of dirs) {
                const z = d.dot(f)
                if (z <= 0.05) continue
                if (Math.abs(d.dot(arr)) / z <= t && Math.abs(d.dot(der)) / z <= t * aspecto) n++
            }
            return n
        }

        // Rumbo: se prueba la vuelta entera con el campo abierto.
        let yaw = 0, mejor = -1
        for (let g = 0; g < 360; g += 5) {
            const n = dentro(g * RAD, FOV_MAX)
            if (n > mejor) { mejor = n; yaw = g * RAD }
        }

        // Campo: el más cerrado que conserva prácticamente los mismos lotes.
        let fov = FOV_MAX
        for (let f = FOV_MIN; f <= FOV_MAX; f += 2) {
            if (dentro(yaw, f) >= mejor * 0.95) { fov = f; break }
        }
        fov = Math.max(FOV_MIN, Math.min(FOV_MAX, fov * 1.06))   // un respiro en los bordes

        return { yaw, pitch: cabeceo(), fov }
    }

    // ---------- mirar y acercarse ----------

    _controles() {
        const lienzo = this.renderer.domElement
        let arrastrando = false, px = 0, py = 0, movido = 0

        lienzo.addEventListener('pointerdown', e => {
            arrastrando = true; movido = 0
            px = e.clientX; py = e.clientY
            lienzo.setPointerCapture(e.pointerId)
            lienzo.style.cursor = 'grabbing'
            this._cine = false
        })
        lienzo.addEventListener('pointermove', e => {
            if (!arrastrando) {
                const id = this.idEn(e.clientX, e.clientY)
                if (id !== this._hov) { this._hov = id; this._pintar(); this._sucio = true }
                lienzo.style.cursor = id ? 'pointer' : 'grab'
                return
            }
            const dx = e.clientX - px, dy = e.clientY - py
            px = e.clientX; py = e.clientY
            movido += Math.abs(dx) + Math.abs(dy)
            // El paso se escala con el zoom: acercado, el mismo gesto mueve menos.
            const k = this._fov * RAD / Math.max(1, this.clientHeight)
            this._yaw -= dx * k
            this._pitch = Math.max(this._topePitch(), Math.min(PITCH_MAX, this._pitch + dy * k))
            this._destino = null
            this._sucio = true
        })
        const soltar = e => {
            if (!arrastrando) return
            arrastrando = false
            lienzo.style.cursor = 'grab'
            try { lienzo.releasePointerCapture(e.pointerId) } catch { }
            // Un arrastre no es un clic: sin esto, girar el mapa abre una ficha.
            if (movido < 6) this._tocar(e.clientX, e.clientY)
        }
        lienzo.addEventListener('pointerup', soltar)
        lienzo.addEventListener('pointercancel', () => { arrastrando = false })
        lienzo.addEventListener('pointerleave', () => {
            if (this._hov) { this._hov = 0; this._pintar(); this._sucio = true }
        })

        lienzo.addEventListener('wheel', e => {
            e.preventDefault()
            this._cine = false
            this._destino = null
            this._fov = Math.max(FOV_MIN, Math.min(FOV_MAX, this._fov * Math.exp(e.deltaY * 0.0012)))
            this._sucio = true
        }, { passive: false })

        // Pellizco en celular.
        const dedos = new Map()
        let sep0 = 0, fov0 = 0
        lienzo.addEventListener('pointerdown', e => {
            dedos.set(e.pointerId, e)
            if (dedos.size === 2) {
                const [a, b] = [...dedos.values()]
                sep0 = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
                fov0 = this._fov
            }
        })
        lienzo.addEventListener('pointermove', e => {
            if (!dedos.has(e.pointerId)) return
            dedos.set(e.pointerId, e)
            if (dedos.size !== 2) return
            const [a, b] = [...dedos.values()]
            const sep = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
            if (sep0 > 10) {
                this._fov = Math.max(FOV_MIN, Math.min(FOV_MAX, fov0 * sep0 / sep))
                this._sucio = true
            }
        })
        const quitar = e => dedos.delete(e.pointerId)
        lienzo.addEventListener('pointerup', quitar)
        lienzo.addEventListener('pointercancel', quitar)
    }

    _animar(dt) {
        if (this._destino) {
            const d = this._destino
            d.t = Math.min(1, d.t + dt / d.dur)
            // Cúbico simétrico: sale y llega suave, como una cámara de verdad.
            const u = d.t < 0.5 ? 4 * d.t ** 3 : 1 - (-2 * d.t + 2) ** 3 / 2
            this._yaw = d.y0 + angulo(d.y1 - d.y0) * u
            this._pitch = d.p0 + (d.p1 - d.p0) * u
            this._fov = d.f0 + (d.f1 - d.f0) * u
            this._sucio = true
            if (d.t >= 1) this._destino = null
        } else if (this._cine) {
            this._yaw += dt * 0.035     // unos 2° por segundo
            this._sucio = true
        }
    }

    // ---------- qué lote hay acá ----------

    /** Identificador de celda bajo un punto de la pantalla, o 0. */
    idEn(clientX, clientY) {
        const r = this.renderer.domElement.getBoundingClientRect()
        const nx = (clientX - r.left) / r.width * 2 - 1
        const ny = 1 - (clientY - r.top) / r.height * 2
        const p = new THREE.Vector3(nx, ny, -1).applyMatrix4(this.cam.projectionMatrixInverse)
        const d = p.normalize().applyMatrix3(
            new THREE.Matrix3().setFromMatrix4(this.cam.matrixWorld)).normalize()

        const u = Math.atan2(d.x, d.z) / TAU + 0.5
        const v = 0.5 + Math.asin(Math.max(-1, Math.min(1, d.y))) / Math.PI
        const { datos, W, H } = this._pick
        const x = Math.min(W - 1, Math.max(0, Math.floor(((u % 1) + 1) % 1 * W)))
        const y = Math.min(H - 1, Math.max(0, Math.floor((1 - v) * H)))
        const i = (y * W + x) * 4
        const id = datos[i] + datos[i + 1] * 256
        return this.porId.has(id) ? id : 0
    }

    _tocar(clientX, clientY) {
        const id = this.idEn(clientX, clientY)
        if (!id) return
        const c = this.porId.get(id)
        this._sel = id
        this._pintar()
        this._sucio = true
        this.focusLot(id)
        this.dispatchEvent(new CustomEvent('lotpick', {
            detail: {
                id: c.id, n: c.n, stage: c.stage, area: c.area,
                sold: !!c.sold, price: null, cx: 0, cy: 0
            }
        }))
    }

    // ---------- pintado ----------

    _pintar() {
        const t = this._tabla
        t.fill(0)
        for (const c of this.celdas) {
            const i = c.id * 4
            /* Fuera de la etapa elegida el lote se apaga un poco. Es lo único
               que se pinta en reposo: el plano ya está dibujado en la foto y
               taparlo con rectángulos de color lo ensucia. */
            if (!this._enFiltro(c)) {
                t[i] = 6; t[i + 1] = 12; t[i + 2] = 20; t[i + 3] = 90
            } else if (c.sold && this._marcarVendidos) {
                t[i] = SOLD.r * 255; t[i + 1] = SOLD.g * 255; t[i + 2] = SOLD.b * 255; t[i + 3] = 70
            }
        }
        if (this._mat) {
            this._mat.uniforms.tabla.value.needsUpdate = true
            this._mat.uniforms.sel.value = this._sel
            this._mat.uniforms.hov.value = this._hov
        }
    }

    _enFiltro(c) {
        const f = this._filtro || {}
        if (f.stage && c.stage !== f.stage) return false
        return true
    }

    // ---------- números ----------

    _etiquetas() {
        const capa = document.createElement('div')
        Object.assign(capa.style, {
            position: 'absolute', inset: '0', pointerEvents: 'none', overflow: 'hidden'
        })
        this.appendChild(capa)
        this.etiquetas = this.celdas.map(c => {
            const el = document.createElement('div')
            el.textContent = c.n ?? '·'
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
            return { el, c, v: new THREE.Vector3() }
        })
        this._capaEtiquetas = capa
    }

    _colocarEtiquetas() {
        if (!this.etiquetas || !this._sucio) return
        this._sucio = false
        const w = this.clientWidth, h = this.clientHeight
        for (const L of this.etiquetas) {
            const c = L.c
            /* Igual que en el mapa anterior: en la página solo se ve el número
               del lote apuntado y el del elegido. En el editor, todos. */
            const vivo = this._todosLosNumeros || this._sel === c.id || this._hov === c.id
            if (!vivo || !this._enFiltro(c)) {
                if (L.on) { L.el.style.visibility = 'hidden'; L.on = false }
                continue
            }
            L.v.copy(this._dir(c)).multiplyScalar(5).project(this.cam)
            if (L.v.z > 1 || Math.abs(L.v.x) > 1.05 || Math.abs(L.v.y) > 1.05) {
                if (L.on) { L.el.style.visibility = 'hidden'; L.on = false }
                continue
            }
            L.el.style.transform =
                `translate3d(${Math.round((L.v.x * 0.5 + 0.5) * w)}px,${Math.round((-L.v.y * 0.5 + 0.5) * h)}px,0) translate(-50%,-50%)`
            if (!L.on) { L.el.style.visibility = 'visible'; L.on = true }
        }
    }

    // ---------- lo que usa la página ----------

    focusLot(id) {
        const c = this.porId.get(id)
        if (!c) return
        const d = this._dir(c)
        this._cine = false
        this._destino = {
            t: 0, dur: 1.25,
            y0: this._yaw, y1: Math.atan2(d.x, d.z),
            p0: this._pitch,
            p1: Math.max(PITCH_MIN, Math.min(PITCH_MAX, Math.asin(d.y))),
            f0: this._fov, f1: 30
        }
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
        const enc = this._encuadre(this.celdas.filter(c => this._enFiltro(c)))
        this._destino = {
            t: 0, dur: 1,
            y0: this._yaw, y1: enc.yaw,
            p0: this._pitch, p1: enc.pitch,
            f0: this._fov, f1: enc.fov
        }
    }

    setFilter(f) {
        this._filtro = f || {}
        this._pintar()
        this._sucio = true
        /* Elegir una etapa además acerca la cámara a esa etapa. Sin esto el
           chip solo apagaba un poco el resto y el visitante seguía viendo el
           loteo entero desde lejos, que es justo lo que cuesta mirar. */
        if (!this._sel) this._volarA(this._encuadre(this.celdas.filter(c => this._enFiltro(c))))
    }

    /** Vuelo suave hacia un encuadre. */
    _volarA(enc, dur = 1) {
        this._cine = false
        this._destino = {
            t: 0, dur,
            y0: this._yaw, y1: enc.yaw,
            p0: this._pitch, p1: enc.pitch,
            f0: this._fov, f1: enc.fov
        }
    }

    setNumbers(todos) {
        this._todosLosNumeros = !!todos && this.getAttribute('editor') === '1'
        this._sucio = true
    }

    cinematic(on) {
        this._cine = !!on
        if (on) this._destino = null
    }

    /* El visor anterior tenía capas, modos, calce y edición sobre el terreno.
       Acá no hay terreno que calzar, pero la página todavía llama a estos
       métodos: se dejan sin efecto para no obligarla a saber qué visor le tocó. */
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
    dolly(f) {
        this._fov = Math.max(FOV_MIN, Math.min(FOV_MAX, this._fov * f))
        this._sucio = true
    }
    orbit(deg) { this._yaw += deg * RAD; this._sucio = true }
    get dem() { return null }
    height() { return 0 }
}

/** Diferencia de ángulos por el lado corto, para que el giro no dé la vuelta larga. */
function angulo(a) {
    while (a > Math.PI) a -= TAU
    while (a < -Math.PI) a += TAU
    return a
}

function cargarTextura(src) {
    return new Promise((res, rej) => {
        new THREE.TextureLoader().load(src, t => {
            t.colorSpace = THREE.SRGBColorSpace
            t.wrapS = THREE.RepeatWrapping
            t.wrapT = THREE.ClampToEdgeWrapping
            t.minFilter = THREE.LinearFilter      // sin mipmaps: no es potencia de dos en v
            t.generateMipmaps = false
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

if (!customElements.get('pano-lotes')) customElements.define('pano-lotes', PanoLotes)

export default PanoLotes
