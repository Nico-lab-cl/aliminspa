'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './PromoPoll.module.css';

// ═══════════════════════════════════════════════════════════
// Datos mockeados de resultados — Preparados para reemplazarse
// por un Server Action que consulte la base de datos real.
// ═══════════════════════════════════════════════════════════
const MOCK_RESULTS: Record<number, number> = {
  1: 45, // 45% de los votos
  2: 35, // 35% de los votos
  3: 20, // 20% de los votos
};

const POLL_OPTIONS = [
  { id: 1, text: '🥇 Descuento directo en el precio final' },
  { id: 2, text: '🥈 Mayor cantidad de meses para pagar el pie ¡SIN interés!' },
  { id: 3, text: '🥉 Asesoría legal y gestión de trámites notariales 100% gratuita' },
] as const;

// Clave usada en localStorage para persistir el estado de la encuesta
const STORAGE_KEY = 'alimin_poll_state';

// Porcentaje de scroll para activar la aparición del componente
const SCROLL_TRIGGER_PERCENT = 50;

// Tiempo (ms) antes de ocultar el componente después de votar
const AUTO_DISMISS_DELAY = 8000;

// Tiempo de cooldown (ms) antes de volver a mostrar si el usuario cerró sin votar
// 7 días = 7 * 24 * 60 * 60 * 1000
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

// ═══════════════════════════════════════════════════════════
// Tipos para la persistencia en localStorage
// ═══════════════════════════════════════════════════════════
interface PollState {
  /** 'voted' = nunca volver a mostrar | 'dismissed' = re-mostrar tras cooldown */
  status: 'voted' | 'dismissed';
  /** Timestamp (ms) de cuándo se guardó el estado */
  timestamp: number;
}

/**
 * Lee el estado de la encuesta desde localStorage.
 * Retorna null si no hay estado guardado o si el JSON es inválido.
 */
function readPollState(): PollState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Validación básica de la estructura
    if (parsed && typeof parsed.status === 'string' && typeof parsed.timestamp === 'number') {
      return parsed as PollState;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Guarda el estado de la encuesta en localStorage.
 */
function savePollState(status: PollState['status']): void {
  try {
    const state: PollState = { status, timestamp: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Fallo silencioso si localStorage no está disponible
  }
}

/**
 * Determina si la encuesta debe mostrarse según el estado guardado.
 *
 * - Sin estado → mostrar (visitante nuevo)
 * - status: 'voted' → NUNCA volver a mostrar
 * - status: 'dismissed' → mostrar solo si han pasado más de 7 días
 */
function shouldShowPoll(): { show: boolean; alreadyVoted: boolean } {
  const state = readPollState();

  // Visitante nuevo — sin datos en localStorage
  if (!state) return { show: true, alreadyVoted: false };

  // Ya votó — no molestar nunca más
  if (state.status === 'voted') return { show: false, alreadyVoted: true };

  // Cerró sin votar — verificamos si ya pasó el cooldown de 7 días
  if (state.status === 'dismissed') {
    const elapsed = Date.now() - state.timestamp;
    const cooldownExpired = elapsed >= DISMISS_COOLDOWN_MS;
    return { show: cooldownExpired, alreadyVoted: false };
  }

  // Fallback seguro
  return { show: true, alreadyVoted: false };
}

// ═══════════════════════════════════════════════════════════
// Mapeo de clases CSS para las barras de progreso de cada opción
// ═══════════════════════════════════════════════════════════
const PROGRESS_FILL_CLASSES = [
  styles.progressFillFirst,
  styles.progressFillSecond,
  styles.progressFillThird,
];

/**
 * PromoPoll — Encuesta interactiva tipo slide-in / bottom-sheet
 *
 * Se muestra al scrollear el 50% de la página, guarda el voto en
 * localStorage para evitar doble participación, y muestra resultados
 * simulados con barras de progreso animadas.
 *
 * En desktop aparece como un card flotante en la esquina inferior derecha.
 * En mobile se transforma en un bottom-sheet de ancho completo.
 */
export default function PromoPoll() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // ── Verificación de localStorage y listener de scroll ───────
  useEffect(() => {
    // Limpieza de la clave antigua (backwards compatibility)
    try { localStorage.removeItem('alimin_poll_voted'); } catch { /* noop */ }

    // Verificamos si la encuesta debe mostrarse según el estado guardado
    const { show, alreadyVoted } = shouldShowPoll();

    if (!show) {
      setHasVoted(alreadyVoted);
      setIsDismissed(true);
      return;
    }

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Evitamos división por cero en páginas muy cortas
      if (documentHeight <= windowHeight) return;

      const scrollPercentage = (scrollPosition / (documentHeight - windowHeight)) * 100;

      if (scrollPercentage >= SCROLL_TRIGGER_PERCENT) {
        setIsVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Verificación inicial por si el usuario ya está en la posición correcta
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []); // Solo se ejecuta al montar

  // ── Handler de voto ─────────────────────────────────────────
  const handleVote = useCallback((optionId: number) => {
    // Aquí se conectaría con un Server Action en producción:
    // await submitVote(optionId);
    console.log('[PromoPoll] Voto registrado:', optionId);

    // Persistimos como 'voted' — nunca más se mostrará la encuesta
    savePollState('voted');

    setHasVoted(true);
    setShowResults(true);

    // Auto-dismiss después de unos segundos para no obstruir la UI
    setTimeout(() => {
      setIsVisible(false);
      // Tras la animación de salida, marcamos como dismissed
      setTimeout(() => setIsDismissed(true), 600);
    }, AUTO_DISMISS_DELAY);
  }, []);

  // ── Handler de cierre manual (sin votar) ────────────────────
  const handleClose = useCallback(() => {
    // Guardamos como 'dismissed' con timestamp — se re-mostrará en 7 días
    savePollState('dismissed');

    setIsVisible(false);
    // Esperamos a que termine la animación de salida antes de desmontar
    setTimeout(() => setIsDismissed(true), 600);
  }, []);

  // Si fue cerrado o si ya había votado en sesión anterior, no renderizamos
  if (isDismissed) return null;

  return (
    <div
      className={`${styles.wrapper} ${isVisible ? styles.visible : styles.hidden}`}
      role="complementary"
      aria-label="Encuesta interactiva Lomas del Mar"
    >
      {/* Botón de cierre */}
      <button
        onClick={handleClose}
        className={styles.closeButton}
        aria-label="Cerrar encuesta"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {!showResults ? (
        /* ══════════════════════════════════════════════════════
           ESTADO 1: Opciones de la encuesta
           ══════════════════════════════════════════════════════ */
        <div className={styles.content}>
          <h3 className={styles.title}>
            ¿Qué beneficio te haría decir &quot;Sí, este es mi terreno&quot;? 🤩👇
          </h3>
          <div className={styles.optionsList}>
            {POLL_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => handleVote(option.id)}
                className={styles.optionButton}
              >
                {option.text}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════
           ESTADO 2: Resultados post-clic
           ══════════════════════════════════════════════════════ */
        <div className={styles.resultsContent}>
          <h3 className={styles.thankYouTitle}>
            ¡Gracias por ayudarnos a mejorar Lomas del Mar! 🎉
          </h3>
          <div className={styles.resultsList}>
            {POLL_OPTIONS.map((option, index) => {
              const percentage = MOCK_RESULTS[option.id] ?? 0;
              return (
                <div
                  key={option.id}
                  className={`${styles.resultItem} ${styles.resultEnter}`}
                >
                  <div className={styles.resultLabel}>
                    <span className={styles.resultText}>{option.text}</span>
                    <span className={styles.resultPercentage}>{percentage}%</span>
                  </div>
                  {/* Barra de progreso con color diferenciado por posición */}
                  <div className={styles.progressTrack}>
                    <div
                      className={`${styles.progressFill} ${PROGRESS_FILL_CLASSES[index] ?? ''}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className={styles.footnote}>
            Resultados simulados de la comunidad
          </p>
        </div>
      )}
    </div>
  );
}
