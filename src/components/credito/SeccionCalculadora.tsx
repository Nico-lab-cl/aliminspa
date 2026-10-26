import CalculadoraCredito from './CalculadoraCredito'
import type { DatosCredito, PlanCredito } from './calculo'
import styles from './SeccionCalculadora.module.css'

/**
 * La calculadora de /credito como sección de página (home y páginas de
 * proyecto). `origen` es lo que distingue el lead en el CRM:
 * "Crédito - Lomas del Mar | Terreno … | Pie … | …".
 */
export default function SeccionCalculadora({
    origen,
    valoresIniciales,
    planes,
}: {
    origen: string
    valoresIniciales?: DatosCredito
    planes?: PlanCredito[]
}) {
    return (
        <section className={styles.seccion} id="calculadora">
            <div className={styles.grid}>
                <div className={styles.info}>
                    <span className={styles.eyebrow}>Financiamiento directo</span>
                    <h2 className={styles.titulo}>Calcula en cuántas cuotas pagas tu terreno</h2>
                    <p className={styles.desc}>
                        Ingresa el valor del terreno, el pie y la cuota mensual que te acomoda. Si el plan
                        te sirve, déjanos tus datos y un asesor te contacta para revisarlo contigo.
                    </p>
                </div>
                <CalculadoraCredito origen={origen} valoresIniciales={valoresIniciales} planes={planes} />
            </div>
        </section>
    )
}
