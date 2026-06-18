'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { MessageCircle, Phone, Sparkles, HelpCircle, Check } from 'lucide-react';
import { PROJECTS, FAQ_ITEMS, FATHERS_DAY_PROMO } from '@/lib/constants';
import MetaTrackPageView from '@/components/analytics/MetaTrackPageView';
import { trackMetaEvent } from '@/lib/track';
import styles from './page.module.css';

const WhatsAppIcon = ({ size = 16 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    fill="currentColor" 
    viewBox="0 0 24 24"
    style={{ display: 'inline-block', verticalAlign: 'middle' }}
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const ADVISORS = [
  {
    name: "Marcela Escobar",
    role: "Asesora Inmobiliaria",
    image: "/images/asesores/Marcela.png",
    phone: "+56 9 5665 4833",
    cleanPhone: "56956654833",
    description: "Experta en entender necesidades y convertirlas en decisiones seguras. Siempre con una sonrisa y soluciones prácticas.",
    message: "Hola Marcela, vengo del correo por el Especial del Día del Padre y me interesa el Mystery Box 🎁"
  },
  {
    name: "Orlando Costa",
    role: "Asesor Inmobiliario",
    image: "/images/asesores/Orlando.png",
    phone: "+56 9 7307 7128",
    cleanPhone: "56973077128",
    description: "Cercano, claro y confiable. Te acompaña paso a paso para encontrar el terreno perfecto según tus metas.",
    message: "Hola Orlando, vengo del correo por el Especial del Día del Padre y me interesa el Mystery Box 🎁"
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

  const trackContactClick = (method: 'WhatsApp' | 'Phone', advisorName: string, projectName: string = 'General') => {
    // 1. Server-side tracking via Meta Conversions API (CAPI)
    trackMetaEvent('Contact', {}, {
      method,
      advisor: advisorName,
      project: projectName,
      page: 'asesores_landing'
    });

    // 2. Client-side tracking via Meta Pixel
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'Contact', {
        content_category: 'Advisors Landing Campaign',
        content_name: `Contact ${advisorName} via ${method}`,
        content_ids: [projectName],
        value: method === 'WhatsApp' ? 12 : 6,
        currency: 'USD'
      });
    }
  };

  return (
    <div className={styles.page}>
      {/* Meta Pixel & Conversions API Page View Event */}
      <MetaTrackPageView eventName="ViewContent" customData={{ content_name: 'Fathers Day Mystery Box Advisors Campaign' }} />

      {/* Animated Background Spheres */}
      <div className={styles.heroGlowContainer}>
        <div className={styles.glowSphere1} />
        <div className={styles.glowSphere2} />
      </div>

      {/* Hero Header - Father's Day & Mystery Box Special */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroContent}>
            <div className={styles.fathersDayTag}>
              <Sparkles size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
              {FATHERS_DAY_PROMO.tag}
            </div>
            <h1 className={styles.heroTitle}>
              ¡Mystery Box de Regalo <br /> para Papá en su día! 🎁
            </h1>
            <p className={styles.heroSubtitle}>
              Este Día del Padre, llévate una Mystery Box exclusiva al reservar o comprar tu terreno directamente con nosotros. ¡Asegura tu lote hoy y celebra con el mejor regalo!
            </p>
            <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1.2rem', flexWrap: 'wrap' }}>
              <button onClick={handleScrollToAdvisors} className={styles.scheduleBtn}>
                Hablar con un asesor de una
              </button>
              <a 
                href="#projects-section" 
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('projects-section')?.scrollIntoView({ behavior: 'smooth' });
                }} 
                className={styles.callBtn} 
                style={{ padding: '1.1rem 2rem', borderRadius: 'var(--radius-md)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                Ver terrenos disponibles
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Advisors Grid Section (Moved right after Hero) */}
      <section id="advisors-section" className={styles.advisorsSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>Contacto Directo</span>
            <h2 className={styles.sectionTitle} style={{ color: '#ffffff' }}>Nuestros Asesores Inmobiliarios</h2>
          </div>
          <div className={styles.advisorsGrid}>
            {ADVISORS.map((advisor, index) => {
              const waUrl = `https://wa.me/${advisor.cleanPhone}?text=${encodeURIComponent(advisor.message)}`;
              return (
                <motion.div
                  key={advisor.name}
                  className={styles.advisorCard}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                >
                  <div className={styles.avatarWrapper}>
                    <Image
                      src={advisor.image}
                      alt={advisor.name}
                      width={130}
                      height={130}
                      className={styles.avatar}
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
                      onClick={() => trackContactClick('WhatsApp', advisor.name)}
                      data-crm-name={`WhatsApp Asesor - asesores page - ${advisor.name}`}
                      data-crm-category="Contacto Asesor"
                    >
                      <WhatsAppIcon size={18} />
                      WhatsApp Directo
                    </a>
                    <a
                      href={`tel:${advisor.phone.replace(/\s+/g, '')}`}
                      className={`${styles.actionBtn} ${styles.callBtn} crm-track-click`}
                      onClick={() => trackContactClick('Phone', advisor.name)}
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

      {/* Projects Section */}
      <section id="projects-section" className={styles.projectsSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>Nuestros Lotes</span>
            <h2 className={styles.sectionTitle}>Proyectos Disponibles en El Tabo</h2>
          </div>
          
          <div className={styles.projectsGrid}>
            {PROJECTS.filter(project => project.id !== 'libertad-y-alegria').map((project) => {
              const isAvailable = (project.status as string) !== 'Proyecto Vendido';
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
                            const projectMsg = `Hola ${adv.name}, vengo del correo y me interesa obtener más información sobre el proyecto ${project.name} por la promo del Día del Padre 🏠`;
                            const projectWaUrl = `https://wa.me/${adv.cleanPhone}?text=${encodeURIComponent(projectMsg)}`;
                            return (
                              <a
                                key={adv.name}
                                href={projectWaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`${styles.askAsesorBtn} crm-track-click`}
                                onClick={() => trackContactClick('WhatsApp', adv.name, project.name)}
                                data-crm-name={`Consultar Proyecto ${project.name} - ${adv.name}`}
                                data-crm-category="Contacto Proyecto"
                                style={{ fontSize: '0.8rem', padding: '0.7rem' }}
                              >
                                <WhatsAppIcon size={14} />
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
