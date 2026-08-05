'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import styles from './overlay.module.css';

const SORTEO_ID = 'dia-del-nino-2026';
const POLL_MS = 1500;

/**
 * ?sorteo=ensayo apunta a un registro paralelo en la misma base.
 * Permite ensayar el vivo completo sin tocar el sorteo real.
 */
function idDesdeUrl(): string {
  if (typeof window === 'undefined') return SORTEO_ID;
  const p = new URLSearchParams(window.location.search).get('sorteo');
  const limpio = (p || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 24);
  return limpio ? `dia-del-nino-${limpio}` : SORTEO_ID;
}

const PREMIOS = [
  { puesto: 1, medalla: '🥇', titulo: '1.er Lugar', detalle: 'Pack Familiar Fantasilandia · 4 entradas' },
  { puesto: 2, medalla: '🥈', titulo: '2.º Lugar', detalle: 'Pack Familiar Fantasilandia · 2+2' },
  { puesto: 3, medalla: '🥉', titulo: '3.er Lugar', detalle: '$50.000 en efectivo' },
];

interface Ganador {
  puesto: number;
  username: string;
  comentario: string;
  fecha: string;
}

interface Estado {
  participantes: string[];
  total: number;
  ganadores: Ganador[];
  girando: number | null;
  hash: string;
  status: string;
}

const inicial: Estado = {
  participantes: [], total: 0, ganadores: [], girando: null, hash: '', status: 'pending',
};

/**
 * Los @ de Instagram van de 4 a 30 caracteres. A tamaño fijo, uno largo como
 * @marielaalejandrajaraorellana se corta — y truncar al ganador en vivo no es opción.
 *
 * Para el nombre que gira basta una estimación por largo (cambia cada 65ms y no
 * conviene medir en cada tick). Para el ganador se mide de verdad contra la caja:
 * es el momento que queda en pantalla y en las capturas de la gente.
 */
function tamanoEstimado(texto: string, base: number, holgura: number) {
  return { fontSize: `${Math.min(base, holgura / Math.max(texto.length, 8)).toFixed(2)}cqw` };
}

function useAjustarAlAncho(
  ref: React.RefObject<HTMLElement | null>,
  dep: string | undefined,
) {
  useEffect(() => {
    const el = ref.current;
    const caja = el?.parentElement;
    if (!el || !caja || !dep) return;

    el.style.fontSize = '';
    let px = parseFloat(getComputedStyle(el).fontSize);
    const limite = caja.clientWidth * 0.9;
    let vueltas = 0;
    while (el.scrollWidth > limite && px > 10 && vueltas++ < 60) {
      px -= 1;
      el.style.fontSize = `${px}px`;
    }
  }, [ref, dep]);
}

export default function OverlaySorteo() {
  const [estado, setEstado] = useState<Estado>(inicial);
  const [nombreRuleta, setNombreRuleta] = useState('');
  const [sorteoId, setSorteoId] = useState(SORTEO_ID);
  const ganadosPrevios = useRef(0);
  const refGanador = useRef<HTMLSpanElement>(null);

  useEffect(() => setSorteoId(idDesdeUrl()), []);

  // ── polling del estado compartido ──
  useEffect(() => {
    let vivo = true;
    const cargar = async () => {
      try {
        const r = await fetch(`/api/sorteo/${sorteoId}`, { cache: 'no-store' });
        if (!r.ok) return;
        const data: Estado = await r.json();
        if (vivo) setEstado((prev) => ({ ...prev, ...data }));
      } catch {
        /* el overlay nunca debe romperse en vivo: se reintenta al siguiente tick */
      }
    };
    cargar();
    const t = setInterval(cargar, POLL_MS);
    return () => { vivo = false; clearInterval(t); };
  }, [sorteoId]);

  // ── nombres girando ──
  useEffect(() => {
    if (estado.girando === null || estado.participantes.length === 0) return;
    const t = setInterval(() => {
      const i = Math.floor(Math.random() * estado.participantes.length);
      setNombreRuleta(estado.participantes[i]);
    }, 65);
    return () => clearInterval(t);
  }, [estado.girando, estado.participantes]);

  // ── confeti cuando aparece un ganador nuevo ──
  const celebrar = useCallback(() => {
    const fin = Date.now() + 2600;
    const colores = ['#76d845', '#a8e88a', '#4ba646', '#d4a946', '#ffffff'];
    (function marco() {
      confetti({ particleCount: 5, angle: 60, spread: 70, origin: { x: 0, y: 0.65 }, colors: colores });
      confetti({ particleCount: 5, angle: 120, spread: 70, origin: { x: 1, y: 0.65 }, colors: colores });
      if (Date.now() < fin) requestAnimationFrame(marco);
    })();
  }, []);

  useEffect(() => {
    if (estado.ganadores.length > ganadosPrevios.current) celebrar();
    ganadosPrevios.current = estado.ganadores.length;
  }, [estado.ganadores.length, celebrar]);

  const ganadorDe = (puesto: number) => estado.ganadores.find((g) => g.puesto === puesto);
  const ganadorActual = estado.ganadores[estado.ganadores.length - 1];
  useAjustarAlAncho(refGanador, ganadorActual?.username);

  // qué mostrar en la ventana central
  const ultimo = estado.ganadores[estado.ganadores.length - 1];
  const girando = estado.girando !== null;
  const premioEnJuego = girando
    ? PREMIOS.find((p) => p.puesto === estado.girando)
    : ultimo
      ? PREMIOS.find((p) => p.puesto === ultimo.puesto)
      : null;

  return (
    <div className={styles.marco}>
      <div className={styles.escenario}>
        <div className={styles.zonaSegura} />

        <header className={styles.cabecera}>
          <div className={styles.marca}>
            <Image
              src="/assets/homepage-v2/logo-alimin-icon.webp"
              alt="Alimin"
              width={120}
              height={120}
              className={styles.logo}
              priority
            />
            <span className={styles.marcaTexto}>Alimin</span>
          </div>
          <h1 className={styles.titulo}>
            Sorteo Día del Niño
            <span className={styles.tituloAcento}>¡En Grande!</span>
          </h1>
          <div className={styles.contador}>
            <span className={styles.contadorNumero}>{estado.total.toLocaleString('es-CL')}</span>
            <span className={styles.contadorTexto}>participantes</span>
          </div>
        </header>

        <main className={styles.centro}>
          {premioEnJuego && (
            <div className={styles.etiquetaPremio}>{premioEnJuego.titulo}</div>
          )}

          <div className={`${styles.ventana} ${girando ? styles.ventanaGirando : ''}`}>
            {girando ? (
              <span
                className={styles.nombreGirando}
                style={tamanoEstimado(`@${nombreRuleta}`, 6.6, 140)}
              >
                @{nombreRuleta || '…'}
              </span>
            ) : ultimo ? (
              <span ref={refGanador} className={styles.nombreGanador}>
                @{ultimo.username}
              </span>
            ) : (
              <span className={styles.espera}>Preparando el sorteo…</span>
            )}
          </div>

          {!girando && ultimo?.comentario && (
            <p className={styles.comentario}>“{ultimo.comentario}”</p>
          )}
        </main>

        <section className={styles.premios}>
          {PREMIOS.map((p) => {
            const g = ganadorDe(p.puesto);
            const activo = estado.girando === p.puesto;
            return (
              <article
                key={p.puesto}
                className={`${styles.premio} ${g ? styles.premioGanado : ''} ${activo ? styles.premioActivo : ''}`}
              >
                <div className={styles.medalla}>{p.medalla}</div>
                <div className={styles.premioPuesto}>{p.titulo}</div>
                <div className={styles.premioDetalle}>{p.detalle}</div>
                {g && <div className={styles.premioGanador}>@{g.username}</div>}
              </article>
            );
          })}
        </section>

        <footer className={styles.pie}>
          {estado.hash && (
            <div className={styles.sello}>
              <span className={styles.selloTitulo}>Sello de auditoría</span>
              {estado.hash.slice(0, 32)}…
            </div>
          )}
        </footer>

        <div className={styles.zonaSegura} />
      </div>
    </div>
  );
}
