"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy, Users, Play, RotateCcw, Award, Star, Settings } from 'lucide-react';
import styles from './sorteo.module.css';

export default function SorteoPage() {
  const [participants, setParticipants] = useState<string[]>([]);
  const [inputText, setInputText] = useState('');
  const [winners, setWinners] = useState<string[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [filterDuplicates, setFilterDuplicates] = useState(true);
  const [currentWinner, setCurrentWinner] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);
  const angularVelocityRef = useRef(0);
  const requestRef = useRef<number>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'alimin2026') {
      setIsAdmin(true);
    }
  }, []);

  // Draw the Wheel
  useEffect(() => {
    if (showSetup || !canvasRef.current || participants.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 20;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw slices
      const sliceAngle = (2 * Math.PI) / participants.length;
      
      participants.forEach((name, i) => {
        const angle = rotationRef.current + i * sliceAngle;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, angle, angle + sliceAngle);
        
        // Alternate gold/teal colors
        ctx.fillStyle = i % 2 === 0 ? '#c5a059' : '#1a2b2b';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.stroke();

        // Only draw names if there are few, otherwise it's a mess
        // But for many, we draw a glow effect on the active part
        if (participants.length < 50) {
          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.rotate(angle + sliceAngle / 2);
          ctx.textAlign = 'right';
          ctx.fillStyle = i % 2 === 0 ? '#121d1d' : '#f8f9fa';
          ctx.font = 'bold 12px Inter';
          ctx.fillText(name.substring(0, 15), radius - 10, 5);
          ctx.restore();
        }
      });

      // Outer ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = '#c5a059';
      ctx.lineWidth = 8;
      ctx.stroke();

      // Inner circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, 40, 0, 2 * Math.PI);
      ctx.fillStyle = '#121d1d';
      ctx.fill();
      ctx.strokeStyle = '#c5a059';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Pointer (Triangle at the top)
      ctx.beginPath();
      ctx.moveTo(centerX + radius + 10, centerY);
      ctx.lineTo(centerX + radius - 20, centerY - 15);
      ctx.lineTo(centerX + radius - 20, centerY + 15);
      ctx.closePath();
      ctx.fillStyle = '#f8f9fa';
      ctx.fill();
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
    };

    const animate = () => {
      if (angularVelocityRef.current > 0) {
        rotationRef.current += angularVelocityRef.current;
        angularVelocityRef.current *= 0.985; // Friction

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
  }, [participants, showSetup]);

  const handleStart = () => {
    let list = inputText.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    if (filterDuplicates) list = Array.from(new Set(list));
    if (list.length < 2) {
      alert('Por favor ingresa al menos 2 participantes');
      return;
    }
    setParticipants(list);
    setShowSetup(false);
  };

  const spinWheel = () => {
    if (isSpinning || participants.length === 0) return;
    setIsSpinning(true);
    setCurrentWinner(null);
    
    // Initial kick
    angularVelocityRef.current = 0.5 + Math.random() * 0.5;
  };

  const finalizeSelection = () => {
    setIsSpinning(false);
    
    // Calculate winner based on rotation
    const sliceAngle = (2 * Math.PI) / participants.length;
    // The pointer is at angle 0 (right side in canvas context)
    // We need to find which index is at the pointer position
    const normalizedRotation = rotationRef.current % (2 * Math.PI);
    const pointerAngle = 0; 
    
    // Find index
    let winningIndex = Math.floor((pointerAngle - rotationRef.current) / sliceAngle) % participants.length;
    if (winningIndex < 0) winningIndex += participants.length;
    
    const winner = participants[winningIndex];
    setWinners(prev => [winner, ...prev]);
    setCurrentWinner(winner);

    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#c5a059', '#1a2b2b', '#f8f9fa']
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
    } catch (e) {}
  };

  const resetAll = () => {
    if (confirm('¿Reiniciar todo?')) {
      setWinners([]);
      setCurrentWinner(null);
      setShowSetup(true);
    }
  };

  return (
    <div className={styles.mainContainer}>
      <header className={styles.header}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className={styles.title}>SORTEO ALIMIN</h1>
          <p className={styles.subtitle}>Especial Día del Trabajador</p>
        </motion.div>
      </header>

      <main className="w-full max-w-5xl flex flex-col items-center">
        {!isAdmin && showSetup ? (
          <div className="text-center py-20">
             <Trophy size={64} className="text-[#c5a059] mx-auto mb-4 opacity-30" />
             <h2 className="text-3xl font-serif mb-2">Próximamente: Gran Sorteo</h2>
             <p className="text-gray-500 uppercase tracking-widest text-sm">Martes 5 de Mayo</p>
          </div>
        ) : showSetup ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={styles.glassCard}>
            <div className={styles.setupTitle}>
              <Users className="text-[#c5a059]" />
              <span>Cargar Participantes</span>
            </div>
            <textarea className={styles.textarea} placeholder="@usuario1&#10;@usuario2..." value={inputText} onChange={(e) => setInputText(e.target.value)} />
            <div className="flex flex-col gap-4 mb-6">
              <label className="flex items-center gap-3 cursor-pointer group" onClick={() => setFilterDuplicates(!filterDuplicates)}>
                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${filterDuplicates ? 'bg-[#c5a059]' : 'bg-white/10'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${filterDuplicates ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
                <span className="text-sm text-gray-300">Filtrar duplicados</span>
              </label>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <span className="text-xs text-gray-500 uppercase">Total: {inputText.split('\n').filter(s => s.trim()).length}</span>
              <button onClick={handleStart} className={styles.btnPrimary}><Play size={18} /> Preparar Sorteo</button>
            </div>
          </motion.div>
        ) : (
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Wheel Section */}
            <div className="flex flex-col items-center">
              <div className="relative mb-8">
                <canvas ref={canvasRef} width={500} height={500} className="max-w-full h-auto drop-shadow-[0_0_30px_rgba(197,160,89,0.2)]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                   <div className="w-20 h-20 rounded-full border-4 border-gold bg-dark flex items-center justify-center shadow-xl">
                      <Star className="text-gold" fill="currentColor" />
                   </div>
                </div>
              </div>
              
              <button onClick={spinWheel} disabled={isSpinning} className={`${styles.btnPrimary} text-xl md:text-2xl px-8 py-4 md:px-16 md:py-6 w-full max-w-sm justify-center`}>
                {isSpinning ? 'GIRANDO...' : '¡GIRAR RULETA!'}
              </button>

              <div className="mt-12 text-center">
                 <AnimatePresence mode="wait">
                   {currentWinner && (
                     <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gold/10 border-2 border-gold p-8 rounded-3xl">
                        <h4 className="text-gold uppercase tracking-[0.4em] text-xs mb-2">¡Tenemos Ganador!</h4>
                        <div className="text-4xl font-bold">{currentWinner}</div>
                     </motion.div>
                   )}
                 </AnimatePresence>
              </div>
            </div>

            {/* Side Info */}
            <div className="space-y-8">
               <div className={styles.winnersList}>
                  <h3 className="text-xl font-bold font-serif mb-6 flex items-center gap-2">
                    <Trophy className="text-gold" /> Ganadores
                  </h3>
                  <div className="space-y-3">
                    {winners.map((winner, idx) => {
                      const prizeIndex = winners.length - 1 - idx;
                      const prizes = ["$50.000", "$50.000", "$100.000"];
                      return (
                        <div key={winner + idx} className={styles.winnerItem}>
                          <div>
                            <div className="font-bold">{winner}</div>
                            <div className="text-[10px] text-gold uppercase font-bold">{prizes[prizeIndex] || "Premio"}</div>
                          </div>
                          <Star className="text-gold" size={16} fill="currentColor" />
                        </div>
                      );
                    })}
                  </div>
               </div>
               <button onClick={resetAll} className="text-gray-600 text-xs uppercase font-bold flex items-center gap-2"><RotateCcw size={14} /> Reiniciar</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
