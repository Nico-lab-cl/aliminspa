'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getUtmParams } from '@/lib/track';
import styles from './AliChat.module.css';

/**
 * Chat en vivo con un asesor.
 *
 * La conversación vive en el CRM: acá sólo se envía lo que escribe el visitante
 * y se consulta cada pocos segundos si el asesor respondió.
 *
 * El visitante escribe primero y recién ahí se le piden los datos: pedirlos
 * antes de dejarlo hablar espantaba a quien sólo quería preguntar un precio.
 * El mensaje que ya escribió queda a la vista y se despacha solo en cuanto
 * completa el formulario.
 */

interface Adjunto {
    id: string;
    tipo: 'image' | 'audio' | 'video';
    mimeType: string;
    duracionMs?: number | null;
}

interface Mensaje {
    id: string;
    text: string;
    deAsesor: boolean;
    autor?: string | null;
    createdAt: string;
    /** Sólo para los mensajes propios mientras viajan al servidor. */
    estado?: 'enviando' | 'error' | 'pendiente';
    adjunto?: Adjunto | null;
    /**
     * URL temporal (blob:) del archivo propio mientras se sube.
     * Deja ver la foto o escuchar el audio de inmediato, sin esperar a que el
     * servidor lo devuelva.
     */
    urlLocal?: string;
}

const INTERVALO_POLL_MS = 3000;

/** Lo mismo que valida el CRM, repetido acá para avisar antes de subir nada. */
const LIMITES_POR_TIPO: Record<string, number> = {
    image: 8 * 1024 * 1024,
    audio: 12 * 1024 * 1024,
    video: 25 * 1024 * 1024,
};

/**
 * Formatos de audio que se intentan al grabar, en orden de preferencia.
 * Android y Chrome graban WEBM/Opus; iOS y Safari sólo aceptan MP4/AAC.
 */
const FORMATOS_DE_AUDIO = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
];

function formatoDeAudioSoportado(): string | null {
    if (typeof MediaRecorder === 'undefined') return null;
    return FORMATOS_DE_AUDIO.find((f) => MediaRecorder.isTypeSupported(f)) || null;
}

/** "1:07" a partir de milisegundos. */
function duracionLegible(ms: number) {
    const total = Math.round(ms / 1000);
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
const MARCA_VISTOS = 'alimin_chat_visto';

/** Marca de agua del último mensaje leído, para el punto de no leídos. */
export function marcarTodoLeido(fecha: string) {
    try {
        window.localStorage.setItem(MARCA_VISTOS, fecha);
    } catch {
        // Modo incógnito o almacenamiento bloqueado: no es crítico.
    }
}

interface AliChatProps {
    /**
     * UTM con las que se abre la conversación cuando la URL no trae ninguna.
     * Es lo único que le dice al asesor desde qué página escribe el visitante:
     * el CRM abre la conversación con nombre, teléfono, correo y UTM, y no hay
     * campo de proyecto. Se usan las mismas etiquetas que el formulario de cada
     * landing, así el chat y el lead de esa página quedan bajo el mismo origen.
     */
    utmPorDefecto?: Record<string, string>;
}

/** Los controles de cerrar y "más opciones" viven en el encabezado del modal. */
export default function AliChat({ utmPorDefecto }: AliChatProps = {}) {
    const [mensajes, setMensajes] = useState<Mensaje[]>([]);
    const [texto, setTexto] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mostrarAcuse, setMostrarAcuse] = useState(false);

    /** Hay conversación abierta en el CRM: sin esto no se puede despachar nada. */
    const [haySesion, setHaySesion] = useState(false);
    /** El formulario de contacto ocupa el lugar de la barra de escritura. */
    const [pidiendoDatos, setPidiendoDatos] = useState(false);

    // Datos de la puerta de entrada
    const [nombre, setNombre] = useState('');
    const [telefono, setTelefono] = useState('');
    const [email, setEmail] = useState('');
    const [consentimiento, setConsentimiento] = useState(false);
    const [abriendo, setAbriendo] = useState(false);

    // Grabación de voz
    const [grabando, setGrabando] = useState(false);
    const [msGrabados, setMsGrabados] = useState(0);
    const [puedeGrabar, setPuedeGrabar] = useState(false);
    const grabadora = useRef<MediaRecorder | null>(null);
    const trozos = useRef<Blob[]>([]);
    const inicioGrabacion = useRef(0);
    const cronometro = useRef<ReturnType<typeof setInterval> | null>(null);
    const grabacionCancelada = useRef(false);

    const inputArchivo = useRef<HTMLInputElement>(null);
    /** Archivo que quedó esperando a que el visitante deje sus datos. */
    const archivoPendienteRef = useRef<{ id: string; archivo: File; duracionMs?: number } | null>(null);

    const desdeRef = useRef<string | null>(null);
    const listaRef = useRef<HTMLDivElement>(null);
    /** Lo que el visitante escribió antes de que le pidiéramos los datos. */
    const pendienteRef = useRef<{ id: string; text: string } | null>(null);
    const botonPuertaRef = useRef<HTMLButtonElement>(null);

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
                // La sesión venció o nunca existió: se pedirá el contacto cuando
                // el visitante intente enviar, no antes.
                setHaySesion(false);
                return;
            }
            if (!res.ok) return;

            const datos = await res.json();
            incorporar(datos.mensajes || []);
            setHaySesion(true);
        } catch {
            // Un fallo puntual de red no debe romper la vista; el siguiente ciclo reintenta.
        }
    }, [incorporar]);

    // La grabación sólo se ofrece si el navegador puede hacerla. En un iPhone
    // viejo o sobre HTTP no existe MediaRecorder, y un botón de micrófono que no
    // hace nada es peor que no tenerlo.
    useEffect(() => {
        setPuedeGrabar(
            Boolean(navigator.mediaDevices?.getUserMedia) && formatoDeAudioSoportado() !== null
        );
    }, []);

    // Si el visitante cierra el chat con el micrófono abierto hay que soltarlo:
    // el navegador deja el indicador de grabación encendido.
    useEffect(() => {
        return () => {
            if (cronometro.current) clearInterval(cronometro.current);
            grabadora.current?.stream.getTracks().forEach((t) => t.stop());
        };
    }, []);

    // El chat se pinta de inmediato con el saludo y la conversación anterior,
    // si la hay, se incorpora cuando llega: nadie espera mirando un spinner.
    useEffect(() => {
        consultar();
    }, [consultar]);

    // Consulta periódica, en pausa cuando la pestaña no está visible.
    useEffect(() => {
        if (!haySesion) return;

        const intervalo = setInterval(() => {
            if (document.visibilityState === 'visible') consultar();
        }, INTERVALO_POLL_MS);

        return () => clearInterval(intervalo);
    }, [haySesion, consultar]);

    useEffect(() => {
        if (listaRef.current) {
            listaRef.current.scrollTop = listaRef.current.scrollHeight;
        }
    }, [mensajes, mostrarAcuse]);

    // En pantallas bajas el formulario no cabe entero: se arrastra el modal
    // hasta el botón para que nadie se quede sin ver cómo enviar.
    useEffect(() => {
        if (!pidiendoDatos) return;
        botonPuertaRef.current?.scrollIntoView({ block: 'nearest' });
    }, [pidiendoDatos]);

    const abrirConversacion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (abriendo) return;

        setError(null);
        setAbriendo(true);

        try {
            const res = await fetch('/api/chat/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre,
                    telefono,
                    email,
                    consentimiento,
                    // Las UTM de la URL mandan; las de la landing sólo rellenan
                    // cuando el visitante llegó por un enlace limpio.
                    ...getUtmParams(utmPorDefecto),
                }),
            });

            const datos = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(datos.error || 'No pudimos abrir el chat. Intenta otra vez.');
                return;
            }

            setHaySesion(true);
            setPidiendoDatos(false);

            // El mensaje que quedó esperando sale ahora, sin que el visitante
            // tenga que volver a escribirlo.
            const pendiente = pendienteRef.current;
            pendienteRef.current = null;

            if (pendiente) {
                setMensajes((previos) =>
                    previos.map((m) =>
                        m.id === pendiente.id ? { ...m, estado: 'enviando' } : m
                    )
                );
                await despachar(pendiente.text, pendiente.id);
            }

            // El archivo que quedó esperando sale ahora, igual que el texto.
            const archivoPendiente = archivoPendienteRef.current;
            archivoPendienteRef.current = null;

            if (archivoPendiente) {
                setMensajes((previos) =>
                    previos.map((m) =>
                        m.id === archivoPendiente.id ? { ...m, estado: 'enviando' } : m
                    )
                );
                await despacharArchivo(
                    archivoPendiente.archivo,
                    archivoPendiente.id,
                    archivoPendiente.duracionMs
                );
            }

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

        // Sin conversación abierta el mensaje no se pierde: queda a la vista
        // marcado como pendiente mientras se piden los datos de contacto.
        if (!haySesion) {
            setMensajes((previos) => [
                ...previos,
                {
                    id: idTemporal,
                    text: contenido,
                    deAsesor: false,
                    createdAt: new Date().toISOString(),
                    estado: 'pendiente',
                },
            ]);
            pendienteRef.current = { id: idTemporal, text: contenido };
            setTexto('');
            setError(null);
            setPidiendoDatos(true);
            return;
        }

        setMensajes((previos) => [
            ...previos,
            {
                id: idTemporal,
                text: contenido,
                deAsesor: false,
                createdAt: new Date().toISOString(),
                estado: 'enviando',
            },
        ]);
        setTexto('');
        setError(null);

        await despachar(contenido, idTemporal);
    };

    /** Envía al CRM un mensaje que ya está pintado en la lista. */
    const despachar = async (contenido: string, idTemporal: string) => {
        setEnviando(true);

        try {
            const res = await fetch('/api/chat/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: contenido }),
            });

            const datos = await res.json().catch(() => ({}));

            if (res.status === 409) {
                // La sesión venció: el mensaje vuelve a quedar pendiente y sale
                // solo en cuanto el visitante reconfirma sus datos.
                setMensajes((previos) =>
                    previos.map((m) => (m.id === idTemporal ? { ...m, estado: 'pendiente' } : m))
                );
                pendienteRef.current = { id: idTemporal, text: contenido };
                setHaySesion(false);
                setPidiendoDatos(true);
                setError('Tu sesión de chat expiró. Confirma tus datos y lo enviamos.');
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

    /* ── Adjuntos ────────────────────────────────────────────── */

    /**
     * Pinta el adjunto en la lista y lo envía.
     *
     * Igual que con el texto: si todavía no hay conversación abierta, el archivo
     * no se pierde. Queda a la vista marcado como pendiente y sale solo apenas
     * el visitante completa sus datos.
     */
    const enviarArchivo = async (archivo: File, duracionMs?: number) => {
        setError(null);

        const tipo = archivo.type.startsWith('image/')
            ? 'image'
            : archivo.type.startsWith('video/')
              ? 'video'
              : 'audio';

        const limite = LIMITES_POR_TIPO[tipo];
        if (limite && archivo.size > limite) {
            setError(
                `El archivo es muy pesado. El máximo son ${Math.round(limite / (1024 * 1024))} MB.`
            );
            return;
        }

        const idTemporal = `local-${Date.now()}`;
        const urlLocal = URL.createObjectURL(archivo);

        setMensajes((previos) => [
            ...previos,
            {
                id: idTemporal,
                text: '',
                deAsesor: false,
                createdAt: new Date().toISOString(),
                estado: haySesion ? 'enviando' : 'pendiente',
                urlLocal,
                adjunto: { id: idTemporal, tipo, mimeType: archivo.type, duracionMs },
            },
        ]);

        if (!haySesion) {
            archivoPendienteRef.current = { id: idTemporal, archivo, duracionMs };
            setPidiendoDatos(true);
            return;
        }

        await despacharArchivo(archivo, idTemporal, duracionMs);
    };

    /** Sube al CRM un archivo que ya está pintado en la lista. */
    const despacharArchivo = async (archivo: File, idTemporal: string, duracionMs?: number) => {
        setEnviando(true);

        try {
            const cuerpo = new FormData();
            cuerpo.append('file', archivo);
            if (duracionMs) cuerpo.append('durationMs', String(Math.round(duracionMs)));

            const res = await fetch('/api/chat/media', { method: 'POST', body: cuerpo });
            const datos = await res.json().catch(() => ({}));

            if (res.status === 409) {
                setMensajes((previos) =>
                    previos.map((m) => (m.id === idTemporal ? { ...m, estado: 'pendiente' } : m))
                );
                archivoPendienteRef.current = { id: idTemporal, archivo, duracionMs };
                setHaySesion(false);
                setPidiendoDatos(true);
                setError('Tu sesión de chat expiró. Confirma tus datos y lo enviamos.');
                return;
            }

            if (!res.ok) {
                setMensajes((previos) =>
                    previos.map((m) => (m.id === idTemporal ? { ...m, estado: 'error' } : m))
                );
                setError(datos.error || 'No se pudo enviar el archivo.');
                return;
            }

            // El mensaje local se reemplaza por el que quedó guardado. La URL
            // local se conserva a propósito: ya está en memoria y evita volver a
            // descargar del servidor un archivo que el visitante acaba de elegir.
            setMensajes((previos) =>
                previos.map((m) =>
                    m.id === idTemporal
                        ? {
                              ...m,
                              id: datos.id,
                              createdAt: datos.createdAt,
                              text: datos.text || m.text,
                              estado: undefined,
                              adjunto: datos.mediaId
                                  ? {
                                        id: datos.mediaId,
                                        tipo: datos.kind,
                                        mimeType: datos.mimeType,
                                        duracionMs,
                                    }
                                  : m.adjunto,
                          }
                        : m
                )
            );

            if (datos.createdAt && (!desdeRef.current || datos.createdAt > desdeRef.current)) {
                desdeRef.current = datos.createdAt;
            }

            setMostrarAcuse(true);
        } catch {
            setMensajes((previos) =>
                previos.map((m) => (m.id === idTemporal ? { ...m, estado: 'error' } : m))
            );
            setError('No hay conexión. Tu archivo no se envió.');
        } finally {
            setEnviando(false);
        }
    };

    const alElegirArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
        const archivo = e.target.files?.[0];
        // El input se limpia siempre: sin esto, elegir dos veces la misma foto
        // no vuelve a disparar el evento.
        e.target.value = '';
        if (archivo) enviarArchivo(archivo);
    };

    const empezarAGrabar = async () => {
        setError(null);

        const formato = formatoDeAudioSoportado();
        if (!formato) {
            setError('Tu navegador no permite grabar audio.');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const rec = new MediaRecorder(stream, { mimeType: formato });

            trozos.current = [];
            grabacionCancelada.current = false;
            inicioGrabacion.current = Date.now();

            rec.ondataavailable = (evento) => {
                if (evento.data.size > 0) trozos.current.push(evento.data);
            };

            rec.onstop = () => {
                // Soltar el micrófono apaga el indicador del navegador. Va acá
                // porque hay dos caminos hacia el stop: enviar y cancelar.
                stream.getTracks().forEach((t) => t.stop());

                const ms = Date.now() - inicioGrabacion.current;
                const grabados = trozos.current;
                trozos.current = [];

                if (grabacionCancelada.current || grabados.length === 0) return;

                if (ms < 1000) {
                    setError('La grabación fue muy corta.');
                    return;
                }

                // El tipo se recorta antes del ";codecs=..." porque el CRM
                // valida contra una lista de tipos base.
                const tipoBase = formato.split(';')[0];
                const extension = tipoBase.includes('mp4')
                    ? 'm4a'
                    : tipoBase.includes('ogg')
                      ? 'ogg'
                      : 'webm';

                const blob = new Blob(grabados, { type: tipoBase });
                enviarArchivo(
                    new File([blob], `audio-${Date.now()}.${extension}`, { type: tipoBase }),
                    ms
                );
            };

            rec.start();
            grabadora.current = rec;
            setGrabando(true);
            setMsGrabados(0);

            cronometro.current = setInterval(() => {
                const transcurrido = Date.now() - inicioGrabacion.current;
                setMsGrabados(transcurrido);
                // Corte de seguridad antes de acercarse al límite de tamaño.
                if (transcurrido > 5 * 60 * 1000) detenerGrabacion(false);
            }, 200);
        } catch {
            setError('No pudimos usar el micrófono. Revisa el permiso en tu navegador.');
        }
    };

    const detenerGrabacion = (cancelar: boolean) => {
        grabacionCancelada.current = cancelar;
        if (cronometro.current) {
            clearInterval(cronometro.current);
            cronometro.current = null;
        }
        grabadora.current?.stop();
        grabadora.current = null;
        setGrabando(false);
        setMsGrabados(0);
    };

    /** Devuelve el texto al campo de escritura para que el visitante lo reenvíe. */
    const reintentar = (mensaje: Mensaje) => {
        setMensajes((previos) => previos.filter((m) => m.id !== mensaje.id));
        setTexto(mensaje.text);
        setError(null);
    };

    /* ── Vistas ──────────────────────────────────────────────── */

    const puerta = (
        <form className={`${styles.puerta} ${styles.puertaEnChat}`} onSubmit={abrirConversacion}>
            <p className={styles.puertaIntro}>
                Déjanos tus datos y <strong>enviamos tu mensaje</strong> al asesor 👇
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

            <button
                ref={botonPuertaRef}
                type="submit"
                className={styles.enviarPuerta}
                disabled={abriendo}
            >
                {abriendo ? 'Enviando...' : 'Enviar mensaje'}
            </button>
        </form>
    );

    return (
        <div className={styles.chat}>
            <div
                className={`${styles.lista} ${pidiendoDatos ? styles.listaCompacta : ''}`}
                ref={listaRef}
                aria-live="polite"
            >
                {/* Saludo de Ali: vive sólo en el widget, no se guarda en el CRM
                    para que el asesor no vea un mensaje que él no escribió. */}
                <div className={`${styles.burbuja} ${styles.deAsesor} ${styles.saludo}`}>
                    <span className={styles.autor}>Ali</span>
                    <span className={styles.texto}>
                        ¡Hola! 👋 Soy <strong>Ali</strong>, el asistente virtual de{' '}
                        <strong>Alimin Inmobiliaria</strong>. ¿Cómo puedo ayudarte hoy con la
                        cotización de tu terreno?
                    </span>
                </div>

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

                        {mensaje.adjunto && (
                            <div className={styles.adjunto}>
                                {/* Mientras el archivo se sube se muestra la copia
                                    local (blob:); una vez guardado, la del servidor.
                                    Así la foto aparece al instante y no queda un
                                    hueco esperando la subida. */}
                                {mensaje.adjunto.tipo === 'image' && (
                                    <img
                                        src={mensaje.urlLocal || `/api/chat/media/${mensaje.adjunto.id}`}
                                        alt="Imagen del chat"
                                        className={styles.adjuntoImagen}
                                        loading="lazy"
                                    />
                                )}

                                {mensaje.adjunto.tipo === 'audio' && (
                                    <audio
                                        controls
                                        preload="metadata"
                                        className={styles.adjuntoAudio}
                                        src={mensaje.urlLocal || `/api/chat/media/${mensaje.adjunto.id}`}
                                    />
                                )}

                                {mensaje.adjunto.tipo === 'video' && (
                                    <video
                                        controls
                                        playsInline
                                        preload="metadata"
                                        className={styles.adjuntoVideo}
                                        src={mensaje.urlLocal || `/api/chat/media/${mensaje.adjunto.id}`}
                                    />
                                )}
                            </div>
                        )}

                        {mensaje.text && <span className={styles.texto}>{mensaje.text}</span>}
                        {mensaje.estado === 'enviando' && (
                            <span className={styles.estado}>enviando...</span>
                        )}
                        {mensaje.estado === 'pendiente' && (
                            <span className={styles.estado}>se envía al dejar tus datos</span>
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

            {error && !pidiendoDatos && <p className={styles.error}>{error}</p>}

            {pidiendoDatos ? (
                puerta
            ) : (
                <form className={styles.barraEnvio} onSubmit={enviar}>
                    {grabando ? (
                        <>
                            <button
                                type="button"
                                className={styles.botonSecundario}
                                onClick={() => detenerGrabacion(true)}
                                aria-label="Descartar grabación"
                            >
                                🗑
                            </button>

                            <span className={styles.grabando}>
                                <span className={styles.puntoGrabacion} />
                                {duracionLegible(msGrabados)} · grabando
                            </span>

                            <button
                                type="button"
                                onClick={() => detenerGrabacion(false)}
                                aria-label="Enviar grabación"
                            >
                                ➤
                            </button>
                        </>
                    ) : (
                        <>
                            <input
                                ref={inputArchivo}
                                type="file"
                                accept="image/*,video/*"
                                hidden
                                onChange={alElegirArchivo}
                            />
                            <button
                                type="button"
                                className={styles.botonSecundario}
                                onClick={() => inputArchivo.current?.click()}
                                disabled={enviando}
                                aria-label="Adjuntar foto o video"
                            >
                                📎
                            </button>

                            <input
                                type="text"
                                value={texto}
                                onChange={(e) => setTexto(e.target.value)}
                                placeholder="Escribe tu mensaje..."
                                maxLength={2000}
                                aria-label="Escribe tu mensaje"
                            />

                            {/* Con texto escrito, el micrófono deja su lugar al
                                botón de enviar: en un teléfono no caben los dos y
                                la acción esperada siempre es la del texto. */}
                            {puedeGrabar && !texto.trim() ? (
                                <button
                                    type="button"
                                    onClick={empezarAGrabar}
                                    disabled={enviando}
                                    aria-label="Grabar mensaje de voz"
                                >
                                    🎤
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={!texto.trim() || enviando}
                                    aria-label="Enviar"
                                >
                                    ➤
                                </button>
                            )}
                        </>
                    )}
                </form>
            )}
        </div>
    );
}
