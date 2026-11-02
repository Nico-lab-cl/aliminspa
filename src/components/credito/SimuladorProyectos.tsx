'use client'

import { useState } from 'react'
import CalculadoraCredito from './CalculadoraCredito'
import { PROYECTOS_CREDITO } from './planes'
import styles from './CalculadoraCredito.module.css'

/**
 * La calculadora de /credito con un selector de proyecto arriba. Elegir el
 * proyecto carga sus planes (y el selector de tamaño si tiene más de uno); el
 * lead llega como "Crédito - Simulador Lomas del Mar 200 m² | …".
 */
export default function SimuladorProyectos() {
    const [proyecto, setProyecto] = useState(0)
    const actual = PROYECTOS_CREDITO[proyecto]

    return (
        <>
            <div className={styles.planes} role="group" aria-label="Proyecto">
                {PROYECTOS_CREDITO.map((p, i) => (
                    <button
                        key={p.nombre}
                        type="button"
                        className={`${styles.plan} ${i === proyecto ? styles.planActivo : ''}`}
                        aria-pressed={i === proyecto}
                        onClick={() => setProyecto(i)}
                    >
                        {p.nombre}
                    </button>
                ))}
            </div>

            {/* key: al cambiar de proyecto la calculadora parte de nuevo con sus montos. */}
            <CalculadoraCredito
                key={actual.nombre}
                titulo={null}
                origen={`Simulador ${actual.nombre}`}
                planes={actual.planes}
            />
        </>
    )
}
