"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy, Users, Play, RotateCcw, Award, Star } from 'lucide-react';
import styles from './sorteo.module.css';

export default function SorteoPage() {
  const [participants, setParticipants] = useState<string[]>([]);
  const [inputText, setInputText] = useState('');
  const [winners, setWinners] = useState<string[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [filterDuplicates, setFilterDuplicates] = useState(true);
  const [currentWinner, setCurrentWinner] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState(true);
  const [tempDisplay, setTempDisplay] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check for admin key in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'alimin2026') {
      setIsAdmin(true);
    }
  }, []);

  const handleStart = () => {
    let list = inputText.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    
    if (filterDuplicates) {
      list = Array.from(new Set(list));
    }

    if (list.length < 2) {
      alert('Por favor ingresa al menos 2 participantes');
      return;
    }
    setParticipants(list);
    setShowSetup(false);
  };

  const spinRoulette = () => {
    if (isSpinning || participants.length === 0) return;
    
    setIsSpinning(true);
    setCurrentWinner(null);
    
    const duration = 4000;
    const startTime = Date.now();
    
    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      
      if (elapsed < duration) {
        const randomIndex = Math.floor(Math.random() * participants.length);
        setTempDisplay(participants[randomIndex]);
        requestAnimationFrame(animate);
      } else {
        const remainingParticipants = participants.filter(p => !winners.includes(p));
        if (remainingParticipants.length === 0) {
           alert("Ya no hay más participantes disponibles.");
           setIsSpinning(false);
           return;
        }
        const winnerIndex = Math.floor(Math.random() * remainingParticipants.length);
        const winner = remainingParticipants[winnerIndex];
        finishSpin(winner);
      }
    };
    
    requestAnimationFrame(animate);
  };

  const finishSpin = (winner: string) => {
    setIsSpinning(false);
    setCurrentWinner(winner);
    setWinners(prev => [winner, ...prev]);
    
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#c5a059', '#f8f9fa', '#e5c17e']
    });

    playWinSound();
  };

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
    } catch (e) {
      console.log('Audio not supported or blocked');
    }
  };

  const resetAll = () => {
    if (confirm('¿Estás seguro de reiniciar todo? Se borrarán los ganadores.')) {
      setWinners([]);
      setCurrentWinner(null);
      setShowSetup(true);
    }
  };

  useEffect(() => {
    // Hide floating buttons for a cleaner stream view
    const whatsapp = document.getElementById('whatsapp-float');
    const booking = document.getElementById('booking-float');
    if (whatsapp) whatsapp.style.display = 'none';
    if (booking) booking.style.display = 'none';

    return () => {
      if (whatsapp) whatsapp.style.display = 'flex';
      if (booking) booking.style.display = 'flex';
    };
  }, []);

  return (
    <div className={styles.mainContainer}>
      <header className={styles.header}>
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={styles.logoContainer}>
             <svg viewBox="0 0 100 100" className="w-full h-full">
               <path d="M50 10 L90 80 L10 80 Z" fill="none" stroke="#c5a059" strokeWidth="4" />
               <path d="M50 30 L75 75 L25 75 Z" fill="#c5a059" />
             </svg>
          </div>
          <h1 className={styles.title}>SORTEO ALIMIN</h1>
          <p className={styles.subtitle}>Especial Día del Trabajador</p>
        </motion.div>
      </header>

      <main className="w-full max-w-4xl flex flex-col items-center">
        {!isAdmin && showSetup ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="mb-8">
               <Trophy size={64} className="text-[#c5a059] mx-auto mb-4 opacity-50" />
               <h2 className="text-3xl font-serif mb-2">Sorteo en Vivo</h2>
               <p className="text-gray-500 uppercase tracking-widest text-sm">Próximamente • Martes 5 de Mayo</p>
            </div>
            <div className="glass-card p-8 inline-block">
              <p className="text-gray-300 italic">"El éxito es la suma de pequeños esfuerzos repetidos día tras día"</p>
            </div>
          </motion.div>
        ) : showSetup ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={styles.glassCard}
          >
            <div className={styles.setupTitle}>
              <Users className="text-[#c5a059]" />
              <span>Cargar Participantes</span>
            </div>
            
            <p className="text-gray-400 mb-6 text-sm">
              Pega la lista de usuarios de Instagram (uno por línea). 
              Solo los que cumplieron con las bases del concurso.
            </p>
            
            <textarea 
              className={styles.textarea}
              placeholder="@usuario1&#10;@usuario2&#10;@usuario3..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            
            <div className="flex flex-col gap-4 mb-6">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${filterDuplicates ? 'bg-[#c5a059]' : 'bg-white/10'}`} onClick={() => setFilterDuplicates(!filterDuplicates)}>
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${filterDuplicates ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Filtrar duplicados (Un solo cupo por persona)</span>
              </label>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500 uppercase tracking-widest">
                Total detectados: <span className="text-white font-bold">{inputText.split('\n').filter(s => s.trim()).length}</span>
              </div>
              <button 
                onClick={handleStart}
                className={styles.btnPrimary}
              >
                <Play size={18} /> Preparar Sorteo
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="w-full space-y-12">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={styles.glassCard}
            >
              <div className="text-center mb-10">
                <h3 className="text-gray-500 uppercase tracking-[0.3em] text-xs mb-6">Sorteando ahora</h3>
                
                <div className={styles.rouletteContainer}>
                  <div className={styles.winnerDisplay}>
                    {isSpinning ? tempDisplay : (currentWinner || '???')}
                  </div>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#c5a059] rotate-45 -translate-y-2" />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#c5a059] rotate-45 translate-y-2" />
                </div>

                <div className="flex justify-center">
                  <button 
                    onClick={spinRoulette}
                    disabled={isSpinning || participants.length === 0}
                    className={styles.btnPrimary}
                  >
                    {isSpinning ? 'GIRANDO...' : '¡LANZAR RULETA!'}
                  </button>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-6 border-t border-white/5 text-[10px] text-gray-600 uppercase tracking-widest">
                <span>Total participantes: {participants.length}</span>
                <span>Restantes: {participants.length - winners.length}</span>
              </div>
            </motion.div>

            <div className={styles.winnersList}>
              <div className="flex items-center gap-3 mb-8">
                <Trophy className="text-[#c5a059]" />
                <h2 className="text-2xl font-bold font-serif">Ganadores Oficiales</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence>
                  {winners.map((winner, idx) => (
                    <motion.div 
                      key={winner}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={styles.winnerItem}
                    >
                      <div className="flex items-center gap-4">
                        <div className={styles.winnerBadge}>{winners.length - idx}</div>
                        <span className="text-lg font-semibold">{winner}</span>
                      </div>
                      <Star className="text-[#c5a059]" fill="currentColor" size={16} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {winners.length === 0 && !isSpinning && (
                <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                  <p className="text-gray-600 italic">Esperando el primer giro...</p>
                </div>
              )}
            </div>

            <div className="flex justify-center pt-10">
              <button 
                onClick={resetAll}
                className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors text-[10px] uppercase tracking-[0.2em] font-bold"
              >
                <RotateCcw size={14} /> Reiniciar Todo
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        ALIMIN Propiedades • Sorteo Digital 2026
      </footer>
    </div>
  );
}
