'use client';
import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import styles from '../page.module.css';

const directors = [
  {
    name: "Patricio Escobar",
    role: "CEO",
    image: "/images/lideres/Patricio Escobar.png",
    description: "Estratega y motor del crecimiento. Impulsa decisiones clave con visión enfocada en resultados sostenibles.",
  },
  {
    name: "Marcela López",
    role: "CEO",
    image: "/images/lideres/Marcela Lopez.png",
    description: "Lidera con energía y pasión por el desarrollo territorial responsable. Acerca oportunidades reales a personas reales.",
  },
];

export const DirectionSection = () => {
  return (
    <section className={styles.dirSection}>
      <div className={styles.dirDeco1} />
      <div className={styles.dirDeco2} />

      <div className={styles.dirContainer}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={styles.dirTransitionText}
        >
          <p>"Detrás de cada proyecto hay dirección, visión y personas comprometidas con hacer las cosas bien."</p>
        </motion.div>

        <div className={styles.sectionHeader}>
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={styles.sectionLabel}
          >
            Dirección
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className={styles.sectionTitle}
            style={{ color: '#fff' }}
          >
            Liderazgo con <span className={styles.textGold}>visión</span>
          </motion.h2>
        </div>

        <div className={styles.dirGrid}>
          {directors.map((director, i) => (
            <motion.div
              key={director.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
            >
              <div className={styles.leaderCardInner}>
                <div className={styles.leaderCardTopLine} />
                <div className={styles.leaderCardContent}>
                  <div className={styles.leaderPhotoWrap}>
                    <div className={styles.leaderPhoto}>
                      <Image
                        src={director.image}
                        alt={director.name}
                        width={144}
                        height={144}
                      />
                    </div>
                  </div>

                  <div className={styles.leaderNameRole}>
                    <h3 className={styles.leaderName}>{director.name}</h3>
                    <span className={styles.leaderRole}>{director.role}</span>
                  </div>

                  <p className={styles.leaderDesc}>{director.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
