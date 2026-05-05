"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy, Users, Play, RotateCcw, Star, Upload, Eye, Crown, Sparkles } from 'lucide-react';
import styles from './sorteo.module.css';

type SorteoStatus = 'pending' | 'active' | 'finished';

interface SorteoData {
  participants: string[];
  winners: string[];
  status: SorteoStatus;
}

const PRIZES = ["$50.000", "$50.000", "$100.000"];
const PRIZE_LABELS = ["1er Premio", "2do Premio", "Gran Premio"];

export default function SorteoPage() {
  const [participants, setParticipants] = useState<string[]>([]);
  const [inputText, setInputText] = useState('');
  const [winners, setWinners] = useState<string[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [filterDuplicates, setFilterDuplicates] = useState(true);
  const [currentWinner, setCurrentWinner] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sorteoStatus, setSorteoStatus] = useState<SorteoStatus>('pending');
  const [loading, setLoading] = useState(true);
  const [showParticipantPreview, setShowParticipantPreview] = useState(false);
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);
  const angularVelocityRef = useRef(0);
  const requestRef = useRef<number>(null);
  const winnersRef = useRef<string[]>([]);
  const participantsRef = useRef<string[]>([]);

  // Keep refs in sync
  useEffect(() => { winnersRef.current = winners; }, [winners]);
  useEffect(() => { participantsRef.current = participants; }, [participants]);

  // Check admin & load data
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'alimin2026') {
      setIsAdmin(true);
    }

    // Hide floating buttons on this page
    const whatsapp = document.getElementById('whatsapp-float');
    const booking = document.getElementById('booking-float');
    if (whatsapp) whatsapp.style.display = 'none';
    if (booking) booking.style.display = 'none';

    loadSorteoData();

    return () => {
      if (whatsapp) whatsapp.style.display = '';
      if (booking) booking.style.display = '';
    };
  }, []);

  const loadSorteoData = async () => {
    try {
      const res = await fetch('/api/sorteo');
      if (res.ok) {
        const data: SorteoData = await res.json();
        setParticipants(data.participants);
        setWinners(data.winners);
        setSorteoStatus(data.status);
        if (data.participants.length > 0) {
          setInputText(data.participants.join('\n'));
        }
      }
    } catch (e) {
      console.error('Error loading sorteo:', e);
    } finally {
      setLoading(false);
    }
  };

  const saveSorteoData = async (
    newParticipants: string[],
    newWinners: string[],
    newStatus: SorteoStatus
  ) => {
    setSavingStatus('saving');
    try {
      const res = await fetch('/api/sorteo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participants: newParticipants,
          winners: newWinners,
          status: newStatus,
          adminKey: 'alimin2026',
        }),
      });
      if (res.ok) {
        setSavingStatus('saved');
        setTimeout(() => setSavingStatus('idle'), 2000);
      } else {
        setSavingStatus('error');
      }
    } catch (e) {
      console.error('Error saving sorteo:', e);
      setSavingStatus('error');
    }
  };

  // Draw the Wheel
  useEffect(() => {
    if (sorteoStatus !== 'active' || !canvasRef.current || participants.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 20;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const sliceAngle = (2 * Math.PI) / participants.length;

      participants.forEach((name, i) => {
        const angle = rotationRef.current + i * sliceAngle;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, angle, angle + sliceAngle);
        ctx.fillStyle = i % 2 === 0 ? '#c5a059' : '#1a2b2b';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.stroke();

        if (participants.length < 50) {
          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.rotate(angle + sliceAngle / 2);
          ctx.textAlign = 'right';
          ctx.fillStyle = i % 2 === 0 ? '#121d1d' : '#f8f9fa';
          ctx.font = 'bold 11px Inter';
          ctx.fillText(name.substring(0, 15), radius - 10, 4);
          ctx.restore();
        }
      });

      // Outer ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = '#c5a059';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Inner circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, 35, 0, 2 * Math.PI);
      ctx.fillStyle = '#121d1d';
      ctx.fill();
      ctx.strokeStyle = '#c5a059';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Pointer
      ctx.beginPath();
      ctx.moveTo(centerX + radius + 8, centerY);
      ctx.lineTo(centerX + radius - 18, centerY - 12);
      ctx.lineTo(centerX + radius - 18, centerY + 12);
      ctx.closePath();
      ctx.fillStyle = '#f8f9fa';
      ctx.fill();
    };

    const animate = () => {
      if (angularVelocityRef.current > 0) {
        rotationRef.current += angularVelocityRef.current;
        angularVelocityRef.current *= 0.985;

        if (angularVelocityRef.current < 0.002) {
          angularVelocityRef.current = 0;
          finalizeSelection();
        }
      }
      draw();
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [participants, sorteoStatus]);

  const handleLoadParticipants = async () => {
    let list = inputText.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    if (filterDuplicates) list = Array.from(new Set(list));
    if (list.length < 2) {
      alert('Por favor ingresa al menos 2 participantes');
      return;
    }
    setParticipants(list);
    setSorteoStatus('active');
    await saveSorteoData(list, [], 'active');
  };

  const spinWheel = () => {
    if (isSpinning || participants.length === 0) return;
    if (winnersRef.current.length >= 3) {
      alert('Ya se han seleccionado los 3 ganadores');
      return;
    }
    setIsSpinning(true);
    setCurrentWinner(null);
    angularVelocityRef.current = 0.4 + Math.random() * 0.4;
  };

  const finalizeSelection = useCallback(() => {
    setIsSpinning(false);

    const sliceAngle = (2 * Math.PI) / participantsRef.current.length;
    let winningIndex = Math.floor((0 - rotationRef.current) / sliceAngle) % participantsRef.current.length;
    if (winningIndex < 0) winningIndex += participantsRef.current.length;

    const winner = participantsRef.current[winningIndex];
    const newWinners = [...winnersRef.current, winner];
    setWinners(newWinners);
    setCurrentWinner(winner);

    confetti({
      particleCount: 200,
      spread: 80,
      origin: { y: 0.5 },
      colors: ['#c5a059', '#e5c17e', '#f8f9fa', '#1a2b2b'],
    });

    playWinSound();

    // Check if all 3 winners selected
    const newStatus: SorteoStatus = newWinners.length >= 3 ? 'finished' : 'active';
    if (newStatus === 'finished') {
      setSorteoStatus('finished');
    }
    saveSorteoData(participantsRef.current, newWinners, newStatus);
  }, []);

  const playWinSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {}
  };

  const resetAll = async () => {
    if (confirm('¿Reiniciar todo el sorteo? Se borrarán los ganadores.')) {
      setWinners([]);
      setCurrentWinner(null);
      setParticipants([]);
      setInputText('');
      setSorteoStatus('pending');
      await saveSorteoData([], [], 'pending');
    }
  };

  if (loading) {
    return (
      <div className={styles.mainContainer}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p>Cargando sorteo...</p>
        </div>
      </div>
    );
  }

  // ─── PUBLIC: Results View (finished) ───
  if (sorteoStatus === 'finished' && !isAdmin) {
    return (
      <div className={styles.mainContainer}>
        <header className={styles.header}>
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className={styles.title}>SORTEO ALIMIN</h1>
            <p className={styles.subtitle}>Especial Día del Trabajador</p>
          </motion.div>
        </header>

        <main className={styles.contentArea}>
          {/* Winners Showcase */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={styles.winnersShowcase}
          >
            <div className={styles.showcaseHeader}>
              <Crown size={32} className={styles.goldIcon} />
              <h2 className={styles.showcaseTitle}>¡Ganadores Oficiales!</h2>
            </div>

            <div className={styles.winnersGrid}>
              {winners.map((winner, idx) => (
                <motion.div
                  key={winner + idx}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.3 }}
                  className={`${styles.winnerCard} ${idx === 2 ? styles.grandPrize : ''}`}
                >
                  <div className={styles.prizeLabel}>{PRIZE_LABELS[idx]}</div>
                  <div className={styles.winnerName}>{winner}</div>
                  <div className={styles.prizeAmount}>{PRIZES[idx]}</div>
                  <Trophy size={20} className={styles.goldIcon} />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Participants preview */}
          <div className={styles.participantsSection}>
            <button
              className={styles.toggleParticipants}
              onClick={() => setShowParticipantPreview(!showParticipantPreview)}
            >
              <Eye size={16} />
              {showParticipantPreview ? 'Ocultar' : 'Ver'} participantes ({participants.length})
            </button>

            <AnimatePresence>
              {showParticipantPreview && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className={styles.participantsGrid}
                >
                  {participants.map((name, i) => (
                    <span
                      key={name + i}
                      className={`${styles.participantTag} ${winners.includes(name) ? styles.winnerTag : ''}`}
                    >
                      {name}
                      {winners.includes(name) && <Star size={10} fill="currentColor" />}
                    </span>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    );
  }

  // ─── PUBLIC: Pending View ───
  if (sorteoStatus === 'pending' && !isAdmin) {
    return (
      <div className={styles.mainContainer}>
        <header className={styles.header}>
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className={styles.title}>SORTEO ALIMIN</h1>
            <p className={styles.subtitle}>Especial Día del Trabajador</p>
          </motion.div>
        </header>
        <main className={styles.contentArea}>
          <div className={styles.pendingView}>
            <Trophy size={64} className={styles.goldIcon} style={{ opacity: 0.3 }} />
            <h2 className={styles.pendingTitle}>Próximamente: Gran Sorteo</h2>
            <p className={styles.pendingDate}>Lunes 5 de Mayo, 2026</p>
            <div className={styles.prizePreview}>
              {PRIZES.map((prize, i) => (
                <div key={i} className={styles.prizePreviewItem}>
                  <span className={styles.prizePreviewLabel}>{PRIZE_LABELS[i]}</span>
                  <span className={styles.prizePreviewAmount}>{prize}</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ─── PUBLIC: Active View (watching the sorteo live, no admin) ───
  if (sorteoStatus === 'active' && !isAdmin) {
    return (
      <div className={styles.mainContainer}>
        <header className={styles.header}>
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className={styles.title}>SORTEO ALIMIN</h1>
            <p className={styles.subtitle}>¡Sorteo en vivo!</p>
          </motion.div>
        </header>
        <main className={styles.contentArea}>
          <div className={styles.liveIndicator}>
            <Sparkles size={16} />
            <span>EN VIVO — {participants.length} participantes</span>
          </div>

          {/* Show winners so far */}
          {winners.length > 0 && (
            <div className={styles.winnersGrid}>
              {winners.map((winner, idx) => (
                <motion.div
                  key={winner + idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`${styles.winnerCard} ${idx === 2 ? styles.grandPrize : ''}`}
                >
                  <div className={styles.prizeLabel}>{PRIZE_LABELS[idx]}</div>
                  <div className={styles.winnerName}>{winner}</div>
                  <div className={styles.prizeAmount}>{PRIZES[idx]}</div>
                </motion.div>
              ))}
            </div>
          )}

          <p className={styles.liveSubtext}>
            Sigue el sorteo en nuestro live de Instagram
          </p>
        </main>
      </div>
    );
  }

  // ─── ADMIN VIEW ───
  return (
    <div className={styles.mainContainer}>
      <header className={styles.header}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className={styles.title}>SORTEO ALIMIN</h1>
          <p className={styles.subtitle}>Panel de Administración</p>
          {savingStatus === 'saving' && <p className={styles.saveBadge}>Guardando...</p>}
          {savingStatus === 'saved' && <p className={styles.saveBadge} style={{ color: '#4ade80' }}>✓ Guardado</p>}
          {savingStatus === 'error' && <p className={styles.saveBadge} style={{ color: '#f87171' }}>Error al guardar</p>}
        </motion.div>
      </header>

      <main className={styles.contentArea}>
        {/* Setup Phase */}
        {sorteoStatus === 'pending' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={styles.glassCard}>
            <div className={styles.setupTitle}>
              <Upload className={styles.goldIcon} />
              <span>Cargar Participantes</span>
            </div>
            <textarea
              className={styles.textarea}
              placeholder={"@usuario1\n@usuario2\n@usuario3..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <div className={styles.setupControls}>
              <label className={styles.toggleLabel} onClick={() => setFilterDuplicates(!filterDuplicates)}>
                <div className={`${styles.toggle} ${filterDuplicates ? styles.toggleOn : ''}`}>
                  <div className={styles.toggleDot} />
                </div>
                <span>Filtrar duplicados</span>
              </label>
              <span className={styles.participantCount}>
                Total: {inputText.split('\n').filter(s => s.trim()).length}
              </span>
            </div>
            <button onClick={handleLoadParticipants} className={styles.btnPrimary}>
              <Play size={18} /> Cargar y Preparar Sorteo
            </button>
          </motion.div>
        )}

        {/* Active Phase — Roulette */}
        {(sorteoStatus === 'active' || sorteoStatus === 'finished') && (
          <div className={styles.sorteoLayout}>
            {/* Left: Wheel + Controls */}
            <div className={styles.wheelSection}>
              {/* Participant preview toggle */}
              <button
                className={styles.toggleParticipants}
                onClick={() => setShowParticipantPreview(!showParticipantPreview)}
              >
                <Users size={16} />
                {showParticipantPreview ? 'Ocultar' : 'Ver'} los {participants.length} participantes
              </button>

              <AnimatePresence>
                {showParticipantPreview && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className={styles.participantsGrid}
                  >
                    {participants.map((name, i) => (
                      <span
                        key={name + i}
                        className={`${styles.participantTag} ${winners.includes(name) ? styles.winnerTag : ''}`}
                      >
                        {name}
                      </span>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Canvas Wheel */}
              {sorteoStatus === 'active' && (
                <>
                  <div className={styles.canvasWrapper}>
                    <canvas ref={canvasRef} width={450} height={450} className={styles.wheelCanvas} />
                    <div className={styles.centerOverlay}>
                      <Star className={styles.goldIcon} fill="currentColor" size={24} />
                    </div>
                  </div>

                  <div className={styles.spinInfo}>
                    Sorteo {winners.length + 1} de 3 — {PRIZES[winners.length]} en juego
                  </div>

                  <button
                    onClick={spinWheel}
                    disabled={isSpinning || winners.length >= 3}
                    className={styles.btnSpin}
                  >
                    {isSpinning ? 'GIRANDO...' : winners.length >= 3 ? '¡SORTEO COMPLETO!' : '¡GIRAR RULETA!'}
                  </button>
                </>
              )}

              {/* Current winner reveal */}
              <AnimatePresence mode="wait">
                {currentWinner && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className={styles.winnerReveal}
                  >
                    <h4 className={styles.winnerRevealLabel}>¡Tenemos Ganador!</h4>
                    <div className={styles.winnerRevealName}>{currentWinner}</div>
                    <div className={styles.winnerRevealPrize}>{PRIZES[winners.length - 1]}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right: Winners List */}
            <div className={styles.winnersPanel}>
              <h3 className={styles.winnersPanelTitle}>
                <Trophy className={styles.goldIcon} size={22} /> Ganadores
              </h3>

              <div className={styles.winnersStack}>
                {[0, 1, 2].map(idx => (
                  <div
                    key={idx}
                    className={`${styles.winnerSlot} ${winners[idx] ? styles.winnerSlotFilled : ''} ${idx === 2 ? styles.grandPrize : ''}`}
                  >
                    <div className={styles.slotHeader}>
                      <span className={styles.slotLabel}>{PRIZE_LABELS[idx]}</span>
                      <span className={styles.slotPrize}>{PRIZES[idx]}</span>
                    </div>
                    <div className={styles.slotName}>
                      {winners[idx] ? (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          {winners[idx]}
                        </motion.span>
                      ) : (
                        <span className={styles.slotEmpty}>Pendiente</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={resetAll} className={styles.btnReset}>
                <RotateCcw size={14} /> Reiniciar Sorteo
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
