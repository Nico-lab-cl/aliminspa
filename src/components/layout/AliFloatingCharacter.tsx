'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { SITE } from '@/lib/constants';
import AliChat from './AliChat';
import styles from './AliFloatingCharacter.module.css';

// Dynamic import of Spline to prevent SSR window/WebGL issues
const Spline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
  loading: () => (
    <div className={styles.avatarFallback}>
      🤖
    </div>
  ),
});

const ADVISORS = [
  {
    name: 'Marcela Escobar',
    role: 'Asesora Inmobiliaria',
    image: '/images/asesores/Marcela.png',
    phone: '56956654833',
  },
  {
    name: 'Orlando Costa',
    role: 'Asesor Inmobiliario',
    image: '/images/asesores/Orlando.png',
    phone: '56973077128',
  },
];

export default function AliFloatingCharacter() {
  const [showSpeechBubble, setShowSpeechBubble] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showAdvisors, setShowAdvisors] = useState(false);
  const [splineLoaded, setSplineLoaded] = useState(false);
  const [shouldLoadScene, setShouldLoadScene] = useState(false);

  // Auto show speech bubble with smooth delay if closed
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSpeechBubble(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Defer the heavy 3D scene until the page has settled, so it never
  // competes with initial/critical page rendering on any route.
  useEffect(() => {
    const load = () => setShouldLoadScene(true);
    const idle = (window as any).requestIdleCallback
      ? (window as any).requestIdleCallback(load, { timeout: 2500 })
      : setTimeout(load, 1500);
    return () => {
      if ((window as any).cancelIdleCallback) (window as any).cancelIdleCallback(idle);
      else clearTimeout(idle);
    };
  }, []);

  // Cuando el visitante sale por un enlace, la navegación ya mueve el
  // historial: no hay que consumir además la entrada del modal.
  const saltarBackRef = useRef(false);

  // El botón "atrás" del teléfono debe cerrar el modal, no sacar al visitante
  // del sitio (o cerrarle la pestaña si entró directo a esta página).
  useEffect(() => {
    if (!isModalOpen) return;

    window.history.pushState({ aliChat: true }, '');

    const cerrarPorHistorial = () => {
      setIsModalOpen(false);
      setShowChat(false);
    };

    window.addEventListener('popstate', cerrarPorHistorial);

    return () => {
      window.removeEventListener('popstate', cerrarPorHistorial);
      // Si se cerró desde la interfaz, nuestra entrada sigue en el historial
      // y hay que retirarla para no dejar un "atrás" que no hace nada.
      if (!saltarBackRef.current && window.history.state?.aliChat) {
        window.history.back();
      }
      saltarBackRef.current = false;
    };
  }, [isModalOpen]);

  const handleCharacterClick = () => {
    setIsModalOpen((prev) => !prev);
    setShowSpeechBubble(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setShowChat(false);
  };

  const handleCloseModalYNavegar = () => {
    saltarBackRef.current = true;
    handleCloseModal();
  };

  return (
    <div className={styles.floatingWrapper} id="whatsapp-float">
      {/* ── INTERACTIVE CHAT MODAL ───────────────────────── */}
      {isModalOpen && (
        <div className={styles.chatModal}>
          {/* Header */}
          <div className={styles.modalHeader}>
            <div className={styles.modalHeaderInfo}>
              {showChat ? (
                <button
                  className={styles.backModalBtn}
                  onClick={() => setShowChat(false)}
                  aria-label="Volver a las opciones"
                  title="Volver a las opciones"
                >
                  ←
                </button>
              ) : (
                <div className={styles.headerAvatar}>🌿</div>
              )}
              <div className={styles.headerTitle}>
                <h4>{showChat ? 'Chat con un asesor' : 'Ali • Asistente Alimin'}</h4>
                <span className={styles.statusOnline}>
                  <span className={styles.statusDot}></span>{' '}
                  {showChat ? 'Toca ← para volver' : 'En línea para ayudarte'}
                </span>
              </div>
            </div>
            <button
              className={styles.closeModalBtn}
              onClick={handleCloseModal}
              aria-label="Cerrar ventana"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className={styles.modalBody}>
            {showChat ? (
              <AliChat />
            ) : (
              <>
            {/* Ali Greeting Message */}
            <div className={styles.aliGreeting}>
              ¡Hola! 👋 Soy <strong>Ali</strong>, el asistente virtual de <strong>Alimin Inmobiliaria</strong>. ¿Cómo puedo ayudarte hoy con la cotización de tu terreno?
            </div>

            <p className={styles.aliHint}>Toca una opción para continuar</p>

            {/* Option 1: Chat en vivo con un asesor */}
            <button
              type="button"
              className={`${styles.optionCard} crm-track-click`}
              onClick={() => setShowChat(true)}
              data-crm-name="Abrir chat en vivo"
              data-crm-category="Chat Web"
            >
              <span className={styles.optionHeader}>
                <span className={styles.optionTitle}>
                  <span>💬</span> Chatear con un asesor
                </span>
                <span className={styles.enVivoBadge}>En vivo</span>
              </span>
              <span className={styles.optionDesc}>
                Escríbenos aquí mismo y resuelve tus dudas de terrenos, escrituración y financiamiento sin salir de la página.
              </span>
              <span className={styles.optionCta}>Abrir chat →</span>
            </button>

            {/* Option 2: Hablar por WhatsApp */}
            <div className={styles.whatsappOptionBox}>
              <button
                className={styles.whatsappMainBtn}
                onClick={() => setShowAdvisors((prev) => !prev)}
              >
                <div className={styles.whatsappBtnLeft}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  <span>{showAdvisors ? 'Elige a quién escribir' : 'Hablar por WhatsApp'}</span>
                </div>
                <span>{showAdvisors ? '▲' : '▼'}</span>
              </button>

              {/* Direct Advisor Links */}
              {showAdvisors ? (
                <div className={styles.advisorSubMenu}>
                  {ADVISORS.map((advisor) => (
                    <a
                      key={advisor.phone}
                      href={`https://wa.me/${advisor.phone}?text=${encodeURIComponent(
                        `Hola ${advisor.name.split(' ')[0]}, vengo desde aliminspa.cl y me gustaría solicitar información sobre los terrenos en El Tabo 🏡`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${styles.advisorLink} crm-track-click`}
                      data-crm-name={`WhatsApp Ali - ${advisor.name}`}
                      data-crm-category="Contacto Asesor Ali"
                    >
                      <div className={styles.advisorInfo}>
                        <Image
                          src={advisor.image}
                          alt={advisor.name}
                          width={32}
                          height={32}
                          className={styles.advisorAvatar}
                        />
                        <div>
                          <div className={styles.advisorName}>{advisor.name}</div>
                          <div className={styles.advisorRole}>{advisor.role}</div>
                        </div>
                      </div>
                      <span style={{ color: '#25D366', fontWeight: 'bold' }}>➜</span>
                    </a>
                  ))}
                </div>
              ) : (
                <a
                  href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
                    'Hola Ali 👋, me gustaría hablar con un asesor sobre los terrenos en El Tabo.'
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.advisorLink} crm-track-click`}
                  style={{ display: 'none' }}
                >
                  General WhatsApp
                </a>
              )}
            </div>

            {/* Option 3: Agendar Visita */}
            <Link href="/reunion" className={styles.agendaLink} onClick={handleCloseModalYNavegar}>
              📅 Agendar Visita a los Terrenos
            </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── SPEECH BUBBLE TOOLTIP ────────────────────────── */}
      {showSpeechBubble && !isModalOpen && (
        <div
          className={styles.speechBubble}
          onClick={handleCharacterClick}
          role="button"
          tabIndex={0}
        >
          <span className={styles.speechBubbleText}>
            Hola, soy <strong>Ali</strong>, estoy aquí para ayudarte 👋
          </span>
          <button
            className={styles.closeBubble}
            onClick={(e) => {
              e.stopPropagation();
              setShowSpeechBubble(false);
            }}
            aria-label="Cerrar mensaje"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── ALI 3D CHARACTER BOX (SPLINE) ────────────────── */}
      <div
        className={styles.characterBox}
        onClick={handleCharacterClick}
        title="Hablar con Ali"
        role="button"
        tabIndex={0}
      >
        <div className={styles.splineCanvasContainer}>
          {shouldLoadScene ? (
            <Spline
              scene="https://prod.spline.design/0Qi8WYg90phYDOHs/scene.splinecode"
              style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
              onLoad={(app) => {
                // Zoom the 3D camera in (instead of CSS-scaling the rendered
                // canvas) so Ali renders large AND crisp at native resolution.
                app.setZoom(1.6);
                // The scene ships with an opaque background; force it
                // transparent so only Ali (no gray card) shows through.
                app.setBackgroundColor('transparent');
                setSplineLoaded(true);
              }}
            />
          ) : (
            <div className={styles.avatarFallback}>🌿</div>
          )}
        </div>
      </div>
    </div>
  );
}
