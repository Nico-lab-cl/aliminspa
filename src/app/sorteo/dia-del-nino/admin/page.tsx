'use client';

import { useCallback, useEffect, useState } from 'react';
import datos from '@/data/participantes-dia-del-nino.json';
import styles from './admin.module.css';

const SORTEO_ID = 'dia-del-nino-2026';

/** ?sorteo=ensayo opera sobre un registro paralelo, sin tocar el sorteo real. */
function idDesdeUrl(): string {
  if (typeof window === 'undefined') return SORTEO_ID;
  const p = new URLSearchParams(window.location.search).get('sorteo');
  const limpio = (p || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 24);
  return limpio ? `dia-del-nino-${limpio}` : SORTEO_ID;
}

// En el orden en que se lanzan durante el vivo: se cierra con el premio mayor.
const PREMIOS = [
  { paso: 1, puesto: 3, medalla: '🥉', titulo: '3.er Lugar', detalle: '$50.000 en efectivo' },
  { paso: 2, puesto: 2, medalla: '🥈', titulo: '2.º Lugar', detalle: 'Pack Familiar · 2 adultos + 2 niños' },
  { paso: 3, puesto: 1, medalla: '🥇', titulo: '1.er Lugar', detalle: 'Pack Familiar · 4 entradas' },
];

interface Ganador { puesto: number; username: string; comentario: string; fecha: string }
interface Estado {
  participantes: string[]; total: number;
  ganadores: Ganador[]; descartados: Ganador[];
  girando: number | null; hash: string; status: string;
}

/** Aleatoriedad criptográfica: Math.random() no sirve para repartir premios reales. */
function elegirIndice(max: number): number {
  const buf = new Uint32Array(1);
  const limite = Math.floor(0xffffffff / max) * max; // descarta sesgo de módulo
  let v: number;
  do { crypto.getRandomValues(buf); v = buf[0]; } while (v >= limite);
  return v % max;
}

export default function PanelSorteo() {
  const [clave, setClave] = useState('');
  const [estado, setEstado] = useState<Estado | null>(null);
  const [msg, setMsg] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [duracion, setDuracion] = useState(7);
  const [sorteoId, setSorteoId] = useState(SORTEO_ID);
  const esEnsayo = sorteoId !== SORTEO_ID;

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('key');
    if (p) setClave(p);
    setSorteoId(idDesdeUrl());
  }, []);

  const cargar = useCallback(async () => {
    const r = await fetch(`/api/sorteo/${sorteoId}`, { cache: 'no-store' });
    if (r.ok) setEstado(await r.json());
  }, [sorteoId]);

  useEffect(() => {
    cargar();
    const t = setInterval(cargar, 2000);
    return () => clearInterval(t);
  }, [cargar]);

  const guardar = useCallback(async (cambios: Record<string, unknown>) => {
    const r = await fetch(`/api/sorteo/${sorteoId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...cambios, adminKey: clave }),
    });
    if (!r.ok) { setMsg(r.status === 401 ? '❌ Clave incorrecta' : '❌ Error al guardar'); return null; }
    const data = await r.json();
    setEstado((p) => (p ? { ...p, ...data } : data));
    return data;
  }, [clave, sorteoId]);

  const cargarParticipantes = async () => {
    setOcupado(true);
    setMsg('Cargando 1.049 participantes…');
    const ok = await guardar({
      participantes: datos.participantes.map((p) => p.username),
      hash: datos.auditoria.hash_sha256,
      ganadores: [],
      girando: null,
      status: 'active',
    });
    setMsg(ok ? '✅ Participantes cargados y sello publicado' : '');
    setOcupado(false);
  };

  const girar = async (puesto: number) => {
    setOcupado(true);
    setMsg(`🎰 Girando ${puesto}.º lugar…`);

    // se trabaja con lo que devuelve el servidor, no con el estado local:
    // el panel puede estar abierto en dos pestañas durante el vivo
    const previo = await guardar({ girando: puesto, status: 'active' });
    if (!previo) { setOcupado(false); return; }

    await new Promise((r) => setTimeout(r, duracion * 1000));

    // fuera quienes ya ganaron y quienes se descartaron por no estar en el vivo
    const excluidos = new Set<string>([
      ...(previo.ganadores || []).map((g: Ganador) => g.username),
      ...(previo.descartados || []).map((g: Ganador) => g.username),
    ]);
    const elegibles = datos.participantes.filter((p) => !excluidos.has(p.username));

    if (elegibles.length === 0) {
      await guardar({ girando: null });
      setMsg('❌ No quedan participantes elegibles');
      setOcupado(false);
      return;
    }

    const elegido = elegibles[elegirIndice(elegibles.length)];
    const ganador: Ganador = {
      puesto,
      username: elegido.username,
      comentario: elegido.comentario,
      fecha: elegido.fecha,
    };

    const nuevos = [...(previo.ganadores || []).filter((g: Ganador) => g.puesto !== puesto), ganador]
      .sort((a, b) => b.puesto - a.puesto);

    await guardar({
      ganadores: nuevos,
      girando: null,
      status: nuevos.length >= 3 ? 'finished' : 'active',
    });
    setMsg(`🏆 ${puesto}.º lugar: @${elegido.username}`);
    setOcupado(false);
  };

  /** El ganador no estaba en el vivo: se descarta y el premio vuelve a estar en juego. */
  const quitarGanador = async (puesto: number) => {
    const g = estado?.ganadores.find((x) => x.puesto === puesto);
    if (!g) return;
    if (!confirm(`¿Descartar a @${g.username} del ${puesto}.º lugar?\n\nNo volverá a salir sorteado y el premio queda libre para girar de nuevo.`)) return;

    setOcupado(true);
    await guardar({
      ganadores: estado!.ganadores.filter((x) => x.puesto !== puesto),
      descartados: [...(estado!.descartados || []), g],
      status: 'active',
    });
    setMsg(`↩ @${g.username} descartado. Puedes girar el ${puesto}.º lugar otra vez.`);
    setOcupado(false);
  };

  const reiniciar = async () => {
    if (!confirm('¿Borrar todos los ganadores y volver a empezar?')) return;
    await guardar({ ganadores: [], girando: null, status: 'active' });
    setMsg('↺ Sorteo reiniciado');
  };

  const ganadorDe = (p: number) => estado?.ganadores.find((g) => g.puesto === p);
  const listo = (estado?.total ?? 0) > 0;

  return (
    <div className={styles.panel}>
      <h1 className={styles.titulo}>Panel · Sorteo Día del Niño</h1>

      {esEnsayo && (
        <div className={styles.aviso}>
          🧪 <b>MODO ENSAYO</b> — operando sobre <code>{sorteoId}</code>. El sorteo real no se toca.
        </div>
      )}

      <div className={styles.fila}>
        <input
          className={styles.campo}
          type="password"
          placeholder="Clave de administrador"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
        />
        <a
          className={styles.enlace}
          href={esEnsayo ? `/sorteo/dia-del-nino?sorteo=${sorteoId.replace('dia-del-nino-', '')}` : '/sorteo/dia-del-nino'}
          target="_blank"
          rel="noreferrer"
        >
          Abrir overlay ↗
        </a>
      </div>

      <div className={styles.tarjeta}>
        <div className={styles.dato}><span>Participantes cargados</span><strong>{estado?.total ?? 0}</strong></div>
        <div className={styles.dato}><span>En el archivo</span><strong>{datos.participantes.length}</strong></div>
        <div className={styles.dato}><span>Estado</span><strong>{estado?.status ?? '—'}</strong></div>
        <div className={styles.dato}><span>Sello</span><code>{(estado?.hash || datos.auditoria.hash_sha256).slice(0, 24)}…</code></div>
      </div>

      <button className={styles.botonSecundario} onClick={cargarParticipantes} disabled={ocupado || !clave}>
        1 · Cargar participantes y publicar sello
      </button>

      <label className={styles.duracion}>
        Duración del giro: <strong>{duracion}s</strong>
        <input type="range" min={3} max={15} value={duracion} onChange={(e) => setDuracion(+e.target.value)} />
      </label>

      <div className={styles.premios}>
        {PREMIOS.map((p) => {
          const g = ganadorDe(p.puesto);
          return (
            <div key={p.puesto} className={styles.premio}>
              <div className={styles.premioCabecera}>
                <span className={styles.paso}>Paso {p.paso}</span>
                <span className={styles.medalla}>{p.medalla}</span>
                <div>
                  <div className={styles.premioTitulo}>{p.titulo}</div>
                  <div className={styles.premioDetalle}>{p.detalle}</div>
                </div>
              </div>
              {g ? (
                <>
                  <div className={styles.ganador}>🏆 @{g.username}</div>
                  <button
                    className={styles.botonQuitar}
                    onClick={() => quitarGanador(p.puesto)}
                    disabled={ocupado || !clave}
                  >
                    No está en el vivo · descartar y volver a girar
                  </button>
                </>
              ) : (
                <button
                  className={styles.botonGirar}
                  onClick={() => girar(p.puesto)}
                  disabled={ocupado || !listo || !clave}
                >
                  Girar {p.titulo}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {!!estado?.descartados?.length && (
        <div className={styles.descartados}>
          <b>Descartados por no estar en el vivo ({estado.descartados.length})</b>
          {estado.descartados.map((d, i) => (
            <span key={`${d.username}-${i}`}>@{d.username} · {d.puesto}.º lugar</span>
          ))}
          <em>No vuelven a salir sorteados.</em>
        </div>
      )}

      {msg && <div className={styles.mensaje}>{msg}</div>}

      <button className={styles.botonPeligro} onClick={reiniciar} disabled={ocupado || !clave}>
        Reiniciar sorteo
      </button>
    </div>
  );
}
