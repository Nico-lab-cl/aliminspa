'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './participantes.module.css';

const SORTEO_ID = 'dia-del-nino-2026';

function idDesdeUrl(): string {
  if (typeof window === 'undefined') return SORTEO_ID;
  const p = new URLSearchParams(window.location.search).get('sorteo');
  const limpio = (p || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 24);
  return limpio ? `dia-del-nino-${limpio}` : SORTEO_ID;
}

export default function Participantes() {
  const [lista, setLista] = useState<string[]>([]);
  const [hash, setHash] = useState('');
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [sorteoId, setSorteoId] = useState(SORTEO_ID);

  useEffect(() => setSorteoId(idDesdeUrl()), []);

  const cargar = useCallback(async () => {
    try {
      const r = await fetch(`/api/sorteo/${sorteoId}`, { cache: 'no-store' });
      if (r.ok) {
        const d = await r.json();
        setLista(d.participantes || []);
        setHash(d.hash || '');
      }
    } finally {
      setCargando(false);
    }
  }, [sorteoId]);

  useEffect(() => { cargar(); }, [cargar]);

  // el @ se escribe con o sin arroba, con mayúsculas, con espacios de más
  const consulta = busqueda.trim().toLowerCase().replace(/^@/, '');

  const resultados = useMemo(() => {
    if (!consulta) return [];
    return lista.filter((u) => u.toLowerCase().includes(consulta)).slice(0, 50);
  }, [consulta, lista]);

  const exacto = consulta && lista.some((u) => u.toLowerCase() === consulta);

  return (
    <main className={styles.pagina}>
      <div className={styles.caja}>
        <h1 className={styles.titulo}>¿Estás participando?</h1>
        <p className={styles.bajada}>
          Sorteo Día del Niño de Alimin. Acá está la lista completa de quienes
          comentaron <b>ALIMIN</b> en{' '}
          <a href="https://www.instagram.com/p/DbMWykKt2G2/" target="_blank" rel="noreferrer">
            la publicación
          </a>.
        </p>

        <div className={styles.total}>
          <span className={styles.totalNumero}>
            {cargando ? '…' : lista.length.toLocaleString('es-CL')}
          </span>
          <span className={styles.totalTexto}>personas participando</span>
        </div>

        <input
          className={styles.campo}
          type="search"
          inputMode="search"
          autoComplete="off"
          placeholder="Escribe tu usuario de Instagram…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          aria-label="Buscar tu usuario"
        />

        {consulta && (
          <div className={exacto ? styles.siEstas : styles.noEstas}>
            {exacto
              ? <>✅ <b>@{consulta}</b> está participando</>
              : resultados.length > 0
                ? <>No encontramos <b>@{consulta}</b> exacto. ¿Es alguno de estos?</>
                : <>No encontramos <b>@{consulta}</b> en la lista</>}
          </div>
        )}

        {consulta && resultados.length > 0 && (
          <ul className={styles.resultados}>
            {resultados.map((u) => (
              <li key={u}>
                <a href={`https://www.instagram.com/${u}/`} target="_blank" rel="noreferrer">@{u}</a>
              </li>
            ))}
          </ul>
        )}

        {consulta && resultados.length === 0 && !cargando && (
          <p className={styles.ayuda}>
            Revisa que esté bien escrito. Solo participa quien comentó la palabra
            ALIMIN en la publicación: las respuestas a otros comentarios y las
            etiquetas por sí solas no cuentan, y cada persona participa una sola vez.
          </p>
        )}

        {!consulta && !cargando && (
          <>
            <h2 className={styles.subtitulo}>Lista completa</h2>
            <ul className={styles.todos}>
              {lista.map((u, i) => (
                <li key={u}>
                  <span className={styles.n}>{i + 1}</span>
                  <a href={`https://www.instagram.com/${u}/`} target="_blank" rel="noreferrer">@{u}</a>
                </li>
              ))}
            </ul>
          </>
        )}

        {hash && (
          <p className={styles.sello}>
            <b>Sello de la lista</b><br />
            {hash}
            <span>
              Se calcula sobre la lista completa. Si alguien la modificara, este
              código cambiaría.
            </span>
          </p>
        )}
      </div>
    </main>
  );
}
