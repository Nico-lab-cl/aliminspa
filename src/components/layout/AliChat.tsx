'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from './AliChat.module.css';

/**
 * Chat en vivo con un asesor.
 *
 * La conversación vive en el CRM: acá sólo se envía lo que escribe el visitante
 * y se consulta cada pocos segundos si el asesor respondió.
 */

interface Mensaje {
    id: string;
    text: string;
    deAsesor: boolean;
    autor?: string | null;
    createdAt: string;
    /** Sólo para los mensajes propios mientras viajan al servidor. */
    estado?: 'enviando' | 'error';
}

const INTERVALO_POLL_MS = 3000;
const MARCA_VISTOS = 'alimin_chat_visto';

/** Marca de agua del último mensaje leído, para el punto de no leídos. */
export function marcarTodoLeido(fecha: string) {
    try {
        window.localStorage.setItem(MARCA_VISTOS, fecha);
    } catch {
        // Modo incógnito o almacenamiento bloqueado: no es crítico.
    }
}

/** El control para volver a las opciones vive en el encabezado del modal. */
export default function AliChat() {
    const [vista, setVista] = useState<'cargando' | 'puerta' | 'chat'>('cargando');
    const [mensajes, setMensajes] = useState<Mensaje[]>([]);
    const [texto, setTexto] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mostrarAcuse, setMostrarAcuse] = useState(false);

    // Datos de la puerta de entrada
    const [nombre, setNombre] = useState('');
    const [telefono, setTelefono] = useState('');
    const [email, setEmail] = useState('');
    const [consentimiento, setConsentimiento] = useState(false);
    const [abriendo, setAbriendo] = useState(false);

    const desdeRef = useRef<string | null>(null);
    const listaRef = useRef<HTMLDivElement>(null);

    const incorporar = useCallback((entrantes: Mensaje[]) => {
        if (!entrantes.length) return;

        setMensajes((previos) => {
            const conocidos = new Set(previos.map((m) => m.id));
            const nuevos = entrantes.filter((m) => !conocidos.has(m.id));
            if (!nuevos.length) return previos;

            return [...previos, ...nuevos].sort(
                (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
        });

        const ultima = entrantes[entrantes.length - 1]?.createdAt;
        if (ultima && (!desdeRef.current || ultima > desdeRef.current)) {
            desdeRef.current = ultima;
            marcarTodoLeido(ultima);
        }
    }, []);

    const consultar = useCallback(async () => {
        try {
            const url = desdeRef.current
                ? `/api/chat/poll?since=${encodeURIComponent(desdeRef.current)}`
                : '/api/chat/poll';
            const res = await fetch(url, { cache: 'no-store' });

            if (res.status === 409) {
                // La sesión venció o nunca existió: se pide de nuevo el contacto.
                setVista('puerta');
                return;
            }
            if (!res.ok) return;

            const datos = await res.json();
            incorporar(datos.mensajes || []);
            setVista('chat');
        } catch {
            // Un fallo puntual de red no debe romper la vista; el siguiente ciclo reintenta.
        }
    }, [incorporar]);

    // Al abrir, se intenta reanudar la conversación anterior antes de pedir datos.
    useEffect(() => {
        consultar().finally(() => {
            setVista((actual) => (actual === 'cargando' ? 'puerta' : actual));
        });
    }, [consultar]);

    // Consulta periódica, en pausa cuando la pestaña no está visible.
    useEffect(() => {
        if (vista !== 'chat') return;

        const intervalo = setInterval(() => {
            if (document.visibilityState === 'visible') consultar();
        }, INTERVALO_POLL_MS);

        return () => clearInterval(intervalo);
    }, [vista, consultar]);

    useEffect(() => {
        if (listaRef.current) {
            listaRef.current.scrollTop = listaRef.current.scrollHeight;
        }
    }, [mensajes, mostrarAcuse]);

    const abrirConversacion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (abriendo) return;

        setError(null);
        setAbriendo(true);

        try {
            const res = await fetch('/api/chat/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, telefono, email, consentimiento }),
            });

            const datos = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(datos.error || 'No pudimos abrir el chat. Intenta otra vez.');
                return;
            }

            setVista('chat');
            await consultar();
        } catch {
            setError('No hay conexión. Revisa tu internet e intenta otra vez.');
        } finally {
            setAbriendo(false);
        }
    };

    const enviar = async (e: React.FormEvent) => {
        e.preventDefault();
        const contenido = texto.trim();
        if (!contenido || enviando) return;

        const idTemporal = `local-${Date.now()}`;
        const optimista: Mensaje = {
            id: idTemporal,
            text: contenido,
            deAsesor: false,
            createdAt: new Date().toISOString(),
            estado: 'enviando',
        };

        setMensajes((previos) => [...previos, optimista]);
        setTexto('');
        setEnviando(true);
        setError(null);

        try {
            const res = await fetch('/api/chat/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: contenido }),
            });

            const datos = await res.json().catch(() => ({}));

            if (res.status === 409) {
                setVista('puerta');
                setError('Tu sesión de chat expiró. Déjanos tus datos otra vez.');
                return;
            }

            if (!res.ok) {
                setMensajes((previos) =>
                    previos.map((m) => (m.id === idTemporal ? { ...m, estado: 'error' } : m))
                );
                setError(datos.error || 'No se pudo enviar. Toca el mensaje para reintentar.');
                return;
            }

            // Se reemplaza el mensaje local por el que quedó guardado, para que la
            // consulta siguiente no lo traiga duplicado.
            setMensajes((previos) =>
                previos.map((m) =>
                    m.id === idTemporal
                        ? { ...m, id: datos.id, createdAt: datos.createdAt, estado: undefined }
                        : m
                )
            );

            if (datos.createdAt && (!desdeRef.current || datos.createdAt > desdeRef.current)) {
                desdeRef.current = datos.createdAt;
            }

            // Acuse de recibo: se muestra sólo en el widget, no se guarda en el CRM,
            // para que el asesor no vea un mensaje que él no escribió.
            setMostrarAcuse(true);
        } catch {
            setMensajes((previos) =>
                previos.map((m) => (m.id === idTemporal ? { ...m, estado: 'error' } : m))
            );
            setError('No hay conexión. Tu mensaje no se envió.');
        } finally {
            setEnviando(false);
        }
    };

    /** Devuelve el texto al campo de escritura para que el visitante lo reenvíe. */
    const reintentar = (mensaje: Mensaje) => {
        setMensajes((previos) => previos.filter((m) => m.id !== mensaje.id));
        setTexto(mensaje.text);
        setError(null);
    };

    /* ── Vistas ──────────────────────────────────────────────── */

    if (vista === 'cargando') {
        return (
            <div className={styles.cargando}>
                <span className={styles.puntos} aria-label="Cargando" />
            </div>
        );
    }

    if (vista === 'puerta') {
        return (
            <form className={styles.puerta} onSubmit={abrirConversacion}>
                <p className={styles.puertaIntro}>
                    Déjanos tus datos y conversas <strong>en vivo</strong> con un asesor de Alimin.
                </p>

                <label className={styles.campo}>
                    <span>Nombre</span>
                    <input
                        type="text"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Tu nombre"
                        autoComplete="name"
                        required
                    />
                </label>

                <label className={styles.campo}>
                    <span>Teléfono</span>
                    <input
                        type="tel"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        placeholder="+56 9 1234 5678"
                        autoComplete="tel"
                        required
                    />
                </label>

                <label className={styles.campo}>
                    <span>Correo</span>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tucorreo@ejemplo.cl"
                        autoComplete="email"
                        required
                    />
                </label>

                <label className={styles.consentimiento}>
                    <input
                        type="checkbox"
                        checked={consentimiento}
                        onChange={(e) => setConsentimiento(e.target.checked)}
                    />
                    <span>
                        Autorizo a Alimin a contactarme y acepto la{' '}
                        <a href="/politica-de-privacidad" target="_blank" rel="noopener noreferrer">
                            política de privacidad
                        </a>
                        .
                    </span>
                </label>

                {error && <p className={styles.error}>{error}</p>}

                <button type="submit" className={styles.enviarPuerta} disabled={abriendo}>
                    {abriendo ? 'Abriendo chat...' : 'Empezar a conversar'}
                </button>
            </form>
        );
    }

    return (
        <div className={styles.chat}>
            <div className={styles.lista} ref={listaRef} aria-live="polite">
                {mensajes.length === 0 && (
                    <p className={styles.vacio}>
                        Escríbenos tu consulta y un asesor te responde por aquí mismo.
                    </p>
                )}

                {mensajes.map((mensaje) => (
                    <div
                        key={mensaje.id}
                        className={`${styles.burbuja} ${
                            mensaje.deAsesor ? styles.deAsesor : styles.propia
                        } ${mensaje.estado === 'error' ? styles.fallida : ''}`}
                        onClick={
                            mensaje.estado === 'error' ? () => reintentar(mensaje) : undefined
                        }
                    >
                        {mensaje.deAsesor && mensaje.autor && (
                            <span className={styles.autor}>{mensaje.autor}</span>
                        )}
                        <span className={styles.texto}>{mensaje.text}</span>
                        {mensaje.estado === 'enviando' && (
                            <span className={styles.estado}>enviando...</span>
                        )}
                        {mensaje.estado === 'error' && (
                            <span className={styles.estado}>no se envió · toca para reintentar</span>
                        )}
                    </div>
                ))}

                {mostrarAcuse && !mensajes.some((m) => m.deAsesor) && (
                    <p className={styles.acuse}>
                        ✅ Recibimos tu mensaje. Un asesor te responde por aquí a la brevedad.
                    </p>
                )}
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <form className={styles.barraEnvio} onSubmit={enviar}>
                <input
                    type="text"
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    placeholder="Escribe tu mensaje..."
                    maxLength={2000}
                    aria-label="Escribe tu mensaje"
                />
                <button type="submit" disabled={!texto.trim() || enviando} aria-label="Enviar">
                    ➤
                </button>
            </form>
        </div>
    );
}
