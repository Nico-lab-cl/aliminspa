'use client'

import { useCallback, useState, type CSSProperties } from 'react'
import { POLITICA_VERSION, type ConsentimientoFormulario as Payload } from '@/lib/consent'
import styles from './ConsentimientoFormulario.module.css'

/**
 * Estado de las casillas de consentimiento de un formulario.
 *
 * `datos()` arma lo que se agrega al body del POST: queda guardado junto al
 * lead o la reserva como prueba de qué aceptó la persona, cuándo, con qué
 * versión de la política y desde qué página.
 */
export function useConsentimiento() {
    const [contacto, setContacto] = useState(false)
    const [marketing, setMarketing] = useState(false)

    const datos = useCallback(
        (): Payload => ({
            consentimiento_contacto: contacto,
            consentimiento_marketing: marketing,
            politica_version: POLITICA_VERSION,
            consentimiento_origen: typeof window !== 'undefined' ? window.location.href.slice(0, 500) : undefined,
        }),
        [contacto, marketing]
    )

    const reiniciar = useCallback(() => {
        setContacto(false)
        setMarketing(false)
    }, [])

    return { contacto, setContacto, marketing, setMarketing, datos, reiniciar }
}

interface Props {
    consentimiento: ReturnType<typeof useConsentimiento>
    /** `oscuro` para formularios sobre fondo oscuro o foto. */
    tono?: 'claro' | 'oscuro'
    /** Para el newsletter: una sola casilla, que es el consentimiento para recibir correos. */
    soloMarketing?: boolean
    /** Texto de la casilla obligatoria, si el formulario no es de contacto. */
    textoContacto?: string
    style?: CSSProperties
}

/**
 * Casillas de la Ley 21.719 para los formularios del sitio.
 *
 * - La obligatoria: acepta la política y que un asesor lo contacte por lo que
 *   pidió. Lleva `required`, así que el navegador no deja enviar sin marcarla.
 * - La opcional, desmarcada: recibir publicidad. La ley pide que el uso para
 *   marketing se consienta aparte y que negarse no impida la consulta.
 */
export default function ConsentimientoFormulario({
    consentimiento,
    tono = 'claro',
    soloMarketing = false,
    textoContacto = 'y que un asesor de Alimin me contacte por esta consulta.',
    style,
}: Props) {
    const politica = (
        <a href="/politica-de-privacidad" target="_blank" rel="noopener noreferrer">
            Política de Privacidad
        </a>
    )

    if (soloMarketing) {
        return (
            <div className={`${styles.caja} ${tono === 'oscuro' ? styles.oscuro : ''}`} style={style}>
                <label className={styles.fila}>
                    <input
                        type="checkbox"
                        required
                        checked={consentimiento.marketing}
                        onChange={(e) => {
                            consentimiento.setMarketing(e.target.checked)
                            consentimiento.setContacto(e.target.checked)
                        }}
                    />
                    <span>
                        Acepto recibir novedades y ofertas de Alimin por correo y la {politica}. Puedo darme de baja
                        cuando quiera.
                    </span>
                </label>
            </div>
        )
    }

    return (
        <div className={`${styles.caja} ${tono === 'oscuro' ? styles.oscuro : ''}`} style={style}>
            <label className={styles.fila}>
                <input
                    type="checkbox"
                    required
                    checked={consentimiento.contacto}
                    onChange={(e) => consentimiento.setContacto(e.target.checked)}
                />
                <span>
                    Acepto la {politica} {textoContacto}
                </span>
            </label>
            <label className={styles.fila}>
                <input
                    type="checkbox"
                    checked={consentimiento.marketing}
                    onChange={(e) => consentimiento.setMarketing(e.target.checked)}
                />
                <span>Quiero recibir novedades y ofertas de Alimin (opcional).</span>
            </label>
        </div>
    )
}
