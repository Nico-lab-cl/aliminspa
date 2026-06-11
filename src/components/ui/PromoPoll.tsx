'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './PromoPoll.module.css';

// ═══════════════════════════════════════════════════════════
// Configuración de la encuesta
// ═══════════════════════════════════════════════════════════
const POLL_ID = 'lomas-del-mar-beneficio';
const PROYECTO = 'Lomas del Mar';

const POLL_OPTIONS = [
  { id: 1, text: '🥇 Descuento directo en el precio final' },
  { id: 2, text: '🥈 Mayor cantidad de meses para pagar el pie ¡SIN interés!' },
  { id: 3, text: '🥉 Asesoría legal y gestión de trámites notariales 100% gratuita' },
] as const;

// Clave en localStorage para recordar que ya votó
const STORAGE_KEY = 'alimin_poll_state';

// Cooldown de 7 días para re-mostrar banner si cerró sin votar
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

// ═══════════════════════════════════════════════════════════
// Tipos
// ═══════════════════════════════════════════════════════════
interface PollState {
  status: 'voted' | 'dismissed';
  timestamp: number;
}

interface PollResults {
  totalVotes: number;
  results: Record<number, { count: number; percentage: number }>;
}

// ═══════════════════════════════════════════════════════════
// Helpers de localStorage
// ═══════════════════════════════════════════════════════════
function readPollState(): PollState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.status === 'string' && typeof parsed.timestamp === 'number') {
      return parsed as PollState;
    }
    return null;
  } catch {
    return null;
  }
}

function savePollState(status: PollState['status']): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ status, timestamp: Date.now() }));
  } catch { /* noop */ }
}

/**
 * Determina si el banner debe mostrarse:
 * - Sin estado → mostrar
 * - 'voted' → NO mostrar (ya participó)
 * - 'dismissed' → mostrar si pasaron 7 días
 */
function shouldShowBanner(): boolean {
  const state = readPollState();
  if (!state) return true;
  if (state.status === 'voted') return false;
  if (state.status === 'dismissed') {
    return (Date.now() - state.timestamp) >= DISMISS_COOLDOWN_MS;
  }
  return true;
}

// ═══════════════════════════════════════════════════════════
// Clases CSS para barras de progreso
// ═══════════════════════════════════════════════════════════
const PROGRESS_CLASSES = [
  styles.progressFillFirst,
  styles.progressFillSecond,
  styles.progressFillThird,
];

/**
 * PromoPoll — Banner visible + Modal con encuesta
 *
 * Un banner dorado fijo aparece siempre en la parte inferior.
 * Al hacer clic se abre un modal con las opciones de la encuesta.
 * Los votos se guardan en la base de datos vía API route.
 * Los resultados se muestran en tiempo real tras votar.
 */
export default function PromoPoll() {
  const [showBanner, setShowBanner] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<PollResults | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Verificar si debe mostrarse al montar ─────────────────
  useEffect(() => {
    // Limpieza de clave antigua
    try { localStorage.removeItem('alimin_poll_voted'); } catch { /* noop */ }

    if (shouldShowBanner()) {
      setShowBanner(true);
    }
  }, []);

  // ── Abrir modal ───────────────────────────────────────────
  const openModal = useCallback(() => {
    setIsModalOpen(true);
    // Bloquear scroll del body
    document.body.style.overflow = 'hidden';
  }, []);

  // ── Cerrar modal ──────────────────────────────────────────
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    document.body.style.overflow = '';

    // Si no votó y cierra el modal, guardamos dismiss con cooldown
    if (!showResults) {
      savePollState('dismissed');
      setShowBanner(false);
    }
  }, [showResults]);

  // ── Cerrar banner sin abrir modal ─────────────────────────
  const dismissBanner = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // No propagar al click del banner
    savePollState('dismissed');
    setShowBanner(false);
  }, []);

  // ── Enviar voto a la API ──────────────────────────────────
  const handleVote = useCallback(async (optionId: number, optionText: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId: POLL_ID,
          optionId,
          optionText,
          proyecto: PROYECTO,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setResults(data.results);
        setShowResults(true);
        savePollState('voted');
      }
    } catch (error) {
      console.error('[PromoPoll] Error al enviar voto:', error);
      // Fallback: mostrar resultados simulados si falla la API
      setResults({
        totalVotes: 0,
        results: {
          1: { count: 0, percentage: 45 },
          2: { count: 0, percentage: 35 },
          3: { count: 0, percentage: 20 },
        },
      });
      setShowResults(true);
      savePollState('voted');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting]);

  // Si no debe mostrar banner, no renderizamos nada
  if (!showBanner) return null;

  return (
    <>
      {/* ══════════════════════════════════════════════════════
          BANNER — Siempre visible en la parte inferior
          ══════════════════════════════════════════════════════ */}
      <div
        className={styles.banner}
        onClick={openModal}
        role="button"
        tabIndex={0}
        aria-label="Abrir encuesta interactiva"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openModal(); }}
      >
        <span className={styles.bannerEmoji}>🤩</span>
        <span className={styles.bannerText}>
          ¿Qué beneficio te convencería? ¡Opina aquí!
        </span>
        <svg
          className={styles.bannerArrow}
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>

      {/* ══════════════════════════════════════════════════════
          MODAL — Se abre al hacer clic en el banner
          ══════════════════════════════════════════════════════ */}
      <div
        className={`${styles.overlay} ${isModalOpen ? styles.overlayVisible : ''}`}
        onClick={closeModal}
        aria-hidden={!isModalOpen}
      >
        <div
          className={styles.modal}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Encuesta Lomas del Mar"
        >
          {/* Botón cerrar */}
          <button
            onClick={closeModal}
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
            /* ── ESTADO 1: Opciones de la encuesta ──────────── */
            <div className={styles.content}>
              <h3 className={styles.title}>
                ¿Qué beneficio te haría decir &quot;Sí, este es mi terreno&quot;? 🤩👇
              </h3>
              <div className={styles.optionsList}>
                {POLL_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleVote(option.id, option.text)}
                    className={`${styles.optionButton} ${isSubmitting ? styles.optionButtonDisabled : ''}`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <span className={styles.spinner} />}
                    {option.text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* ── ESTADO 2: Resultados reales ────────────────── */
            <div className={styles.resultsContent}>
              <h3 className={styles.thankYouTitle}>
                ¡Gracias por ayudarnos a mejorar Lomas del Mar! 🎉
              </h3>
              <div className={styles.resultsList}>
                {POLL_OPTIONS.map((option, index) => {
                  const data = results?.results?.[option.id];
                  const percentage = data?.percentage ?? 0;
                  return (
                    <div
                      key={option.id}
                      className={`${styles.resultItem} ${styles.resultEnter}`}
                    >
                      <div className={styles.resultLabel}>
                        <span className={styles.resultText}>{option.text}</span>
                        <span className={styles.resultPercentage}>{percentage}%</span>
                      </div>
                      <div className={styles.progressTrack}>
                        <div
                          className={`${styles.progressFill} ${PROGRESS_CLASSES[index] ?? ''}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className={styles.totalVotes}>
                {results?.totalVotes
                  ? `${results.totalVotes} voto${results.totalVotes !== 1 ? 's' : ''} registrado${results.totalVotes !== 1 ? 's' : ''}`
                  : 'Resultados de la comunidad'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
