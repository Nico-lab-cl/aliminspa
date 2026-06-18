'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { MessageCircle, Phone, Sparkles, HelpCircle, ArrowRight, Home, Check } from 'lucide-react';
import { PROJECTS, FAQ_ITEMS, FATHERS_DAY_PROMO } from '@/lib/constants';
import styles from './page.module.css';

const ADVISORS = [
  {
    name: "Marcela Escobar",
    role: "Asesora Inmobiliaria",
    image: "/images/asesores/Marcela.png",
    phone: "+56 9 5665 4833",
    cleanPhone: "56956654833",
    description: "Experta en entender necesidades y convertirlas en decisiones seguras. Siempre con una sonrisa y soluciones prácticas.",
    message: "Hola Marcela, vengo del correo y me gustaría conversar sobre los terrenos en El Tabo 👋"
  },
  {
    name: "Orlando Costa",
    role: "Asesor Inmobiliario",
    image: "/images/asesores/Orlando.png",
    phone: "+56 9 7307 7128",
    cleanPhone: "56973077128",
    description: "Cercano, claro y confiable. Te acompaña paso a paso para encontrar el terreno perfecto según tus metas.",
    message: "Hola Orlando, vengo del correo y me gustaría conversar sobre los terrenos en El Tabo 👋"
  }
];

export default function AsesoresClient() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleScrollToAdvisors = () => {
    const section = document.getElementById('advisors-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={styles.page}>
      {/* Animated Background Spheres */}
      <div className={styles.heroGlowContainer}>
        <div className={styles.glowSphere1} />
        <div className={styles.glowSphere2} />
      </div>

      {/* Hero Header */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroContent}>
            <span className={styles.heroLabel}>
              Contacto Directo
            </span>
            <h1 className={styles.heroTitle}>
              Encuentra tu terreno ideal con la ayuda de <span>nuestros asesores</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Estamos listos para ayudarte de inmediato. Resuelve tus dudas sobre financiamiento, visitas y el proceso legal de compra con un solo click.
            </p>
          </div>
        </div>
      </section>

      {/* Advisors Grid Section */}
      <section id="advisors-section" className={styles.advisorsSection}>
        <div className="container">
          <div className={styles.advisorsGrid}>
            {ADVISORS.map((advisor, index) => {
              const waUrl = `https://wa.me/${advisor.cleanPhone}?text=${encodeURIComponent(advisor.message)}`;
              return (
                <motion.div
                  key={advisor.name}
                  className={styles.advisorCard}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                >
                  <div className={styles.avatarWrapper}>
                    <Image
                      src={advisor.image}
                      alt={advisor.name}
                      width={130}
                      height={130}
                      className={styles.avatar}
                      priority
                    />
                  </div>
                  <span className={styles.advisorRole}>{advisor.role}</span>
                  <h3 className={styles.advisorName}>{advisor.name}</h3>
                  <p className={styles.advisorDesc}>{advisor.description}</p>
                  
                  <div className={styles.actionsGrid}>
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${styles.actionBtn} ${styles.whatsappBtn} crm-track-click`}
                      data-crm-name={`WhatsApp Asesor - asesores page - ${advisor.name}`}
                      data-crm-category="Contacto Asesor"
                    >
                      <MessageCircle size={20} />
                      WhatsApp Directo
                    </a>
                    <a
                      href={`tel:${advisor.phone.replace(/\s+/g, '')}`}
                      className={`${styles.actionBtn} ${styles.callBtn} crm-track-click`}
                      data-crm-name={`Llamar Asesor - asesores page - ${advisor.name}`}
                      data-crm-category="Llamada Asesor"
                    >
                      <Phone size={18} />
                      Llamar por Teléfono
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Father's Day Special Section */}
      <section className={styles.fathersDayPromo}>
        <div className="container">
          <motion.div 
            className={styles.fathersDayCard}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className={styles.fathersDayInfo}>
              <div className={styles.fathersDayTag}>
                <Sparkles size={14} />
                {FATHERS_DAY_PROMO.tag}
              </div>
              <h2 className={styles.fathersDayTitle}>¡Regalo Secreto para Papá!</h2>
              <p className={styles.fathersDayMessage}>
                {FATHERS_DAY_PROMO.message} Agenda tu visita guiada con cualquiera de nuestros asesores para este fin de semana y reclama un obsequio especial al concretar tu recorrido.
              </p>
            </div>
            
            <div className={styles.fathersDayActions}>
              <a
                href={FATHERS_DAY_PROMO.link}
                className={`${styles.scheduleBtn} crm-track-click`}
                data-crm-name="Agendar Visita - Dia del Padre - Pagina Asesores"
                data-crm-category="Agendamiento"
              >
                {FATHERS_DAY_PROMO.cta}
              </a>
              <span onClick={handleScrollToAdvisors} className={styles.contactTeamLink}>
                Hablar con un asesor primero
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Projects Section */}
      <section className={styles.projectsSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>Nuestros Lotes</span>
            <h2 className={styles.sectionTitle}>Proyectos Disponibles en El Tabo</h2>
          </div>
          
          <div className={styles.projectsGrid}>
            {PROJECTS.filter(project => project.id !== 'lomas-del-mar').map((project) => {
              const isAvailable = project.status !== 'Proyecto Vendido';
              return (
                <div key={project.id} className={styles.projectCard}>
                  <div className={styles.projectImageWrapper}>
                    <Image
                      src={project.image}
                      alt={project.name}
                      fill
                      className={styles.projectImg}
                      sizes="(max-width: 992px) 100vw, 50vw"
                    />
                    <span className={`${styles.projectStatusTag} ${isAvailable ? styles.statusAvailable : styles.statusSold}`}>
                      {project.status}
                    </span>
                  </div>
                  
                  <div className={styles.projectBody}>
                    <h3 className={styles.projectHeading}>{project.name}</h3>
                    <span className={styles.projectDistance}>{project.distance}</span>
                    <p className={styles.projectDesc}>{project.description}</p>
                    
                    <div className={styles.featuresWrap}>
                      {project.features.map((feature, i) => (
                        <span key={i} className={styles.featureTag}>
                          <Check size={10} style={{ display: 'inline', marginRight: '4px', color: '#1A8A7D' }} />
                          {feature}
                        </span>
                      ))}
                    </div>
                    
                    <div className={styles.projectMetaGrid}>
                      <div>
                        <div className={styles.projectMetaLabel}>Tamaño lotes</div>
                        <div className={styles.projectMetaVal}>{project.lotSize}</div>
                      </div>
                      <div>
                        <div className={styles.projectMetaLabel}>Ubicación</div>
                        <div className={styles.projectMetaVal}>El Tabo, Chile</div>
                      </div>
                    </div>

                    {isAvailable && (
                      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.50rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff', textAlign: 'center', display: 'block', marginBottom: '0.2rem' }}>
                          Consultar por este proyecto:
                        </span>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          {ADVISORS.map((adv) => {
                            const projectMsg = `Hola ${adv.name}, vengo del correo y me interesa obtener más información sobre el proyecto ${project.name} 🏠`;
                            const projectWaUrl = `https://wa.me/${adv.cleanPhone}?text=${encodeURIComponent(projectMsg)}`;
                            return (
                              <a
                                key={adv.name}
                                href={projectWaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`${styles.askAsesorBtn} crm-track-click`}
                                data-crm-name={`Consultar Proyecto ${project.name} - ${adv.name}`}
                                data-crm-category="Contacto Proyecto"
                                style={{ fontSize: '0.8rem', padding: '0.7rem' }}
                              >
                                <MessageCircle size={14} />
                                con {adv.name.split(' ')[0]}
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className={styles.faqSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>Preguntas Frecuentes</span>
            <h2 className={styles.sectionTitle}>Resuelve tus dudas al instante</h2>
          </div>
          
          <div className={styles.faqWrap}>
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div 
                  key={index} 
                  className={`${styles.faqItem} ${isOpen ? styles.faqItemActive : ''}`}
                >
                  <button 
                    className={styles.faqQuestionButton}
                    onClick={() => toggleFaq(index)}
                    aria-expanded={isOpen}
                  >
                    <span className={styles.faqQuestion}>{item.question}</span>
                    <HelpCircle size={18} className={styles.faqIcon} />
                  </button>
                  <div 
                    className={styles.faqAnswerWrapper}
                    style={{ maxHeight: isOpen ? '300px' : '0px' }}
                  >
                    <div className={styles.faqAnswer}>
                      {item.answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
