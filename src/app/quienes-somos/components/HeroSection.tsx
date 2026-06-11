'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { FlipWords } from './FlipWords';
import styles from '../page.module.css';

export const HeroSection = () => {
  const words = ["Tu futuro", "una mejor vida", "un mejor camino"];

  const pillars = [
    { icon: "✦", title: "Cercanía real", desc: "Trato humano y personalizado" },
    { icon: "◉", title: "Transparencia", desc: "Claridad en cada paso" },
    { icon: "◈", title: "Visión de futuro", desc: "Inversiones sostenibles" },
  ];

  return (
    <section className={styles.heroSection}>
      <div className={styles.heroOverlay} />
      <div className={styles.heroContent}>
        <div className={styles.heroInner}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className={styles.heroEyebrow}>Nuestro Equipo</span>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className={styles.heroTitleContainer}
          >
            <h1 className={styles.heroTitle}>
              Las personas detrás de cada terreno, cada decisión y{" "}
              <span className={styles.textGold}>
                <FlipWords words={words} duration={3000} />
              </span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className={styles.heroSubtitle}
          >
            En Alimin no solo desarrollamos proyectos. Acompañamos a familias e inversionistas 
            con cercanía, transparencia y visión de largo plazo en cada oportunidad del litoral.
          </motion.p>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className={styles.heroLine}
          />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className={styles.heroPillars}
          >
            {pillars.map((pillar, index) => (
              <div key={index} className={styles.pillarCol}>
                <span className={styles.pillarIcon}>{pillar.icon}</span>
                <h3 className={styles.pillarTitle}>{pillar.title}</h3>
                <p className={styles.pillarDesc}>{pillar.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
