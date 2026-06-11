'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { GlowCard } from './GlowCard';
import styles from '../page.module.css';

const cards = [
  {
    title: "Misión",
    text: "Ayudamos a las familias y emprendedores a acceder a bienes raíces urbanizados y asequibles, facilitando espacios para vivir, invertir y crecer. Nuestro compromiso es entregar soluciones rentables, seguras y con impacto a largo plazo.",
    icon: (
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
      </svg>
    ),
  },
  {
    title: "Visión",
    text: "Convertirnos en la inmobiliaria referente en Chile para terrenos urbanizados, reconocida por nuestra transparencia, innovación y cercanía con el cliente, generando comunidades sostenibles y accesibles para todos.",
    icon: (
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.577-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: "Compromiso",
    text: "Cada proyecto que emprendemos lleva nuestra firma de honestidad, dedicación y responsabilidad. Nos comprometemos a ser transparentes en cada etapa, desde el primer contacto hasta la entrega final.",
    icon: (
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.745 3.745 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
  },
];

export const MisionVision = () => {
  return (
    <section className={styles.mvSection}>
      <div className={styles.mvContainer}>
        <div className={styles.sectionHeader}>
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={styles.sectionLabel}
          >
            Nuestros Pilares
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className={styles.sectionTitle}
          >
            Lo que nos <span className={styles.textGold}>define</span>
          </motion.h2>
        </div>

        <div className={styles.mvGrid}>
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              style={{ height: '100%' }}
            >
              <GlowCard>
                <div className={styles.glowCardWrapper}>
                  <div className={styles.glowCardTopLine} />
                  <div className={styles.glowCardIconBox}>
                    {card.icon}
                  </div>
                  <h3 className={styles.glowCardTitle}>{card.title}</h3>
                  <p className={styles.glowCardText}>{card.text}</p>
                </div>
              </GlowCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
