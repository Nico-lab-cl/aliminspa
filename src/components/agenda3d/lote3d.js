/*
 * Visor 3D del loteo Lomas del Mar.
 *
 * Portado del export de Claude Design (Agendamiento-dron/lote3d.js) a la app:
 * three viene de npm en vez del importmap, y el visor acepta un atributo
 * "quality" para bajar el costo en celulares. El resto del cálculo —DEM de
 * AWS Terrain Tiles, ortofoto georreferenciada en UTM 19S, picking de lotes—
 * es el mismo del canvas y no debe tocarse sin volver a validar el calce.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const DEM_Z = 15, TILE = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium';
/* Perfiles de calidad. "baja" es lo que reciben los celulares: la malla del
   terreno se muestrea cada 10 m en vez de cada 6 (unas 3 veces menos vértices)
   y se recorta el filtrado anisotrópico, que es caro en GPUs móviles. */
const QUALITY = {
  alta: { demStep: 6, pixelRatio: 2, anisotropy: 16 },
  baja: { demStep: 10, pixelRatio: 1.5, anisotropy: 4 }
};
const SAT = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile';
const AV = 0x76d845, SOLD = 0xe5484d, SEL = 0xd8f56a, HOV = 0xb9e79a, OFF = 0x2c3540;
// Un lote vendido, al elegirlo, tiene que seguir leyéndose rojo: si se pintara
// del verde de selección parecería disponible justo cuando se lo está mirando.
const SEL_SOLD = 0xff8085;
const NOT_FOR_SALE = 4; // etapa fuera de venta

class Lote3D extends HTMLElement {
  connectedCallback() {
    if (this._up) return;
    this._up = true;
    this.style.display = 'block';
    this.style.width = '100%';
    this.style.height = '100%';
    if (!this.style.position) this.style.position = 'relative';
    this.mode = this.getAttribute('mode') || 'natural';
    this.q = QUALITY[this.getAttribute('quality')] || QUALITY.alta;
    this._boot().catch(e => console.error('lote-3d', e));
  }

  async _boot() {
    const data = await fetch(this.getAttribute('src') || 'mapa-data.json').then(r => r.json());
    /* Lotes dibujados a mano sobre el mapa desde /agendar-visita?editor=1.
       Cuando existen mandan sobre los del repo: son los que el equipo colocó
       mirando la foto. Los originales quedan intactos en mapa-data.json. */
    const propios = await fetch(this.getAttribute('lotes') || '/lomas3d/lotes-editados.json')
      .then(r => r.ok ? r.json() : null).catch(() => null);
    if (propios && Array.isArray(propios.lotes) && propios.lotes.length) {
      data.lots = propios.lotes;
      this.lotesPropios = true;
    }
    this.data = data;
    this._geo = await fetch(this.getAttribute('georef') || 'georef.json')
      .then(r => r.json()).catch(() => null);

    /* Calce del vuelo: dónde estaba el dron y hacia dónde miraba cuando tomó
       la panorámica. Sin estos cuatro números la proyección sobre el terreno
       queda girada y corrida respecto de los lotes. Se ajusta una sola vez
       desde el modo de calce y queda guardado en este archivo. */
    this._vuelo = await fetch(this.getAttribute('vuelo') || '/lomas3d/vuelo.json')
      .then(r => r.ok ? r.json() : null).catch(() => null);
    /* Mientras el calce no esté hecho, la panorámica proyectada aparece
       girada respecto de los lotes: se muestra la ortofoto, que sí está
       georreferenciada. Al guardar el calce, vuelo.json queda con
       calibrado:true y la vista del dron pasa a ser la de entrada. */
    /* La vista del dron es de fiar en dos casos: cuando se calzó la
       panorámica con el terreno, o cuando los lotes se dibujaron a mano
       encima de ella — ahí la propia foto es la referencia y no hay nada
       que calzar. */
    this._calibrado = !!(this._vuelo && this._vuelo.calibrado) || !!this.lotesPropios;
    if (this._vuelo) {
      const v = this._vuelo;
      if (v.x != null) this.setAttribute('drone-x', v.x);
      if (v.z != null) this.setAttribute('drone-z', v.z);
      if (v.alt != null) this.setAttribute('drone-alt', v.alt);
      if (v.yaw != null) this.setAttribute('pano-yaw', v.yaw);
    }

    const R = 111320, kx = R * Math.cos(data.origin.lat * Math.PI / 180);
    this.geo = { R, kx, la: data.origin.lat, lo: data.origin.lng };

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1520);
    scene.fog = new THREE.Fog(0x0a1520, 620, 1500);
    const cam = new THREE.PerspectiveCamera(42, 1, 1, 4000);
    cam.position.set(-180, 420, 300);
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, this.q.pixelRatio));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, { width: '100%', height: '100%', display: 'block' });

    scene.add(new THREE.HemisphereLight(0xdbeaff, 0x6b5a45, 1.5));
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const sun = new THREE.DirectionalLight(0xfff2dc, 1.1);
    sun.position.set(-260, 340, 210);
    scene.add(sun);

    const ctr = new OrbitControls(cam, renderer.domElement);
    ctr.enableDamping = true;
    ctr.dampingFactor = 0.08;
    ctr.maxPolarAngle = Math.PI / 2.15;
    // 60 m era demasiado lejos para colocar un lote sobre un punto concreto
    // de la foto: desde 12 m se distingue el detalle del terreno.
    ctr.minDistance = 12;
    /* La foto del dron cubre unos 610 x 440 m. A 1300 m de distancia el
       encuadre abarca casi 1 km y el visitante ve dónde termina la foto: un
       parche flotando. Con 620 el borde nunca entra en cuadro. */
    ctr.maxDistance = 620;
    Object.assign(this, { scene, cam, renderer, ctr });

    // panorámica real del dron como entorno; se carga aparte para no bloquear el mapa
    this._pano(scene);

    const dem = await this._dem().catch(() => null);
    this.dem = dem;
    /* El mapa es solo la vista del dron: no se piden los mosaicos de Esri ni
       se arma la ortofoto. Son varias decenas de peticiones y medio mega que
       ya no hacen falta. */
    this._terrain(dem, null);
    /* La ortofoto y el relleno satelital se dan de baja: el unico suelo es la
       panoramica del dron. _terrain deja las mallas armadas por compatibilidad,
       asi que se sacan de la escena y se liberan. */
    for (const clave of ['ground', 'ortho']) {
      const malla = this[clave];
      if (!malla) continue;
      this.scene.remove(malla);
      malla.geometry.dispose();
      malla.material.dispose();
      this[clave] = null;
    }

    this._mountDrape();
    this._lots();
    this.setLayer(this._calibrado || this.getAttribute('editor') === '1' ? 'dron' : 'foto');
    this._pick();

    const fit = () => {
      const w = this.clientWidth || 800, h = this.clientHeight || 600;
      if (w === this._fw && h === this._fh) return;
      this._fw = w; this._fh = h;
      cam.aspect = w / h; cam.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    fit();
    new ResizeObserver(fit).observe(this);
    this.resetView(true);

    renderer.setAnimationLoop(() => {
      fit();                      // el ResizeObserver no siempre dispara: se revisa por frame
      ctr.update();
      renderer.render(scene, cam);
      try { this._placeLabels(); } catch (e) { this.labels = null; console.error('lote-3d labels', e); }
    });

    // las etiquetas son accesorias: si fallan, el mapa sigue vivo
    try { this._labels(); } catch (e) { this.labels = null; console.error('lote-3d labels', e); }
    this.dispatchEvent(new CustomEvent('ready', {
      detail: {
        layer: this.layer,
        calibrado: this._calibrado,
        /* La cuenta de disponibles sale de los propios lotes, no de un numero
           escrito a mano: al marcar uno como vendido en el editor, el contador
           de la pagina se corrige solo. */
        conteo: (() => {
          const enVenta = this.data.lots.filter(l => l.stage !== NOT_FOR_SALE);
          const porEtapa = {};
          for (const l of enVenta) {
            const e = (porEtapa[l.stage] ||= { total: 0, disponibles: 0 });
            e.total++;
            if (!l.sold) e.disponibles++;
          }
          return {
            total: enVenta.length,
            disponibles: enVenta.filter(l => !l.sold).length,
            porEtapa
          };
        })(),
        relief: dem ? +(dem.max - dem.min).toFixed(1) : 0,
        source: dem ? dem.source : 'plano'
      }
    }));
  }

  // ---------- elevación real (AWS Terrain Tiles) ----------
  async _dem() {
    const { R, kx, la, lo } = this.geo;
    const N = 2 ** DEM_Z;
    const tileOf = (lat, lng) => {
      const s = Math.sin(lat * Math.PI / 180);
      return [(lng + 180) / 360 * N, (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * N];
    };
    const toLL = (x, z) => [la - z / R, lo + x / kx];
    const X0 = -300, X1 = 310, ZA = -240, ZB = 200, STEP = this.q.demStep;
    const nx = Math.round((X1 - X0) / STEP) + 1, nz = Math.round((ZB - ZA) / STEP) + 1;

    const need = new Set();
    for (const [x, z] of [[X0, ZA], [X1, ZA], [X0, ZB], [X1, ZB], [0, 0]]) {
      const [tx, ty] = tileOf(...toLL(x, z));
      for (const dx of [-1, 0, 1]) for (const dy of [-1, 0, 1]) need.add((Math.floor(tx) + dx) + '/' + (Math.floor(ty) + dy));
    }
    const px = {};
    await Promise.all([...need].map(k => new Promise(res => {
      const [tx, ty] = k.split('/').map(Number);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const c = document.createElement('canvas'); c.width = c.height = 256;
        const g = c.getContext('2d'); g.drawImage(img, 0, 0);
        px[k] = g.getImageData(0, 0, 256, 256).data;
        res();
      };
      img.onerror = () => res();
      img.src = `${TILE}/${DEM_Z}/${tx}/${ty}.png`;
    })));
    if (!Object.keys(px).length) throw new Error('sin tiles');

    const at = (gx, gy) => {
      const k = Math.floor(gx / 256) + '/' + Math.floor(gy / 256);
      const d = px[k];
      if (!d) return null;
      const i = ((((gy % 256) + 256) % 256 | 0) * 256 + (((gx % 256) + 256) % 256 | 0)) * 4;
      return (d[i] * 256 + d[i + 1] + d[i + 2] / 256) - 32768;
    };
    const sample = (x, z) => {
      const [tx, ty] = tileOf(...toLL(x, z));
      const gx = tx * 256 - 0.5, gy = ty * 256 - 0.5;
      const x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0;
      const a = at(x0, y0), b = at(x0 + 1, y0), c = at(x0, y0 + 1), e = at(x0 + 1, y0 + 1);
      if ([a, b, c, e].some(v => v == null)) return null;
      return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + e * fx) * fy;
    };
    const grid = new Float32Array(nx * nz);
    let min = Infinity, max = -Infinity;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const v = sample(X0 + i * STEP, ZA + j * STEP);
      if (v == null) throw new Error('hueco en el DEM');
      grid[j * nx + i] = v;
      if (v < min) min = v; if (v > max) max = v;
    }
    return { nx, nz, step: STEP, x0: X0, z0: ZA, grid, min, max, source: 'AWS Terrain Tiles z15' };
  }

  height(x, z) {
    const d = this.dem;
    if (!d) return 0;
    const fx = (x - d.x0) / d.step, fz = (z - d.z0) / d.step;
    const i = Math.max(0, Math.min(d.nx - 2, Math.floor(fx)));
    const j = Math.max(0, Math.min(d.nz - 2, Math.floor(fz)));
    const tx = Math.max(0, Math.min(1, fx - i)), tz = Math.max(0, Math.min(1, fz - j));
    const g = d.grid, n = d.nx;
    const a = g[j * n + i], b = g[j * n + i + 1], c = g[(j + 1) * n + i], e = g[(j + 1) * n + i + 1];
    return (a * (1 - tx) + b * tx) * (1 - tz) + (c * (1 - tx) + e * tx) * tz - d.min;
  }

  // ---------- entorno: panorámica 360° del dron ----------
  _pano(scene) {
    const src = this.getAttribute('pano');
    if (!src) return;
    new THREE.TextureLoader().load(src, tex => {
      tex.mapping = THREE.EquirectangularReflectionMapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      this.panoTex = tex;
      if (this.env !== 'oscuro') this._applyPano();
      this._buildDrape();
      this.dispatchEvent(new CustomEvent('panoready'));
    }, undefined, e => console.warn('pano', e));
  }

  _applyPano() {
    const s = this.scene;
    if (!this.panoTex) return;
    s.background = this.panoTex;
    // el pano se orienta por yaw: el mar queda al poniente, como en el vuelo
    const yaw = +(this.getAttribute('pano-yaw') || 0) * Math.PI / 180;
    if (s.backgroundRotation) s.backgroundRotation.set(0, yaw, 0);
    s.fog = null;
  }

  setEnv(k) {
    this.env = k;
    if (k === 'oscuro' || !this.panoTex) {
      this.scene.background = new THREE.Color(0x0a1520);
      this.scene.fog = new THREE.Fog(0x0a1520, 620, 1500);
      if (this.scene.backgroundRotation) this.scene.backgroundRotation.set(0, 0, 0);
    } else {
      this._applyPano();
    }
  }

  setPanoYaw(deg) {
    this.setAttribute('pano-yaw', deg);
    if (this.env !== 'oscuro') this._applyPano();
    this._buildDrape();
  }

  // ---------- ortofoto satelital (Esri World Imagery) ----------
  async _sat() {
    const { R, kx, la, lo } = this.geo;
    const d = this.dem;
    const X0 = d ? d.x0 : -300, X1 = d ? d.x0 + d.step * (d.nx - 1) : 310;
    const ZA = d ? d.z0 : -240, ZB = d ? d.z0 + d.step * (d.nz - 1) : 200;
    const Z = 18, N = 2 ** Z;
    const merc = (lat, lng) => {
      const s = Math.sin(lat * Math.PI / 180);
      return [(lng + 180) / 360 * N * 256, (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * N * 256];
    };
    const toLL = (x, z) => [la - z / R, lo + x / kx];
    const [pxW, pyN] = merc(...toLL(X0, ZA));
    const [pxE, pyS] = merc(...toLL(X1, ZB));
    const tx0 = Math.floor(pxW / 256), tx1 = Math.floor(pxE / 256);
    const ty0 = Math.floor(pyN / 256), ty1 = Math.floor(pyS / 256);
    const cols = tx1 - tx0 + 1, rows = ty1 - ty0 + 1;

    const canvas = document.createElement('canvas');
    canvas.width = cols * 256;
    canvas.height = rows * 256;
    const g = canvas.getContext('2d');
    g.fillStyle = '#6b5b45';
    g.fillRect(0, 0, canvas.width, canvas.height);

    let ok = 0;
    const jobs = [];
    for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
      jobs.push(new Promise(res => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => { g.drawImage(img, (tx - tx0) * 256, (ty - ty0) * 256); ok++; res(); };
        img.onerror = () => res();
        img.src = `${SAT}/${Z}/${ty}/${tx}`;
      }));
    }
    await Promise.all(jobs);
    if (!ok) throw new Error('sin ortofoto');

    /* Esri no tiene más resolución que z18 en El Tabo (z19 responde "map data
       not yet available"), así que el suelo satelital es solo el relleno que
       rodea a la foto del dron. Se difumina el borde para que no se vea el
       rectángulo recto flotando cuando el visitante se aleja. */
    const W = canvas.width, H = canvas.height, borde = Math.round(Math.min(W, H) * 0.16);
    g.globalCompositeOperation = 'destination-out';
    for (const [x0, y0, x1, y1, w, h] of [
      [0, 0, borde, 0, borde, H],          // izquierda
      [W, 0, W - borde, 0, borde, H],      // derecha
      [0, 0, 0, borde, W, borde],          // arriba
      [0, H, 0, H - borde, W, borde]       // abajo
    ]) {
      const grad = g.createLinearGradient(x0, y0, x1, y1);
      grad.addColorStop(0, 'rgba(0,0,0,1)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grad;
      g.fillRect(Math.min(x0, x1), Math.min(y0, y1), w, h);
    }
    g.globalCompositeOperation = 'source-over';
    return { canvas, Z, px0: tx0 * 256, py0: ty0 * 256, merc, toLL, source: `Esri World Imagery z${Z}` };
  }

  // ---------- terreno: ortofoto drapeada sobre la cota real ----------
  _terrain(dem, sat) {
    const o = this.data.overlay, { R, kx, la, lo } = this.geo;
    const xw = (o.west - lo) * kx, xe = (o.east - lo) * kx;
    const zn = -(o.north - la) * R, zs = -(o.south - la) * R;
    const cxo = (xw + xe) / 2, czo = (zn + zs) / 2;
    const W = xe - xw, H = zs - zn;
    const th = -o.rotation * Math.PI / 180, cs = Math.cos(th), sn = Math.sin(th);

    const nx = dem ? dem.nx : 2, nz = dem ? dem.nz : 2;
    const x0 = dem ? dem.x0 : -300, z0 = dem ? dem.z0 : -240;
    const sx = dem ? dem.step * (nx - 1) : 610, sz = dem ? dem.step * (nz - 1) : 440;
    const g = new THREE.PlaneGeometry(sx, sz, nx - 1, nz - 1);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position, uv = g.attributes.uv;
    const cx = x0 + sx / 2, cz = z0 + sz / 2;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) + cx, z = pos.getZ(i) + cz;
      pos.setX(i, x); pos.setZ(i, z);
      pos.setY(i, this.height(x, z));
      // UV del plano CAD (georreferenciado por el KMZ, con su rotación)
      const E = x - cxo, Nn = -(z - czo);
      const Eu = E * cs + Nn * sn, Nu = -E * sn + Nn * cs;
      uv.setXY(i, 0.5 + Eu / W, 0.5 + Nu / H);
    }
    g.computeVertexNormals();

    // geometría gemela con UV de la ortofoto (web mercator)
    const gs = g.clone();
    if (sat) {
      const p = gs.attributes.position, u = gs.attributes.uv;
      const cw = sat.canvas.width, ch = sat.canvas.height;
      for (let i = 0; i < p.count; i++) {
        const [lat, lng] = sat.toLL(p.getX(i), p.getZ(i));
        const [px, py] = sat.merc(lat, lng);
        u.setXY(i, (px - sat.px0) / cw, 1 - (py - sat.py0) / ch);
      }
    }

    let groundMat;
    if (sat) {
      const tex = new THREE.CanvasTexture(sat.canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.anisotropy = this.q.anisotropy;
      groundMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92, metalness: 0, transparent: true });
    } else {
      groundMat = new THREE.MeshStandardMaterial({ color: 0x9a8360, roughness: 0.95 });
    }
    const ground = new THREE.Mesh(gs, groundMat);
    ground.name = 'terreno_satelital';
    ground.renderOrder = 0;   // el fondo de todo
    this.scene.add(ground);
    this.ground = ground;
    // La satelital queda siempre puesta: es el relleno alrededor de la huella
    // del vuelo. La foto del dron se dibuja encima.
    ground.visible = true;
    this.plan = null;

    // ---- ortofoto georreferenciada: UV por UTM, calce exacto sin ajustes ----
    if (this._geo) {
      const G = this._geo, U = G.utm;
      const go = g.clone();
      const p = go.attributes.position, u = go.attributes.uv;
      for (let i = 0; i < p.count; i++) {
        const [E, N] = this._ll2utm(la - p.getZ(i) / R, lo + p.getX(i) / kx);
        u.setXY(i,
          (U.x0 + (E - U.e0) * U.sx) / G.w,
          1 - (U.y0 - (N - U.n0) * U.sy) / G.h);
      }
      const otex = new THREE.TextureLoader().load(G.img, () => { this._needsRender = true; });
      otex.colorSpace = THREE.SRGBColorSpace;
      otex.wrapS = otex.wrapT = THREE.ClampToEdgeWrapping;
      otex.anisotropy = this.q.anisotropy;
      const ortho = new THREE.Mesh(go, new THREE.MeshBasicMaterial({
        map: otex, transparent: true, depthWrite: true
      }));
      ortho.position.y = 0.15;
      ortho.name = 'ortofoto_terreno';
      ortho.renderOrder = 1;  // sobre la satelital, bajo el manto del dron
      this.scene.add(ortho);
      this.ortho = ortho;
    }
  }

  // WGS84 -> UTM 19S (mismo cálculo con que se leyó la grilla de la ortofoto)
  _ll2utm(lat, lng) {
    const a = 6378137, f = 1 / 298.257223563, e2 = f * (2 - f), ep2 = e2 / (1 - e2);
    const k0 = 0.9996, lon0 = -69 * Math.PI / 180;
    const p = lat * Math.PI / 180, l = lng * Math.PI / 180;
    const s = Math.sin(p), N1 = a / Math.sqrt(1 - e2 * s * s);
    const T = Math.tan(p) ** 2, C = ep2 * Math.cos(p) ** 2, A = Math.cos(p) * (l - lon0);
    const M = a * ((1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 ** 3 / 256) * p
      - (3 * e2 / 8 + 3 * e2 * e2 / 32 + 45 * e2 ** 3 / 1024) * Math.sin(2 * p)
      + (15 * e2 * e2 / 256 + 45 * e2 ** 3 / 1024) * Math.sin(4 * p)
      - (35 * e2 ** 3 / 3072) * Math.sin(6 * p));
    return [
      k0 * N1 * (A + (1 - T + C) * A ** 3 / 6 + (5 - 18 * T + T * T + 72 * C - 58 * ep2) * A ** 5 / 120) + 500000,
      k0 * (M + N1 * Math.tan(p) * (A * A / 2 + (5 - T + 9 * C + 4 * C * C) * A ** 4 / 24
        + (61 - 58 * T + T * T + 600 * C - 330 * ep2) * A ** 6 / 720)) + 10000000
    ];
  }

  // Malla polar: anillos con paso geométrico (denso cerca, amplio al fondo).
  // La última columna duplica la primera, así no hay costura en el equirect.
  _buildApron() {
    // R0 es el radio del primer anillo: dentro de el no hay geometria y se ve
    // el suelo de abajo. Con 5 m eso era un disco perfectamente visible desde
    // el aire; a medio metro deja de notarse.
    const SEC = 256, RINGS = 130, R0 = 0.5, R1 = 2600;
    const cols = SEC + 1;
    const pos = new Float32Array(cols * (RINGS + 1) * 3);
    const rad = new Float32Array(cols * (RINGS + 1));
    const ang = new Float32Array(cols * (RINGS + 1));
    const idx = [];
    for (let k = 0; k <= RINGS; k++) {
      const r = R0 * Math.pow(R1 / R0, k / RINGS);
      for (let j = 0; j < cols; j++) {
        const t = (j / SEC) * Math.PI * 2;
        const i = k * cols + j;
        pos[i * 3] = Math.cos(t) * r;
        pos[i * 3 + 2] = Math.sin(t) * r;
        rad[i] = r; ang[i] = t;
      }
    }
    for (let k = 0; k < RINGS; k++) {
      for (let j = 0; j < SEC; j++) {
        const a = k * cols + j, b = a + 1, c = a + cols, d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(rad.length * 2), 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(rad.length * 4), 4));
    g.setIndex(idx);
    this._drapeGeo = g;
    this._apron = { rad, ang, cols, SEC, R1 };
  }

  /* Monta el manto: la panorámica del dron proyectada sobre el terreno real.
     La geometría y la reproyección ya estaban escritas en el export, pero
     nadie las llamaba, así que la panorámica solo se usaba de telón. */
  _mountDrape() {
    this._buildApron();
    this._drape = new THREE.Mesh(this._drapeGeo, new THREE.MeshBasicMaterial({
      transparent: true,
      vertexColors: true,   // el alfa por vértice difumina el disco bajo el dron y el borde lejano
      depthWrite: false,
      side: THREE.DoubleSide
    }));
    this._drape.name = 'entorno_dron';
    /* Los objetos transparentes se ordenan por renderOrder antes que por
       distancia, así que la escena se apila a mano:

         0  satelital (relleno del entorno)
         1  ortofoto del vuelo
         2  manto: la panorámica del dron proyectada
         3  relleno de los lotes
         4  deslindes

       Cada capa tiene que quedar sobre la anterior. */
    this._drape.renderOrder = 2;
    this._drape.visible = false;   // se enciende con la capa 'dron'
    this.scene.add(this._drape);
    // La textura puede haber llegado antes que la malla: se reintenta acá.
    this._buildDrape();
  }

  // Reproyección esférica: la dirección desde el dron a cada vértice da su
  // coordenada en el equirect. Exacta si la posición del dron es la correcta.
  _buildDrape() {
    if (!this._drape || !this.panoTex || !this._apron) return;
    const m = this._drape.material;
    if (m.map !== this.panoTex) {
      m.map = this.panoTex.clone();
      m.map.mapping = THREE.UVMapping;
      m.map.colorSpace = THREE.SRGBColorSpace;
      m.map.wrapS = THREE.RepeatWrapping;
      m.map.wrapT = THREE.ClampToEdgeWrapping;
      m.map.anisotropy = this.q.anisotropy;
      m.map.needsUpdate = true;
      m.needsUpdate = true;
    }

    const dx = +(this.getAttribute('drone-x') || 0);
    const dz = +(this.getAttribute('drone-z') || 0);
    const alt = +(this.getAttribute('drone-alt') || 110);
    const yaw = +(this.getAttribute('pano-yaw') || 0) * Math.PI / 180;
    const dy = this.height(dx, dz) + alt;

    const { rad, ang, R1 } = this._apron;
    const g = this._drapeGeo;
    const p = g.attributes.position, uv = g.attributes.uv, col = g.getAttribute('color');
    const TAU = Math.PI * 2;
    for (let i = 0; i < p.count; i++) {
      const r = rad[i], t = ang[i];
      const x = dx + Math.cos(t) * r, z = dz + Math.sin(t) * r;
      const y = this.height(x, z) + 0.3;
      p.setXYZ(i, x, y, z);
      // u sale del ángulo generado, no de atan2: monotónico, sin costura
      uv.setXY(i,
        0.5 - t / TAU + yaw / TAU,
        0.5 + Math.asin(Math.max(-1, Math.min(1, (y - dy) / Math.hypot(r, y - dy)))) / Math.PI);
      /* El manto no se abre en ningun lado. Abrirlo en el nadir dejaba ver la
         ortofoto, con los colores del plano viejo deformandose en el centro
         del mapa. La zona bajo el dron se cubre con la propia panoramica, que
         ahi va desenfocada a proposito.

         El borde lejano si se difumina, para que el manto no termine en un
         corte recto contra el horizonte. */
      const suave = t => { const u = Math.min(1, Math.max(0, t)); return u * u * (3 - 2 * u); };
      const a = suave((R1 - r) / (R1 * 0.45));
      col.setXYZW(i, 1, 1, 1, a);
    }
    p.needsUpdate = true;
    uv.needsUpdate = true;
    col.needsUpdate = true;
    g.computeVertexNormals();
    g.computeBoundingSphere();
  }

  // La ortofoto satelital tope en la zona es ~50 cm/píxel.
  _lod() {}

  // ---------- lotes tocables ----------
  _lots() {
    const grp = new THREE.Group();
    grp.name = 'lotes';
    this.lotMeshes = [];
    for (const l of this.data.lots) {
      const shape = new THREE.Shape(l.p.map(([x, z]) => new THREE.Vector2(x, z)));
      const geo = new THREE.ShapeGeometry(shape);
      geo.rotateX(Math.PI / 2);
      const pos = geo.attributes.position;
      let sum = 0;
      for (let i = 0; i < pos.count; i++) sum += this.height(pos.getX(i), pos.getZ(i));
      const flat = sum / pos.count;
      for (let i = 0; i < pos.count; i++) {
        const y = this.mode === 'plataformas' ? flat : this.height(pos.getX(i), pos.getZ(i));
        pos.setY(i, y + 0.9);
      }
      geo.computeVertexNormals();
      const nfs = l.stage === NOT_FOR_SALE;
      const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
        color: nfs ? OFF : l.sold ? SOLD : AV, transparent: true, opacity: nfs ? 0.2 : 0.1,
        depthWrite: false, side: THREE.DoubleSide
      }));
      mesh.name = `lote_${String(l.n).padStart(2, '0')}_e${l.stage}`;
      mesh.userData = { lot: l, flat, nfs };
      grp.add(mesh);
      this.lotMeshes.push(mesh);
    }
    this.pickable = this.lotMeshes.filter(m => !m.userData.nfs);
    grp.renderOrder = 3;              // por encima del manto y de la ortofoto
    this.lotMeshes.forEach(m => { m.renderOrder = 3; });
    this._outline(grp);
    this.scene.add(grp);
    this.lotGroup = grp;
  }

  // un solo trazado de deslindes; etapa fuera de venta en gris
  _outline(grp) {
    const v = [], c = [];
    const lime = new THREE.Color(0x76d845), gray = new THREE.Color(0x7d8894);
    const rojo = new THREE.Color(0xe5484d);
    for (const l of this.data.lots) {
      const p = l.p;
      const col = l.stage === NOT_FOR_SALE ? gray : l.sold ? rojo : lime;
      for (let i = 0; i < p.length; i++) {
        const a = p[i], b = p[(i + 1) % p.length];
        v.push(a[0], this.height(a[0], a[1]) + 1.1, a[1], b[0], this.height(b[0], b[1]) + 1.1, b[1]);
        c.push(col.r, col.g, col.b, col.r, col.g, col.b);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
    const lines = new THREE.LineSegments(g, new THREE.LineBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false
    }));
    lines.name = 'deslindes';
    lines.renderOrder = 4;            // el deslinde, sobre el relleno
    grp.add(lines);
    this.lines = lines;
  }

  // ---------- numeración de lotes, con anti-solapamiento ----------
  _labels() {
    const layer = document.createElement('div');
    Object.assign(layer.style, {
      position: 'absolute', inset: '0', pointerEvents: 'none', overflow: 'hidden'
    });
    this.appendChild(layer);
    this.labels = this.lotMeshes.map(m => {
      const l = m.userData.lot;
      const el = document.createElement('div');
      el.textContent = l.n;
      Object.assign(el.style, {
        position: 'absolute', left: '0', top: '0', transform: 'translate3d(-9999px,-9999px,0)',
        whiteSpace: 'nowrap', willChange: 'transform',
        font: '700 11px Montserrat, sans-serif', letterSpacing: '.02em',
        padding: '2px 6px', borderRadius: '6px', visibility: 'hidden',
        background: 'rgba(10,18,28,.72)', color: 'rgba(255,255,255,.92)',
        border: '1px solid rgba(118,216,69,.35)'
      });
      layer.appendChild(el);
      return { el, mesh: m, lot: l, v: new THREE.Vector3() };
    });
    this._labelLayer = layer;
    // durante el giro las etiquetas se apagan: nada de recalcular por frame
    layer.style.transition = 'opacity .16s cubic-bezier(.16,1,.3,1)';
    this.ctr.addEventListener('start', () => {
      this._moving = true;
      layer.style.opacity = '0';
    });
    this.ctr.addEventListener('end', () => {
      this._moving = false;
      this._dirty = true;
      layer.style.opacity = '1';
    });
  }

  _placeLabels() {
    if (!this.labels || this._moving) return;
    const now = performance.now();
    if (now - (this._lt || 0) < 140) return;

    // solo si la cámara se movió desde el último cálculo
    const p = this.cam.position, t = this.ctr.target;
    const key = `${p.x | 0}|${p.y | 0}|${p.z | 0}|${t.x | 0}|${t.z | 0}`;
    if (key === this._camKey && !this._dirty) return;
    this._camKey = key;
    this._dirty = false;
    this._lt = now;

    const w = this.clientWidth, h = this.clientHeight;
    const cands = [];
    for (const L of this.labels) {
      const l = L.lot;
      if (!this._inFilter(l) || l.stage === NOT_FOR_SALE) {
        if (L.on) { L.el.style.visibility = 'hidden'; L.on = false; }
        continue;
      }
      const y = this.mode === 'plataformas' ? L.mesh.userData.flat : this.height(l.cx, l.cy);
      L.v.set(l.cx, y + 1.4, l.cy).project(this.cam);
      if (L.v.z > 1 || L.v.x < -1.02 || L.v.x > 1.02 || L.v.y < -1.02 || L.v.y > 1.02) {
        if (L.on) { L.el.style.visibility = 'hidden'; L.on = false; }
        continue;
      }
      cands.push({ L, x: (L.v.x * 0.5 + 0.5) * w, y: (-L.v.y * 0.5 + 0.5) * h, z: L.v.z });
    }
    cands.sort((a, b) => a.z - b.z);
    const placed = [];
    const MINX = 34, MINY = 17;
    for (const c of cands) {
      const L = c.L, sel = this._sel === L.lot.id;
      const clash = !sel && placed.some(q => Math.abs(q.x - c.x) < MINX && Math.abs(q.y - c.y) < MINY);
      const st = L.el.style;
      if (clash) {
        if (L.on) { st.visibility = 'hidden'; L.on = false; }
        continue;
      }
      placed.push(c);
      st.transform = `translate3d(${Math.round(c.x)}px,${Math.round(c.y)}px,0) translate(-50%,-50%)`;
      if (!L.on) { st.visibility = 'visible'; L.on = true; }
      if (L.wasSel !== sel || L.styled !== true) {
        const sold = L.lot.sold;
        st.background = sel ? '#76d845' : sold ? 'rgba(10,18,28,.6)' : 'rgba(10,18,28,.72)';
        st.color = sel ? '#0a1520' : sold ? 'rgba(255,255,255,.5)' : 'rgba(255,255,255,.92)';
        st.borderColor = sel ? '#76d845' : sold ? 'rgba(255,255,255,.18)' : 'rgba(118,216,69,.35)';
        st.zIndex = sel ? '3' : '1';
        L.wasSel = sel;
        L.styled = true;
      }
    }
  }

  _rebuildLots() {
    for (const m of this.lotMeshes) {
      const pos = m.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const y = this.mode === 'plataformas' ? m.userData.flat : this.height(pos.getX(i), pos.getZ(i));
        pos.setY(i, y + 0.9);
      }
      pos.needsUpdate = true;
      m.geometry.computeVertexNormals();
    }
    // los deslindes siguen el mismo modo
    if (this.lines) {
      const arr = this.lines.geometry.attributes.position;
      let k = 0;
      for (const m of this.lotMeshes) {
        const p = m.userData.lot.p, flat = m.userData.flat;
        for (let i = 0; i < p.length; i++) {
          const a = p[i], b = p[(i + 1) % p.length];
          for (const q of [a, b]) {
            const y = this.mode === 'plataformas' ? flat : this.height(q[0], q[1]);
            arr.setXYZ(k++, q[0], y + 1.1, q[1]);
          }
        }
      }
      arr.needsUpdate = true;
    }
  }

  _pick() {
    const ray = new THREE.Raycaster(), v = new THREE.Vector2();
    let moved = false, down = null;
    const hit = e => {
      const r = this.renderer.domElement.getBoundingClientRect();
      v.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(v, this.cam);
      return ray.intersectObjects(this.pickable, false)[0];
    };
    this.addEventListener('pointerdown', e => {
      // La órbita de presentación cede el control en cuanto alguien toca el
      // mapa: seguir girando bajo el dedo se siente como que pelea.
      this.cinematic(false);
      if (this.align) return;
      down = [e.clientX, e.clientY]; moved = false;
    });

    /* Arrastrar el lote ya elegido lo mueve. Va en fase de captura y corta la
       propagación: OrbitControls escucha en el canvas, que es hijo de este
       elemento, así que en fase de burbuja ya habría empezado a desplazar el
       mapa y el lote se movería junto con la cámara.

       Solo se mueve el lote elegido: si cualquiera se moviera al arrastrarlo,
       sería imposible recorrer el mapa apoyando el cursor sobre uno. */
    this.addEventListener('pointerdown', e => {
      if (!this.editing || this.align || this._sel == null) return;
      const h = hit(e);
      if (!h || h.object.userData.lot.id !== this._sel) return;
      const g = this.pickGround(e.clientX, e.clientY);
      if (!g) return;
      const l = h.object.userData.lot;
      this._arrastre = { id: l.id, gx: g.x - l.cx, gz: g.z - l.cy };
      this.ctr.enabled = false;
      this.setPointerCapture(e.pointerId);
      e.stopPropagation();
      e.preventDefault();
    }, true);
    this.addEventListener('pointermove', e => {
      if (this._arrastre) {
        const g = this.pickGround(e.clientX, e.clientY);
        if (g) {
          this.dispatchEvent(new CustomEvent('lotdrag', {
            detail: {
              id: this._arrastre.id,
              cx: +(g.x - this._arrastre.gx).toFixed(2),
              cy: +(g.z - this._arrastre.gz).toFixed(2)
            },
            bubbles: true
          }));
        }
        return;
      }
      if (this.align) return;
      if (down) {
        if (Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) moved = true;
        return; // girando: no se raycastea
      }
      const now = performance.now();
      if (now - (this._ht || 0) < 60) return;
      this._ht = now;
      const h = hit(e);
      const id = h ? h.object.userData.lot.id : null;
      if (id !== this._hover) { this._hover = id; this._paint(); }
      this.renderer.domElement.style.cursor = h ? 'pointer' : 'grab';
    });
    this.addEventListener('pointerup', e => {
      if (this._arrastre) {
        this._arrastre = null;
        this.ctr.enabled = true;
        return;
      }
      const wasMoved = moved; down = null;
      if (this.align || wasMoved) return;
      const h = hit(e);
      if (h) {
        // En edición no se vuela la cámara: mover el encuadre a cada clic
        // haría imposible colocar lotes uno tras otro.
        if (this.editing) { this._sel = h.object.userData.lot.id; this._paint(); }
        else this.select(h.object.userData.lot.id);
        this.dispatchEvent(new CustomEvent('lotpick', { detail: h.object.userData.lot, bubbles: true }));
      } else if (this.editing) {
        const g = this.pickGround(e.clientX, e.clientY);
        if (g) this.dispatchEvent(new CustomEvent('groundpick', { detail: g, bubbles: true }));
      }
    });
    this.addEventListener('pointerleave', () => { this._hover = null; this._paint(); });
  }

  _paint() {
    for (const m of this.lotMeshes) {
      const l = m.userData.lot;
      if (m.userData.nfs) { m.material.color.setHex(OFF); m.material.opacity = 0.2; continue; }
      const on = this._inFilter(l);
      const sel = this._sel === l.id, hov = this._hover === l.id;
      m.material.color.setHex(
        sel ? (l.sold ? SEL_SOLD : SEL)
          : hov && on ? HOV
            : l.sold ? SOLD : AV);
      // Al dibujar hay que ver bien dónde quedó cada lote: en la página el
      // relleno es apenas un velo para no tapar el terreno, pero en el editor
      // eso vuelve imposible trabajar.
      m.material.opacity = !on ? 0.02
        : sel ? 0.75
          : hov ? 0.5
            : l.sold ? 0.42
              : this.editing ? 0.42 : 0.28;
    }
  }

  _inFilter(l) {
    const f = this._filter || {};
    if (f.stage && l.stage !== f.stage) return false;
    if (f.size === '200' && !(l.area != null && l.area < 300)) return false;
    if (f.size === '390' && !(l.area != null && l.area >= 300)) return false;
    return true;
  }

  // ---------- API ----------
  setFilter(f) { this._filter = f; this._paint(); this._dirty = true; }

  setMode(m) {
    if (m === this.mode) return;
    this.mode = m;
    this._rebuildLots();
    this._dirty = true;
  }

  setNumbers(on) {
    this._numbers = on !== false;
    if (this._labelLayer) this._labelLayer.style.display = this._numbers ? 'block' : 'none';
  }

  setLayer(k) {
    this.layer = k;
    /* 'dron'     = la panoramica proyectada sobre el terreno
       'foto'     = ortofoto del vuelo sobre la satelital
       'satelite' = solo el relleno satelital

       En 'dron' la ortofoto queda encendida por debajo: el manto se abre en el
       nadir y ahi tiene que asomar suelo de verdad, no un disco liso. */
    if (this._drape) this._drape.visible = k === 'dron';
    if (this.ortho) this.ortho.visible = k !== 'satelite';
    if (this.ground) this.ground.visible = true;
    if (this.lines) this.lines.visible = true;
    if (this._labelLayer) this._labelLayer.style.display = this._numbers === false ? 'none' : 'block';
  }

  // ---------- modo alineación: arrastrar la foto sobre la retícula ----------
  setAlign(on) {
    this.align = !!on;
    this.ctr.enabled = !on;
    this.renderer.domElement.style.cursor = on ? 'move' : 'grab';
    if (this.lines) {
      this.lines.material.opacity = on ? 1 : 0.8;
      this.lines.material.needsUpdate = true;
    }
    if (on && !this._alignBound) this._bindAlign();
    this._emitAlign();
  }

  _bindAlign() {
    this._alignBound = true;
    let drag = null;
    this.addEventListener('pointerdown', e => {
      if (!this.align) return;
      e.preventDefault();
      this.setPointerCapture(e.pointerId);
      drag = {
        mx: e.clientX, my: e.clientY, rot: e.shiftKey,
        x: +(this.getAttribute('drone-x') || 0),
        z: +(this.getAttribute('drone-z') || 0),
        yaw: +(this.getAttribute('pano-yaw') || 0)
      };
    });
    this.addEventListener('pointermove', e => {
      if (!this.align || !drag) return;
      const dxs = e.clientX - drag.mx, dys = e.clientY - drag.my;
      if (drag.rot) {
        this.setPanoYaw(+(drag.yaw + dxs * 0.15).toFixed(1));
      } else {
        const dist = this.cam.position.distanceTo(this.ctr.target);
        const k = dist / (this.clientHeight || 600) * 1.7;
        const d = new THREE.Vector3();
        this.cam.getWorldDirection(d);
        const right = new THREE.Vector3(-d.z, 0, d.x).normalize();
        const fwd = new THREE.Vector3(d.x, 0, d.z).normalize();
        this.setDrone({
          x: +(drag.x + right.x * dxs * k - fwd.x * dys * k).toFixed(1),
          z: +(drag.z + right.z * dxs * k - fwd.z * dys * k).toFixed(1)
        });
      }
      this._emitAlign();
    });
    const end = e => {
      if (!drag) return;
      drag = null;
      try { this.releasePointerCapture(e.pointerId); } catch (_) {}
    };
    this.addEventListener('pointerup', end);
    this.addEventListener('pointercancel', end);
  }

  _emitAlign() {
    this.dispatchEvent(new CustomEvent('alignchange', {
      detail: {
        x: +(this.getAttribute('drone-x') || 0),
        z: +(this.getAttribute('drone-z') || 0),
        alt: +(this.getAttribute('drone-alt') || 110),
        yaw: +(this.getAttribute('pano-yaw') || 0)
      }
    }));
  }

  nudgeYaw(d) {
    let y = (+(this.getAttribute('pano-yaw') || 0)) + d;
    while (y > 180) y -= 360;
    while (y < -180) y += 360;
    this.setPanoYaw(+y.toFixed(1));
    this._emitAlign();
  }

  nudgeAlt(d) {
    const a = Math.max(30, Math.min(400, (+(this.getAttribute('drone-alt') || 110)) + d));
    this.setDrone({ alt: a });
    this._emitAlign();
  }

  /** Gira la cámara alrededor del punto que mira, en grados. */
  orbit(deg) {
    const t = this.ctr.target;
    const off = this.cam.position.clone().sub(t);
    const a = deg * Math.PI / 180, cos = Math.cos(a), sin = Math.sin(a);
    const x = off.x * cos - off.z * sin;
    const z = off.x * sin + off.z * cos;
    off.x = x; off.z = z;
    this.cam.position.copy(t).add(off);
    this.ctr.update();
  }

  /** Qué hace el arrastre con el botón izquierdo: desplazar o girar. */
  setDragMode(modo) {
    if (!this.ctr) return;
    this.dragMode = modo;
    const girar = modo === 'girar';
    this.ctr.mouseButtons = girar
      ? { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }
      : { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
    this.ctr.touches = girar
      ? { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }
      : { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE };
  }

  /** Acerca o aleja la cámara un factor dado, respetando los topes. */
  dolly(factor) {
    const t = this.ctr.target;
    const d = this.cam.position.distanceTo(t);
    const nuevo = Math.max(this.ctr.minDistance, Math.min(this.ctr.maxDistance, d * factor));
    this.cam.position.sub(t).multiplyScalar(nuevo / d).add(t);
    this.ctr.update();
  }

  topDown() {
    const t = this.ctr.target.clone();
    this.cam.position.set(t.x + 0.01, t.y + 640, t.z);
    this.ctr.update();
  }

  setDrone(o) {
    if (o.x != null) this.setAttribute('drone-x', o.x);
    if (o.z != null) this.setAttribute('drone-z', o.z);
    if (o.alt != null) this.setAttribute('drone-alt', o.alt);
    if (o.reach != null) this.setAttribute('drone-reach', o.reach);
    this._buildDrape();
  }

  select(id) {
    const m = this.lotMeshes.find(x => x.userData.lot.id === id);
    this._sel = id;
    this._paint();
    this._dirty = true;
    if (!m) return;
    const l = m.userData.lot;
    const y = this.height(l.cx, l.cy);
    // Acercamiento cinematográfico: baja hasta ver el lote de cerca, con un
    // recorrido algo más largo para que se lea como un vuelo y no como un salto.
    this._fly(new THREE.Vector3(l.cx, y, l.cy), 58, 0.5, false, 1250);
  }

  clear() { this._sel = null; this._paint(); this.resetView(); }

  /* ---------- edición de lotes sobre el mapa ---------- */

  /**
   * Modo comparación para el calce: la ortofoto —que sí está georreferenciada
   * y donde los lotes caen bien— queda debajo, y la vista del dron encima con
   * la opacidad que se le pida. Calzar deja de ser a ciegas: se trata de mover
   * la foto de arriba hasta que los caminos y las casas coincidan con los de
   * abajo.
   *
   * opacidad 1 = solo dron · 0.5 = mezcla · 0 = solo ortofoto
   */
  setMezcla(opacidad) {
    if (this.ground) this.ground.visible = true;
    if (this.ortho) this.ortho.visible = true;
    if (this._drape) {
      this._drape.visible = opacidad > 0.02;
      this._drape.material.opacity = opacidad;
      this._drape.material.needsUpdate = true;
    }
  }

  /**
   * Punto del terreno bajo el centro de la pantalla. Es lo que usa la mira:
   * encuadras con libertad y el lote cae exactamente donde apuntas, sin que
   * el clic tenga que hacer de desplazar y de colocar a la vez.
   */
  pickGroundCenter() {
    const r = this.renderer.domElement.getBoundingClientRect();
    return this.pickGround(r.left + r.width / 2, r.top + r.height / 2);
  }

  /** Elige un lote y lleva la cámara hasta él. Lo usa la lista del editor. */
  focusLot(id) {
    const m = this.lotMeshes.find(x => x.userData.lot.id === id);
    this._sel = id;
    this._paint();
    if (!m) return;
    const l = m.userData.lot;
    this._fly(new THREE.Vector3(l.cx, this.height(l.cx, l.cy), l.cy), 70, 0.62);
  }

  /** Enciende el modo en que un clic en el suelo coloca un lote. */
  setEditor(on) {
    this.editing = !!on;
    // Colocar lotes sobre un mapa que gira solo es imposible.
    if (this.editing) this.cinematic(false);
    if (this.ctr) {
      this.ctr.screenSpacePanning = false;   // el paneo sigue el plano del suelo
      this.ctr.mouseButtons = this.editing
        ? { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE }
        : { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
      this.ctr.touches = this.editing
        ? { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE }
        : { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
    }
    if (this.lines) {
      this.lines.material.opacity = this.editing ? 1 : 0.8;
      this.lines.material.needsUpdate = true;
    }
    this._paint();
  }

  /**
   * Punto del terreno bajo el cursor, en las coordenadas locales del loteo
   * (las mismas que usan los polígonos). Devuelve null si el rayo no toca
   * ninguna superficie visible.
   */
  pickGround(clientX, clientY) {
    const objetivos = [this._drape, this.ortho, this.ground].filter(o => o && o.visible);
    if (!objetivos.length) return null;
    const r = this.renderer.domElement.getBoundingClientRect();
    const v = new THREE.Vector2(
      ((clientX - r.left) / r.width) * 2 - 1,
      -((clientY - r.top) / r.height) * 2 + 1
    );
    const ray = new THREE.Raycaster();
    ray.setFromCamera(v, this.cam);
    const h = ray.intersectObjects(objetivos, false)[0];
    if (!h) return null;
    return { x: +h.point.x.toFixed(2), z: +h.point.z.toFixed(2) };
  }

  /**
   * Reemplaza el conjunto de lotes y rehace mallas, deslindes y etiquetas.
   * Es lo que usa el editor tras cada colocación o movimiento.
   */
  setLots(lots) {
    if (this.lotGroup) {
      this.lotGroup.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
      this.scene.remove(this.lotGroup);
    }
    if (this._labelLayer) { this._labelLayer.remove(); this._labelLayer = null; }
    this.labels = null;

    this.data.lots = lots;
    this._sel = null;
    this._lots();
    try { this._labels(); } catch (e) { this.labels = null; console.error('lote-3d labels', e); }
    if (this._numbers === false && this._labelLayer) this._labelLayer.style.display = 'none';
    this._paint();
    this._dirty = true;
  }

  /* Órbita lenta para la intro: el mapa se presenta solo mientras el visitante
     todavía no toca nada. Se apaga apenas elige un lote, para no pelearle la
     cámara. */
  cinematic(on) {
    if (!this.ctr) return;
    if (on && !this._cedeCinematic) {
      this._cedeCinematic = () => this.cinematic(false);
      this.addEventListener('wheel', this._cedeCinematic, { passive: true });
    }
    this.ctr.autoRotate = !!on;
    this.ctr.autoRotateSpeed = 0.35;
  }

  resetView(immediate) {
    // encuadra solo lo que está en venta
    const lots = this.data.lots.filter(l => l.stage !== NOT_FOR_SALE);
    const xs = lots.map(l => l.cx), zs = lots.map(l => l.cy);
    const x0 = Math.min(...xs), x1 = Math.max(...xs);
    const z0 = Math.min(...zs), z1 = Math.max(...zs);
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    const span = Math.max(x1 - x0, z1 - z0);
    this._fly(new THREE.Vector3(cx, this.height(cx, cz), cz), span * 1.15, 0.56, immediate);
  }

  _fly(target, dist, pitch, immediate, dur = 780) {
    const dir = new THREE.Vector3(-0.55, Math.tan(pitch * Math.PI / 2) * 0.9, 0.82).normalize();
    const to = target.clone().add(dir.multiplyScalar(dist));
    // el primer encuadre se aplica de una: partir de una posición degenerada hace
    // que OrbitControls colapse la cámara contra minDistance
    if (immediate || this.cam.position.distanceTo(this.ctr.target) < 1) {
      this.cam.position.copy(to);
      this.ctr.target.copy(target);
      this.ctr.update();
      return;
    }
    const from = this.cam.position.clone(), fromT = this.ctr.target.clone();
    const t0 = performance.now();
    // Salida y llegada suaves: un cúbico simétrico se siente como una cámara
    // de verdad, no como una interpolación.
    const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const step = () => {
      const t = Math.min(1, (performance.now() - t0) / dur), k = ease(t);
      this.cam.position.lerpVectors(from, to, k);
      this.ctr.target.lerpVectors(fromT, target, k);
      this.ctr.update();
      if (t < 1) requestAnimationFrame(step);
    };
    step();
  }
}

if (!customElements.get('lote-3d')) customElements.define('lote-3d', Lote3D);
